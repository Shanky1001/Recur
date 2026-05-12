import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";
import type { Notification } from "@/src/data/dummy";
import type { AppRepository } from "@/src/repository/appRepository";

import {
	cancelSubscription,
	clearNotifications,
	deleteNotification,
	initSqlite,
	loadNotifications,
	loadSubscriptions,
	markAllNotificationsRead,
	markNotificationRead,
	resetLocalData,
	seedIfEmpty,
	upsertNotification,
	upsertSubscription,
} from "@/src/db/sqlite";

export const sqliteAppRepository: AppRepository = {
	init: async () => {
		await initSqlite();
	},
	seedIfEmpty: async (
		seedSubscriptions: Subscription[],
		seedNotifications: Notification[],
	) => {
		await seedIfEmpty(seedSubscriptions, seedNotifications);
	},
	loadSubscriptions: async () => {
		return await loadSubscriptions();
	},
	upsertSubscription: async (subscription: Subscription) => {
		await upsertSubscription(subscription);
	},
	cancelSubscription: async (id: string) => {
		await cancelSubscription(id);
	},
	loadNotifications: async () => {
		return await loadNotifications();
	},
	upsertNotification: async (notification: Notification) => {
		await upsertNotification(notification);
	},
	markNotificationRead: async (id: string) => {
		await markNotificationRead(id);
	},
	deleteNotification: async (id: string) => {
		await deleteNotification(id);
	},
	clearNotifications: async () => {
		await clearNotifications();
	},
	markAllNotificationsRead: async () => {
		await markAllNotificationsRead();
	},
	resetLocalData: async (
		seedSubscriptions: Subscription[],
		seedNotifications: Notification[],
	) => {
		await resetLocalData(seedSubscriptions, seedNotifications);
	},
};
