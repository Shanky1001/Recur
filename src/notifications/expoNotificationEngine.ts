import { Platform } from "react-native";

import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";
import type { Notification } from "@/src/data/dummy";
import type { AppRepository } from "@/src/repository/appRepository";
import type { NotificationJob, Preferences } from "@/src/repository/models";
import {
	buildRenewalReminderTrigger,
	renewalInstant,
} from "@/src/utils/reminderSchedule";

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

function jobId(subscriptionId: string): string {
	return `${subscriptionId}:renewalReminder`;
}

function reminderStartMs(
	subscription: Subscription,
	preferences: Preferences | null,
): number | null {
	const trigger = buildRenewalReminderTrigger({
		subscription,
		preferences,
	});
	if (!trigger) return null;
	return trigger.getTime();
}

function reminderEndMs(
	subscription: Subscription,
	preferences: Preferences | null,
): number | null {
	const end = renewalInstant(subscription, preferences);
	if (!end) return null;
	return end.getTime();
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

function inAppNotificationId(subscription: Subscription): string {
	return `${subscription.id}:renewal:${subscription.nextPaymentDate}`;
}

function inAppNotificationIdFromParts(
	subscriptionId: string,
	renewalAt?: string,
): string {
	if (renewalAt?.trim()) return `${subscriptionId}:renewal:${renewalAt}`;
	return `${subscriptionId}:renewal:unknown`;
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
	type ScheduleContext = {
		notificationIds?: Set<string>;
		jobBySubscriptionId?: Map<string, NotificationJob | null>;
		preferences?: Preferences | null;
	};

	let bootstrapped = false;
	let canSchedule = false;
	let permissionPromptAttempted = false;
	let notificationsMod: typeof import("expo-notifications") | null = null;
	let listenersAttached = false;

	async function persistInAppFromNotificationPayload(payload: {
		subscriptionId: string;
		renewalAt?: string;
		title?: string | null;
		message?: string | null;
		firedAtIso?: string;
	}): Promise<void> {
		const subscriptionId = payload.subscriptionId.trim();
		if (!subscriptionId) return;

		const createdAt = payload.firedAtIso ?? nowIsoUtc();
		const id = inAppNotificationIdFromParts(
			subscriptionId,
			payload.renewalAt,
		);
		const title = payload.title?.trim() || "Upcoming renewal";
		const message =
			payload.message?.trim() ||
			(payload.renewalAt
				? `Renews on ${toIndianDateTime(payload.renewalAt)}`
				: "Your subscription is renewing soon.");

		try {
			await repository.upsertNotification({
				id,
				title,
				message,
				type: "billing",
				subscriptionId,
				createdAt,
				read: false,
			});
		} catch {
			// ignore
		}
	}

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

		if (!listenersAttached) {
			listenersAttached = true;
			try {
				(Notifications as any).addNotificationReceivedListener?.(
					async (event: any) => {
						const data = event?.request?.content?.data as
							| Record<string, unknown>
							| undefined;
						if (String(data?.type ?? "") !== "renewalReminder")
							return;
						const subscriptionId = String(
							data?.subscriptionId ?? "",
						);
						if (!subscriptionId) return;
						const renewalAt =
							typeof data?.renewalAt === "string"
								? data.renewalAt
								: undefined;
						const eventDate =
							typeof event?.date === "number"
								? new Date(event.date).toISOString()
								: nowIsoUtc();
						await persistInAppFromNotificationPayload({
							subscriptionId,
							renewalAt,
							title: event?.request?.content?.title,
							message: event?.request?.content?.body,
							firedAtIso: eventDate,
						});
					},
				);
			} catch {
				// ignore
			}
			try {
				(
					Notifications as any
				).addNotificationResponseReceivedListener?.(
					async (response: any) => {
						const notification = response?.notification;
						const data = notification?.request?.content?.data as
							| Record<string, unknown>
							| undefined;
						if (String(data?.type ?? "") !== "renewalReminder")
							return;
						const subscriptionId = String(
							data?.subscriptionId ?? "",
						);
						if (!subscriptionId) return;
						const renewalAt =
							typeof data?.renewalAt === "string"
								? data.renewalAt
								: undefined;
						const firedAtIso =
							typeof notification?.date === "number"
								? new Date(notification.date).toISOString()
								: nowIsoUtc();
						await persistInAppFromNotificationPayload({
							subscriptionId,
							renewalAt,
							title: notification?.request?.content?.title,
							message: notification?.request?.content?.body,
							firedAtIso,
						});
					},
				);
			} catch {
				// ignore
			}
		}

		try {
			let settings = await Notifications.getPermissionsAsync();
			if (settings.status !== "granted" && !permissionPromptAttempted) {
				permissionPromptAttempted = true;
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
			const status = String(settings.status ?? "");
			if (
				status !== "granted" &&
				(status === "undetermined" || !permissionPromptAttempted)
			) {
				permissionPromptAttempted = true;
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

		// Remove paired in-app reminder row for the cancelled schedule.
		// Only clear future billing reminders/snoozes so historical records are preserved.
		let all: Notification[] = [];
		try {
			all = await repository.loadNotifications({ includeFuture: true });
		} catch {
			all = [];
		}
		const nowMs = Date.now();
		for (const n of all) {
			if (n.subscriptionId !== job.subscriptionId) continue;
			if (n.type !== "billing") continue;
			const createdMs = Date.parse(n.createdAt);
			if (!Number.isFinite(createdMs) || createdMs <= nowMs) continue;
			try {
				await repository.deleteNotification(n.id);
			} catch {
				// ignore
			}
		}
	}

	async function getExistingJob(
		subscriptionId: string,
		ctx?: ScheduleContext,
	): Promise<NotificationJob | null> {
		const map = ctx?.jobBySubscriptionId;
		if (map) {
			if (map.has(subscriptionId)) return map.get(subscriptionId) ?? null;
			let fetched: NotificationJob | null = null;
			try {
				fetched = await repository.getNotificationJob(
					jobId(subscriptionId),
				);
			} catch {
				fetched = null;
			}
			map.set(subscriptionId, fetched);
			return fetched;
		}

		try {
			return await repository.getNotificationJob(jobId(subscriptionId));
		} catch {
			return null;
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

	async function hasAlreadyFiredForCycle(
		subscription: Subscription,
		ctx?: ScheduleContext,
	): Promise<boolean> {
		const expectedId = inAppNotificationId(subscription);
		if (ctx?.notificationIds) {
			return ctx.notificationIds.has(expectedId);
		}

		let all: Notification[] = [];
		try {
			all = await repository.loadNotifications();
		} catch {
			all = [];
		}

		for (const n of all) {
			if (n.id === expectedId) return true;
		}

		return false;
	}

	async function loadPreferencesSafe(): Promise<Preferences | null> {
		try {
			return await repository.loadPreferences();
		} catch {
			return null;
		}
	}

	async function scheduleRenewalReminder(
		subscription: Subscription,
		ctx?: ScheduleContext,
	) {
		const Notifications = await getExpoNotifications();
		if (!Notifications) return;

		const preferences =
			ctx?.preferences !== undefined
				? ctx.preferences
				: await loadPreferencesSafe();

		const enabled = subscription.reminderEnabled ?? true;
		if (
			!enabled ||
			subscription.status === "cancelled" ||
			subscription.status === "paused"
		) {
			const existing = await getExistingJob(subscription.id, ctx);
			if (existing) {
				await cancelJob(existing);
				ctx?.jobBySubscriptionId?.set(subscription.id, null);
			}
			return;
		}

		const nowMs = Date.now();
		const startMs = reminderStartMs(subscription, preferences);
		const endMs = reminderEndMs(subscription, preferences);
		if (startMs == null || endMs == null) {
			const existing = await getExistingJob(subscription.id, ctx);
			if (existing) {
				await cancelJob(existing);
				ctx?.jobBySubscriptionId?.set(subscription.id, null);
			}
			return;
		}

		if (nowMs > endMs) {
			const existing = await getExistingJob(subscription.id, ctx);
			if (existing) {
				await cancelJob(existing);
				ctx?.jobBySubscriptionId?.set(subscription.id, null);
			}
			return;
		}

		if (nowMs >= startMs && nowMs <= endMs) {
			const alreadyNotifiedInWindow = await hasAlreadyFiredForCycle(
				subscription,
				ctx,
			);
			if (alreadyNotifiedInWindow) {
				return;
			}

			const existing = await getExistingJob(subscription.id, ctx);
			if (existing) {
				const existingMs = Date.parse(existing.triggerAt);
				if (
					Number.isFinite(existingMs) &&
					existingMs >= startMs &&
					existingMs <= nowMs
				) {
					// Already fired (or attempted) in this cycle; do not schedule again.
					return;
				}
				if (Number.isFinite(existingMs) && existingMs > nowMs) {
					return;
				}
				await cancelJob(existing);
				ctx?.jobBySubscriptionId?.set(subscription.id, null);
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
				ctx?.jobBySubscriptionId?.set(subscription.id, {
					id: jobId(subscription.id),
					subscriptionId: subscription.id,
					type: "renewalReminder",
					triggerAt,
					expoNotificationId,
					createdAt: nowIsoUtc(),
				});
			} catch {
				// ignore
			}
			return;
		}

		let triggerDate = buildRenewalReminderTrigger({
			subscription,
			preferences,
		});
		if (!triggerDate) {
			const existing = await getExistingJob(subscription.id, ctx);
			if (existing) {
				await cancelJob(existing);
				ctx?.jobBySubscriptionId?.set(subscription.id, null);
			}
			return;
		}

		if (triggerDate.getTime() <= nowMs) {
			triggerDate = new Date(nowMs + 2 * 60 * 1000);
		}

		const triggerAt = triggerDate.toISOString();
		const existing = await getExistingJob(subscription.id, ctx);
		if (existing && existing.triggerAt === triggerAt) return;
		if (existing) {
			await cancelJob(existing);
			ctx?.jobBySubscriptionId?.set(subscription.id, null);
		}

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
			ctx?.jobBySubscriptionId?.set(subscription.id, job);
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
			const preferences = await loadPreferencesSafe();
			const ctx: ScheduleContext = {
				notificationIds: new Set<string>(),
				jobBySubscriptionId: new Map<string, NotificationJob | null>(),
				preferences,
			};
			try {
				const allNotifications = await repository.loadNotifications();
				for (const n of allNotifications)
					ctx.notificationIds?.add(n.id);
			} catch {
				// ignore
			}
			let allJobs: NotificationJob[] = [];
			try {
				allJobs = await repository.loadNotificationJobs();
				for (const job of allJobs) {
					ctx.jobBySubscriptionId?.set(job.subscriptionId, job);
				}
			} catch {
				allJobs = [];
			}
			// Reschedule all renewal reminders.
			for (const sub of subscriptions) {
				try {
					await scheduleRenewalReminder(sub, ctx);
				} catch {
					// ignore
				}
			}
			// Clean up jobs for subscriptions that no longer exist.
			const ids = new Set(subscriptions.map((s) => s.id));
			for (const job of allJobs) {
				if (!ids.has(job.subscriptionId)) {
					try {
						await cancelJob(job);
						ctx.jobBySubscriptionId?.set(job.subscriptionId, null);
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
