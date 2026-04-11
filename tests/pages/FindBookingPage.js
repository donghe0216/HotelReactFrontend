// tests/pages/FindBookingPage.js
// Structure based on FindBookingPage.jsx:
//   - input            : placeholder="Enter your booking confirmation code"
//   - Find button      : button text="Find"
//   - booking details  : .booking-details
//   - error message    : style="color: red" (inline style — no className)
//   - booker details section
//   - room details section

export class FindBookingPage {
  constructor(page) {
    this.page = page;

    this.codeInput      = page.getByPlaceholder(/booking confirmation code/i);
    this.findButton     = page.getByRole("button", { name: /find/i });

    this.errorMessage   = page.locator(".error-message");

    this.bookingDetails = page.locator(".booking-details");
    this.bookingCode    = page.locator(".booking-details p", { hasText: /booking code/i });
    this.checkInDate    = page.locator(".booking-details p", { hasText: /check-in date/i });
    this.checkOutDate   = page.locator(".booking-details p", { hasText: /check-out date/i });
  }

  async goto() {
    await this.page.goto("/find-booking");
  }

  async search(code) {
    await this.codeInput.fill(code);
    await this.findButton.click();
  }

  async getErrorMessage() {
    await this.errorMessage.waitFor({ state: "visible", timeout: 6_000 });
    return this.errorMessage.textContent();
  }

  async waitForBookingDetails() {
    await this.bookingDetails.waitFor({ state: "visible", timeout: 10_000 });
  }
}
