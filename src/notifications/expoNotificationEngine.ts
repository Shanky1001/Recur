import { Platform } from "react-native";

import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";
import type { Notification } from "@/src/data/dummy";
import type { AppRepository } from "@/src/repository/appRepository";
import type { NotificationJob } from "@/src/repository/models";
import { parseIsoLike } from "@/src/utils/helper";

import type { NotificationEngine, SnoozeArgs, SnoozeResult } from "./types";

function nowIsoUtc(): string {
	return new Date().toISOString();
}

function addHours(iso: string, hours: number): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	date.setHours(date.getHours() + hours);
	return date.toISOString();
}

const IST_TIME_ZONE = "Asia/Kolkata";

function subtractDaysIst(date: Date, days: number): Date {
	return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}

function reminderDaysBefore(subscription: Subscription): number {
	const raw = subscription.reminderDaysBefore ?? 3;
	if (!Number.isFinite(raw)) return 3;
	return Math.max(0, Math.round(raw));
}

function buildRenewalTrigger(subscription: Subscription): Date | null {
	const next = parseIsoLike(subscription.nextPaymentDate);
	if (!next) return null;
	const daysBefore = reminderDaysBefore(subscription);
	const enabled = subscription.reminderEnabled ?? true;
	if (!enabled) return null;
	if (subscription.status === "cancelled") return null;

	const trigger = subtractDaysIst(next, daysBefore);
	if (Number.isNaN(trigger.getTime())) return null;
	return trigger;
}

function jobId(subscriptionId: string): string {
	return `${subscriptionId}:renewalReminder`;
}

function reminderStartMs(subscription: Subscription): number | null {
	const trigger = buildRenewalTrigger(subscription);
	if (!trigger) return null;
	return trigger.getTime();
}

function reminderEndMs(subscription: Subscription): number | null {
	const next = parseIsoLike(subscription.nextPaymentDate);
	if (!next) return null;
	return next.getTime();
}

function buildReminderContent(subscription: Subscription) {
	const renewalLabel = toIndianDateTime(subscription.nextPaymentDate);
	return {
		title: `Upcoming renewal: ${subscription.name}`,
		body: `Renews on ${renewalLabel}`,
		data: {
			type: "renewalReminder",
			subscriptionId: subscription.id,
			renewalAt: subscription.nextPaymentDate,
		},
		channelId: "default",
	};
}

function inAppNotificationId(subscriptionId: string, atIso: string): string {
	return `${subscriptionId}:renewal:${atIso}`;
}

function toIndianDateTime(input: Date | number | string): string {
	const date =
		input instanceof Date
			? input
			: new Date(typeof input === "number" ? input : String(input));
	if (Number.isNaN(date.getTime())) return String(input);
	return date.toLocaleString("en-IN", {
		timeZone: IST_TIME_ZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: true,
	});
}

export function createExpoNotificationEngine(
	repository: AppRepository,
): NotificationEngine {
	let bootstrapped = false;
	let canSchedule = false;
	let notificationsMod: typeof import("expo-notifications") | null = null;

	async function getExpoNotifications() {
		if (Platform.OS === "web") return null;
		if (notificationsMod) return notificationsMod;
		// Lazy import so web bundling doesn't explode.
		try {
			notificationsMod = await import("expo-notifications");
			return notificationsMod;
		} catch {
			return null;
		}
	}

	async function ensureBootstrapped(): Promise<void> {
		if (bootstrapped) return;
		const Notifications = await getExpoNotifications();
		if (!Notifications) {
			bootstrapped = true;
			return;
		}

		try {
			(Notifications as any).setNotificationHandler?.({
				handleNotification: async () => ({
					shouldShowBanner: true,
					shouldShowList: true,
					shouldPlaySound: true,
					shouldSetBadge: false,
				}),
			});
		} catch {
			// ignore
		}

		try {
			let settings = await Notifications.getPermissionsAsync();
			if (settings.status !== "granted") {
				settings = await Notifications.requestPermissionsAsync();
			}
			canSchedule = settings.status === "granted";
		} catch {
			// ignore: permissions flow can fail on simulators/emulators
			canSchedule = false;
		}

		if (Platform.OS === "android") {
			try {
				await Notifications.setNotificationChannelAsync("default", {
					name: "Default",
					importance: Notifications.AndroidImportance.HIGH,
					sound: "default",
				});
			} catch {
				// ignore
			}
		}

		bootstrapped = true;
	}

	async function ensureCanSchedule(): Promise<boolean> {
		const Notifications = await getExpoNotifications();
		if (!Notifications) return false;
		try {
			let settings = await Notifications.getPermissionsAsync();
			if (settings.status !== "granted") {
				settings = await Notifications.requestPermissionsAsync();
			}
			canSchedule = settings.status === "granted";
		} catch {
			canSchedule = false;
		}
		return canSchedule;
	}

	async function cancelJob(job: NotificationJob): Promise<void> {
		const Notifications = await getExpoNotifications();
		if (Notifications) {
			try {
				await Notifications.cancelScheduledNotificationAsync(
					job.expoNotificationId,
				);
			} catch {
				// ignore
			}
		}
		try {
			await repository.deleteNotificationJob(job.id);
		} catch {
			// ignore
		}
	}

	async function clearInAppNotificationsForSubscription(
		subscriptionId: string,
	): Promise<void> {
		let all: Notification[] = [];
		try {
			all = await repository.loadNotifications();
		} catch {
			all = [];
		}

		const related = all.filter((n) => n.subscriptionId === subscriptionId);
		for (const n of related) {
			try {
				await repository.deleteNotification(n.id);
			} catch {
				// ignore
			}
		}
	}

	async function hasInAppReminderInWindow(
		subscriptionId: string,
		startMs: number,
		endMs: number,
	): Promise<boolean> {
		let all: Notification[] = [];
		try {
			all = await repository.loadNotifications();
		} catch {
			all = [];
		}

		for (const n of all) {
			if (n.subscriptionId !== subscriptionId) continue;
			if (n.type !== "billing") continue;
			const t = Date.parse(n.createdAt);
			if (!Number.isFinite(t)) continue;
			if (t >= startMs && t <= endMs) return true;
		}

		return false;
	}

	async function scheduleRenewalReminder(subscription: Subscription) {
		const Notifications = await getExpoNotifications();
		if (!Notifications) return;

		const enabled = subscription.reminderEnabled ?? true;
		if (!enabled || subscription.status === "cancelled") {
			const existing = await repository.getNotificationJob(
				jobId(subscription.id),
			);
			if (existing) await cancelJob(existing);
			return;
		}

		const nowMs = Date.now();
		const startMs = reminderStartMs(subscription);
		const endMs = reminderEndMs(subscription);
		if (startMs == null || endMs == null) {
			const existing = await repository.getNotificationJob(
				jobId(subscription.id),
			);
			if (existing) await cancelJob(existing);
			return;
		}

		if (nowMs > endMs) {
			const existing = await repository.getNotificationJob(
				jobId(subscription.id),
			);
			if (existing) await cancelJob(existing);
			return;
		}

		if (nowMs >= startMs && nowMs <= endMs) {
			const alreadyNotifiedInWindow = await hasInAppReminderInWindow(
				subscription.id,
				startMs,
				endMs,
			);
			if (alreadyNotifiedInWindow) {
				return;
			}

			const existing = await repository.getNotificationJob(
				jobId(subscription.id),
			);
			if (existing) {
				const existingMs = Date.parse(existing.triggerAt);
				if (Number.isFinite(existingMs) && existingMs > nowMs) {
					return;
				}
				await cancelJob(existing);
			}

			const triggerDate = new Date(nowMs + 2 * 60 * 1000);
			const triggerAt = triggerDate.toISOString();

			if (!(await ensureCanSchedule())) {
				return;
			}

			try {
				const scheduleTrigger: any =
					Platform.OS === "android"
						? {
								type: "date",
								date: triggerDate,
								channelId: "default",
							}
						: {
								type: "date",
								date: triggerDate,
							};
				const expoNotificationId =
					await Notifications.scheduleNotificationAsync({
						content: buildReminderContent(subscription),
						trigger: scheduleTrigger,
					});

				await repository.upsertNotificationJob({
					id: jobId(subscription.id),
					subscriptionId: subscription.id,
					type: "renewalReminder",
					triggerAt,
					expoNotificationId,
					createdAt: nowIsoUtc(),
				});
				await repository.upsertNotification({
					id: inAppNotificationId(subscription.id, triggerAt),
					title: `Upcoming renewal: ${subscription.name}`,
					message: `Renews on ${toIndianDateTime(subscription.nextPaymentDate)}`,
					type: "billing",
					subscriptionId: subscription.id,
					createdAt: triggerAt,
					read: false,
				});
			} catch {}
			return;
		}

		let triggerDate = buildRenewalTrigger(subscription);
		if (!triggerDate) {
			const existing = await repository.getNotificationJob(
				jobId(subscription.id),
			);
			if (existing) await cancelJob(existing);
			return;
		}

		if (triggerDate.getTime() <= nowMs) {
			triggerDate = new Date(nowMs + 2 * 60 * 1000);
		}

		const triggerAt = triggerDate.toISOString();
		const existing = await repository.getNotificationJob(
			jobId(subscription.id),
		);
		if (existing && existing.triggerAt === triggerAt) return;
		if (existing) await cancelJob(existing);

		if (!(await ensureCanSchedule())) {
			// Permissions not granted; don't attempt to schedule.
			return;
		}

		let expoNotificationId: string;
		try {
			const scheduleTrigger: any =
				Platform.OS === "android"
					? {
							type: "date",
							date: triggerDate,
							channelId: "default",
						}
					: {
							type: "date",
							date: triggerDate,
						};
			expoNotificationId = await Notifications.scheduleNotificationAsync({
				content: buildReminderContent(subscription),
				trigger: scheduleTrigger,
			});
		} catch {
			// Scheduling can fail if permissions are denied or OS rejects the request.
			return;
		}

		const job: NotificationJob = {
			id: jobId(subscription.id),
			subscriptionId: subscription.id,
			type: "renewalReminder",
			triggerAt,
			expoNotificationId,
			createdAt: nowIsoUtc(),
		};
		try {
			await repository.upsertNotificationJob(job);
			await repository.upsertNotification({
				id: inAppNotificationId(subscription.id, triggerAt),
				title: `Upcoming renewal: ${subscription.name}`,
				message: `Renews on ${toIndianDateTime(subscription.nextPaymentDate)}`,
				type: "billing",
				subscriptionId: subscription.id,
				createdAt: triggerAt,
				read: false,
			});
		} catch {
			// ignore
		}
	}

	return {
		bootstrap: async () => {
			await ensureBootstrapped();
		},
		syncForSubscriptions: async (subscriptions) => {
			await ensureBootstrapped();
			// Reschedule all renewal reminders.
			for (const sub of subscriptions) {
				try {
					await scheduleRenewalReminder(sub);
				} catch {
					// ignore
				}
			}
			// Clean up jobs for subscriptions that no longer exist.
			let allJobs: NotificationJob[] = [];
			try {
				allJobs = await repository.loadNotificationJobs();
			} catch {
				allJobs = [];
			}
			const ids = new Set(subscriptions.map((s) => s.id));
			for (const job of allJobs) {
				if (!ids.has(job.subscriptionId)) {
					try {
						await cancelJob(job);
					} catch {
						// ignore
					}
				}
			}
		},
		onSubscriptionUpserted: async (subscription) => {
			await ensureBootstrapped();
			try {
				await scheduleRenewalReminder(subscription);
			} catch {
				// ignore
			}
		},
		onSubscriptionCancelled: async (subscriptionId) => {
			await ensureBootstrapped();
			try {
				const existing = await repository.getNotificationJob(
					jobId(subscriptionId),
				);
				if (existing) await cancelJob(existing);
				await clearInAppNotificationsForSubscription(subscriptionId);
			} catch {
				// ignore
			}
		},
		onSubscriptionDeleted: async (subscriptionId) => {
			await ensureBootstrapped();
			try {
				const existing = await repository.getNotificationJob(
					jobId(subscriptionId),
				);
				if (existing) await cancelJob(existing);
				await clearInAppNotificationsForSubscription(subscriptionId);
			} catch {
				// ignore
			}
		},
		snoozeNotification: async ({
			id,
			hours,
			notifications,
		}: SnoozeArgs): Promise<SnoozeResult> => {
			// In-app notification snooze: duplicates the notification with a later createdAt.
			const existing = notifications.find((n) => n.id === id);
			if (!existing) return null;
			const snoozed: Notification = {
				...existing,
				id: `${existing.id}-snooze-${Date.now()}`,
				read: false,
				createdAt: addHours(nowIsoUtc(), hours),
			};
			await repository.markNotificationRead(id);
			await repository.upsertNotification(snoozed);
			return { id, snoozed };
		},
		clearAllScheduled: async () => {
			await ensureBootstrapped();
			let jobs: NotificationJob[] = [];
			try {
				jobs = await repository.loadNotificationJobs();
			} catch {
				jobs = [];
			}
			for (const job of jobs) {
				try {
					await cancelJob(job);
				} catch {
					// ignore
				}
			}
			try {
				await repository.clearNotificationJobs();
			} catch {
				// ignore
			}
		},
	};
}
