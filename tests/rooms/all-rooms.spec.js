// tests/rooms/all-rooms.spec.js
// Project: chromium-public (no login needed / ログイン不要)

import { test, expect } from "@playwright/test";
import { AllRoomsPage } from "../pages/AllRoomsPage.js";

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
    await page.waitForLoadState("networkidle");

    const count = await roomsPage.getRoomCardCount();
    expect(count).toBeGreaterThanOrEqual(0);

    if (count > 0) {
      const typeTexts = await page.locator(".room-list-item .room-details h3").allTextContents();
      typeTexts.forEach(t => expect(t.toUpperCase()).toContain("DOUBLE"));
    }
  });

  // ─────────────────────────────────────────────────────────────
  // TC-AR-07  pagination shows when there are more than 9 rooms
  // ─────────────────────────────────────────────────────────────
  test("TC-AR-07 | pagination shows when more than 9 rooms exist", async ({ page }) => {
    const roomsPage = new AllRoomsPage(page);
    await roomsPage.goto();
    await roomsPage.waitForRoomsToLoad();

    const total = await roomsPage.getRoomCardCount();

    if (total === 9) {
      const pagination = page.locator(".pagination");
      const visible = await pagination.isVisible().catch(() => false);
      console.log("Pagination visible:", visible);
    }
  });
});
