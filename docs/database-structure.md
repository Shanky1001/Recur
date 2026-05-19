# Recurvo Local Database Structure

This document describes all data persisted in the local SQLite database (`recur.db`), including table structure and how records relate to each other.

## Database overview

- Engine: SQLite via `expo-sqlite`
- File: `recur.db`
- Mode: WAL (`PRAGMA journal_mode = WAL`)
- Initialization source: [src/db/sqlite.ts](../src/db/sqlite.ts)

---

## Tables

### 1) `subscriptions`
Primary business records for tracked subscriptions.

**Schema**
- `id TEXT PRIMARY KEY NOT NULL`
- `name TEXT NOT NULL`
- `category TEXT NOT NULL`
- `status TEXT NOT NULL` (`active`, `trial`, `paused`, `cancelled` at app level)
- `planName TEXT NOT NULL`
- `pricePerMonth INTEGER NOT NULL`
- `currencySymbol TEXT NOT NULL`
- `billingCycle TEXT` (`Monthly`, `Yearly`, optionally `Weekly` in app type)
- `pricePerBillingCycle INTEGER`
- `paymentMethod TEXT`
- `reminderEnabled INTEGER` (boolean as `0/1`, nullable)
- `reminderDaysBefore INTEGER` (nullable)
- `startDate TEXT` (ISO/date string)
- `nextPaymentDate TEXT NOT NULL` (ISO string)
- `logoUri TEXT`
- `createdAt TEXT NOT NULL` (UTC ISO)

**Purpose**
- Main source of truth for subscription UI, billing projections, and reminder scheduling.

---

### 2) `notifications`
In-app notification feed items.

**Schema**
- `id TEXT PRIMARY KEY NOT NULL`
- `title TEXT NOT NULL`
- `message TEXT NOT NULL`
- `type TEXT NOT NULL` (`billing`, `trial`, `insight`, `info`)
- `subscriptionId TEXT` (nullable soft-link to `subscriptions.id`)
- `createdAt TEXT NOT NULL` (UTC ISO)
- `read INTEGER NOT NULL` (boolean as `0/1`)

**Purpose**
- Stores items shown in notification/history UI.
- Can be linked to subscriptions through `subscriptionId`.

---

### 3) `notification_jobs`
Mapping between app-level reminder jobs and OS-scheduled notification IDs.

**Schema**
- `id TEXT PRIMARY KEY NOT NULL` (stable key like `${subscriptionId}:renewalReminder`)
- `subscriptionId TEXT NOT NULL` (soft-link to `subscriptions.id`)
- `type TEXT NOT NULL` (currently `renewalReminder`)
- `triggerAt TEXT NOT NULL` (UTC ISO)
- `expoNotificationId TEXT NOT NULL` (ID returned by Expo scheduler)
- `createdAt TEXT NOT NULL` (UTC ISO)

**Purpose**
- Prevent duplicate schedules.
- Enables cancel/resync operations against OS notifications.

---

### 4) `preferences`
Single-row app preferences.

**Schema**
- `id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1)`
- `currency TEXT NOT NULL`
- `defaultReminderDaysBefore INTEGER NOT NULL`
- `defaultReminderEnabled INTEGER NOT NULL` (boolean as `0/1`)
- `hasOnboarded INTEGER NOT NULL DEFAULT 0` (boolean as `0/1`)
- `updatedAt TEXT NOT NULL` (UTC ISO)

**Purpose**
- Stores global user settings used as defaults for new subscriptions and onboarding state.

---

### 5) `user_profile`
Single-row profile record.

**Schema**
- `id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1)`
- `name TEXT NOT NULL`
- `avatarUri TEXT NOT NULL`
- `updatedAt TEXT NOT NULL` (UTC ISO)

**Purpose**
- Stores local profile information used across Home/Profile UI.

---

### 6) `services`
Persisted service catalog (default + custom services) used in add/onboarding flows.

**Schema**
- `name TEXT PRIMARY KEY NOT NULL`
- `logoUri TEXT`
- `plansJson TEXT NOT NULL` (JSON array of plan names)
- `defaultCycle TEXT NOT NULL` (`Monthly`/`Yearly`)
- `defaultCost INTEGER NOT NULL`
- `defaultCategory TEXT NOT NULL`
- `defaultStatus TEXT NOT NULL` (`active`/`trial`)
- `createdAt TEXT NOT NULL` (UTC ISO)
- `updatedAt TEXT NOT NULL` (UTC ISO)

**Purpose**
- Provides selectable service templates everywhere service options are shown.
- Supports user-created custom services.

---

## How tables are connected

SQLite constraints do **not** define explicit foreign keys in this schema. Connections are **logical/application-level**:

1. `subscriptions.id` → `notification_jobs.subscriptionId`
   - One subscription can have zero or one active renewal job record per job type/key.

2. `subscriptions.id` → `notifications.subscriptionId`
   - One subscription can have many in-app notifications.

3. `services` → `subscriptions`
   - No direct FK.
   - A new subscription is created using selected service template fields (`name`, `logoUri`, defaults).

4. `preferences` and `user_profile`
   - Singleton tables (`id = 1`), globally consumed by app state/hydration.

### Relationship diagram

```text
user_profile (1 row)
preferences  (1 row)
services     (many rows)

subscriptions (many rows)
   ├── notifications (many rows, via notifications.subscriptionId)
   └── notification_jobs (0..1 current job key, via notification_jobs.subscriptionId)
```

---

## Data flow notes

- Hydration loads `user_profile`, `preferences`, `subscriptions`, `notifications`, and `services`.
- Services are seeded from app defaults if `services` is empty.
- Reminder scheduling writes to `notification_jobs` and also upserts paired rows in `notifications`.
- Deleting/resetting local data clears all six tables.

---

## Type mapping summary

- SQLite booleans are stored as `INTEGER` (`0/1`) and mapped to `boolean` in app code.
- Timestamps are stored as UTC ISO strings (`TEXT`).
- `services.plansJson` stores arrays as serialized JSON.

---

## Source references

- Table definitions + CRUD: [src/db/sqlite.ts](../src/db/sqlite.ts)
- Repository contract: [src/repository/appRepository.ts](../src/repository/appRepository.ts)
- DB models: [src/repository/models.ts](../src/repository/models.ts)
