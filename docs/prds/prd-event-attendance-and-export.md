# PRD: Event Attendance View and Export (V1)

## 1. Introduction / Overview

Admins need a dedicated place to review attendance for a specific event and export that data for reporting. This feature adds an Attendance tab within an event’s detail view that shows event-level KPIs and a detailed attendee table with filters. Admins can export filtered results to CSV or XLSX. Data is stored in UTC but displayed in the event’s timezone for clarity.

## 2. Goals

- Provide a clear, accurate overview of attendance per event (and per session) for Admins.
- Support table-level exploration with essential filters (session, status, search).
- Enable reliable export to CSV and XLSX that reflects current filters.
- Meet baseline performance targets for page load and exports with pagination and streaming.

## 3. Target Users

- Admin (V1). Organizer access may be added in V2.

## 4. User Stories

- As an Admin, I can open an event and view attendance KPIs so I can quickly assess turnout.
- As an Admin, I can filter attendees by session and status so I can investigate specific subsets.
- As an Admin, I can search by name, email, or student ID so I can locate specific attendees.
- As an Admin, I can export the currently filtered results to CSV or XLSX so I can share or archive them.

## 5. Functional Requirements

1) Access & Navigation
   - Admin-only access in V1.
   - Entry via Admin > Events list → click an event → Event detail → dedicated "Attendance" tab.
   - Optional deep link pattern: `/admin/events/[id]?tab=attendance` or `/admin/events/[id]/attendance`.

2) Views (V1 scope)
   - Summary KPIs:
     - Registered (event total)
     - Present (meets session presence criteria; see Status Definitions)
     - Checked In Only
     - Checked Out
     - Absent (registered but no qualifying check-in)
     - Attendance Rate (% present of registered)
     - Per-session aggregates (present, checked-in only, checked-out, absent)
   - Attendee Table:
     - Columns: Name, Email, Student/ID number, Program/Section, Check-in status, Check-in time, Check-out time, Session name
     - Sorting: by name, status, check-in time
     - Pagination: 50 rows per page default (configurable to 50–100)
     - Search: free-text across name, email, student ID
     - Filters:
       - Session(s) multi-select
       - Status: checked-in, checked-out, present, absent

3) Status Definitions
   - Present: attendee has a valid check-in within the session’s allowed window. If checkout exists, present remains true; if only check-in exists, status may show as "Checked In Only" but is still counted as present for rate if within window. Final logic will respect the current attendance policy.
   - Checked In Only: attendee has a valid check-in but no checkout recorded.
   - Checked Out: attendee has both a valid check-in and a valid checkout.
   - Absent: registered but no valid check-in for the session.
   - Duplicates: system prevents multiple valid check-ins; subsequent scans are logged as duplicates and not counted as additional presence.

4) Timezone & Timestamps
   - Storage: UTC in database.
   - Display: Event timezone for UI (times and date labels).
   - Exports: Include timezone designation for all timestamp columns (e.g., ISO 8601 with offset or a companion column indicating event timezone).

5) Export
   - Formats: CSV and XLSX.
   - Scope: One consolidated file including a `session` column. Export respects applied filters (session, status, search) and current sort.
   - Performance policy: synchronous export for ≤ 1,000 rows. CSV uses streaming; XLSX uses buffered generation. For >1,000 rows, V1 may still attempt sync with warning if near limits; V2 will introduce background jobs.
   - Columns in export should match the attendee table plus any IDs required for reconciliation (e.g., internal `attendeeId` if available). PII is allowed for Admins in V1.

6) Large Data Handling (UI)
   - Pagination (server-driven) with page size 50 by default; allow 50/100 selection.
   - Query parameters for filters, search, sort, and pagination for shareable links.

7) Data Consistency
   - Zero data mismatch between UI and export given identical filters and timestamp display rules.

## 6. Non-Goals (V1)

- Editing attendance records.
- Manual overrides or bulk updates.
- Real-time streaming of new scans in the Attendance tab.
- Cross-event comparative analytics.
- Device/scanner-level breakdown charts (defer to V2).

## 7. Design Considerations

- Align with current Admin > Events detail layout and tabs.
- Use existing UI components (cards for KPIs, `table` for attendees, pagination controls, filters/selects, inputs).
- Charts are out of scope for V1; place KPIs above the table and filters in a toolbar.
- Empty states and loading states consistent with existing admin patterns.

## 8. Technical Considerations

- Reuse existing Prisma models and queries where possible (attendance, sessions, registrations, users/students).
- Add focused queries if needed for:
  - Event-level aggregates and per-session aggregates.
  - Attendee list with joins for program/section and session name.
- API Endpoints (suggested):
  - GET `/api/admin/events/[id]/attendance` → KPIs + paginated attendees (filters: sessionIds[], status[], search, sort, page, pageSize; timezone context)
  - GET `/api/admin/events/[id]/attendance/export` → `format=csv|xlsx` with same filter params; returns stream (CSV) or file (XLSX)
- CSV streaming via web streams; XLSX via in-memory generation (e.g., SheetJS) within current size limits.
- Respect auth/role middleware for Admin-only access.
- Timestamps: server converts UTC → event timezone for response and export; include timezone metadata.
- Ensure indexes on attendance/session foreign keys to meet performance targets.

## 9. Data Model Inputs (Reference)

- Event: id, name, timezone, start/end (for context)
- Session: id, eventId, name, schedule (late/early windows where applicable)
- Registration/Student: id, name, email, studentId, program/section
- Attendance/Scan: attendeeId/studentId, sessionId, checkInAt, checkOutAt, validity/duplicate flags

## 10. Success Metrics

- Export completes < 10 seconds for ≤ 10,000 rows (CSV streaming path; XLSX within practical limits).
- Page loads < 2 seconds (TTFB for API) for ≤ 10,000 records when paginated.
- Zero measurable data mismatch between UI and export.
- < 1% support tickets related to exports/attendance visibility over first month post-release.

## 11. Edge Cases

- Duplicate scans: UI shows only the valid attendance; duplicates are excluded from counts.
- Late/Early window per session: status derivation reflects policy (e.g., mark late check-in where applicable; final labels may appear in a Notes/Status detail if needed).
- Invalid QR or manual entries: logged by scanning system; not counted as valid presence; can appear with status as not present if registered.
- Missing profile fields: table displays fallbacks (e.g., "—") and exports include empty cells.

## 12. Acceptance Criteria

1) Admin can open an event’s Attendance tab and see KPIs for the event and per-session aggregates.
2) Admin can view a paginated attendee table with the specified columns and sort.
3) Admin can filter by session(s) and status, and search by free text.
4) Admin can export to CSV or XLSX; exported data reflects applied filters/sort and includes a `session` column.
5) Timestamps match event timezone in UI and export; timezone noted in export.
6) Exports ≤ 1,000 rows complete synchronously and within performance targets.
7) No discrepancies between UI counts and export rows for identical filters.

## 13. Open Questions

- Presence policy: Should "Present" include "Checked In Only" or require both check-in and check-out? Current spec counts valid check-in within window as present; confirm.
- Default page size: 50 confirmed? Allow 25/50/100 options?
- Export formatting: preferred timestamp format (ISO 8601 with offset vs localized string)?
- Additional identifiers: include internal IDs (e.g., `studentInternalId`, `registrationId`) in exports for reconciliation?
- Per-session export splits: future V2 option (multi-sheet XLSX or separate files)?

## 14. Implementation Notes (For Developers)

- Prefer server-side pagination and filtering. Ensure deterministic sort (tie-break by id).
- Consider adding composite indexes (sessionId, checkInAt) and (eventId, sessionId) to support queries.
- Use schema-safe type definitions and reuse existing DTOs/types under `src/lib/types` where available.
- Validate and sanitize export query params; enforce export row caps to prevent memory issues on XLSX path.


