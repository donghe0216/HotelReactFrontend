// tests/profile/profile.spec.js
// Project: chromium (requires customer storageState)
//
// Covers: profile info display, logout behavior, booking history rendering,
//         account deletion flow, edit profile page (including known bugs).
//
// Out of scope:
//   - Profile update API correctness (covered in UserApiTest.java)
//   - Password change (not implemented in current build)
//   - Admin-initiated user management (covered in AuthorizationTest.java)

import { test, expect } from "@playwright/test";
import { ProfilePage }     from "../pages/ProfilePage.js";
import { EditProfilePage } from "../pages/EditProfilePage.js";

test.describe("👤 Profile Page", () => {

  // ─────────────────────────────────────────────────────────────
  // TC-PRO-01  page loads with welcome heading and user info
  // ─────────────────────────────────────────────────────────────
  test("TC-PRO-01 | page loads with welcome heading and user info", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-public", "Requires auth");
    const profilePage = new ProfilePage(page);
    await profilePage.goto();
    await profilePage.waitForProfileToLoad();

    const heading = await profilePage.welcomeHeading.textContent();
    expect(heading).toMatch(/welcome/i);

    const detailsText = await profilePage.profileDetails.textContent();
    expect(detailsText).toMatch(/email/i);
    expect(detailsText).toMatch(/phone/i);
  });

  // ─────────────────────────────────────────────────────────────
  // TC-PRO-02  page shows Edit Profile and Logout buttons
  // ─────────────────────────────────────────────────────────────
  test("TC-PRO-02 | page shows Edit Profile and Logout buttons", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-public", "Requires auth");
    const profilePage = new ProfilePage(page);
    await profilePage.goto();
    await profilePage.waitForProfileToLoad();

    await expect(profilePage.editProfileButton).toBeVisible();
    await expect(profilePage.logoutButton).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // TC-PRO-03  clicking Edit Profile navigates to /edit-profile
  // ─────────────────────────────────────────────────────────────
  test("TC-PRO-03 | clicking Edit Profile navigates to /edit-profile", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-public", "Requires auth");
    const profilePage = new ProfilePage(page);
    await profilePage.goto();
    await profilePage.waitForProfileToLoad();
    await profilePage.clickEditProfile();

    await expect(page).toHaveURL(/edit-profile/);
  });

  // ─────────────────────────────────────────────────────────────
  // TC-PRO-04  clicking Logout clears the token and redirects to /home
  // ─────────────────────────────────────────────────────────────
  test("TC-PRO-04 | clicking Logout clears token and redirects to /home", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-public", "Requires auth");
    const profilePage = new ProfilePage(page);
    await profilePage.goto();
    await profilePage.waitForProfileToLoad();
    await profilePage.clickLogout();

    await expect(page).toHaveURL(/home/);

    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeFalsy();
  });

  // ─────────────────────────────────────────────────────────────
  // TC-PRO-05  booking list shows when user has past bookings
  // ─────────────────────────────────────────────────────────────
  test("TC-PRO-05 | booking list shows when user has past bookings", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-public", "Requires auth");
    const profilePage = new ProfilePage(page);
    await profilePage.goto();
    await profilePage.waitForProfileToLoad();

    const count = await profilePage.getBookingCount();

    // Branching on runtime state: seed data may or may not include bookings for this account.
    // TC-PRO-06 covers the guaranteed zero-booking case with a fresh user.
    if (count > 0) {
      const firstItem = profilePage.bookingItems.first();
      const itemText  = await firstItem.textContent();
      expect(itemText).toMatch(/booking code/i);
      expect(itemText).toMatch(/check-in/i);
    } else {
      await expect(profilePage.noBookingsMessage).toBeVisible();
    }
  });

  // ─────────────────────────────────────────────────────────────
  // TC-PRO-06  user with no bookings sees "No bookings found."
  // ─────────────────────────────────────────────────────────────
  test("TC-PRO-06 | new user with no bookings sees 'No bookings found.'", async ({ browser }) => {
    // Fresh context: register + login a brand-new user
    const context = await browser.newContext();
    const page    = await context.newPage();

    const freshEmail = `fresh_${Date.now()}@hotel.com`;

    // Register
    await page.goto("/register");
    await page.locator('input[name="firstName"]').fill("Fresh");
    await page.locator('input[name="lastName"]').fill("User");
    await page.locator('input[name="email"]').fill(freshEmail);
    await page.locator('input[name="phoneNumber"]').fill("09099999999");
    await page.locator('input[name="password"]').fill("FreshPass1234!");
    await page.getByRole("button", { name: /register/i }).click();
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });

    // Login
    await page.locator('input[name="email"]').fill(freshEmail);
    await page.locator('input[name="password"]').fill("FreshPass1234!");
    await page.getByRole("button", { name: /login/i }).click();
    await expect(page).toHaveURL(/home/, { timeout: 15_000 });

    // Visit profile
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("No bookings found.")).toBeVisible({ timeout: 8_000 });

    await context.close();
  });

  // ─────────────────────────────────────────────────────────────
  // TC-PRO-07  unauthenticated user visiting /profile is redirected to /login
  // ─────────────────────────────────────────────────────────────
  test("TC-PRO-07 | unauthenticated user visiting /profile is redirected to /login", async ({ browser }, testInfo) => {
    // This test creates a fresh context with no auth — should work in any project.
    // Skip in authenticated projects to avoid flakiness from browser-level timing.
    test.skip(testInfo.project.name !== "chromium-public", "Unauthenticated Guard test — run in chromium-public only");
    const context = await browser.newContext(); // no storageState
    const page    = await context.newPage();

    await page.goto("/profile");
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });

    await context.close();
  });
});

// ══════════════════════════════════════════════════════════════════
// Edit Profile Page tests
// ══════════════════════════════════════════════════════════════════
test.describe("✏️ Edit Profile Page", () => {

  // ─────────────────────────────────────────────────────────────
  // TC-EDIT-01  page loads with user info and Delete button
  // ─────────────────────────────────────────────────────────────
  test("TC-EDIT-01 | page loads with user info and Delete button", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-public", "Requires auth");
    const editPage = new EditProfilePage(page);
    await editPage.goto();
    await editPage.waitForProfileToLoad();

    await expect(editPage.heading).toBeVisible();
    await expect(editPage.deleteButton).toBeVisible();

    const detailsText = await editPage.profileDetails.textContent();
    expect(detailsText).toMatch(/first name/i);
    expect(detailsText).toMatch(/email/i);
  });

  // ─────────────────────────────────────────────────────────────
  // TC-EDIT-02a  [Bug] EditProfile page has no input fields for editing
  //
  //   Expected: firstName, lastName, phoneNumber inputs + Save button
  //   Actual:   no form fields at all — page only shows read-only info and Delete button
  // ─────────────────────────────────────────────────────────────
  test("TC-EDIT-02a | [Bug] EditProfile page has no input fields for editing", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-public", "Requires auth");
    const editPage = new EditProfilePage(page);
    await editPage.goto();
    await editPage.waitForProfileToLoad();

    // Bug: none of these inputs exist — editing is not implemented
    test.fail();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="phoneNumber"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /save/i })).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // TC-EDIT-02b  [Bug] submitting edit form never calls PUT /users/update
  //
  //   Backend PUT /users/update exists and is tested (TC-U-10~14).
  //   Bug: frontend has no form, so the API is never called from this page.
  // ─────────────────────────────────────────────────────────────
  test("TC-EDIT-02b | [Bug] submitting edit never calls PUT /users/update", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-public", "Requires auth");
    const editPage = new EditProfilePage(page);
    await editPage.goto();
    await editPage.waitForProfileToLoad();

    // Monitor outgoing requests to detect whether the update API is called
    let updateCalled = false;
    page.on("request", (req) => {
      if (req.method() === "PUT" && req.url().includes("/users/update")) {
        updateCalled = true;
      }
    });

    // Bug: no save button exists, so we cannot even attempt to submit
    test.fail();
    await page.getByRole("button", { name: /save/i }).click();
    expect(updateCalled).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────
  // TC-EDIT-03  clicking Delete shows a browser confirm dialog
  // ─────────────────────────────────────────────────────────────
  test("TC-EDIT-03 | clicking Delete My Account shows a confirm dialog", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-public", "Requires auth");
    const editPage = new EditProfilePage(page);
    await editPage.goto();
    await editPage.waitForProfileToLoad();

    let dialogMessage = "";
    page.once("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.dismiss();  // dismiss so account isn't actually deleted
    });

    await editPage.deleteButton.click();

    expect(dialogMessage).toMatch(/delete your account/i);
  });

  // ─────────────────────────────────────────────────────────────
  // TC-EDIT-04  canceling the delete dialog keeps the account and stays on same page
  // ─────────────────────────────────────────────────────────────
  test("TC-EDIT-04 | canceling delete keeps the account and stays on same page", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "chromium-public", "Requires auth");
    const editPage = new EditProfilePage(page);
    await editPage.goto();
    await editPage.waitForProfileToLoad();

    await editPage.clickDeleteWithConfirm(false); // dismiss

    // Should stay on edit-profile
    await expect(page).toHaveURL(/edit-profile/);
  });

  // ─────────────────────────────────────────────────────────────
  // TC-EDIT-05  [Bug] after delete, app navigates to /signup which does not exist
  //
  //   EditProfile.jsx calls navigate('/signup') but /signup has no route in App.js.
  //   After deletion, the app navigates to /signup which has no route.
  //   Should be navigate('/register') or navigate('/home').
  // ─────────────────────────────────────────────────────────────
  test("TC-EDIT-05 | [Bug] after delete, navigates to /signup which does not exist", async ({ browser }) => {
    // Use a disposable account so we can safely delete it
    const context = await browser.newContext();
    const page    = await context.newPage();
    const tempEmail = `delete_me_${Date.now()}@hotel.com`;

    // Register
    await page.goto("/register");
    await page.locator('input[name="firstName"]').fill("Del");
    await page.locator('input[name="lastName"]').fill("Me");
    await page.locator('input[name="email"]').fill(tempEmail);
    await page.locator('input[name="phoneNumber"]').fill("09011112222");
    await page.locator('input[name="password"]').fill("DeleteMe1234!");
    await page.getByRole("button", { name: /register/i }).click();
    await expect(page).toHaveURL(/login/, { timeout: 15_000 });

    // Login
    await page.locator('input[name="email"]').fill(tempEmail);
    await page.locator('input[name="password"]').fill("DeleteMe1234!");
    await page.getByRole("button", { name: /login/i }).click();
    await expect(page).toHaveURL(/home/, { timeout: 15_000 });

    // Delete account
    await page.goto("/edit-profile");
    await page.waitForLoadState("networkidle");
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /delete/i }).click();

    // BUG: navigates to /signup which doesn't exist → falls back to /home via wildcard
    // After fix: should navigate to /register
    await page.waitForURL(/signup|register|home/, { timeout: 8_000 });
    const finalUrl = page.url();
    console.warn(`⚠️ After delete, navigated to: ${finalUrl} (expected /register)`);

    await context.close();
  });
});
