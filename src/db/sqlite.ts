import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";
import type { Notification } from "@/src/data/dummy";
import type {
	NotificationJob,
	Preferences,
	ServiceCatalogItem,
	UserProfile,
} from "@/src/repository/models";
import {
	BILLING_CYCLE_OPTIONS,
	type BillingCycle,
} from "@/src/utils/billingCycle";

function parseStoredBillingCycle(raw: unknown): BillingCycle {
	const value = String(raw ?? "Monthly");
	if ((BILLING_CYCLE_OPTIONS as readonly string[]).includes(value)) {
		return value as BillingCycle;
	}
	return "Monthly";
}

// We keep timestamps as UTC ISO strings only.
export function nowIsoUtc(): string {
	return new Date().toISOString();
}

type AsyncDb = {
	execAsync: (sql: string) => Promise<void>;
	getAllAsync: <T = any>(sql: string, params?: any[]) => Promise<T[]>;
	runAsync: (sql: string, params?: any[]) => Promise<{ changes: number }>;
};

let db: AsyncDb | null = null;
let initPromise: Promise<void> | null = null;

async function openAsyncDb(): Promise<AsyncDb | null> {
	if (Platform.OS === "web") return null;
	if (db) return db;

	// expo-sqlite SDK 54 provides async database APIs.
	const d: any = await (SQLite as any).openDatabaseAsync("recur.db");
	const wrapped: AsyncDb = {
		execAsync: async (sql) => {
			await d.execAsync(sql);
		},
		getAllAsync: async (sql, params = []) => {
			return await d.getAllAsync(sql, params);
		},
		runAsync: async (sql, params = []) => {
			const res = await d.runAsync(sql, params);
			return { changes: res?.changes ?? 0 };
		},
	};

	db = wrapped;
	return wrapped;
}

export async function initSqlite(): Promise<void> {
	if (Platform.OS === "web") return;
	if (initPromise) return initPromise;

	initPromise = (async () => {
		const d = await openAsyncDb();
		if (!d) return;

		await d.execAsync(`
			PRAGMA journal_mode = WAL;
			CREATE TABLE IF NOT EXISTS subscriptions (
				id TEXT PRIMARY KEY NOT NULL,
				name TEXT NOT NULL,
				category TEXT NOT NULL,
				status TEXT NOT NULL,
				planName TEXT NOT NULL,
				pricePerMonth INTEGER NOT NULL,
				currencySymbol TEXT NOT NULL,
				billingCycle TEXT,
				pricePerBillingCycle INTEGER,
				paymentMethod TEXT,
				reminderEnabled INTEGER,
				reminderDaysBefore INTEGER,
				reminderTime TEXT,
				startDate TEXT,
				nextPaymentDate TEXT NOT NULL,
				logoUri TEXT,
				createdAt TEXT NOT NULL
			);

			CREATE TABLE IF NOT EXISTS notifications (
				id TEXT PRIMARY KEY NOT NULL,
				title TEXT NOT NULL,
				message TEXT NOT NULL,
				type TEXT NOT NULL,
				subscriptionId TEXT,
				createdAt TEXT NOT NULL,
				read INTEGER NOT NULL
			);

			CREATE TABLE IF NOT EXISTS notification_jobs (
				id TEXT PRIMARY KEY NOT NULL,
				subscriptionId TEXT NOT NULL,
				type TEXT NOT NULL,
				triggerAt TEXT NOT NULL,
				expoNotificationId TEXT NOT NULL,
				createdAt TEXT NOT NULL
			);

			CREATE TABLE IF NOT EXISTS preferences (
				id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
				currency TEXT NOT NULL,
				defaultReminderDaysBefore INTEGER NOT NULL,
				defaultReminderTime TEXT NOT NULL DEFAULT '09:00',
				defaultReminderEnabled INTEGER NOT NULL,
				themeMode TEXT NOT NULL DEFAULT 'system',
				hasOnboarded INTEGER NOT NULL DEFAULT 0,
				updatedAt TEXT NOT NULL
			);

			CREATE TABLE IF NOT EXISTS user_profile (
				id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
				name TEXT NOT NULL,
				avatarUri TEXT NOT NULL,
				updatedAt TEXT NOT NULL
			);

			CREATE TABLE IF NOT EXISTS services (
				name TEXT PRIMARY KEY NOT NULL,
				logoUri TEXT,
				plansJson TEXT NOT NULL,
				defaultCycle TEXT NOT NULL,
				defaultCost INTEGER NOT NULL,
				defaultCategory TEXT NOT NULL,
				defaultStatus TEXT NOT NULL,
				createdAt TEXT NOT NULL,
				updatedAt TEXT NOT NULL
			);
		`);
	})();

	return initPromise;
}

export async function loadSubscriptions(): Promise<Subscription[]> {
	await initSqlite();
	const d = db;
	if (!d) return [];

	const rows = await d.getAllAsync<any>(
		"SELECT * FROM subscriptions ORDER BY createdAt DESC",
	);
	return rows.map((r) => ({
		id: String(r.id),
		name: String(r.name),
		category: String(r.category),
		status: r.status as any,
		planName: String(r.planName),
		pricePerMonth: Number(r.pricePerMonth),
		currencySymbol: String(r.currencySymbol),
		billingCycle: (r.billingCycle ?? undefined) as any,
		pricePerBillingCycle:
			r.pricePerBillingCycle == null
				? undefined
				: Number(r.pricePerBillingCycle),
		paymentMethod: r.paymentMethod ?? undefined,
		reminderEnabled:
			r.reminderEnabled == null ? undefined : Boolean(r.reminderEnabled),
		reminderDaysBefore:
			r.reminderDaysBefore == null
				? undefined
				: Number(r.reminderDaysBefore),
		reminderTime: r.reminderTime ?? undefined,
		startDate: r.startDate == null ? undefined : String(r.startDate),
		nextPaymentDate: String(r.nextPaymentDate),
		logoUri: r.logoUri ?? undefined,
		createdAt: r.createdAt == null ? undefined : String(r.createdAt),
	}));
}

export async function upsertSubscription(sub: Subscription): Promise<void> {
	await initSqlite();
	const d = db;
	if (!d) return;

	const createdAt = sub.createdAt ?? nowIsoUtc();
	const startDate =
		sub.startDate ??
		(sub.createdAt ? String(sub.createdAt).slice(0, 10) : undefined) ??
		createdAt.slice(0, 10);
	await d.runAsync(
		`INSERT INTO subscriptions (
			id, name, category, status, planName, pricePerMonth, currencySymbol,
			billingCycle, pricePerBillingCycle, paymentMethod, reminderEnabled, reminderDaysBefore, reminderTime,
			startDate, nextPaymentDate, logoUri, createdAt
		) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
		ON CONFLICT(id) DO UPDATE SET
			name=excluded.name,
			category=excluded.category,
			status=excluded.status,
			planName=excluded.planName,
			pricePerMonth=excluded.pricePerMonth,
			currencySymbol=excluded.currencySymbol,
			billingCycle=excluded.billingCycle,
			pricePerBillingCycle=excluded.pricePerBillingCycle,
			paymentMethod=excluded.paymentMethod,
			reminderEnabled=excluded.reminderEnabled,
			reminderDaysBefore=excluded.reminderDaysBefore,
			reminderTime=excluded.reminderTime,
			startDate=excluded.startDate,
			nextPaymentDate=excluded.nextPaymentDate,
			logoUri=excluded.logoUri
		`,
		[
			sub.id,
			sub.name,
			sub.category,
			sub.status,
			sub.planName,
			Math.round(sub.pricePerMonth),
			sub.currencySymbol,
			sub.billingCycle ?? null,
			sub.pricePerBillingCycle ?? null,
			sub.paymentMethod ?? null,
			sub.reminderEnabled == null ? null : sub.reminderEnabled ? 1 : 0,
			sub.reminderDaysBefore ?? null,
			sub.reminderTime ?? null,
			startDate ?? null,
			sub.nextPaymentDate,
			sub.logoUri ?? null,
			createdAt,
		],
	);
}

export async function cancelSubscription(id: string): Promise<void> {
	await initSqlite();
	const d = db;
	if (!d) return;
	await d.runAsync("UPDATE subscriptions SET status=? WHERE id=?", [
		"cancelled",
		id,
	]);
}

export async function deleteSubscription(id: string): Promise<void> {
	await initSqlite();
	const d = db;
	if (!d) return;
	await d.runAsync("DELETE FROM subscriptions WHERE id=?", [id]);
}

export async function clearSubscriptions(): Promise<void> {
	await initSqlite();
	const d = db;
	if (!d) return;
	await d.runAsync("DELETE FROM subscriptions");
}

export async function loadNotifications(options?: {
	includeFuture?: boolean;
}): Promise<Notification[]> {
	await initSqlite();
	const d = db;
	if (!d) return [];
	const includeFuture = options?.includeFuture === true;
	const rows = includeFuture
		? await d.getAllAsync<any>(
				"SELECT * FROM notifications ORDER BY createdAt DESC",
			)
		: await d.getAllAsync<any>(
				"SELECT * FROM notifications WHERE createdAt <= ? ORDER BY createdAt DESC",
				[new Date().toISOString()],
			);
	return rows.map((r) => ({
		id: String(r.id),
		title: String(r.title),
		message: String(r.message),
		type: r.type as any,
		subscriptionId: r.subscriptionId ?? undefined,
		createdAt: String(r.createdAt),
		read: Boolean(r.read),
	}));
}

export async function upsertNotification(n: Notification): Promise<void> {
	await initSqlite();
	const d = db;
	if (!d) return;
	await d.runAsync(
		`INSERT INTO notifications (id, title, message, type, subscriptionId, createdAt, read)
		VALUES (?,?,?,?,?,?,?)
		ON CONFLICT(id) DO UPDATE SET
			title=excluded.title,
			message=excluded.message,
			type=excluded.type,
			subscriptionId=excluded.subscriptionId,
			createdAt=excluded.createdAt,
			read=excluded.read
		`,
		[
			n.id,
			n.title,
			n.message,
			n.type,
			n.subscriptionId ?? null,
			n.createdAt,
			n.read ? 1 : 0,
		],
	);
}

export async function markNotificationRead(id: string): Promise<void> {
	await initSqlite();
	const d = db;
	if (!d) return;
	await d.runAsync("UPDATE notifications SET read=1 WHERE id=?", [id]);
}

export async function deleteNotification(id: string): Promise<void> {
	await initSqlite();
	const d = db;
	if (!d) return;
	await d.runAsync("DELETE FROM notifications WHERE id=?", [id]);
}

export async function clearNotifications(): Promise<void> {
	await initSqlite();
	const d = db;
	if (!d) return;
	await d.runAsync("DELETE FROM notifications");
}

export async function markAllNotificationsRead(): Promise<void> {
	await initSqlite();
	const d = db;
	if (!d) return;
	const nowIso = new Date().toISOString();
	await d.runAsync("UPDATE notifications SET read=1 WHERE createdAt <= ?", [
		nowIso,
	]);
}

export async function resetLocalData(): Promise<void> {
	await initSqlite();
	const d = db;
	if (!d) return;

	await d.runAsync("DELETE FROM subscriptions");
	await d.runAsync("DELETE FROM notifications");
	await d.runAsync("DELETE FROM notification_jobs");
	await d.runAsync("DELETE FROM preferences");
	await d.runAsync("DELETE FROM user_profile");
	await d.runAsync("DELETE FROM services");
}

export async function loadServices(): Promise<ServiceCatalogItem[]> {
	await initSqlite();
	const d = db;
	if (!d) return [];
	const rows = await d.getAllAsync<any>(
		"SELECT * FROM services ORDER BY name COLLATE NOCASE ASC",
	);
	return rows.map((r) => {
		let plans: string[] = [];
		try {
			const parsed = JSON.parse(String(r.plansJson ?? "[]"));
			plans = Array.isArray(parsed)
				? parsed
						.map((p) => String(p).trim())
						.filter((p) => p.length > 0)
				: [];
		} catch {
			plans = [];
		}
		if (plans.length === 0) plans = ["Standard"];

		const cycle = parseStoredBillingCycle(r.defaultCycle);
		const status = String(r.defaultStatus) === "trial" ? "trial" : "active";

		return {
			name: String(r.name),
			logoUri: r.logoUri == null ? undefined : String(r.logoUri),
			plans,
			defaultCycle: cycle,
			defaultCost: Number(r.defaultCost),
			defaultCategory: String(r.defaultCategory),
			defaultStatus: status,
			createdAt: String(r.createdAt),
			updatedAt: String(r.updatedAt),
		};
	});
}

export async function upsertService(
	service: ServiceCatalogItem,
): Promise<void> {
	await initSqlite();
	const d = db;
	if (!d) return;
	const createdAt = service.createdAt ?? nowIsoUtc();
	const updatedAt = service.updatedAt ?? nowIsoUtc();
	const plans = (service.plans ?? [])
		.map((p) => String(p).trim())
		.filter((p) => p.length > 0);
	await d.runAsync(
		`INSERT INTO services (name, logoUri, plansJson, defaultCycle, defaultCost, defaultCategory, defaultStatus, createdAt, updatedAt)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(name) DO UPDATE SET
			logoUri=excluded.logoUri,
			plansJson=excluded.plansJson,
			defaultCycle=excluded.defaultCycle,
			defaultCost=excluded.defaultCost,
			defaultCategory=excluded.defaultCategory,
			defaultStatus=excluded.defaultStatus,
			updatedAt=excluded.updatedAt
		`,
		[
			service.name,
			service.logoUri ?? null,
			JSON.stringify(plans.length ? plans : ["Standard"]),
			service.defaultCycle,
			Math.round(service.defaultCost),
			service.defaultCategory,
			service.defaultStatus,
			createdAt,
			updatedAt,
		],
	);
}

export async function deleteService(name: string): Promise<void> {
	await initSqlite();
	const d = db;
	if (!d) return;
	await d.runAsync("DELETE FROM services WHERE name=?", [name]);
}

export async function loadPreferences(): Promise<Preferences | null> {
	await initSqlite();
	const d = db;
	if (!d) return null;
	const rows = await d.getAllAsync<any>(
		"SELECT * FROM preferences WHERE id=1 LIMIT 1",
	);
	const r = rows[0];
	if (!r) return null;
	return {
		currency: String(r.currency),
		defaultReminderDaysBefore: Number(r.defaultReminderDaysBefore),
		defaultReminderTime:
			r.defaultReminderTime == null
				? undefined
				: String(r.defaultReminderTime),
		defaultReminderEnabled: Boolean(r.defaultReminderEnabled),
		themeMode:
			r.themeMode === "light" || r.themeMode === "dark"
				? r.themeMode
				: "system",
		hasOnboarded: Boolean(r.hasOnboarded),
		updatedAt: String(r.updatedAt),
	};
}

export async function upsertPreferences(p: Preferences): Promise<void> {
	await initSqlite();
	const d = db;
	if (!d) return;
	const updatedAt = p.updatedAt ?? nowIsoUtc();
	await d.runAsync(
		`INSERT INTO preferences (id, currency, defaultReminderDaysBefore, defaultReminderTime, defaultReminderEnabled, themeMode, hasOnboarded, updatedAt)
		VALUES (1, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			currency=excluded.currency,
			defaultReminderDaysBefore=excluded.defaultReminderDaysBefore,
			defaultReminderTime=excluded.defaultReminderTime,
			defaultReminderEnabled=excluded.defaultReminderEnabled,
			themeMode=excluded.themeMode,
			hasOnboarded=excluded.hasOnboarded,
			updatedAt=excluded.updatedAt
		`,
		[
			p.currency,
			Math.round(p.defaultReminderDaysBefore),
			p.defaultReminderTime ?? "09:00",
			p.defaultReminderEnabled ? 1 : 0,
			p.themeMode === "light" || p.themeMode === "dark"
				? p.themeMode
				: "system",
			p.hasOnboarded ? 1 : 0,
			updatedAt,
		],
	);
}

export async function clearPreferences(): Promise<void> {
	await initSqlite();
	const d = db;
	if (!d) return;
	await d.runAsync("DELETE FROM preferences");
}

export async function loadUserProfile(): Promise<UserProfile | null> {
	await initSqlite();
	const d = db;
	if (!d) return null;
	const rows = await d.getAllAsync<any>(
		"SELECT * FROM user_profile WHERE id=1 LIMIT 1",
	);
	const r = rows[0];
	if (!r) return null;
	return {
		name: String(r.name),
		avatarUri: String(r.avatarUri),
		updatedAt: String(r.updatedAt),
	};
}

export async function upsertUserProfile(profile: UserProfile): Promise<void> {
	await initSqlite();
	const d = db;
	if (!d) return;
	const updatedAt = profile.updatedAt ?? nowIsoUtc();
	await d.runAsync(
		`INSERT INTO user_profile (id, name, avatarUri, updatedAt)
		VALUES (1, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			name=excluded.name,
			avatarUri=excluded.avatarUri,
			updatedAt=excluded.updatedAt
		`,
		[profile.name, profile.avatarUri, updatedAt],
	);
}

export async function clearUserProfile(): Promise<void> {
	await initSqlite();
	const d = db;
	if (!d) return;
	await d.runAsync("DELETE FROM user_profile");
}

export async function loadNotificationJobs(): Promise<NotificationJob[]> {
	await initSqlite();
	const d = db;
	if (!d) return [];
	const rows = await d.getAllAsync<any>(
		"SELECT * FROM notification_jobs ORDER BY createdAt DESC",
	);
	return rows.map((r) => ({
		id: String(r.id),
		subscriptionId: String(r.subscriptionId),
		type: String(r.type) as any,
		triggerAt: String(r.triggerAt),
		expoNotificationId: String(r.expoNotificationId),
		createdAt: String(r.createdAt),
	}));
}

export async function getNotificationJob(
	id: string,
): Promise<NotificationJob | null> {
	await initSqlite();
	const d = db;
	if (!d) return null;
	const rows = await d.getAllAsync<any>(
		"SELECT * FROM notification_jobs WHERE id=? LIMIT 1",
		[id],
	);
	const r = rows[0];
	if (!r) return null;
	return {
		id: String(r.id),
		subscriptionId: String(r.subscriptionId),
		type: String(r.type) as any,
		triggerAt: String(r.triggerAt),
		expoNotificationId: String(r.expoNotificationId),
		createdAt: String(r.createdAt),
	};
}

export async function upsertNotificationJob(
	job: NotificationJob,
): Promise<void> {
	await initSqlite();
	const d = db;
	if (!d) return;
	await d.runAsync(
		`INSERT INTO notification_jobs (id, subscriptionId, type, triggerAt, expoNotificationId, createdAt)
		VALUES (?,?,?,?,?,?)
		ON CONFLICT(id) DO UPDATE SET
			subscriptionId=excluded.subscriptionId,
			type=excluded.type,
			triggerAt=excluded.triggerAt,
			expoNotificationId=excluded.expoNotificationId,
			createdAt=excluded.createdAt
		`,
		[
			job.id,
			job.subscriptionId,
			job.type,
			job.triggerAt,
			job.expoNotificationId,
			job.createdAt,
		],
	);
}

export async function deleteNotificationJob(id: string): Promise<void> {
	await initSqlite();
	const d = db;
	if (!d) return;
	await d.runAsync("DELETE FROM notification_jobs WHERE id=?", [id]);
}

export async function deleteNotificationJobsBySubscriptionId(
	subscriptionId: string,
): Promise<void> {
	await initSqlite();
	const d = db;
	if (!d) return;
	await d.runAsync("DELETE FROM notification_jobs WHERE subscriptionId=?", [
		subscriptionId,
	]);
}

export async function clearNotificationJobs(): Promise<void> {
	await initSqlite();
	const d = db;
	if (!d) return;
	await d.runAsync("DELETE FROM notification_jobs");
}
