// tests/pages/AllRoomsPage.js
// Structure based on AllRoomsPage.jsx:
//   - room type filter : <select> inside .all-room-filter-div
//   - RoomSearch       : date pickers + type select (no keyword input)
//   - RoomResult       : room cards list
//   - Pagination       : page navigation

export class AllRoomsPage {
  constructor(page) {
    this.page = page;

    // ── Room type filter (top of page) ────────────────────────────
    this.heading        = page.getByRole("heading", { name: /all rooms/i });
    this.roomTypeSelect = page.locator(".all-room-filter-div select");

    // ── RoomSearch component ──────────────────────────────────────
    // Two readOnly inputs that open DayPicker on focus
    this.searchCheckInInput   = page.getByPlaceholder(/select check-in date/i);
    this.searchCheckOutInput  = page.getByPlaceholder(/select check-out date/i);
    // Separate from roomTypeSelect above — scoped inside .search-container
    this.searchRoomTypeSelect = page.locator(".search-container select");
    this.searchButton         = page.locator("button.home-search-button");
    this.searchErrorMessage   = page.locator(".search-error-message");
    this.startDatePicker      = page.locator(".search-checkin-picker");
    this.endDatePicker        = page.locator(".search-checkout-picker");

    // ── RoomResult ────────────────────────────────────────────────
    this.roomCards      = page.locator(".room-list-item");

    // ── Pagination ────────────────────────────────────────────────
    this.nextPageButton = page.getByRole("button", { name: /next/i });
    this.prevPageButton = page.getByRole("button", { name: /prev/i });
  }

  async goto() {
    await this.page.goto("/rooms");
  }

  async waitForRoomsToLoad() {
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

}
