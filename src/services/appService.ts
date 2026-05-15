import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";
import { seed, type Notification } from "@/src/data/dummy";
import type { NotificationEngine } from "@/src/notifications";
import { createNotificationEngine } from "@/src/notifications";
import type {
	AppRepository,
	HydratedData,
} from "@/src/repository/appRepository";
import type { Preferences } from "@/src/repository/models";
import { sqliteAppRepository } from "@/src/repository/sqliteAppRepository";

export type AppService = {
	hydrate: () => Promise<HydratedData>;
	resetLocalData: () => Promise<HydratedData>;
	resyncReminders: (subscriptions: Subscription[]) => Promise<void>;
	updatePreferences: (preferences: Preferences) => Promise<Preferences>;

	upsertSubscription: (subscription: Subscription) => Promise<Subscription>;
	cancelSubscription: (id: string) => Promise<void>;
	deleteSubscription: (id: string) => Promise<void>;

	clearAllNotifications: () => Promise<void>;
	markAllNotificationsRead: () => Promise<void>;
	deleteNotification: (id: string) => Promise<void>;
	markNotificationRead: (id: string) => Promise<void>;
	snoozeNotification: (args: {
		id: string;
		hours: number;
		notifications: Notification[];
	}) => Promise<{ id: string; snoozed: Notification } | null>;
};

function nowIsoUtc(): string {
	return new Date().toISOString();
}

function defaultPreferences(): Preferences {
	return {
		currency: seed.preferences?.currency ?? "INR",
		defaultReminderDaysBefore:
			seed.preferences?.defaultReminderDaysBefore ?? 3,
		defaultReminderEnabled:
			seed.preferences?.defaultReminderEnabled ?? true,
		updatedAt: nowIsoUtc(),
	};
}

export function createAppService(
	repository: AppRepository = sqliteAppRepository,
	notificationEngine: NotificationEngine = createNotificationEngine(
		repository,
		"expo",
	),
): AppService {
	return {
		hydrate: async () => {
			await repository.init();
			await repository.seedIfEmpty(
				seed.subscriptions,
				seed.notifications,
			);
			let preferences = await repository.loadPreferences();
			if (!preferences) {
				preferences = defaultPreferences();
				await repository.upsertPreferences(preferences);
			}
			const [subscriptions, notifications] = await Promise.all([
				repository.loadSubscriptions(),
				repository.loadNotifications(),
			]);
			try {
				await notificationEngine.bootstrap();
				await notificationEngine.syncForSubscriptions(subscriptions);
			} catch {
				// Notifications are best-effort; never block app startup.
			}
			return { subscriptions, notifications, preferences };
		},
		resetLocalData: async () => {
			try {
				await notificationEngine.bootstrap();
				await notificationEngine.clearAllScheduled();
			} catch {
				// ignore
			}
			await repository.resetLocalData(
				seed.subscriptions,
				seed.notifications,
			);
			await repository.clearPreferences();
			const preferences = defaultPreferences();
			await repository.upsertPreferences(preferences);
			const [subscriptions, notifications] = await Promise.all([
				repository.loadSubscriptions(),
				repository.loadNotifications(),
			]);
			try {
				await notificationEngine.syncForSubscriptions(subscriptions);
			} catch {
				// ignore
			}
			return { subscriptions, notifications, preferences };
		},
		resyncReminders: async (subscriptions: Subscription[]) => {
			try {
				await notificationEngine.bootstrap();
				await notificationEngine.syncForSubscriptions(subscriptions);
			} catch {
				// best-effort
			}
		},
		updatePreferences: async (preferences: Preferences) => {
			const next: Preferences = {
				...preferences,
				updatedAt: nowIsoUtc(),
			};
			await repository.upsertPreferences(next);
			return next;
		},
		upsertSubscription: async (subscription: Subscription) => {
			const prefs =
				(await repository.loadPreferences()) ?? defaultPreferences();
			const next: Subscription = {
				...subscription,
				createdAt: subscription.createdAt ?? nowIsoUtc(),
				reminderEnabled:
					subscription.reminderEnabled ??
					prefs.defaultReminderEnabled,
				reminderDaysBefore:
					subscription.reminderDaysBefore ??
					prefs.defaultReminderDaysBefore,
			};
			await repository.upsertSubscription(next);
			await notificationEngine.onSubscriptionUpserted(next);
			return next;
		},
		cancelSubscription: async (id: string) => {
			await repository.cancelSubscription(id);
			await notificationEngine.onSubscriptionCancelled(id);
		},
		deleteSubscription: async (id: string) => {
			await repository.deleteSubscription(id);
			await notificationEngine.onSubscriptionDeleted(id);
		},
		clearAllNotifications: async () => {
			await repository.clearNotifications();
		},
		markAllNotificationsRead: async () => {
			await repository.markAllNotificationsRead();
		},
		deleteNotification: async (id: string) => {
			await repository.deleteNotification(id);
		},
		markNotificationRead: async (id: string) => {
			await repository.markNotificationRead(id);
		},
		snoozeNotification: async ({ id, hours, notifications }) => {
			return await notificationEngine.snoozeNotification({
				id,
				hours,
				notifications,
			});
		},
	};
}

export const appService = createAppService();
