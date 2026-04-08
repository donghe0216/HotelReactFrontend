# E2E Test Technical Debt

## Out of Scope (Current Phase)

### Admin User Management (`admin.spec.js`)
- **Reason**: High implementation cost; covers multiple operation flows (add room, edit room, manage bookings, manage users).
- **Risk mitigation**: Authorization rules and CRUD operations are fully covered at the API layer (`AuthorizationTest.java`, `RoomApiTest.java`, `BookingApiTest.java`).
- **To be added when**: Admin UI stabilizes or QA capacity allows.


---

## Known Bugs (Documented via `test.fail()`)

| TC | File | Description |
|----|------|-------------|
| TC-AUTH-02 | `auth/auth.spec.js` | Login: empty submit does not trigger React error — `required` attribute makes `setError()` unreachable |
| TC-AUTH-06 | `auth/auth.spec.js` | Register: same issue as TC-AUTH-02 |
| TC-EDIT-02a | `profile/profile.spec.js` | EditProfile page has no input fields — editing is not implemented |
| TC-EDIT-02b | `profile/profile.spec.js` | No save button exists, so PUT /users/update is never called from the UI |
| TC-EDIT-05 | `profile/profile.spec.js` | After account deletion, app navigates to `/signup` which has no route |
