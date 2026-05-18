# Notification Architecture (Recurvo)

This document explains how notification scheduling works end-to-end in the app, including how the notification engine communicates with the service layer and repository.

## 1) High-level architecture

Notification flow is split into 3 layers:

1. **Service layer**
   - File: `src/services/appService.ts`
   - Owns application use-cases (hydrate, upsert subscription, cancel, delete, resync reminders).
   - Calls notification engine methods after subscription lifecycle changes.

2. **Notification engine**
   - Files:
     - `src/notifications/index.ts`
     - `src/notifications/types.ts`
     - `src/notifications/expoNotificationEngine.ts`
   - Contains scheduling logic, reminder window calculations, permission/channel bootstrap, and OS scheduling calls.

3. **Repository (persistence layer)**
   - Interface: `src/repository/appRepository.ts`
   - SQLite adapter: `src/repository/sqliteAppRepository.ts`
   - Stores:
     - subscriptions
     - in-app notifications list
     - scheduled job mapping (`NotificationJob`) used by the engine to update/cancel existing scheduled OS notifications safely.

---

## 2) Core contracts

### `NotificationEngine` contract
File: `src/notifications/types.ts`

Main functions:

- `bootstrap()`
- `syncForSubscriptions(subscriptions)`
- `onSubscriptionUpserted(subscription)`
- `onSubscriptionCancelled(subscriptionId)`
- `onSubscriptionDeleted(subscriptionId)`
- `snoozeNotification(args)`
- `clearAllScheduled()`

`createNotificationEngine()` in `src/notifications/index.ts` returns either:
- `createExpoNotificationEngine(...)` (real implementation)
- `createNoopNotificationEngine(...)` (disabled/no-op mode)

---

## 3) Service-layer integration

File: `src/services/appService.ts`

### On app startup
`hydrate()` does:
1. loads data from repository,
2. calls `notificationEngine.bootstrap()`,
3. calls `notificationEngine.syncForSubscriptions(subscriptions)`.

This ensures reminders are synced every time app state is hydrated.

### On subscription create/update
`upsertSubscription()`:
1. normalizes payload (`createdAt`, `startDate`, defaults for reminder fields),
2. computes `nextPaymentDate` using `nextPaymentFromStartDate(...)`,
3. writes subscription to repository,
4. calls `notificationEngine.onSubscriptionUpserted(next)`.

### On subscription cancel/delete
- `cancelSubscription(id)` -> `notificationEngine.onSubscriptionCancelled(id)`
- `deleteSubscription(id)` -> `notificationEngine.onSubscriptionDeleted(id)`

### Manual resync
`resyncReminders(subscriptions)` calls:
- `notificationEngine.bootstrap()`
- `notificationEngine.syncForSubscriptions(subscriptions)`

---

## 4) Expo notification engine internals

File: `src/notifications/expoNotificationEngine.ts`

## 4.1 Initialization / bootstrap

### `getExpoNotifications()`
Lazy-loads `expo-notifications` at runtime and returns `null` on unsupported platforms (e.g. web).

### `ensureBootstrapped()`
One-time setup:
- installs foreground presentation handler (`setNotificationHandler`),
- checks/requests permission (`getPermissionsAsync` + `requestPermissionsAsync`),
- sets Android channel (`setNotificationChannelAsync("default", ...)`),
- caches state via `bootstrapped` and `canSchedule`.

### `ensureCanSchedule()`
Revalidates permission before scheduling.

---

## 4.2 Reminder time computation

Helper functions:

- `reminderDaysBefore(subscription)`
  - sanitizes reminder lead time.
- `subtractDaysIst(date, days)`
  - subtracts days from renewal timestamp.
- `buildRenewalTrigger(subscription)`
  - returns the target reminder trigger datetime.
- `reminderStartMs(subscription)` / `reminderEndMs(subscription)`
  - defines the active reminder window boundaries.

Formatting helper:
- `toIndianDateTime(...)` used for user-facing reminder text in push/in-app message body.

---

## 4.3 Scheduling logic path

Main function: `scheduleRenewalReminder(subscription)`

### Step A: early exits
- If notifications module unavailable -> return.
- If subscription reminder disabled or status cancelled -> cancel existing scheduled job and return.
- If reminder boundaries invalid -> cancel existing job and return.
- If now is past renewal end -> cancel existing job and return.

### Step B: inside reminder window
If current time is between `startMs` and `endMs`:
1. check `hasInAppReminderInWindow(subscriptionId, startMs, endMs)`
   - prevents duplicate “keep scheduling every load” behavior.
2. inspect existing scheduled `NotificationJob`:
   - if an existing future trigger is already present, keep it and return.
   - else cancel stale job.
3. schedule fallback reminder at `now + 2 minutes`.
4. persist:
   - `upsertNotificationJob(...)`
   - `upsertNotification(...)` for in-app list.

### Step C: outside reminder window
1. compute `triggerDate = buildRenewalTrigger(subscription)`.
2. if trigger already in the past, fallback to `now + 2 minutes`.
3. if job with same `triggerAt` already exists, do nothing.
4. else cancel old job, schedule new OS notification, persist job + in-app notification.

OS scheduling call:
- `Notifications.scheduleNotificationAsync({ content, trigger })`
- Android trigger object includes `channelId: "default"`.

---

## 4.4 Cancellation and cleanup

### `cancelJob(job)`
- cancels OS scheduled notification by `expoNotificationId`,
- removes `NotificationJob` record from repository.

### `clearInAppNotificationsForSubscription(subscriptionId)`
- removes in-app notification rows for that subscription from notification list.

Used by:
- `onSubscriptionCancelled(subscriptionId)`
- `onSubscriptionDeleted(subscriptionId)`

---

## 4.5 Bulk sync behavior

### `syncForSubscriptions(subscriptions)`
- schedules/reschedules each subscription via `scheduleRenewalReminder(sub)`.
- loads all stored jobs and deletes orphaned ones (jobs referencing non-existent subscriptions).

This is why startup sync can reconcile stale jobs.

---

## 4.6 In-app notification actions

### `snoozeNotification({ id, hours, notifications })`
- finds existing in-app item,
- marks original as read,
- inserts cloned notification with future `createdAt` (`addHours`).

### `clearAllScheduled()`
- loads all `NotificationJob` records,
- cancels each OS notification,
- clears all job mapping records.

---

## 5) Repository responsibilities for notifications

From `AppRepository` (`src/repository/appRepository.ts`):

### In-app notifications table operations
- `loadNotifications()`
- `upsertNotification(notification)`
- `deleteNotification(id)`
- `markNotificationRead(id)`
- `markAllNotificationsRead()`
- `clearNotifications()`

### Scheduled job mapping operations
- `loadNotificationJobs()`
- `getNotificationJob(id)`
- `upsertNotificationJob(job)`
- `deleteNotificationJob(id)`
- `deleteNotificationJobsBySubscriptionId(subscriptionId)`
- `clearNotificationJobs()`

SQLite wiring is implemented in `src/repository/sqliteAppRepository.ts`.

---

## 6) Data model relationships

- **Subscription** (domain object)
  - includes `nextPaymentDate`, `status`, `reminderEnabled`, `reminderDaysBefore`.

- **NotificationJob** (scheduling mapping)
  - `id` (e.g. `${subscriptionId}:renewalReminder`)
  - `subscriptionId`
  - `triggerAt`
  - `expoNotificationId`

- **Notification** (in-app feed item)
  - stored for UI in notifications screen.
  - renewal reminders are inserted with type `"billing"`.

---

## 7) Why this architecture is used

- **Service layer** keeps business events centralized.
- **Engine** encapsulates platform-specific notification details.
- **Repository** provides durable state for:
  - deduplication,
  - cancellation/replacement safety,
  - app restart resilience.

This separation makes reminder behavior deterministic and recoverable across app launches.

---

## 8) Key call chain summary

1. User adds/edits subscription.
2. `appService.upsertSubscription()` normalizes and saves subscription.
3. `notificationEngine.onSubscriptionUpserted()` is called.
4. `scheduleRenewalReminder()` decides trigger strategy.
5. Engine schedules with Expo and persists `NotificationJob` + in-app `Notification`.
6. On future app loads, `hydrate()` -> `syncForSubscriptions()` reconciles state.

---

## 9) Detailed execution traces

This section gives concrete step-by-step traces with actual function names.

### 9.1 App cold start (`hydrate` path)

1. `createAppService().hydrate()`
2. `repository.init()`
3. `repository.loadUserProfile()` / `repository.loadPreferences()`
4. `repository.loadSubscriptions()` + `repository.loadNotifications()`
5. `notificationEngine.bootstrap()`
   - `ensureBootstrapped()`
   - `getExpoNotifications()` (lazy module load)
   - `setNotificationHandler(...)`
   - `getPermissionsAsync()` + optional `requestPermissionsAsync()`
   - Android `setNotificationChannelAsync("default", ...)`
6. `notificationEngine.syncForSubscriptions(subscriptions)`
   - loops each subscription -> `scheduleRenewalReminder(sub)`
   - then removes orphan `NotificationJob` records not linked to current subscriptions

### 9.2 Subscription create/update (`upsert` path)

1. UI dispatches `upsertSubscription(...)` thunk.
2. `appService.upsertSubscription(subscription)`:
   - computes `createdAt`
   - derives `startDate`
   - computes `nextPaymentDate` via `nextPaymentFromStartDate(...)`
   - applies default `reminderEnabled` and `reminderDaysBefore`
   - persists subscription through repository
3. `notificationEngine.onSubscriptionUpserted(next)`
4. `scheduleRenewalReminder(next)` decides between:
   - no-op/cancel
   - immediate-window fallback schedule (`now + 2m`)
   - normal schedule (`nextPaymentDate - reminderDaysBefore`)

### 9.3 Subscription cancel/delete

1. `appService.cancelSubscription(id)` or `appService.deleteSubscription(id)`
2. service writes subscription state change to repository
3. calls `notificationEngine.onSubscriptionCancelled(id)` or `onSubscriptionDeleted(id)`
4. engine:
   - finds job via `getNotificationJob(jobId(id))`
   - cancels OS schedule in `cancelJob(...)`
   - removes persisted job record
   - removes related in-app reminders via `clearInAppNotificationsForSubscription(id)`

---

## 10) Scheduling decision tree (actual logic)

Main function: `scheduleRenewalReminder(subscription)`

1. **Feature gates / validity checks**
   - If notifications module unavailable -> return.
   - If reminder disabled or status is `cancelled` -> cancel existing job -> return.
   - Compute `startMs` (`reminderStartMs`) and `endMs` (`reminderEndMs`).
   - If invalid window -> cancel existing job -> return.

2. **Expired reminder window**
   - If `now > endMs` -> cancel existing job -> return.

3. **Within reminder window (`startMs <= now <= endMs`)**
   - Check `hasInAppReminderInWindow(...)`:
     - If true -> return (prevents repeated +2m scheduling every load).
   - Check existing `NotificationJob`:
     - If existing trigger is still future -> return (keep existing).
     - Otherwise cancel old job.
   - Schedule at `now + 2 minutes`.
   - Persist job mapping (`upsertNotificationJob`) and in-app entry (`upsertNotification`).

4. **Before reminder window**
   - Compute normal trigger via `buildRenewalTrigger(...)`.
   - If past due unexpectedly, fallback to `now + 2 minutes`.
   - If existing job has same `triggerAt` -> return.
   - Else replace old job, schedule OS notification, persist job + in-app row.

---

## 11) Trigger-time math details

### 11.1 Reminder lead-time normalization

Function: `reminderDaysBefore(subscription)`

- input may be missing/invalid
- normalization:
  - non-finite -> `3`
  - rounded integer
  - minimum `0`

### 11.2 Trigger baseline

Function: `buildRenewalTrigger(subscription)`

- parse `nextPaymentDate` via `parseIsoLike`
- compute `nextPaymentDate - reminderDaysBefore * 24h`
- return `Date` as trigger

### 11.3 Reminder window

- `startMs = reminderStartMs(subscription)` (same value as baseline trigger)
- `endMs = reminderEndMs(subscription)` (renewal instant)

So reminder window is:

$$
[startMs, endMs]
$$

and “inside-window fallback scheduling” applies only in that interval.

---

## 12) Repository communication map

Inside notification engine, repository methods are used as follows:

- **OS job mapping lifecycle**
  - `getNotificationJob(...)`
  - `upsertNotificationJob(...)`
  - `deleteNotificationJob(...)`
  - `loadNotificationJobs(...)`
  - `clearNotificationJobs(...)`

- **In-app feed lifecycle**
  - `upsertNotification(...)`
  - `loadNotifications(...)`
  - `deleteNotification(...)`
  - `markNotificationRead(...)` (snooze flow)

This split avoids coupling display feed state with OS scheduled-notification IDs.

---

## 13) Edge-case matrix

### Case A: reminder disabled after being enabled
- Expected: pending OS reminder removed.
- Path: `onSubscriptionUpserted` -> `scheduleRenewalReminder` -> early cancel branch.

### Case B: renewal moved to past date
- Expected: no future reminder.
- Path: `now > endMs` branch -> `cancelJob`.

### Case C: app reopened repeatedly inside reminder window
- Expected: should not keep moving trigger.
- Guard rails:
  - `hasInAppReminderInWindow(...)`
  - keep-existing-future-job check in within-window branch.

### Case D: same trigger already scheduled
- Expected: idempotent (no reschedule).
- Path: `existing && existing.triggerAt === triggerAt` -> return.

### Case E: missing permissions
- Expected: no schedule, no crash.
- Path: `ensureCanSchedule()` false -> return.

---

## 14) Push vs in-app reminder timing

- Push is delivered by OS at `triggerAt`.
- In-app notification row is inserted at schedule time with `createdAt: triggerAt` in current implementation.
  - this keeps feed semantically aligned with trigger instant.

If product wants “show upcoming reminders immediately in feed”, this can be changed to `createdAt: nowIsoUtc()`.

---

## 15) Troubleshooting checklist

When reminders do not appear as expected:

1. Confirm `nextPaymentDate` correctness after `appService.upsertSubscription`.
2. Verify reminder fields (`reminderEnabled`, `reminderDaysBefore`) on stored subscription.
3. Check if app is in within-window path and whether dedupe guards are returning early.
4. Verify permission state from `ensureCanSchedule()`.
5. Confirm channel exists on Android (`default`) and notification icon metadata is valid.
6. Inspect persisted `NotificationJob` row for `triggerAt` and `expoNotificationId`.
7. Validate in-app row existence in notifications table (`type: "billing"`, matching `subscriptionId`).

---

## 16) Suggested future hardening

- Add a dedicated domain field for “window notification already emitted” instead of inferring from in-app feed timestamps.
- Add integration tests around:
  - hydrate idempotency,
  - within-window app reopen loop,
  - cancel/delete cleanup.
- Add explicit metrics counters for:
  - schedule attempt
  - schedule success
  - schedule failure
  - cancel success

