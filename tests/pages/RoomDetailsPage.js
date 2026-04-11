// tests/pages/RoomDetailsPage.js
// Structure based on RoomDetailsPage.jsx:
//   - room info    : .room-details-info
//   - "Select Dates" button  → shows DayPicker
//   - Check-in / Check-out DayPicker
//   - "Proceed" button       → shows booking preview
//   - Booking preview        : .booking-preview
//   - "Confirm and Book"     → calls acceptBooking()
//   - "Cancel" button        → hides preview
//   - success message        : .booking-success-message
//   - error message          : .error-message

export class RoomDetailsPage {
  constructor(page) {
    this.page = page;

    // ── Room info ─────────────────────────────────────────────────
    this.roomInfo         = page.locator(".room-details-info");
    this.roomImage        = page.locator(".room-details-image");

    // ── Booking controls ──────────────────────────────────────────
    this.selectDatesBtn   = page.getByRole("button", { name: /select dates/i });
    this.proceedBtn       = page.getByRole("button", { name: /proceed/i });
    this.confirmBookingBtn= page.getByRole("button", { name: /confirm and book/i });
    this.cancelBookingBtn = page.locator("button.cancel-booking");

    // ── DayPicker containers ──────────────────────────────────────
    this.checkInPicker    = page.locator(".date-picker", { has: page.getByText("Check-in Date",  { exact: true }) });
    this.checkOutPicker   = page.locator(".date-picker", { has: page.getByText("Check-out Date", { exact: true }) });

    // ── Booking preview ───────────────────────────────────────────
    this.bookingPreview   = page.locator(".booking-preview");
    this.previewCheckIn   = page.locator(".booking-preview p", { hasText: /check-in date/i });
    this.previewCheckOut  = page.locator(".booking-preview p", { hasText: /check-out date/i });
    this.previewTotalDays = page.locator(".booking-preview p", { hasText: /total days/i });
    this.previewTotalPrice= page.locator(".booking-preview p", { hasText: /total price/i });

    // ── Messages ──────────────────────────────────────────────────
    this.successMessage   = page.locator(".booking-success-message");
    this.errorMessage     = page.locator(".error-message");
  }

  async goto(roomId) {
    await this.page.goto(`/room-details/${roomId}`);
    // Wait for room data to load (Loading... disappears)
    await this.roomInfo.waitFor({ state: "visible", timeout: 10_000 });
  }

  /**
   * Click a specific day in a DayPicker container.
   * @param {Locator} pickerLocator  - checkInPicker or checkOutPicker
   * @param {number}  dayNumber      - day of month (1-31)
   */
  async pickDay(pickerLocator, dayNumber) {
    // react-day-picker v9: structure is <td role="gridcell"><button>20</button></td>
    // The button has no role="gridcell" — just filter all buttons by text content.
    await pickerLocator
      .locator("button")
      .filter({ hasText: new RegExp(`^${dayNumber}$`) })
      .first()
      .click();
  }

  /**
   * Navigate a DayPicker forward by n months by clicking "Go to the Next Month".
   * @param {Locator} pickerLocator
   * @param {number}  n  months to advance
   */
  async navigateMonths(pickerLocator, n) {
    for (let i = 0; i < n; i++) {
      await pickerLocator
        .getByRole("button", { name: "Go to the Next Month" })
        .click();
    }
  }

  async openDatePicker() {
    await this.selectDatesBtn.click();
    await this.checkInPicker.waitFor({ state: "visible" });
  }

  /**
   * @param {number} checkInDay
   * @param {number} checkOutDay
   * @param {number} [monthsAhead=0]  navigate this many months forward before picking
   */
  async selectDates(checkInDay, checkOutDay, monthsAhead = 0) {
    await this.openDatePicker();
    if (monthsAhead > 0) {
      await this.navigateMonths(this.checkInPicker,  monthsAhead);
      await this.navigateMonths(this.checkOutPicker, monthsAhead);
    }
    await this.pickDay(this.checkInPicker,  checkInDay);
    await this.pickDay(this.checkOutPicker, checkOutDay);
  }

  async proceedToPreview() {
    await this.proceedBtn.click();
    await this.bookingPreview.waitFor({ state: "visible" });
  }

  async confirmBooking() {
    await this.confirmBookingBtn.click();
  }

  async getSuccessMessage() {
    await this.successMessage.waitFor({ state: "visible", timeout: 10_000 });
    return this.successMessage.textContent();
  }

  async getErrorMessage() {
    await this.errorMessage.waitFor({ state: "visible", timeout: 6_000 });
    return this.errorMessage.textContent();
  }
}
