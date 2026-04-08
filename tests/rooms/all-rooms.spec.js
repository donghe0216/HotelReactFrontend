// tests/rooms/all-rooms.spec.js
// Project: chromium-public (no login needed / ログイン不要)
//
// Covers: room list rendering, room type filter, RoomSearch component
//         (date picker open/close, date selection, availability search), pagination.
//
// Out of scope:
//   - Room CRUD (add / edit / delete) — admin operations covered in API layer
//   - Booking flow from room card — covered in room-details.spec.js
//   - Availability logic correctness — covered in BookingServiceImplTest.java
//
// TC-AR-01~06  All Rooms Page — filter and navigation
// TC-AR-08~13  RoomSearch component — date picker and search
// TC-AR-07     Pagination — placed at the bottom because it requires
//              beforeAll/afterAll API setup to seed 10+ rooms

import { test, expect, request as playwrightRequest } from "@playwright/test";
import { AllRoomsPage } from "../pages/AllRoomsPage.js";

const API_BASE = "http://localhost:9090/api";
const ADMIN    = { email: "admin@hotel.com", password: "Admin1234!" };

test.describe("🏠 All Rooms Page", () => {

  // ─────────────────────────────────────────────────────────────
  // TC-AR-01  page loads with room list and filter controls
  // ページ読み込み：部屋一覧とフィルターが表示されるか確認
  // ─────────────────────────────────────────────────────────────
  test("TC-AR-01 | page loads with heading, filter dropdown, and room list", async ({ page }) => {
    const roomsPage = new AllRoomsPage(page);
    await roomsPage.goto();
    await roomsPage.waitForRoomsToLoad();

    await expect(roomsPage.heading).toBeVisible();
    await expect(roomsPage.roomTypeSelect).toBeVisible();

    const count = await roomsPage.getRoomCardCount();
    expect(count).toBeGreaterThan(0);
  });

  // ─────────────────────────────────────────────────────────────
  // TC-AR-02  room type filter defaults to "All"
  // ─────────────────────────────────────────────────────────────
  test("TC-AR-02 | room type dropdown defaults to 'All'", async ({ page }) => {
    const roomsPage = new AllRoomsPage(page);
    await roomsPage.goto();
    await roomsPage.waitForRoomsToLoad();

    const selectedValue = await roomsPage.roomTypeSelect.inputValue();
    expect(selectedValue).toBe("");  // <option value="">All</option>
  });

  // ─────────────────────────────────────────────────────────────
  // TC-AR-03  selecting a room type filters the list correctly
  // フィルター選択 → 該当タイプのみ表示されるか確認
  // ─────────────────────────────────────────────────────────────
  test("TC-AR-03 | selecting SINGLE type shows only SINGLE rooms", async ({ page }) => {
    const roomsPage = new AllRoomsPage(page);
    await roomsPage.goto();
    await roomsPage.waitForRoomsToLoad();

    const totalBefore = await roomsPage.getRoomCardCount();

    await roomsPage.selectRoomType("SINGLE");
    await expect(roomsPage.roomCards.first()).toBeVisible();

    const totalAfter = await roomsPage.getRoomCardCount();

    expect(totalAfter).toBeLessThanOrEqual(totalBefore);
    const typeTexts = await page.locator(".room-list-item .room-details h3").allTextContents();
    typeTexts.forEach(t => expect(t.toLowerCase()).toContain("single"));
  });

  // ─────────────────────────────────────────────────────────────
  // TC-AR-04  switching back to All shows all rooms again
  // ─────────────────────────────────────────────────────────────
  test("TC-AR-04 | switching back to All shows all rooms", async ({ page }) => {
    const roomsPage = new AllRoomsPage(page);
    await roomsPage.goto();
    await roomsPage.waitForRoomsToLoad();

    const totalAll = await roomsPage.getRoomCardCount();

    await roomsPage.selectRoomType("SINGLE");
    await expect(roomsPage.roomCards.first()).toBeVisible();
    await roomsPage.selectRoomType("");   // back to All
    await expect(roomsPage.roomCards.first()).toBeVisible();

    const totalAfter = await roomsPage.getRoomCardCount();
    expect(totalAfter).toBe(totalAll);
  });

  // ─────────────────────────────────────────────────────────────
  // TC-AR-05  clicking a room card navigates to /room-details/:id
  //
  // Only runs in chromium (customer auth).
  // chromium-public: Guard redirects /room-details to /login.
  // chromium-admin:  RoomResult renders "Edit Room" → /admin/edit-room/:id.
  // ─────────────────────────────────────────────────────────────
  test("TC-AR-05 | clicking a room card navigates to room details page", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Requires customer auth; admin navigates to edit-room instead");
    const roomsPage = new AllRoomsPage(page);
    await roomsPage.goto();
    await roomsPage.waitForRoomsToLoad();

    await roomsPage.clickFirstRoom();
    await expect(page).toHaveURL(/room-details\/\d+/, { timeout: 8_000 });
  });

  // ─────────────────────────────────────────────────────────────
  // TC-AR-06  filtering by room type updates results
  //
  // Note: AllRoomsPage does NOT have a keyword search input.
  // RoomSearch uses date pickers (readOnly) + room type select for availability.
  // This test validates the DOUBLE type filter.
  // ─────────────────────────────────────────────────────────────
  test("TC-AR-06 | selecting DOUBLE type shows only DOUBLE rooms", async ({ page }) => {
    const roomsPage = new AllRoomsPage(page);
    await roomsPage.goto();
    await roomsPage.waitForRoomsToLoad();

    await roomsPage.selectRoomType("DOUBLE");
    await expect(roomsPage.roomCards.first()).toBeVisible();

    const count = await roomsPage.getRoomCardCount();
    expect(count).toBeGreaterThan(0);

    const typeTexts = await page.locator(".room-list-item .room-details h3").allTextContents();
    typeTexts.forEach(t => expect(t.toUpperCase()).toContain("DOUBLE"));
  });

});

// ══════════════════════════════════════════════════════════════════
// RoomSearch component tests
// Covers: date picker open/close, date selection, validation, search results
// ══════════════════════════════════════════════════════════════════
test.describe("🔍 RoomSearch Component", () => {

  // ─────────────────────────────────────────────────────────────
  // TC-AR-08  clicking Check-in input opens the date picker
  // ─────────────────────────────────────────────────────────────
  test("TC-AR-08 | clicking Check-in input opens the date picker", async ({ page }) => {
    const roomsPage = new AllRoomsPage(page);
    await roomsPage.goto();
    await roomsPage.waitForRoomsToLoad();

    await roomsPage.searchCheckInInput.click();
    await expect(roomsPage.startDatePicker).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // TC-AR-09  clicking outside the date picker closes it
  // ─────────────────────────────────────────────────────────────
  test("TC-AR-09 | clicking outside the date picker closes it", async ({ page }) => {
    const roomsPage = new AllRoomsPage(page);
    await roomsPage.goto();
    await roomsPage.waitForRoomsToLoad();

    await roomsPage.searchCheckInInput.click();
    await expect(roomsPage.startDatePicker).toBeVisible();

    // Click the page heading — outside any date picker container
    await roomsPage.heading.click();
    await expect(roomsPage.startDatePicker).not.toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // TC-AR-10  selecting a date updates the input field
  // ─────────────────────────────────────────────────────────────
  test("TC-AR-10 | selecting a check-in date updates the input", async ({ page }) => {
    const roomsPage = new AllRoomsPage(page);
    await roomsPage.goto();
    await roomsPage.waitForRoomsToLoad();

    await roomsPage.searchCheckInInput.click();
    await expect(roomsPage.startDatePicker).toBeVisible();

    // Pick any day (25) — picker closes and input updates
    await roomsPage.startDatePicker
      .locator("button")
      .filter({ hasText: /^25$/ })
      .first()
      .click();

    await expect(roomsPage.startDatePicker).not.toBeVisible();
    const value = await roomsPage.searchCheckInInput.inputValue();
    expect(value).not.toBe("");
  });

  // ─────────────────────────────────────────────────────────────
  // TC-AR-11  clicking Search without filling any field shows error
  // ─────────────────────────────────────────────────────────────
  test("TC-AR-11 | clicking Search without fields shows validation error", async ({ page }) => {
    const roomsPage = new AllRoomsPage(page);
    await roomsPage.goto();
    await roomsPage.waitForRoomsToLoad();

    await roomsPage.searchButton.click();

    await expect(roomsPage.searchErrorMessage).toBeVisible();
    const msg = await roomsPage.searchErrorMessage.textContent();
    expect(msg).toContain("Please select fields");
  });

  // ─────────────────────────────────────────────────────────────
  // TC-AR-12  valid search returns available rooms
  // ─────────────────────────────────────────────────────────────
  test("TC-AR-12 | valid search with all fields returns available rooms", async ({ page }) => {
    const roomsPage = new AllRoomsPage(page);
    await roomsPage.goto();
    await roomsPage.waitForRoomsToLoad();

    // Select check-in (day 25)
    await roomsPage.searchCheckInInput.click();
    await roomsPage.startDatePicker.locator("button").filter({ hasText: /^25$/ }).first().click();

    // Select check-out (day 27)
    await roomsPage.searchCheckOutInput.click();
    await roomsPage.endDatePicker.locator("button").filter({ hasText: /^27$/ }).first().click();

    // Select room type
    await roomsPage.searchRoomTypeSelect.selectOption("SINGLE");

    await roomsPage.searchButton.click();

    // Room list should update with results matching the searched type
    await expect(roomsPage.roomCards.first()).toBeVisible({ timeout: 8_000 });
    const count = await roomsPage.getRoomCardCount();
    expect(count).toBeGreaterThan(0);

    const typeTexts = await page.locator(".room-list-item .room-details h3").allTextContents();
    typeTexts.forEach(t => expect(t.toUpperCase()).toContain("SINGLE"));
  });

  // ─────────────────────────────────────────────────────────────
  // TC-AR-13  valid search with no available rooms shows error
  // ─────────────────────────────────────────────────────────────
  test("TC-AR-13 | valid search with no available rooms shows error", async ({ page }) => {
    const roomsPage = new AllRoomsPage(page);
    await roomsPage.goto();
    await roomsPage.waitForRoomsToLoad();

    // Mock the availability API to return empty list
    await page.route("**/rooms/available**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, rooms: [] }),
      });
    });

    // Select check-in (day 25)
    await roomsPage.searchCheckInInput.click();
    await roomsPage.startDatePicker.locator("button").filter({ hasText: /^25$/ }).first().click();

    // Select check-out (day 27)
    await roomsPage.searchCheckOutInput.click();
    await roomsPage.endDatePicker.locator("button").filter({ hasText: /^27$/ }).first().click();

    // Select room type
    await roomsPage.searchRoomTypeSelect.selectOption("SINGLE");

    await roomsPage.searchButton.click();

    await expect(roomsPage.searchErrorMessage).toBeVisible({ timeout: 8_000 });
    const msg = await roomsPage.searchErrorMessage.textContent();
    expect(msg).toMatch(/not currently available/i);
  });

});

// ══════════════════════════════════════════════════════════════════
// TC-AR-07  pagination — requires 10+ rooms, created and cleaned up via API
// ══════════════════════════════════════════════════════════════════
test.describe("🏠 All Rooms Page — Pagination", () => {

  let adminToken     = null;
  let createdRoomIds = [];

  test.beforeAll(async () => {
    const api = await playwrightRequest.newContext();

    // Login as admin to get token
    const loginRes = await api.post(`${API_BASE}/auth/login`, {
      data: { email: ADMIN.email, password: ADMIN.password },
    });
    adminToken = (await loginRes.json()).token;

    // roomNumber uses timestamp suffix to avoid unique constraint conflicts with existing seed data.
    // Fixed numbers (e.g. 201, 202) risk colliding if seed data changes — timestamp makes each run independent.
    // type SUITE avoids interfering with SINGLE/DOUBLE filter tests (TC-AR-03, TC-AR-06)
    const base = Date.now() % 100000;
    for (let i = 0; i < 10; i++) {
      const res = await api.post(`${API_BASE}/rooms/add`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        multipart: {
          roomNumber:    base + i,
          type:          "SUITE",
          pricePerNight: "10000",
          capacity:      2,
          description:   "Pagination test room",
        },
      });
      if (res.ok()) {
        const { room } = await res.json();
        if (room?.id) createdRoomIds.push(room.id);
      }
    }

    await api.dispose();
  });

  test.afterAll(async () => {
    const api = await playwrightRequest.newContext();

    for (const id of createdRoomIds) {
      await api.delete(`${API_BASE}/rooms/delete/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }

    await api.dispose();
  });

  // ─────────────────────────────────────────────────────────────
  // TC-AR-07  pagination shows when there are more than 9 rooms
  // ─────────────────────────────────────────────────────────────
  test("TC-AR-07 | pagination shows when more than 9 rooms exist", async ({ page }) => {
    const roomsPage = new AllRoomsPage(page);
    await roomsPage.goto();
    await roomsPage.waitForRoomsToLoad();

    const count = await roomsPage.getRoomCardCount();
    expect(count).toBe(9); // page size is 9

    await expect(page.locator(".pagination")).toBeVisible();
  });
});
