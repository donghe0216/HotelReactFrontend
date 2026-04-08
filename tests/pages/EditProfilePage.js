// tests/pages/EditProfilePage.js
// Structure based on EditProfile.jsx:
//   - h2               : "Edit Profile"
//   - profile details  : .profile-details (read-only display)
//   - delete button    : button.delete-profile-button
//   - confirm dialog   : window.confirm (native browser dialog)
//   - error message    : .error-message
//
// Note: despite the name, EditProfile.jsx has no edit form at all.
// It only shows user info + a delete account button.

export class EditProfilePage {
  constructor(page) {
    this.page = page;

    this.heading         = page.getByRole("heading", { name: /edit profile/i });
    this.profileDetails  = page.locator(".profile-details");
    // Using getByRole for stability — CSS class names can break after refactoring.
    this.deleteButton    = page.getByRole("button", { name: /delete/i });
    this.errorMessage    = page.locator(".error-message");
  }

  async goto() {
    await this.page.goto("/edit-profile");
    await this.page.waitForLoadState("networkidle");
  }

  async waitForProfileToLoad() {
    await this.profileDetails.waitFor({ state: "visible", timeout: 10_000 });
  }

  /** Accept or dismiss the delete confirmation dialog. */
  async clickDeleteWithConfirm(accept = true) {
    this.page.once("dialog", (dialog) => {
      if (accept) dialog.accept();
      else dialog.dismiss();
    });
    await this.deleteButton.click();
  }
}
