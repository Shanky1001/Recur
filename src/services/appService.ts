import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";
import { seed, type Notification } from "@/src/data/dummy";
import type {
	AppRepository,
	HydratedData,
} from "@/src/repository/appRepository";
import { sqliteAppRepository } from "@/src/repository/sqliteAppRepository";

export type AppService = {
	hydrate: () => Promise<HydratedData>;
	resetLocalData: () => Promise<HydratedData>;

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

function addHours(iso: string, hours: number): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	date.setHours(date.getHours() + hours);
	return date.toISOString();
}

export function createAppService(
	repository: AppRepository = sqliteAppRepository,
): AppService {
	return {
		hydrate: async () => {
			await repository.init();
			await repository.seedIfEmpty(
				seed.subscriptions,
				seed.notifications,
			);
			const [subscriptions, notifications] = await Promise.all([
				repository.loadSubscriptions(),
				repository.loadNotifications(),
			]);
			return { subscriptions, notifications };
		},
		resetLocalData: async () => {
			await repository.resetLocalData(
				seed.subscriptions,
				seed.notifications,
			);
			const [subscriptions, notifications] = await Promise.all([
				repository.loadSubscriptions(),
				repository.loadNotifications(),
			]);
			return { subscriptions, notifications };
		},
		upsertSubscription: async (subscription: Subscription) => {
			const next: Subscription = {
				...subscription,
				createdAt: subscription.createdAt ?? nowIsoUtc(),
			};
			await repository.upsertSubscription(next);
			return next;
		},
		cancelSubscription: async (id: string) => {
			await repository.cancelSubscription(id);
		},
		deleteSubscription: async (id: string) => {
			await repository.deleteSubscription(id);
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
	};
}

export const appService = createAppService();
