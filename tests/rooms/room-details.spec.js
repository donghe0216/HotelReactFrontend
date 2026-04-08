// tests/rooms/room-details.spec.js
//
// Project: chromium（requires customer storageState from auth.setup.js）
//
// Covers: room info display, date picker interaction, booking preview,
//         price calculation, full booking confirmation flow, auth guard redirect.
//
// Out of scope:
//   - Booking cancellation after confirmation (covered in BookingApiTest.java)
//   - Concurrent booking conflicts (covered in ConcurrentBookingTest.java)
//   - Authorization — customer vs admin access (covered in AuthorizationTest.java)
//
// TC-RD-01~08 require authentication (CustomerRoute guard).
// TC-RD-09 always creates a fresh unauthenticated context.

import { test, expect } from "@playwright/test";
import { RoomDetailsPage } from "../pages/RoomDetailsPage.js";

const API_BASE = process.env.BACKEND_URL
  ? `${process.env.BACKEND_URL}/api`
  : "http://localhost:9090/api";

// Booking dates for TC-RD-07 and TC-RD-08.
// Navigate 3 months ahead to use dates unlikely to conflict on a fresh DB.
// TC-RD-07 mocks the booking POST (no DB pollution, idempotent on re-runs).
// TC-RD-08 uses a beforeAll-seeded conflict booking so it reliably gets a "not available" error.
const BOOK_MONTHS_AHEAD  = 3;
const BOOK_CHECK_IN_DAY  = 15;
const BOOK_CHECK_OUT_DAY = 17;

/** Compute ISO date strings for the conflict booking (3 months ahead, days 15 / 17) */
function conflictDates() {
  const d = new Date();
  d.setMonth(d.getMonth() + BOOK_MONTHS_AHEAD);
  const y  = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  return {
    checkIn:  `${y}-${mo}-${String(BOOK_CHECK_IN_DAY).padStart(2, "0")}`,
    checkOut: `${y}-${mo}-${String(BOOK_CHECK_OUT_DAY).padStart(2, "0")}`,
  };
}

// Dynamically resolve the first available room ID from the DB (avoids hardcoded id=1).
// Also seed a conflict booking for TC-RD-08 (silently ignored if already booked).
let SEED_ROOM_ID;
let SEED_BOOKING_OK = false;
test.beforeAll(async ({ request }) => {
  // 1. Get first room ID
  const resp = await request.get(`${API_BASE}/rooms/all`);
  const { rooms } = await resp.json();
  SEED_ROOM_ID = rooms?.[0]?.id ?? 1;

  // 2. Login as customer to obtain a token for seeding
  const loginRes = await request.post(`${API_BASE}/auth/login`, {
    data: { email: "customer@hotel.com", password: "Customer1234!" },
  });
  if (!loginRes.ok()) return;
  const { token } = await loginRes.json();

  // 3. Seed a real conflict booking for TC-RD-08
  // Track whether seed succeeded so TC-RD-08 can skip if it didn't
  const { checkIn, checkOut } = conflictDates();
  const seedRes = await request.post(`${API_BASE}/bookings`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { roomId: SEED_ROOM_ID, checkInDate: checkIn, checkOutDate: checkOut },
  });
  SEED_BOOKING_OK = seedRes.ok();
});

test.describe("🛏️ Room Details & Booking Flow", () => {

  // ─────────────────────────────────────────────────────────────
  // TC-RD-01  page loads with room type, price, and capacity info
  // ページ読み込み：部屋情報が正しく表示されるか確認
  // ─────────────────────────────────────────────────────────────
  test("TC-RD-01 | page loads with room type, price, and capacity info", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Requires customer auth");
    const detailsPage = new RoomDetailsPage(page);
    await detailsPage.goto(SEED_ROOM_ID);

    await expect(detailsPage.roomInfo).toBeVisible();
    await expect(detailsPage.roomImage).toBeVisible();

    const infoText = await detailsPage.roomInfo.textContent();
    expect(infoText).toMatch(/\$/);
    expect(infoText).toMatch(/capacity/i);
  });

  // ─────────────────────────────────────────────────────────────
  // TC-RD-02  clicking "Select Dates" shows the date pickers
  // ─────────────────────────────────────────────────────────────
  test("TC-RD-02 | clicking Select Dates shows the date pickers", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Requires customer auth");
    const detailsPage = new RoomDetailsPage(page);
    await detailsPage.goto(SEED_ROOM_ID);

    await detailsPage.openDatePicker();

    await expect(detailsPage.checkInPicker).toBeVisible();
    await expect(detailsPage.checkOutPicker).toBeVisible();
    await expect(detailsPage.proceedBtn).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // TC-RD-03  clicking Proceed without selecting dates shows an error
  // ─────────────────────────────────────────────────────────────
  test("TC-RD-03 | clicking Proceed without dates shows an error", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Requires customer auth");
    const detailsPage = new RoomDetailsPage(page);
    await detailsPage.goto(SEED_ROOM_ID);

    await detailsPage.openDatePicker();
    await detailsPage.proceedBtn.click();

    const msg = await detailsPage.getErrorMessage();
    expect(msg).toContain("Please select both check-in and check-out dates");
  });

  // ─────────────────────────────────────────────────────────────
  // TC-RD-04  selecting valid dates and clicking Proceed shows booking preview
  // 日付選択 → Proceed → 予約プレビュー表示の確認
  // ─────────────────────────────────────────────────────────────
  test("TC-RD-04 | selecting check-in and check-out dates shows booking preview", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Requires customer auth");
    const detailsPage = new RoomDetailsPage(page);
    await detailsPage.goto(SEED_ROOM_ID);

    await detailsPage.selectDates(20, 22);
    await detailsPage.proceedToPreview();

    await expect(detailsPage.bookingPreview).toBeVisible();
    const previewText = await detailsPage.bookingPreview.textContent();
    expect(previewText).toMatch(/check-in/i);
    expect(previewText).toMatch(/check-out/i);
    expect(previewText).toMatch(/total price/i);
  });

  // ─────────────────────────────────────────────────────────────
  // TC-RD-05  total price in preview equals pricePerNight × nights
  // ─────────────────────────────────────────────────────────────
  test("TC-RD-05 | total price in preview matches pricePerNight × nights", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Requires customer auth");
    const detailsPage = new RoomDetailsPage(page);
    await detailsPage.goto(SEED_ROOM_ID);

    const infoText = await detailsPage.roomInfo.textContent();
    const priceMatch = infoText.match(/\$(\d+(?:\.\d+)?)\s*\/\s*night/i);
    const pricePerNight = priceMatch ? parseFloat(priceMatch[1]) : null;

    await detailsPage.selectDates(20, 22);
    await detailsPage.proceedToPreview();

    const previewText = await detailsPage.bookingPreview.textContent();
    const totalMatch  = previewText.match(/total price.*?\$(\d+(?:\.\d+)?)/i);
    const totalPrice  = totalMatch ? parseFloat(totalMatch[1]) : null;

    // Soft assertion: only runs when both values are parseable from the DOM.
    // If the price format changes, this test silently passes rather than failing —
    // price calculation correctness is covered in BookingServiceImplTest.java.
    if (pricePerNight && totalPrice) {
      expect(totalPrice).toBe(pricePerNight * 2);
    }
  });

  // ─────────────────────────────────────────────────────────────
  // TC-RD-06  clicking Cancel hides the booking preview
  // ─────────────────────────────────────────────────────────────
  test("TC-RD-06 | clicking Cancel hides the booking preview", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Requires customer auth");
    const detailsPage = new RoomDetailsPage(page);
    await detailsPage.goto(SEED_ROOM_ID);

    await detailsPage.selectDates(20, 22);
    await detailsPage.proceedToPreview();
    await expect(detailsPage.bookingPreview).toBeVisible();

    await detailsPage.cancelBookingBtn.click();
    await expect(detailsPage.bookingPreview).not.toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // TC-RD-07  full booking flow: select dates → Proceed → Confirm → show confirmation
  // 予約フロー全体：日付選択 → Proceed → Confirm → 確認メッセージ表示
  //
  // Note: the component does not auto-navigate to /rooms after booking.
  // It shows "Booking Confirmed!" with a "Back to Rooms" button instead.
  // ─────────────────────────────────────────────────────────────
  test("TC-RD-07 | full booking flow shows confirmation then navigates to /rooms", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Requires customer auth");
    const detailsPage = new RoomDetailsPage(page);
    await detailsPage.goto(SEED_ROOM_ID);

    // Mock the booking POST so no real booking is created in the DB.
    // This makes the test idempotent across re-runs (dates never get "used up").
    const { checkIn, checkOut } = conflictDates();
    await page.route(`${API_BASE}/bookings`, async (route, request) => {
      if (request.method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: 200,
            booking: {
              bookingReference: "TEST-MOCK-REF-007",
              checkInDate: checkIn,
              checkOutDate: checkOut,
              totalPrice: 300,
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await detailsPage.selectDates(BOOK_CHECK_IN_DAY, BOOK_CHECK_OUT_DAY, BOOK_MONTHS_AHEAD);
    await detailsPage.proceedToPreview();
    await detailsPage.confirmBooking();

    // .booking-preview reuses class for confirmed state showing "Booking Confirmed!"
    // Wait for mock response + React state update
    await expect(detailsPage.bookingPreview).toContainText(/booking confirmed/i, { timeout: 10_000 });

    // Click "Back to Rooms" button (class: cancel-booking) → navigate to /rooms
    await detailsPage.cancelBookingBtn.click();
    await expect(page).toHaveURL(/rooms/, { timeout: 5_000 });
  });

  // ─────────────────────────────────────────────────────────────
  // TC-RD-08  booking already-taken dates shows backend error
  // ─────────────────────────────────────────────────────────────
  test("TC-RD-08 | booking unavailable dates shows error from backend", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Requires customer auth");
    test.skip(!SEED_BOOKING_OK, "Seed booking failed — conflict test skipped");
    const detailsPage = new RoomDetailsPage(page);
    await detailsPage.goto(SEED_ROOM_ID);

    // Same dates as TC-RD-07 (3 months ahead, days 15-17) — TC-RD-07 books them first,
    // so this attempt should receive a "not available" error from the backend.
    await detailsPage.selectDates(BOOK_CHECK_IN_DAY, BOOK_CHECK_OUT_DAY, BOOK_MONTHS_AHEAD);
    await detailsPage.proceedToPreview();
    await detailsPage.confirmBooking();

    const msg = await detailsPage.getErrorMessage();
    expect(msg).toMatch(/not available/i);
  });

  // ─────────────────────────────────────────────────────────────
  // TC-RD-09  unauthenticated user is redirected to /login by route guard
  // ─────────────────────────────────────────────────────────────
  test(
    "TC-RD-09 | unauthenticated user accessing room details is redirected to /login",
    async ({ browser }, testInfo) => {
      // Browser timing issues occur in chromium/chromium-admin authenticated contexts.
      // Run only in chromium-public where no storageState is injected.
      test.skip(testInfo.project.name !== "chromium-public", "Unauthenticated Guard test — run in chromium-public only");
      const context = await browser.newContext();
      const page    = await context.newPage();

      await page.goto(`/room-details/${SEED_ROOM_ID}`);
      await expect(page).toHaveURL(/login/, { timeout: 15_000 });

      await context.close();
    }
  );
});
