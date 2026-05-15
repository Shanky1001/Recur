import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";
import type { Notification } from "@/src/data/dummy";
import type { AppRepository } from "@/src/repository/appRepository";
import type { NotificationJob } from "@/src/repository/models";

import {
	cancelSubscription,
	clearNotificationJobs,
	clearNotifications,
	clearPreferences,
	clearUserProfile,
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
	loadUserProfile,
	markAllNotificationsRead,
	markNotificationRead,
	resetLocalData,
	upsertNotification,
	upsertNotificationJob,
	upsertPreferences,
	upsertSubscription,
	upsertUserProfile,
} from "@/src/db/sqlite";

export const sqliteAppRepository: AppRepository = {
	init: async () => {
		await initSqlite();
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
	loadUserProfile: async () => {
		return await loadUserProfile();
	},
	upsertUserProfile: async (profile) => {
		await upsertUserProfile(profile);
	},
	clearUserProfile: async () => {
		await clearUserProfile();
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
	resetLocalData: async () => {
		await resetLocalData();
	},
};
