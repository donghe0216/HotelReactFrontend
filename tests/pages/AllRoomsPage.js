// tests/pages/AllRoomsPage.js
// Structure based on AllRoomsPage.jsx:
//   - room type filter : <select> inside .all-room-filter-div
//   - RoomSearch       : date pickers + type select (no keyword input)
//   - RoomResult       : room cards list
//   - Pagination       : page navigation

export class AllRoomsPage {
  constructor(page) {
    this.page = page;

    // ── Locators ──────────────────────────────────────────────────
    this.heading        = page.getByRole("heading", { name: /all rooms/i });
    this.roomTypeSelect = page.locator(".all-room-filter-div select");

    // RoomResult renders .room-list-item per room card
    this.roomCards      = page.locator(".room-list-item");

    // AllRooms has no keyword search input — RoomSearch uses date pickers (readOnly)
    // searchButton matches "Search Roooms" button in RoomSearch component
    this.searchButton   = page.getByRole("button", { name: /search/i });

    // Pagination buttons
    this.nextPageButton = page.getByRole("button", { name: /next/i });
    this.prevPageButton = page.getByRole("button", { name: /prev/i });
  }

  async goto() {
    await this.page.goto("/rooms");
  }

  async waitForRoomsToLoad() {
    await this.page.waitForLoadState("networkidle");
    await this.heading.waitFor({ state: "visible" });
  }

  async selectRoomType(type) {
    await this.roomTypeSelect.selectOption(type);
  }

  async getRoomCardCount() {
    return this.roomCards.count();
  }

  async clickFirstRoom() {
    // RoomResult renders a "View/Book Now" button inside each .room-list-item
    await this.roomCards.first().locator("button.book-now-button").click();
  }

  async search(keyword) {
    // AllRooms page does not have a keyword search text input.
    // The RoomSearch component uses date pickers (readOnly inputs) + room type select.
    // This method is a no-op; tests should use selectRoomType() for filtering.
    await this.page.waitForTimeout(100);
  }
}
