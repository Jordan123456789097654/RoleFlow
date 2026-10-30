# Roster by RoleFlow — Architecture & Implementation Plan

> **Status: UNRELEASED (Behind Feature Flag `ROSTER_ENABLED=false`)**  
> **Target Release Domain:** `roster.roleflow.site` (subject to owner confirmation in Q5)  
> **Parent Platform:** RoleFlow (`roleflow.site`)  
> **Recruitment Integration:** ApplyHub (`applyhub.roleflow.site`)

---

## 1. Product Overview & Objectives
**Roster by RoleFlow** is a modern, unified staff management, activity auditing, and moderation operations suite engineered specifically for Roblox groups and game development studios. 

It provides community founders and managers with a single, clear cockpit to manage:
- **Staff Roster & Hierarchy:** Who is on staff, their verified Roblox username/ID, their current group rank, assigned internal teams (e.g., Support, QA, Build), and real-time active/inactive status.
- **Activity & Shift Tracking:** Scheduled and completed shifts, attendance check-ins, and aggregate activity analytics (7, 30, and 90-day intervals) without invasive keystroke or presence spyware.
- **Moderation Event Logging:** Formal, auditable records of warnings, suspensions, removals, and administrative notes with a strict 24-hour edit lockout window and tamper-evident audit trails.
- **Training & Onboarding:** Structured session tracking, checklists, and attendance verification recorded directly onto the member's permanent staff dossier.
- **Seamless ApplyHub Bridge:** One-click conversion of accepted ApplyHub candidates into verified Roster staff profiles without redundant manual re-entry.

---

## 2. Role Hierarchy & Server-Enforced Permissions
Permissions are strictly verified on the server per request. UI guards are convenience-only; API endpoints and data loaders enforce authorization using pure function validation (`src/lib/roster-permissions.ts`).

| Permission / Action | Owner | Manager | Moderator | Staff |
| :--- | :---: | :---: | :---: | :---: |
| **Connect / Archive Group** | ✅ | ❌ | ❌ | ❌ |
| **Delete Group & Purge History** | ✅ | ❌ | ❌ | ❌ |
| **Manage Managers & Permissions** | ✅ | ❌ | ❌ | ❌ |
| **Edit Roster & Assign Teams/Ranks** | ✅ | ✅ | ❌ | ❌ |
| **Import Accepted ApplyHub Applicants** | ✅ | ✅ | ❌ | ❌ |
| **Create & Close Shifts / Trainings** | ✅ | ✅ | ❌ | ❌ |
| **Broadcast Team & Group Notices** | ✅ | ✅ | ❌ | ❌ |
| **View Full Group Moderation Log** | ✅ | ✅ | ❌ | ❌ |
| **Log New Moderation Action** | ✅ | ✅ | ✅ | ❌ |
| **Edit Own Action (Within 24 Hours)** | ✅ | ✅ | ✅ | ❌ |
| **Export Full Moderation CSV** | ✅ | ✅ | ❌ | ❌ |
| **View Full Staff Roster Directory** | ✅ | ✅ | ✅ | ❌ (Own only)* |
| **View Own Staff Dossier & Actions** | ✅ | ✅ | ✅ | ✅ |

*\* Note: Subject to Owner Question Q12 regarding whether staff members may browse their own team or the full directory.*

---

## 3. Data Model (`prisma/schema.prisma`)
The following models will be introduced into the PostgreSQL database schema without altering or dropping existing platform tables:

```prisma
// Roblox Group managed in Roster
model RosterGroup {
  id              String             @id @default(cuid())
  robloxGroupId   String             @unique
  name            String
  ownerUserId     String
  owner           User               @relation(fields: [ownerUserId], references: [id], onDelete: Cascade)
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  archivedAt      DateTime?
  
  memberships     RosterMembership[]
  staffRecords    RosterStaff[]
  teams           RosterTeam[]
  actions         RosterAction[]
  auditEntries    RosterAuditEntry[]
  trainings       RosterTraining[]
  shifts          RosterShift[]
  rankCache       RosterRankCache[]

  @@index([ownerUserId])
  @@index([robloxGroupId])
}

// User membership association with a group
model RosterMembership {
  id            String      @id @default(cuid())
  groupId       String
  group         RosterGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  userId        String?     // Associated RoleFlow User ID (optional until linked)
  user          User?       @relation(fields: [userId], references: [id], onDelete: SetNull)
  robloxUserId  String
  username      String
  role          String      @default("STAFF") // OWNER, MANAGER, MODERATOR, STAFF
  teamIds       String      @default("[]")    // JSON array of RosterTeam IDs
  status        String      @default("ACTIVE") // ACTIVE, INACTIVE, ON_LEAVE
  joinedAt      DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@unique([groupId, robloxUserId])
  @@index([groupId, role])
  @@index([groupId, status])
  @@index([userId])
}

// Detailed staff record and dossier
model RosterStaff {
  id                  String      @id @default(cuid())
  groupId             String
  group               RosterGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  robloxUserId        String
  rank                String
  status              String      @default("ACTIVE") // ACTIVE, INACTIVE, SUSPENDED
  notes               String?     @db.Text
  joinedAt            DateTime    @default(now())
  updatedAt           DateTime    @updatedAt
  sourceApplicationId String?     // Link back to ApplyHub application if originated from hiring

  @@unique([groupId, robloxUserId])
  @@index([groupId, status])
  @@index([groupId, rank])
}

// Team within a group (e.g. "Moderation Team", "Event Staff")
model RosterTeam {
  id        String      @id @default(cuid())
  groupId   String
  group     RosterGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  name      String
  createdAt DateTime    @default(now())

  @@unique([groupId, name])
  @@index([groupId])
}

// Moderation & Administrative Action Log
model RosterAction {
  id                 String      @id @default(cuid())
  groupId            String
  group              RosterGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  targetRobloxUserId String
  actorUserId        String
  actor              User        @relation(fields: [actorUserId], references: [id], onDelete: Cascade)
  type               String      // NOTE, WARNING, SUSPENSION, REMOVAL, COMMENDATION
  reason             String      @db.Text
  durationMinutes    Int?        // Optional duration for temporary suspensions
  createdAt          DateTime    @default(now())
  editedAt           DateTime?
  deletedAt          DateTime?   // Soft delete only

  @@index([groupId, targetRobloxUserId])
  @@index([groupId, actorUserId])
  @@index([groupId, type])
  @@index([groupId, createdAt])
}

// Permanent Tamper-Evident Audit Trail
model RosterAuditEntry {
  id          String      @id @default(cuid())
  groupId     String
  group       RosterGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  actorUserId String
  actor       User        @relation(fields: [actorUserId], references: [id], onDelete: Cascade)
  event       String      // ACTION_CREATED, ACTION_EDITED, STAFF_STATUS_CHANGED, etc.
  detail      String      @db.Text // JSON snapshot of previous state & new state
  createdAt   DateTime    @default(now())

  @@index([groupId, createdAt])
  @@index([groupId, event])
}

// Training Session
model RosterTraining {
  id          String                     @id @default(cuid())
  groupId     String
  group       RosterGroup                @relation(fields: [groupId], references: [id], onDelete: Cascade)
  title       String
  startsAt    DateTime
  completedAt DateTime?
  createdBy   String
  createdAt   DateTime                   @default(now())
  attendance  RosterTrainingAttendance[]

  @@index([groupId, startsAt])
}

model RosterTrainingAttendance {
  id           String         @id @default(cuid())
  trainingId   String
  training     RosterTraining @relation(fields: [trainingId], references: [id], onDelete: Cascade)
  robloxUserId String
  completed    Boolean        @default(false)
  updatedAt    DateTime       @updatedAt

  @@unique([trainingId, robloxUserId])
  @@index([trainingId])
}

// Scheduled Activity Shift
model RosterShift {
  id         String                  @id @default(cuid())
  groupId    String
  group      RosterGroup             @relation(fields: [groupId], references: [id], onDelete: Cascade)
  teamId     String?
  startsAt   DateTime
  endsAt     DateTime
  closedAt   DateTime?
  createdAt  DateTime                @default(now())
  attendance RosterShiftAttendance[]

  @@index([groupId, startsAt])
}

model RosterShiftAttendance {
  id           String      @id @default(cuid())
  shiftId      String
  shift        RosterShift @relation(fields: [shiftId], references: [id], onDelete: Cascade)
  robloxUserId String
  joinedAt     DateTime    @default(now())

  @@unique([shiftId, robloxUserId])
  @@index([shiftId])
}

// Server-side Cached Roblox Rank Directory
model RosterRankCache {
  id           String      @id @default(cuid())
  groupId      String
  group        RosterGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  robloxUserId String
  rank         String
  rankId       Int
  fetchedAt    DateTime    @default(now())

  @@unique([groupId, robloxUserId])
  @@index([groupId, fetchedAt])
}
```

---

## 4. Key Engineering Workflows

### 4.1 Group Setup & Verification
1. User provides a Roblox Group ID.
2. Server verifies the user holds management authority in that group via Roblox Group API.
3. Server imports roles and roster as a preliminary preview.
4. User confirms the imported roster. No database records are committed until explicit confirmation.

### 4.2 Group Syncing & Resilience
- Background server-side calls query Roblox Group APIs with backoff and rate-limit buffering.
- Cache duration defaults to 10 minutes.
- If Roblox returns 429, 500, or network timeouts, last known good data is preserved; UI surfaces a clear warning badge rather than clearing or corrupting the roster.

### 4.3 Moderation Auditability
- Actions cannot be deleted permanently (soft-deleted with `deletedAt`).
- Edit window is enforced strictly at the database/API level: `now() - createdAt <= 24 hours`.
- Any edit logs an immutable snapshot to `RosterAuditEntry`.

### 4.4 ApplyHub to Roster Integration
- Authenticated via short-lived HMAC signed tokens between platform subdomains.
- Exposes only confirmed hiring fields: Roblox ID, username, assigned role/rank.
- Automatically blocked (HTTP 503) during platform maintenance or site lockdown.

---

## 5. Security & Privacy Guarantees
- **No Credentials Stored:** Never store Roblox passwords, session cookies (.ROBLOSECURITY), or private tokens.
- **Single Account:** Uses the unified RoleFlow session (`roleflow_user_id` cookie).
- **Data Subject Rights:** Full compliance with RoleFlow account export and permanent GDPR deletion routines.
- **Feature Flag Isolation:** Every route under `/roster` returns HTTP 404 unless `ROSTER_ENABLED=true` or user ID is listed in `ROSTER_ALLOWLIST_USER_IDS`.

---

## 6. Open Owner Questions Tracking
- **Q1. Retention:** How long are Roster groups, actions, and audit entries kept after a group is deleted? Should this match the standard RoleFlow deletion rule (immediate soft-archive with 30-day purge)? *(Ask before Stage 5)*
- **Q4. Rank Sync Direction:** Should Roster only read ranks from Roblox, or write rank updates back to Roblox via Open Cloud API? *(Ask before Stage 3)*
- **Q5. Subdomain:** Is `roster.roleflow.site` the confirmed subdomain for Roster? *(Ask before Stage 8)*
- **Q6. Countdown:** Should the coming soon product card show an active countdown? *(Ask before Stage 9)*
- **Q7. Logo:** Confirm `roster-hero.png` is the approved logo asset for product cards. *(Ask before Stage 9)*
- **Q11. Connect Authority:** May any group member with verified Roblox manager permissions connect a group, or strictly the Roblox Group Owner? *(Ask before Stage 3)*
- **Q12. Staff Visibility:** Can ordinary staff see the full roster directory, or strictly their own record and team? *(Ask before Stage 4)*
- **Q13. Notice Channels:** Are in-app notices and opt-in emails sufficient, or should Roster integrate Discord webhook dispatches? *(Ask before Stage 7)*
- **Q14. Shift Scheduling:** Are shifts scheduled solely by managers, or can staff claim open shift slots? *(Ask before Stage 7)*
