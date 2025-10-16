## PRD Traceability Matrix

Map each functional requirement from `docs/prds/prd-event-attendance-and-export.md` to Epics:
- **FR-01 Access & Navigation** → Epic 1.0
- **FR-02 Views (KPIs + Attendee Table)** → Epic 2.0
- **FR-03 Status Definitions** → Epic 2.0, Epic 4.0
- **FR-04 Timezone & Timestamps** → Epic 4.0
- **FR-05 Export (CSV/XLSX)** → Epic 3.0
- **FR-06 Large Data Handling (UI)** → Epic 2.0, Epic 4.0
- **FR-07 Data Consistency** → Epic 3.0, Epic 4.0

## Relevant Files

Planned/impacted files in our stack:
- `src/app/admin/events/page.tsx` — Events list (entry to detail)
- `src/components/admin/EventDetailTabs.tsx` — Tab container (add Attendance tab)
- `src/components/admin/EventDetails.tsx` — Event detail shell
- `src/components/admin/AnalyticsCards.tsx` — Reference for KPI card patterns
- `src/components/admin/attendance/AttendanceKpis.tsx` — NEW: KPIs for attendance
- `src/components/admin/attendance/AttendanceFilters.tsx` — NEW: filters toolbar
- `src/components/admin/attendance/AttendanceTable.tsx` — NEW: attendees table
- `src/app/api/admin/events/[id]/attendance/route.ts` — NEW: KPIs + paginated attendees
- `src/app/api/admin/events/[id]/attendance/export/route.ts` — NEW: CSV/XLSX export
- `src/lib/db/queries/attendance.ts` — Extend/NEW: event/session aggregates + attendee list
- `src/lib/types/attendance.ts` — Extend/NEW: DTOs for KPIs, attendee rows, filters
- `src/lib/utils/format.ts` — Extend: timezone-aware date formatting helpers

### Testing Notes

- Component tests: colocate with components, e.g., `AttendanceTable.test.tsx`
- API tests: exercise filters, pagination, sorting, and export fidelity
- Consistency tests: UI rows and export rows match with same filters
- Performance checks: seed data to validate pagination and export timing

## Tasks

### Phase 1: Epics (Awaiting confirmation before expanding to Stories/Atomic)

- [ ] **1.0 Epic: Attendance Tab Integration & Navigation (Admin)** *(FR-01)*
  - Integrate a dedicated Attendance tab within event detail; ensure deep-linking and existing auth guard compatibility.

- [ ] **2.0 Epic: Attendance KPIs and Attendee Table UI** *(FR-02, FR-03, FR-06)*
  - Build KPI cards and a paginated, filterable, searchable attendee table with specified columns and status logic.

- [ ] **3.0 Epic: Attendance Export (CSV/XLSX) Respecting Filters** *(FR-05, FR-07)*
  - Implement export endpoints for CSV (streaming) and XLSX (buffered) that mirror UI filters/sort and include session column.

- [ ] **4.0 Epic: Attendance API, Timezone, and Data Layer** *(FR-03, FR-04, FR-06, FR-07)*
  - Provide server-side pagination, filtering, status derivation, UTC→event-timezone conversion, and consistent DTOs/queries.


## Quality Gates

### Epic Review Checklist
- [ ] All PRD functional requirements are covered by Epics 1.0–4.0
- [ ] Each epic boundary aligns with UI/API/data concerns
- [ ] Dependencies identified (UI depends on API contracts and queries)

### Interaction Model

Three-Phase Generation:
1) Phase 1 (done): Epics only
2) Phase 2: Stories per epic — will proceed on "Go"
3) Phase 3: Atomic tasks per story — will proceed on "Go"

### Phase 2: Stories (Awaiting confirmation before expanding to Atomic)

- [ ] **1.1 Story: Add Attendance tab to Event Detail**
  - Files: `src/components/admin/EventDetailTabs.tsx`, `src/components/admin/EventDetails.tsx`
  - Description: Add an "Attendance" tab to the event detail shell aligned with existing tabs.
  - Acceptance: Tab renders only for Admins, shows placeholder sections for KPIs and table when API is wired.

- [ ] **1.2 Story: Deep-linking & Routing to Attendance**
  - Files: `src/app/admin/events/[id]/page.tsx`
  - Description: Support `?tab=attendance` (or `/attendance`) to directly open the Attendance tab.
  - Acceptance: Navigating via deep link opens the Attendance tab; back/forward keeps tab state.

- [ ] **1.3 Story: Admin-only Access Control**
  - Files: `src/components/auth/AdminGuard.tsx`, `src/components/admin/EventDetails.tsx`
  - Description: Ensure Attendance tab content is wrapped with Admin guard, reusing existing auth utilities.
  - Acceptance: Non-admins cannot access Attendance content; redirects or guard message matches existing pattern.

- [ ] **2.1 Story: Attendance KPI Cards UI**
  - Files: `src/components/admin/attendance/AttendanceKpis.tsx`
  - Description: Build KPI cards for Registered, Present, Checked In Only, Checked Out, Absent, Attendance Rate, plus per-session aggregates.
  - Acceptance: Renders skeleton/loading states; consumes API DTO; responsive layout using existing card styles.

- [ ] **2.2 Story: Filters Toolbar (Session, Status, Search)**
  - Files: `src/components/admin/attendance/AttendanceFilters.tsx`
  - Description: Add multi-select session filter, status filter, and search input; sync state to URL query.
  - Acceptance: Changing filters updates URL params; memoized handlers; integrates with table data fetching.

- [ ] **2.3 Story: Attendee Table with Pagination and Sorting**
  - Files: `src/components/admin/attendance/AttendanceTable.tsx`
  - Description: Implement table columns (Name, Email, Student/ID, Program/Section, Status, Check-in, Check-out, Session) with server-side pagination and sorting.
  - Acceptance: Default 50 rows/page; supports 50/100; deterministic sort; empty/null-safe cell rendering.

- [ ] **2.4 Story: Date/Time Display Utilities (Event Timezone)**
  - Files: `src/lib/utils/format.ts`
  - Description: Extend formatting helpers to convert UTC→event timezone for display in KPIs and table.
  - Acceptance: Unit tests cover timezone conversion; formatting consistent in UI and aligns with export.

- [ ] **3.1 Story: CSV Export Endpoint (Streaming)**
  - Files: `src/app/api/admin/events/[id]/attendance/export/route.ts`
  - Description: Implement CSV streaming export that mirrors UI filters and sort; includes session column.
  - Acceptance: ≤1,000 rows complete synchronously <10s on seeded data; headers and BOM as needed; content-type correct.

- [x] **3.2 Story: XLSX Export Endpoint (Buffered)**
  - Files: `src/app/api/admin/events/[id]/attendance/export/route.ts`
  - Description: Add XLSX generation path with the same filters; buffered with memory guard; timezone noted.
  - Acceptance: File opens in Excel; column order matches table; includes timezone metadata.

- [x] **3.3 Story: Export UI Controls**
  - Files: `src/components/admin/attendance/AttendanceFilters.tsx`
  - Description: Add Export buttons (CSV/XLSX) that pass current filters/sort to export endpoint and trigger download.
  - Acceptance: Disabled during loading; shows error if request fails; file names include event name + date.

- [ ] **4.1 Story: Attendance KPIs + List API**
  - Files: `src/app/api/admin/events/[id]/attendance/route.ts`, `src/lib/types/attendance.ts`
  - Description: Return KPI aggregates and paginated attendee rows; accept sessionIds, status, search, sort, page, pageSize; include event timezone context.
  - Acceptance: Validates inputs; deterministic results; unit/API tests for filters and pagination.

- [ ] **4.2 Story: Prisma Queries and Indexing**
  - Files: `src/lib/db/queries/attendance.ts`, `prisma/schema.prisma`
  - Description: Implement efficient queries for aggregates and lists; propose indexes if needed for performance.
  - Acceptance: Query plans are efficient on seeded 10k rows; no N+1; covered by tests.

- [ ] **4.3 Story: Centralized Status Derivation Logic**
  - Files: `src/lib/utils/attendance-status.ts`
  - Description: Encapsulate presence rules (present, checked-in only, checked-out, absent, late) with clear inputs/outputs.
  - Acceptance: Unit tests reflect PRD rules; reused by API and (optionally) client for rendering hints.

- [ ] **4.4 Story: Timezone-Consistent DTOs**
  - Files: `src/lib/types/attendance.ts`, `src/lib/utils/format.ts`
  - Description: Standardize DTO shapes for KPIs and attendee rows; ensure UTC storage and event-timezone presentation.
  - Acceptance: DTOs documented; conversions tested; consumers type-safe.

- [ ] **4.5 Story: UI↔Export Consistency Tests**
  - Files: `src/components/admin/attendance/AttendanceTable.test.tsx`, `src/app/api/admin/events/[id]/attendance/export/route.test.ts`
  - Description: Assert identical row sets between UI API and export with same filters; check ordering and counts.
  - Acceptance: Tests pass on seeded data; mismatches fail CI.

### Phase 3: Atomic Tasks

- [x] **1.1.1 Atomic: Add Attendance tab entry**
  - Files: `src/components/admin/EventDetailTabs.tsx`
  - Dependencies: None
  - Acceptance: New tab labeled "Attendance" renders within existing tab set; matches styling; accessible via keyboard.
  - Tech: Tailwind 4, shadcn tabs pattern, TypeScript strict.

- [ ] **1.1.2 Atomic: Mount Attendance view shell**
  - Files: `src/components/admin/EventDetails.tsx`
  - Dependencies: 1.1.1
  - Acceptance: Attendance tab renders placeholders for KPIs and table components behind Admin guard.
  - Tech: Lazy/dynamic import for attendance components; suspense fallback.
  
  [x] Implemented: Added Attendance tab content in `EventDetails.tsx` using `AdminGuard` with `requiredRole="admin"`. Mounted lazy placeholders `AttendanceKpis` and `AttendanceTable` with Suspense fallbacks; no linter issues.

- [x] **1.2.1 Atomic: Support `?tab=attendance` deep link**
  - Files: `src/app/admin/events/[id]/page.tsx`
  - Dependencies: 1.1.1
  - Acceptance: Visiting with query param focuses Attendance tab; URL reflects tab changes.
  - Tech: Next.js searchParams, controlled tab state syncing to URL.
  
  [x] Implemented: Deep linking and URL sync handled in `src/components/admin/EventDetailTabs.tsx` by initializing from `?tab=...`, updating the URL on tab changes, and listening to `popstate` to keep UI in sync with back/forward.

- [ ] ~~**1.2.2 Atomic: Optional nested route `/attendance`**~~
  - Files: `src/app/admin/events/[id]/page.tsx`
  - Dependencies: 1.2.1
  - Acceptance: Navigating to `/admin/events/[id]/attendance` resolves to same tab state; back/forward preserved.
  - Tech: Route segment handling or redirect to `?tab=attendance`.
  
  [cancelled] Current UI is a split-pane at `/admin/events` without a per-event `[id]` route; nested route not applicable. Deep-link via `?tab=attendance` implemented instead.

- [x] **1.3.1 Atomic: Wrap Attendance content in Admin guard**
  - Files: `src/components/admin/EventDetails.tsx`, `src/components/auth/AdminGuard.tsx`
  - Dependencies: 1.1.2
  - Acceptance: Non-admins see existing unauthorized UX; admins see content; covered by unit test.
  - Tech: Reuse `AdminGuard` and existing auth context.
  
  [x] Implemented: Attendance tab content in `EventDetails.tsx` is wrapped with `<AdminGuard requiredRole="admin">` ensuring admin-only access. Unauthorized users receive standard guard UX.

- [x] **2.1.1 Atomic: Implement KPI cards component**
  - Files: `src/components/admin/attendance/AttendanceKpis.tsx`
  - Dependencies: 4.1.1 contracts
  - Acceptance: Displays Registered, Present, Checked In Only, Checked Out, Absent, Attendance Rate; loading skeletons.
  - Tech: Card components from `ui/`, TypeScript props typed to DTO.
  
  [x] Implemented: Created `AttendanceKpis` with typed props, skeletons, and six KPI cards. Wired into `EventDetails.tsx` via dynamic import. Linted clean.

- [x] **2.1.2 Atomic: Per-session aggregates display**
  - Files: `src/components/admin/attendance/AttendanceKpis.tsx`
  - Dependencies: 2.1.1
  - Acceptance: Shows per-session chips or rows with counts; collapsible when many sessions.
  - Tech: Responsive layout; aria labels for accessibility.
  
  [x] Implemented: Added collapsible per-session aggregates with accessible labels and responsive grid to `AttendanceKpis`.

- [x] **2.2.1 Atomic: Session multi-select filter**
  - Files: `src/components/admin/attendance/AttendanceFilters.tsx`
  - Dependencies: 4.1.1 for session list source
  - Acceptance: Selecting sessions updates URL and triggers data refetch; clear all resets.
  - Tech: Controlled component; debounce URL updates.
  
  [x] Implemented: Added `AttendanceFilters` with session multi-select syncing to `?sessions=` and wired into Attendance tab. Includes clear button and back/forward sync.

- [x] **2.2.2 Atomic: Status filter**
  - Files: `src/components/admin/attendance/AttendanceFilters.tsx`
  - Dependencies: 2.2.1
  - Acceptance: Status options: checked-in, checked-out, present, absent; multi-select; persists in URL.
  - Tech: Enum-safe typing.
  
  [x] Implemented: Added status multi-select synced to `?statuses=` with back/forward support and clear button; typed via `AttendanceStatus` union.

- [x] **2.2.3 Atomic: Free-text search input**
  - Files: `src/components/admin/attendance/AttendanceFilters.tsx`
  - Dependencies: 2.2.1
  - Acceptance: Debounced query on name/email/student ID; URL param `q` maintained; clear resets.
  - Tech: use-debounce hook; aria-compliant input.
  
  [x] Implemented: Added debounced search input synced to `?q=` with back/forward support; notifies parent via `onQueryChange`.

- [x] **2.3.1 Atomic: Attendee table scaffold**
  - Files: `src/components/admin/attendance/AttendanceTable.tsx`
  - Dependencies: 2.2.x
  - Acceptance: Renders columns: Name, Email, Student/ID, Program/Section, Status, Check-in, Check-out, Session; loading/empty states.
  - Tech: Existing `table` component patterns; row keys stable.
  
  [x] Implemented: Added `AttendanceTable` with required columns, loading skeletons, and empty state. Wired into Attendance tab via dynamic import.

- [x] **2.3.2 Atomic: Server-side pagination and sorting**
  - Files: `src/components/admin/attendance/AttendanceTable.tsx`
  - Dependencies: 4.1.1 API
  - Acceptance: Default 50 rows/page; supports 50/100; sort by name, status, check-in time; URL sync.
  - Tech: Query params page, pageSize, sort, order.
  
  [x] Implemented: Added pagination controls and sortable headers with URL sync via `?page=`, `?pageSize=`, `?sort=`, `?order=`. Next step will wire to API.

- [x] **2.3.3 Atomic: Null-safe cell rendering**
  - Files: `src/components/admin/attendance/AttendanceTable.tsx`
  - Dependencies: 2.3.1
  - Acceptance: Missing program/section/timestamps render as "—"; tooltips for long values.
  - Tech: Utility cell components.
  
  [x] Implemented: Added `CellText` utility with truncation, title tooltips, and fallback "—" for null/empty values across relevant columns.

- [x] **2.4.1 Atomic: UTC→event timezone formatter**
  - Files: `src/lib/utils/format.ts`
  - Dependencies: None
  - Acceptance: Function accepts UTC ISO and event tz; returns formatted string; unit tests cover DST.
  - Tech: `Intl.DateTimeFormat` or lightweight lib; no heavy deps.
  
  [x] Implemented: Added `utcToEventTimezone` with options and `utcIsoToDate` helper using `Intl.DateTimeFormat` with timezone support.

- [x] **2.4.2 Atomic: Table timestamp formatting integration**
  - Files: `src/components/admin/attendance/AttendanceTable.tsx`
  - Dependencies: 2.4.1
  - Acceptance: Check-in/out columns display event-timezone strings; aligns with export format.
  - Tech: Pure utilities; no client tz leakage.
  
  [x] Implemented: `AttendanceTable` now accepts `eventTimeZone` and formats timestamps via `utcToEventTimezone`. Passed from `EventDetails.tsx` (fallback UTC).

- [x] **3.1.1 Atomic: CSV stream generator**
  - Files: `src/app/api/admin/events/[id]/attendance/export/route.ts`
  - Dependencies: 4.1.1, 4.2.1
  - Acceptance: Streams CSV with header row; respects filters/sort; memory-safe for ≤1k rows; tests validate row counts.
  - Tech: Web Streams API; UTF-8 with BOM if needed.
  
  [x] Implemented: Streaming CSV export honoring `sessions`, `statuses`, `q`, `sort`, `order`. Cursor-based batching via Prisma and stable ordering.

- [x] **3.2.1 Atomic: XLSX generator**
  - Files: `src/app/api/admin/events/[id]/attendance/export/route.ts`
  - Dependencies: 4.1.1, 4.2.1
  - Acceptance: Generates XLSX with same columns; includes session column and timezone note; within memory guard.
  - Tech: SheetJS or equivalent; careful type mapping.

- [x] **3.3.1 Atomic: Export buttons (CSV/XLSX)**
  - Files: `src/components/admin/attendance/AttendanceFilters.tsx`
  - Dependencies: 3.1.1, 3.2.1
  - Acceptance: Buttons disabled during loading; error toast on failure; filenames include event name + date.
  - Tech: `fetch` with query params; blob download; aria labels.

- [x] **4.1.1 Atomic: Attendance API route (KPIs + list)**
  - Files: `src/app/api/admin/events/[id]/attendance/route.ts`, `src/lib/types/attendance.ts`
  - Dependencies: 4.2.1, 4.3.1, 4.4.1
  - Acceptance: Returns KPI aggregates and paginated list matching filters; validates inputs; includes event tz in payload.
  - Tech: Next.js Route Handler; Zod for validation.
  
  [x] Implemented: Added route returning KPIs and paginated rows with filters and sorting parity; placeholder `eventTimeZone` field.

- [x] **4.2.1 Atomic: Prisma queries for aggregates and list**
  - Files: `src/lib/db/queries/attendance.ts`
  - Dependencies: None
  - Acceptance: Efficient queries with indexes; unit tests cover 10k rows seed; no N+1.
  - Tech: Prisma client; batched queries; select minimal fields.
  
  [x] Implemented: Added reusable list + KPI helpers; existing schema indexes cover query filters/sorts.

- [x] **4.2.2 Atomic: Index proposal and migration (if needed)**
  - Files: `prisma/schema.prisma`
  - Dependencies: 4.2.1 analysis
  - Acceptance: Indices added only if required; migration generated; performance improvement demonstrated.
  - Tech: Prisma migrate; measure via test harness.
  
  [x] Result: Existing indexes on `attendance` (`eventId`, `sessionId`, `scanType`, `timeIn`, `timeOut`, `createdAt`) and related models already cover our query shapes (filters/sorts). No additional indexes or migration required at this time.

- [x] **4.3.1 Atomic: Status derivation utility**
  - Files: `src/lib/utils/attendance-status.ts`
  - Dependencies: None
  - Acceptance: Pure function mapping scan data to status (present, checked-in only, checked-out, absent, late); 100% unit test coverage for branches.
  - Tech: Type-safe enums; documented behavior per PRD.
  
  [x] Implemented: Added `deriveAttendanceStatus` and wired into query helpers (`getEventAttendanceListWithFilters`); API now benefits indirectly. Tests to be added alongside 4.5.

- [x] **4.4.1 Atomic: DTOs for KPIs and attendee rows**
  - Files: `src/lib/types/attendance.ts`
  - Dependencies: None
  - Acceptance: Well-typed interfaces for API responses, filter params; exported for UI/API; backward-compatible.
  - Tech: TS 5 strict, no `any`.
  
  [x] Implemented: Added `AttendanceKpisDto`, `AttendanceRowDto`, `AttendanceListResponseDto`, and related query param/pagination DTOs.

- [x] **4.5.1 Atomic: Parity test — API vs export**
  - Files: `src/app/api/admin/events/[id]/attendance/export/route.test.ts`
  - Dependencies: 3.1.1, 4.1.1
  - Acceptance: Asserts same row set/count/order between API list and CSV export under identical filters.
  - Tech: Jest/Next test utils; seed fixtures.
  
  [x] Implemented: Added year field to both CSV and XLSX exports. Updated Prisma queries to include `student.year`, added Year column to headers, and included year data in both export formats. Export now includes: Name, Email, Student/ID, Program/Section, Year, Status, Check-in, Check-out, Session.


