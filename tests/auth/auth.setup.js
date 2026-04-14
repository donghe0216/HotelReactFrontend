// tests/auth/auth.setup.js
//
// Runs before all tests.
// Logs in as customer and admin, then saves localStorage (JWT + role) to files.
// Other tests just load the saved state — no need to go through login every time.
//
// Saves auth state to file so other tests can skip the login step

import { test as setup, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

// Test accounts — must match the seed data in the backend
const CUSTOMER = { email: "customer@hotel.com", password: "Customer1234!" };
const ADMIN    = { email: "admin@hotel.com",    password: "Admin1234!" };

const API_BASE = "http://localhost:9090/api";

// Paths where auth state files will be saved
const AUTH_DIR       = path.join("tests", ".auth");
const CUSTOMER_FILE  = path.join(AUTH_DIR, "customer.json");
const ADMIN_FILE     = path.join(AUTH_DIR, "admin.json");
const BOOKING_FILE   = path.join(AUTH_DIR, "booking.json");

// Make sure the directory exists
if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

// Shared login helper — fills the form and waits for redirect to /home
// Fills the login form and waits for redirect to /home
async function loginAs(page, { email, password }) {
  await page.goto("/login");

  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /login/i }).click();

  await expect(page).toHaveURL(/home/, { timeout: 10_000 });
}

// Setup 1: save customer auth state
// Setup 1: save customer auth state
setup("authenticate as customer", async ({ page }) => {
  await loginAs(page, CUSTOMER);
  await page.context().storageState({ path: CUSTOMER_FILE });
});

// Setup 2: save admin auth state
// Setup 2: save admin auth state
setup("authenticate as admin", async ({ page }) => {
  await loginAs(page, ADMIN);
  await page.context().storageState({ path: ADMIN_FILE });
});

// Setup 3: create a seed booking for find-booking tests
// Uses Playwright request API (no browser) to call the real backend.
// Writes the booking reference to a file so find-booking.spec.js can read it.
// If this fails, TC-FB-06~09 will be skipped safely via test.skip.
// Setup 3: create a seed booking for find-booking tests
setup("create seed booking", async ({ request }) => {
  // 1. Login via API to get JWT
  const loginRes = await request.post(`${API_BASE}/auth/login`, {
    data: { email: CUSTOMER.email, password: CUSTOMER.password },
  });
  if (!loginRes.ok()) return;
  const { token } = await loginRes.json();

  // 2. Get the first available room
  const roomsRes = await request.get(`${API_BASE}/rooms/all`);
  if (!roomsRes.ok()) return;
  const { rooms } = await roomsRes.json();
  const roomId = rooms?.[0]?.id;
  if (!roomId) return;

  // 3. Create a booking far in the future to avoid date conflicts
  const checkIn  = new Date();
  checkIn.setFullYear(checkIn.getFullYear() + 2);
  const fmt = (d) => d.toISOString().slice(0, 10);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 2);

  const bookingRes = await request.post(`${API_BASE}/bookings`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { roomId, checkInDate: fmt(checkIn), checkOutDate: fmt(checkOut) },
  });
  if (!bookingRes.ok()) return;
  const { booking } = await bookingRes.json();
  if (!booking?.bookingReference) return;

  fs.writeFileSync(BOOKING_FILE, JSON.stringify({ ref: booking.bookingReference }));
});
