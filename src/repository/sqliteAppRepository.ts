import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";
import type { Notification } from "@/src/data/dummy";
import type { AppRepository } from "@/src/repository/appRepository";
import type { NotificationJob } from "@/src/repository/models";

import {
	cancelSubscription,
	clearNotificationJobs,
	clearNotifications,
	clearPreferences,
	deleteNotification,
	deleteNotificationJob,
	deleteNotificationJobsBySubscriptionId,
	deleteSubscription,
	getNotificationJob,
	initSqlite,
	loadNotificationJobs,
	loadNotifications,
	loadPreferences,
	loadSubscriptions,
	markAllNotificationsRead,
	markNotificationRead,
	resetLocalData,
	seedIfEmpty,
	upsertNotification,
	upsertNotificationJob,
	upsertPreferences,
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
	deleteSubscription: async (id: string) => {
		await deleteSubscription(id);
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
	loadPreferences: async () => {
		return await loadPreferences();
	},
	upsertPreferences: async (preferences) => {
		await upsertPreferences(preferences);
	},
	clearPreferences: async () => {
		await clearPreferences();
	},
	loadNotificationJobs: async () => {
		return await loadNotificationJobs();
	},
	getNotificationJob: async (id: string) => {
		return await getNotificationJob(id);
	},
	upsertNotificationJob: async (job: NotificationJob) => {
		await upsertNotificationJob(job);
	},
	deleteNotificationJob: async (id: string) => {
		await deleteNotificationJob(id);
	},
	deleteNotificationJobsBySubscriptionId: async (subscriptionId: string) => {
		await deleteNotificationJobsBySubscriptionId(subscriptionId);
	},
	clearNotificationJobs: async () => {
		await clearNotificationJobs();
	},
	resetLocalData: async (
		seedSubscriptions: Subscription[],
		seedNotifications: Notification[],
	) => {
		await resetLocalData(seedSubscriptions, seedNotifications);
	},
};
