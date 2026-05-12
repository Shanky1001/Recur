import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";
import type { Notification } from "@/src/data/dummy";
import type { NotificationJob } from "@/src/repository/models";

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
	await d.runAsync(
		`INSERT INTO subscriptions (
			id, name, category, status, planName, pricePerMonth, currencySymbol,
			billingCycle, pricePerBillingCycle, paymentMethod, reminderEnabled, reminderDaysBefore,
			nextPaymentDate, logoUri, createdAt
		) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
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

export async function loadNotifications(): Promise<Notification[]> {
	await initSqlite();
	const d = db;
	if (!d) return [];
	const rows = await d.getAllAsync<any>(
		"SELECT * FROM notifications ORDER BY createdAt DESC",
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
	await d.runAsync("UPDATE notifications SET read=1");
}

export async function seedIfEmpty(
	seedSubscriptions: Subscription[],
	seedNotifications: Notification[],
): Promise<void> {
	await initSqlite();
	const d = db;
	if (!d) return;

	const subCount = await d.getAllAsync<{ c: number }>(
		"SELECT COUNT(*) as c FROM subscriptions",
	);
	const notifCount = await d.getAllAsync<{ c: number }>(
		"SELECT COUNT(*) as c FROM notifications",
	);

	if ((subCount[0]?.c ?? 0) === 0) {
		for (const s of seedSubscriptions) {
			await upsertSubscription(s);
		}
	}
	if ((notifCount[0]?.c ?? 0) === 0) {
		for (const n of seedNotifications) {
			await upsertNotification(n);
		}
	}
}

export async function resetLocalData(
	seedSubscriptions: Subscription[],
	seedNotifications: Notification[],
): Promise<void> {
	await initSqlite();
	const d = db;
	if (!d) return;

	await d.runAsync("DELETE FROM subscriptions");
	await d.runAsync("DELETE FROM notifications");
	await d.runAsync("DELETE FROM notification_jobs");

	for (const s of seedSubscriptions) {
		await upsertSubscription(s);
	}
	for (const n of seedNotifications) {
		await upsertNotification(n);
	}
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
