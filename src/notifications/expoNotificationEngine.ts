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

function toLocal9am(date: Date): Date {
	const d = new Date(date);
	d.setHours(9, 0, 0, 0);
	return d;
}

function subtractDays(date: Date, days: number): Date {
	const d = new Date(date);
	d.setDate(d.getDate() - days);
	return d;
}

function buildRenewalTrigger(subscription: Subscription): Date | null {
	const next = parseIsoLike(subscription.nextPaymentDate);
	if (!next) return null;
	const daysBefore = subscription.reminderDaysBefore ?? 3;
	const enabled = subscription.reminderEnabled ?? true;
	if (!enabled) return null;
	if (subscription.status === "cancelled") return null;

	const triggerBase = subtractDays(next, daysBefore);
	const trigger = toLocal9am(triggerBase);
	if (Number.isNaN(trigger.getTime())) return null;
	return trigger;
}

function jobId(subscriptionId: string): string {
	return `${subscriptionId}:renewalReminder`;
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
			const settings = await Notifications.getPermissionsAsync();
			canSchedule = settings.status === "granted";
		} catch {
			// ignore: permissions flow can fail on simulators/emulators
			canSchedule = false;
		}

		if (Platform.OS === "android") {
			try {
				await Notifications.setNotificationChannelAsync("default", {
					name: "Default",
					importance: Notifications.AndroidImportance.DEFAULT,
				});
			} catch {
				// ignore
			}
		}

		bootstrapped = true;
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

	async function scheduleRenewalReminder(subscription: Subscription) {
		const Notifications = await getExpoNotifications();
		if (!Notifications) return;

		const triggerDate = buildRenewalTrigger(subscription);
		if (!triggerDate) {
			const existing = await repository.getNotificationJob(
				jobId(subscription.id),
			);
			if (existing) await cancelJob(existing);
			return;
		}

		// Don't schedule past reminders.
		if (triggerDate.getTime() <= Date.now()) {
			const existing = await repository.getNotificationJob(
				jobId(subscription.id),
			);
			if (existing) await cancelJob(existing);
			return;
		}

		const triggerAt = triggerDate.toISOString();
		const existing = await repository.getNotificationJob(
			jobId(subscription.id),
		);
		if (existing && existing.triggerAt === triggerAt) return;
		if (existing) await cancelJob(existing);

		if (!canSchedule) {
			// Permissions not granted; don't attempt to schedule.
			return;
		}

		let expoNotificationId: string;
		try {
			expoNotificationId = await Notifications.scheduleNotificationAsync({
				content: {
					title: `Upcoming renewal: ${subscription.name}`,
					body: `Renews on ${subscription.nextPaymentDate}`,
					data: {
						type: "renewalReminder",
						subscriptionId: subscription.id,
					},
				},
				trigger: triggerDate,
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
