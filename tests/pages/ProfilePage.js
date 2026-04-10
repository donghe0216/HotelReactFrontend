// tests/pages/ProfilePage.js
//
// welcomeHeading matches by text so it remains stable even if other h2s are added.
// Buttons use getByRole so class name refactors don't break the locators.

export class ProfilePage {
  constructor(page) {
    this.page = page;

    this.welcomeHeading    = page.getByRole("heading", { name: /welcome/i });
    this.editProfileButton = page.getByRole("button", { name: /edit profile/i });
    this.logoutButton      = page.getByRole("button", { name: /logout/i });
    this.profileDetails    = page.locator(".profile-details");
    this.bookingItems        = page.locator(".booking-item");
    this.noBookingsMessage   = page.getByText("No bookings found.");
    this.errorMessage        = page.locator(".error-message");
    // Only rendered when bookingStatus === 'BOOKED' and checkInDate > today
    this.cancelBookingButton = page.locator("button.cancel-booking-button");
  }

  async goto() {
    await this.page.goto("/profile");
    await this.waitForProfileToLoad();
  }

  async waitForProfileToLoad() {
    await this.welcomeHeading.waitFor({ state: "visible", timeout: 10_000 });
  }

  // Returns the full welcome text e.g. "Welcome, John"
  async getWelcomeName() {
    return this.welcomeHeading.textContent();
  }

  async getBookingCount() {
    return this.bookingItems.count();
  }

  async clickEditProfile() {
    await this.editProfileButton.click();
  }

  async clickLogout() {
    await this.logoutButton.click();
  }
}
