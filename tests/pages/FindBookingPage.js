// tests/pages/FindBookingPage.js
//
// /find-booking is public — no auth required.
// Error message uses both className="error-message" and inline style color:red;
// locating by className is sufficient and more stable than style-based selectors.

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
    await this.codeInput.waitFor({ state: "visible" });
  }

  // No wait after click — what to wait for depends on the test scenario:
  // success path waits via waitForBookingDetails(); error path via getErrorMessage()
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
