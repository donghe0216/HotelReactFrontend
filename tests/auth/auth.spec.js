// tests/auth/auth.spec.js
// Project: chromium-public (no auth required)
//
// Covers: login form validation, credential verification, token storage,
//         registration form validation, duplicate email handling.
//
// Out of scope:
//   - Password strength rules (no complexity policy enforced in current build)
//   - OAuth / social login (not implemented)
//   - Session expiry and token refresh (covered at API layer)
//
// TC-AUTH-01~04  Login page
// TC-AUTH-05~08  Register page

import { test, expect } from "@playwright/test";
import { LoginPage }    from "../pages/LoginPage.js";
import { RegisterPage } from "../pages/RegisterPage.js";

const CUSTOMER = { email: "customer@hotel.com", password: "Customer1234!" };

// ══════════════════════════════════════════════════════════════════
// Login Page
// ══════════════════════════════════════════════════════════════════
test.describe("Login Page", () => {

  // ─────────────────────────────────────────────────────────────
  // TC-AUTH-01  page loads with all required elements
  // ─────────────────────────────────────────────────────────────
  test("TC-AUTH-01 | page loads with email input, password input, and Login button", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-public", "Auth tests run in chromium-public only");
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.registerLink).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // TC-AUTH-02  submitting empty form shows validation error
  // ─────────────────────────────────────────────────────────────
  test("TC-AUTH-02 | submitting empty form shows validation error", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-public", "Auth tests run in chromium-public only");
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.submitButton.click();
    await expect(loginPage.errorMessage).toBeVisible({ timeout: 4_000 });
    const msg = await loginPage.errorMessage.textContent();
    expect(msg).toContain("Please fill all input");
  });

  // ─────────────────────────────────────────────────────────────
  // TC-AUTH-03  wrong password shows backend error message
  // ─────────────────────────────────────────────────────────────
  test("TC-AUTH-03 | wrong password shows error message from backend", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-public", "Auth tests run in chromium-public only");
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login(CUSTOMER.email, "WrongPassword!");

    const msg = await loginPage.getErrorMessage();
    expect(msg).toMatch(/password doesn't match/i);
  });

  // ─────────────────────────────────────────────────────────────
  // TC-AUTH-04  valid credentials redirect to /home and store token
  // ─────────────────────────────────────────────────────────────
  test("TC-AUTH-04 | valid credentials redirect to /home and save token to localStorage", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-public", "Auth tests run in chromium-public only");
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login(CUSTOMER.email, CUSTOMER.password);

    await expect(page).toHaveURL(/home/, { timeout: 8_000 });
    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeTruthy();
  });

});

// ══════════════════════════════════════════════════════════════════
// Register Page
// ══════════════════════════════════════════════════════════════════
test.describe("Register Page", () => {

  // ─────────────────────────────────────────────────────────────
  // TC-AUTH-05  page loads with all required fields
  // ─────────────────────────────────────────────────────────────
  test("TC-AUTH-05 | page loads with all input fields and Register button", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-public", "Auth tests run in chromium-public only");
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await expect(registerPage.firstNameInput).toBeVisible();
    await expect(registerPage.lastNameInput).toBeVisible();
    await expect(registerPage.emailInput).toBeVisible();
    await expect(registerPage.phoneNumberInput).toBeVisible();
    await expect(registerPage.passwordInput).toBeVisible();
    await expect(registerPage.submitButton).toBeVisible();
    await expect(registerPage.loginLink).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // TC-AUTH-06  submitting empty form shows validation error
  // ─────────────────────────────────────────────────────────────
  test("TC-AUTH-06 | submitting empty form shows validation error", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-public", "Auth tests run in chromium-public only");
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.submitButton.click();
    await expect(registerPage.errorMessage).toBeVisible({ timeout: 4_000 });
    const msg = await registerPage.errorMessage.textContent();
    expect(msg).toContain("Please fill all fields");
  });

  // ─────────────────────────────────────────────────────────────
  // TC-AUTH-07  registering with an already-existing email shows error
  // ─────────────────────────────────────────────────────────────
  test("TC-AUTH-07 | registering with existing email shows error from backend", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-public", "Auth tests run in chromium-public only");
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.register({
      firstName:   "Test",
      lastName:    "User",
      email:       CUSTOMER.email,
      phoneNumber: "09011112222",
      password:    "Test1234!",
    });

    const msg = await registerPage.getErrorMessage();
    expect(msg).toMatch(/already exists/i);
  });

  // ─────────────────────────────────────────────────────────────
  // TC-AUTH-08  successful registration shows success message and redirects to /login
  // Timestamp suffix on email avoids unique constraint conflicts on re-runs.
  // ─────────────────────────────────────────────────────────────
  test("TC-AUTH-08 | successful registration shows success message then redirects to /login", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-public", "Auth tests run in chromium-public only");
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    const email = `test_${Date.now()}@hotel.com`;
    await registerPage.register({
      firstName:   "Test",
      lastName:    "User",
      email,
      phoneNumber: "09011112222",
      password:    "Test1234!",
    });

    const msg = await registerPage.getSuccessMessage();
    expect(msg).toMatch(/registered successfully/i);
    await expect(page).toHaveURL(/login/, { timeout: 5_000 });
  });

});
