// tests/pages/AllRoomsPage.js
//
// Date inputs are readOnly — interaction requires click to open DayPicker,
// then clicking a day button inside the picker container.
//
// Two room type selects exist on this page:
//   roomTypeSelect       — controls client-side display filter only
//   searchRoomTypeSelect — sent to the API as a query param for availability search

export class AllRoomsPage {
  constructor(page) {
    this.page = page;

    // ── Room type filter (top of page) ────────────────────────────
    this.heading        = page.getByRole("heading", { name: /all rooms/i });
    this.roomTypeSelect = page.locator(".all-room-filter-div select");

    // ── RoomSearch component ──────────────────────────────────────
    this.searchCheckInInput   = page.getByPlaceholder(/select check-in date/i);
    this.searchCheckOutInput  = page.getByPlaceholder(/select check-out date/i);
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
    await this.waitForRoomsToLoad();
  }

  async waitForRoomsToLoad() {
    await this.heading.waitFor({ state: "visible" });
    // Also wait for room cards — heading renders before the API response arrives
    await this.roomCards.first().waitFor({ state: "visible" });
  }

  async selectRoomType(type) {
    await this.roomTypeSelect.selectOption(type);
  }

  async getRoomCardCount() {
    return this.roomCards.count();
  }

  // Clicks the CTA button rather than the card to match the real user interaction path
  async clickFirstRoom() {
    await this.roomCards.first().locator("button.book-now-button").click();
  }

  // Opens the check-in DayPicker and selects a day by its visible text content.
  // Uses filter({ hasText }) rather than getByRole name — DayPicker day buttons
  // have accessible names like "December 25" not just "25".
  async selectCheckInDate(dayText) {
    await this.searchCheckInInput.click();
    await this.startDatePicker
      .locator("button")
      .filter({ hasText: new RegExp(`^${dayText}$`) })
      .first()
      .click();
  }

  // Opens the check-out DayPicker and selects a day by its visible text content
  async selectCheckOutDate(dayText) {
    await this.searchCheckOutInput.click();
    await this.endDatePicker
      .locator("button")
      .filter({ hasText: new RegExp(`^${dayText}$`) })
      .first()
      .click();
  }

  async goToNextPage() {
    await this.nextPageButton.click();
    await this.roomCards.first().waitFor({ state: "visible" });
  }

  async goToPrevPage() {
    await this.prevPageButton.click();
    await this.roomCards.first().waitFor({ state: "visible" });
  }
}
