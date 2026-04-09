// tests/pages/AdminPages.js
//
// Page Objects for admin-only pages (/admin, /admin/manage-rooms, /admin/manage-bookings).
// Covers navigation and element access only — no assertions here.
// Admin E2E tests deferred; see tests/TODO.md for rationale.

export class AdminPage {
  constructor(page) {
    this.page = page;

    this.welcomeHeading       = page.locator(".welcome-message");
    this.manageRoomsButton    = page.getByRole("button", { name: /manage rooms/i });
    this.manageBookingsButton = page.getByRole("button", { name: /manage bookings/i });
  }

  async goto() {
    await this.page.goto("/admin");
    await this.page.waitForLoadState("domcontentloaded");
  }

  async waitForLoad() {
    await this.welcomeHeading.waitFor({ state: "visible", timeout: 10_000 });
  }
}

// ─────────────────────────────────────────────────────────────────
// ManageRoomPage
// ─────────────────────────────────────────────────────────────────
export class ManageRoomPage {
  constructor(page) {
    this.page = page;

    this.heading        = page.getByRole("heading", { name: /all rooms/i });
    this.roomTypeSelect = page.locator(".filter-select-div select");
    this.addRoomButton  = page.locator("button.add-room-button");
    this.roomCards      = page.locator(".room-list-item");
  }

  async goto() {
    await this.page.goto("/admin/manage-rooms");
    await this.page.waitForLoadState("domcontentloaded");
  }

  async waitForLoad() {
    await this.heading.waitFor({ state: "visible", timeout: 10_000 });
  }

  async getRoomCount() {
    return this.roomCards.count();
  }

  async selectRoomType(type) {
    // Filter is client-side state — DOM updates synchronously after selectOption
    await this.roomTypeSelect.selectOption(type);
  }

  async clickAddRoom() {
    await this.addRoomButton.click();
  }

  // Uses index-based selection because room cards have no stable unique identifier
  async clickEditRoom(index = 0) {
    await this.roomCards.nth(index)
      .getByRole("button", { name: /edit|manage/i })
      .click();
  }
}

// ─────────────────────────────────────────────────────────────────
// ManageBookingsPage
// ─────────────────────────────────────────────────────────────────
export class ManageBookingsPage {
  constructor(page) {
    this.page = page;

    this.heading      = page.getByRole("heading", { name: /all bookings/i });
    this.searchInput  = page.getByPlaceholder(/enter booking number/i);
    this.bookingItems = page.locator(".booking-result-item");
  }

  async goto() {
    await this.page.goto("/admin/manage-bookings");
    await this.page.waitForLoadState("domcontentloaded");
  }

  async waitForLoad() {
    await this.heading.waitFor({ state: "visible", timeout: 10_000 });
  }

  async getBookingCount() {
    return this.bookingItems.count();
  }

  async search(term) {
    // Filter is client-side — DOM updates synchronously after fill
    await this.searchInput.fill(term);
  }

  async clearSearch() {
    await this.searchInput.clear();
  }

  // Uses index-based selection because booking items have no stable unique identifier
  async clickManageBooking(index = 0) {
    await this.bookingItems.nth(index)
      .getByRole("button", { name: /manage booking/i })
      .click();
  }
}
