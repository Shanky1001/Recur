import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";
import type { Notification } from "@/src/data/dummy";
import type {
	NotificationJob,
	Preferences,
	ServiceCatalogItem,
	UserProfile,
} from "@/src/repository/models";

export type HydratedData = {
	user: UserProfile;
	subscriptions: Subscription[];
	notifications: Notification[];
	services: ServiceCatalogItem[];
	preferences: Preferences;
};

export interface AppRepository {
	init: () => Promise<void>;

	loadSubscriptions: () => Promise<Subscription[]>;
	upsertSubscription: (subscription: Subscription) => Promise<void>;
	cancelSubscription: (id: string) => Promise<void>;
	deleteSubscription: (id: string) => Promise<void>;

	loadNotifications: () => Promise<Notification[]>;
	upsertNotification: (notification: Notification) => Promise<void>;
	markNotificationRead: (id: string) => Promise<void>;
	deleteNotification: (id: string) => Promise<void>;
	clearNotifications: () => Promise<void>;
	markAllNotificationsRead: () => Promise<void>;

	loadUserProfile: () => Promise<UserProfile | null>;
	upsertUserProfile: (profile: UserProfile) => Promise<void>;
	clearUserProfile: () => Promise<void>;

	loadPreferences: () => Promise<Preferences | null>;
	upsertPreferences: (preferences: Preferences) => Promise<void>;
	clearPreferences: () => Promise<void>;

	// Scheduled notification job mapping (Notification Engine uses this)
	loadNotificationJobs: () => Promise<NotificationJob[]>;
	getNotificationJob: (id: string) => Promise<NotificationJob | null>;
	upsertNotificationJob: (job: NotificationJob) => Promise<void>;
	deleteNotificationJob: (id: string) => Promise<void>;
	deleteNotificationJobsBySubscriptionId: (
		subscriptionId: string,
	) => Promise<void>;
	clearNotificationJobs: () => Promise<void>;

	loadServices: () => Promise<ServiceCatalogItem[]>;
	upsertService: (service: ServiceCatalogItem) => Promise<void>;
	deleteService: (name: string) => Promise<void>;

	resetLocalData: () => Promise<void>;
}
