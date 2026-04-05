# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack hotel booking system used as a QA portfolio project. Two separate repos share a git history:

| Repo | Path | Stack | Port |
|------|------|-------|------|
| Frontend | `hotel-react-frontend/` | React 19 + React Router 7 + Axios + Stripe | 3000 |
| Backend  | `HotelBookingBackend/`  | Spring Boot 3.4.1 + Java 21 + MySQL + JWT | 9090 |

---

## Commands

### Frontend

```bash
# Dev server
npm start

# Run all Playwright E2E tests (requires backend + MySQL running)
npx playwright test

# Run a single spec file
npx playwright test tests/rooms/all-rooms.spec.js

# Run tests for a specific project (auth role)
npx playwright test --project=chromium          # customer-logged-in
npx playwright test --project=chromium-public   # no auth
npx playwright test --project=chromium-admin    # admin-logged-in

# Run only the auth setup (regenerates tests/.auth/*.json)
npx playwright test --project=setup

# Open Playwright report after a run
npx playwright show-report

# Verbose mode (logs all requests/responses in API tests too)
npx playwright test --debug
```

### Backend

```bash
# Run the application (requires MySQL on localhost:3306/hotel)
./mvnw spring-boot:run

# Run all tests (unit + API — requires live server on :9090)
./mvnw test

# Run a single test class
./mvnw test -Dtest=BookingServiceImplTest
./mvnw test -Dtest=BookingApiTest

# Run only unit tests (no live server needed)
./mvnw test -Dtest="unit.*"

# Run only API tests (requires live server + seed data)
./mvnw test -Dtest="api.*"

# Verbose REST Assured logging
./mvnw test -Dtest.verbose=true
```

---

## Backend Architecture

All classes live under `com.example.HotelBooking`.

**Request flow:** `Controller → ServiceImpl → Repository (JPA)`

**Single response object:** Every endpoint returns `Response` (a fat DTO with optional fields: `booking`, `bookings`, `room`, `rooms`, `user`, `token`, `message`, `status`). Never throws HTTP exceptions directly — exceptions are mapped in `GlobalExceptionHandler`.

**Auth flow:** Stateless JWT. `JwtUtils` issues/validates tokens. `CustomUserDetailsService` loads user by email. `AuthUser` wraps Spring Security's `UserDetails`. Token is stored encrypted (AES via CryptoJS) in frontend `localStorage`.

**Key enums:**
- `BookingStatus`: `BOOKED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`
- `PaymentStatus`: `PENDING`, `COMPLETED`, `FAILED`
- `RoomType`: `SINGLE`, `DOUBLE`, `SUITE` (and others — see enum file)

**Image upload:** Room images are saved to a local directory configured by `app.image.upload-dir` (default `./public/rooms/`). Frontend reads them from the same path. Hardcoded path is a known bug in CI.

---

## Known Bugs (Intentional — Do Not Fix)

These bugs are kept deliberately as interview discussion material. Do not auto-fix them.

**TC-B-05 — Date self-comparison bug**
- Booking validation does not reject `checkIn == checkOut` (zero-night stay)
- The condition compares the date against itself instead of against the other date
- Kept to demonstrate: how I document known defects, and how I distinguish a bug from a design decision

**PUT /payments/update — Unauthenticated endpoint**
- This endpoint has no auth guard and accepts updates from anonymous requests
- Kept to demonstrate: authorization boundary testing and the risk of missing access control on state-changing endpoints

When asked about these, explain the tradeoff — not a mistake, a conscious choice for portfolio depth.

---

## Test Architecture

### Backend — two layers, same JUnit 5 runner

| Package | Type | Dependencies |
|---------|------|-------------|
| `unit/` | Mockito unit tests | No Spring context, no DB |
| `api/`  | REST Assured integration tests | Live server on `:9090` + MySQL |

**`BaseApiTest`** is the parent of all API tests. It:
- Logs in once per class (`@BeforeAll`) as `admin@hotel.com` and `customer@hotel.com` and builds shared `RequestSpecification` objects (`adminSpec`, `customerSpec`, `anonSpec`)
- Calls `cleanupStaleTestData()` before each class — cancels active bookings and deletes test rooms (`roomNumber > 200`) via `docker exec hotel-mysql`

**Seed accounts required in DB before running API tests:**
```
customer@hotel.com / Customer1234!
admin@hotel.com    / Admin1234!
```

**Test layer decision rule — one question, two answers:**

> 去掉真实 DB 和 HTTP 层，这个测试还能跑吗？
>
> - **能跑** → Unit Test（用 mock）
> - **不能跑** → API Test（需要真实环境）
> - **两个层面都值得测** → 两个都写，但测不同的点

Concretely:
- Date validation, availability logic, price calculation → unit tests only; these are pure logic and must not be duplicated in API tests
- HTTP status codes, DB persistence, cross-table side effects (e.g. cancel → room becomes available) → API tests
- Access control (401/403/IDOR) → `AuthorizationTest` only — do not duplicate in feature test files
- Known bugs are documented in-place with `System.out.println("⚠️ BUG ...")` and assertions that pass in the broken state; fix by tightening the assertion

### Frontend — Playwright

**Three auth projects** share a single `setup` dependency:

| Project | Auth state |
|---------|-----------|
| `chromium-public` | None (anonymous) |
| `chromium` | `tests/.auth/customer.json` |
| `chromium-admin` | `tests/.auth/admin.json` |

Auth state files (`tests/.auth/*.json`) are generated by `auth.setup.js` and contain the full `localStorage` snapshot (encrypted JWT + role). They are gitignored — regenerate with `npx playwright test --project=setup`.

**Page Object pattern:** All selectors live in `tests/pages/`. Spec files import Page Objects and contain no raw selectors.

---

## Comment Style Rules

- English only
- Never translate code into words — readable code needs no comment
- Never comment every line
- Only comment these three cases:

  1. Business rules
     // Booking reference must be unique across all active bookings

  2. Non-obvious logic
     // Retry until unique due to potential race condition

  3. Known tradeoffs or bugs
     // Not idempotent yet - duplicate payment may occur

---

## Local Environment Setup

**MySQL** must be running with a database named `hotel`. Override credentials via environment variables or `application-local.properties` (gitignored):

```properties
# HotelBookingBackend/application-local.properties
spring.datasource.password=yourpassword
secreteJwtString=your-jwt-secret
```

**API test cleanup** uses `docker exec hotel-mysql` — the MySQL container must be named `hotel-mysql` or the cleanup step is silently skipped (best-effort).

**Frontend → Backend** communication uses `ApiService.BASE_URL = "http://localhost:9090/api"` (hardcoded). No `.env` file needed for local development.