import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";
import type { Notification } from "@/src/data/dummy";

export type HydratedData = {
	subscriptions: Subscription[];
	notifications: Notification[];
};

export interface AppRepository {
	init: () => Promise<void>;
	seedIfEmpty: (
		seedSubscriptions: Subscription[],
		seedNotifications: Notification[],
	) => Promise<void>;

	loadSubscriptions: () => Promise<Subscription[]>;
	upsertSubscription: (subscription: Subscription) => Promise<void>;
	cancelSubscription: (id: string) => Promise<void>;

	loadNotifications: () => Promise<Notification[]>;
	upsertNotification: (notification: Notification) => Promise<void>;
	markNotificationRead: (id: string) => Promise<void>;
	deleteNotification: (id: string) => Promise<void>;
	clearNotifications: () => Promise<void>;
	markAllNotificationsRead: () => Promise<void>;

	resetLocalData: (
		seedSubscriptions: Subscription[],
		seedNotifications: Notification[],
	) => Promise<void>;
}
