# Hotel Booking System — Frontend

[![E2E Tests](https://github.com/donghe0216/HotelReactFrontend/actions/workflows/e2e.yml/badge.svg)](https://github.com/donghe0216/HotelReactFrontend/actions/workflows/e2e.yml)

A full-stack hotel booking system built as a QA portfolio project, demonstrating end-to-end test automation, CI/CD, and cloud deployment. **53 E2E tests** across 5 spec files using the Page Object Model.

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
| `tests/auth/auth.spec.js` | TC-AUTH-01–08 | Login and register form validation |
| `tests/rooms/all-rooms.spec.js` | TC-AR-01–13 | Room listing, search, filter, date picker |
| `tests/rooms/room-details.spec.js` | TC-RD-01–09 | Room detail page, booking flow |
| `tests/profile/profile.spec.js` | TC-PRO-01–09, TC-EDIT-01–05 | Profile view, edit, cancel booking |
| `tests/booking/find-booking.spec.js` | TC-FB-01–08 | Find booking by reference |

### Auth Projects

Three Playwright projects share a single `setup` step:

| Project | Auth State |
|---------|-----------|
| `chromium-public` | Anonymous |
| `chromium` | Customer logged in |
| `chromium-admin` | Admin logged in |

---

## Bug Report

### Fixed

Bugs found during development and testing, now resolved.

| ID | Location | Description | Severity | Found By |
|----|----------|-------------|----------|---------|
| BUG-F-01 | FindBookingPage | Invalid reference shows no reaction — CloudFront intercepts API 404 and returns HTML; `response.booking` was undefined with no null check | Medium | Manual testing |
| BUG-F-02 | ProfilePage | Cancel button disappears after 9am JST — `new Date("2026-04-14")` parses as midnight UTC (= 9am JST), making today's check-in appear past | Medium | Manual testing |
| BUG-F-03 | RoomDetailsPage | Selected date not highlighted in calendar — react-day-picker v9 removed `onDayClick`; requires `mode="single"` + `onSelect` | Low | Manual testing |
| BUG-F-04 | ProfilePage | Page crashes when room has been deleted — direct access to `booking.room.roomNumber` without null guard | High | Manual testing |
| BUG-F-05 | EditBookingPage | Page crashes when room or user has been deleted — `bookingDetails.room.type` and `bookingDetails.user.firstName` accessed without null guard | High | Manual testing |
| BUG-F-06 | EditBookingPage | First Name label was incorrectly displaying lastName field value | Low | Code review |
| BUG-B-01 | POST `/bookings/{id}/cancel` | Cancel endpoint was never implemented — frontend sent request, received 404 with no error shown to user (silent failure) | High | E2E TC-PRO-08 |

### Known (Preserved)

Intentionally kept as portfolio material. Each demonstrates a different class of defect.

| ID | Location | Description | Severity | Found By |
|----|----------|-------------|----------|---------|
| BUG-K-01 | Edit Profile page | No input fields rendered — profile cannot actually be edited | Medium | E2E TC-EDIT-02 |
| BUG-K-02 | Delete account flow | Redirects to `/signup` after deletion — route does not exist, should be `/register` | Low | E2E TC-EDIT-05 |
| BUG-K-03 | Find Booking page | Heading reads "Booker Detials" — typo | Low | Manual testing |


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
