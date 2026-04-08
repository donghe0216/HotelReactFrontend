// tests/booking/find-booking.spec.js
// Project: chromium-public (/find-booking does not require login)
//
// Covers: booking reference lookup — input validation, backend error handling,
//         correct display of booking / booker / room info.
//
// Out of scope:
//   - Booking creation and cancellation (covered in room-details.spec.js and API layer)
//   - Authorization rules — who can view whose booking (covered in AuthorizationTest.java)
//
// Pre-condition:
//   The "create seed booking" step in auth.setup.js must run first.
//   If tests/.auth/booking.json has a bookingReference, TC-FB-06~08 will use it.
//   If the file does not exist, those tests are safely skipped via test.skip.

import { test, expect } from "@playwright/test";
import { FindBookingPage } from "../pages/FindBookingPage.js";
import fs   from "fs";
import path from "path";

// Load the booking reference written by auth.setup.js
// Load the booking reference written by auth.setup.js
let SEED_BOOKING_REF = null;
try {
  const bookingFile = path.join("tests", ".auth", "booking.json");
  if (fs.existsSync(bookingFile)) {
    SEED_BOOKING_REF = JSON.parse(fs.readFileSync(bookingFile, "utf-8")).ref;
  }
} catch { /* read failed — dependent tests will be skipped */ }

test.describe("🔍 Find Booking Page", () => {

  // ─────────────────────────────────────────────────────────────
  // TC-FB-01  page loads with search input and Find button
  // ─────────────────────────────────────────────────────────────
  test("TC-FB-01 | page loads with search input and Find button", async ({ page }) => {
    const findPage = new FindBookingPage(page);
    await findPage.goto();

    await expect(findPage.codeInput).toBeVisible();
    await expect(findPage.findButton).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // TC-FB-02  clicking Find with empty input shows a validation error
  // ─────────────────────────────────────────────────────────────
  test("TC-FB-02 | clicking Find with empty input shows validation error", async ({ page }) => {
    const findPage = new FindBookingPage(page);
    await findPage.goto();
    await findPage.findButton.click();

    const msg = await findPage.getErrorMessage();
    expect(msg).toContain("Please Enter a booking confirmation code");
  });

  // ─────────────────────────────────────────────────────────────
  // TC-FB-03  whitespace-only input is treated as empty and shows error
  // ─────────────────────────────────────────────────────────────
  test("TC-FB-03 | whitespace-only input is treated as empty and shows error", async ({ page }) => {
    const findPage = new FindBookingPage(page);
    await findPage.goto();
    await findPage.search("     ");

    const msg = await findPage.getErrorMessage();
    expect(msg).toContain("Please Enter a booking confirmation code");
  });

  // ─────────────────────────────────────────────────────────────
  // TC-FB-04  error message disappears automatically after 5 seconds
  // ─────────────────────────────────────────────────────────────
  test("TC-FB-04 | error message disappears after 5 seconds", async ({ page }) => {
    const findPage = new FindBookingPage(page);
    await findPage.goto();
    await findPage.findButton.click();

    await expect(findPage.errorMessage).toBeVisible();
    // Use Playwright built-in polling instead of fixed sleep — more reliable.
    await expect(findPage.errorMessage).not.toBeVisible({ timeout: 10_000 });
  });

  // ─────────────────────────────────────────────────────────────
  // TC-FB-05  invalid reference shows an error from the backend
  // ─────────────────────────────────────────────────────────────
  test("TC-FB-05 | invalid reference shows backend error", async ({ page }) => {
    const findPage = new FindBookingPage(page);
    await findPage.goto();
    await findPage.search("INVALID-REF-000");

    const msg = await findPage.getErrorMessage();
    expect(msg).toMatch(/not found/i);
    await expect(findPage.bookingDetails).not.toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // TC-FB-06  valid reference shows booking, booker, and room info
  // ─────────────────────────────────────────────────────────────
  test("TC-FB-06 | valid reference shows booking, booker, and room details", async ({ page }) => {
    test.skip(!SEED_BOOKING_REF, "No seed booking reference — run auth setup first");
    const findPage = new FindBookingPage(page);
    await findPage.goto();
    await findPage.search(SEED_BOOKING_REF);
    await findPage.waitForBookingDetails();

    const detailsText = await findPage.bookingDetails.textContent();

    // Booking info
    expect(detailsText).toMatch(/booking code/i);
    expect(detailsText).toMatch(/check-in date/i);
    expect(detailsText).toMatch(/check-out date/i);

    // Booker info
    expect(detailsText).toMatch(/first name/i);
    expect(detailsText).toMatch(/email/i);

    // Room info
    expect(detailsText).toMatch(/room number/i);
    expect(detailsText).toMatch(/room type/i);
  });

  // ─────────────────────────────────────────────────────────────
  // TC-FB-07  displayed booking code matches the searched reference
  // ─────────────────────────────────────────────────────────────
  test("TC-FB-07 | displayed booking code matches the searched reference", async ({ page }) => {
    test.skip(!SEED_BOOKING_REF, "No seed booking reference — run auth setup first");
    const findPage = new FindBookingPage(page);
    await findPage.goto();
    await findPage.search(SEED_BOOKING_REF);
    await findPage.waitForBookingDetails();

    const codeText = await findPage.bookingCode.textContent();
    expect(codeText).toContain(SEED_BOOKING_REF);
  });

  // ─────────────────────────────────────────────────────────────
  // TC-FB-08  searching invalid then valid reference updates the result correctly
  // ─────────────────────────────────────────────────────────────
  test("TC-FB-08 | searching invalid then valid reference updates results correctly", async ({ page }) => {
    test.skip(!SEED_BOOKING_REF, "No seed booking reference — run auth setup first");
    const findPage = new FindBookingPage(page);
    await findPage.goto();

    // First search: invalid
    await findPage.search("BAD-REF");
    await expect(findPage.errorMessage).toBeVisible({ timeout: 6_000 });

    // Second search: valid
    await findPage.codeInput.clear();
    await expect(findPage.codeInput).toHaveValue("");
    await findPage.search(SEED_BOOKING_REF);
    await findPage.waitForBookingDetails();

    await expect(findPage.bookingDetails).toBeVisible();
    await expect(findPage.errorMessage).not.toBeVisible();
  });
});
