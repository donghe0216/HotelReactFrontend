# Hotel Booking System — Frontend

[![E2E Tests](https://github.com/donghe0216/HotelReactFrontend/actions/workflows/e2e.yml/badge.svg)](https://github.com/donghe0216/HotelReactFrontend/actions/workflows/e2e.yml)

A full-stack hotel booking system built as a QA portfolio project, demonstrating end-to-end test automation, CI/CD, and cloud deployment.

**Live:** https://d1sr0fmxk50vjd.cloudfront.net/home  
**Backend repo:** https://github.com/donghe0216/HotelJavaBackend

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19, React Router 7 |
| HTTP | Axios |
| E2E Tests | Playwright |
| CI/CD | GitHub Actions |
| Hosting | AWS S3 + CloudFront |

---

## Test Coverage

All E2E tests use the **Page Object Model** pattern. Selectors are encapsulated in `tests/pages/` — spec files contain no raw selectors.

| Spec | Test Cases | Scope |
|------|-----------|-------|
| `tests/rooms/all-rooms.spec.js` | TC-AR-01~07 | Room listing, search, filter |
| `tests/rooms/room-details.spec.js` | TC-RD-01~09 | Room detail page, date picker |
| `tests/profile/profile.spec.js` | TC-PRO-01~08, TC-EDIT-01~05 | Profile view, edit, cancel booking |
| `tests/booking/find-booking.spec.js` | TC-FB-01~09 | Find booking by reference |

### Auth Projects

Three Playwright projects share a single `setup` step:

| Project | Auth State |
|---------|-----------|
| `chromium-public` | Anonymous |
| `chromium` | Customer logged in |
| `chromium-admin` | Admin logged in |

---

## Documented Bugs

Bugs are intentionally preserved as portfolio material. Each has a corresponding test case.

| ID | Location | Description |
|----|----------|-------------|
| TC-EDIT-02 | Edit Profile page | No input fields rendered — cannot actually edit profile |
| TC-EDIT-05 | Delete account flow | Redirects to `/signup` (route does not exist, should be `/register`) |
| TC-FB-09 | Find Booking page | "Booker Detials" — typo in heading |

---

<details>
<summary>Local Setup</summary>

**Prerequisites:**
- Node.js 20+
- npm 9+
- Backend running on `localhost:9090` with seed data (see [Backend README](https://github.com/donghe0216/HotelJavaBackend))

```bash
# 1. Clone the repository
git clone https://github.com/donghe0216/HotelReactFrontend.git
cd HotelReactFrontend

# 2. Install dependencies
npm ci

# 3. Start the dev server
npm start
```

### Run E2E Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install chromium --with-deps

# Generate auth state files (first time or after credential changes)
npx playwright test --project=setup

# All tests (requires backend + MySQL)
npx playwright test

# By auth role
npx playwright test --project=chromium          # customer
npx playwright test --project=chromium-public   # anonymous
npx playwright test --project=chromium-admin    # admin

# Single spec
npx playwright test tests/rooms/all-rooms.spec.js

# View HTML report
npx playwright show-report
```

</details>

---

## Project Structure

```
src/
  component/         # React components
  service/           # ApiService (Axios wrapper)
tests/
  pages/             # Page Object classes
  rooms/             # Room-related specs
  profile/           # Profile specs
  booking/           # Booking specs
  .auth/             # Saved auth state (gitignored)
```
