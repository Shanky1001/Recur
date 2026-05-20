import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";
import { SERVICES_LIST } from "@/src/constants/subscriptionsCatalog";
import type { Notification } from "@/src/data/dummy";
import type { NotificationEngine } from "@/src/notifications";
import { createNotificationEngine } from "@/src/notifications";
import type {
	AppRepository,
	HydratedData,
} from "@/src/repository/appRepository";
import type {
	Preferences,
	ServiceCatalogItem,
	UserProfile,
} from "@/src/repository/models";
import { sqliteAppRepository } from "@/src/repository/sqliteAppRepository";
import { nextPaymentFromStartDate } from "@/src/utils/helper";
import {
	DEFAULT_REMINDER_TIME,
	normalizeReminderDaysBefore,
	normalizeReminderTime,
} from "@/src/utils/reminderSchedule";

export type AppService = {
	hydrate: () => Promise<HydratedData>;
	resetLocalData: () => Promise<HydratedData>;
	resyncReminders: (subscriptions: Subscription[]) => Promise<Notification[]>;
	reloadNotifications: () => Promise<Notification[]>;
	updatePreferences: (preferences: Preferences) => Promise<Preferences>;
	updateUserProfile: (profile: UserProfile) => Promise<UserProfile>;
	upsertService: (service: ServiceCatalogItem) => Promise<ServiceCatalogItem>;
	deleteService: (name: string) => Promise<void>;

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
		currency: "INR",
		defaultReminderDaysBefore: 3,
		defaultReminderTime: DEFAULT_REMINDER_TIME,
		defaultReminderEnabled: true,
		themeMode: "system",
		hasOnboarded: false,
		updatedAt: nowIsoUtc(),
	};
}

function defaultUserProfile(): UserProfile {
	return {
		name: "User",
		avatarUri: "https://i.pravatar.cc/150?img=12",
		updatedAt: nowIsoUtc(),
	};
}

function defaultServices(): ServiceCatalogItem[] {
	return SERVICES_LIST.map((s) => ({
		name: s.name,
		logoUri: s.logoUri,
		plans: [...s.plans],
		defaultCycle: s.defaultCycle,
		defaultCost: s.defaultCost,
		defaultCategory: s.defaultCategory,
		defaultStatus: s.defaultStatus,
		createdAt: nowIsoUtc(),
		updatedAt: nowIsoUtc(),
	}));
}

async function ensureSeedServices(repository: AppRepository): Promise<void> {
	const current = await repository.loadServices();
	if (current.length > 0) return;
	for (const svc of defaultServices()) {
		await repository.upsertService(svc);
	}
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
			let user = await repository.loadUserProfile();
			if (!user || (!user.name && !user.avatarUri)) {
				user = defaultUserProfile();
				await repository.upsertUserProfile(user);
			}

			let preferences = await repository.loadPreferences();
			if (!preferences) {
				preferences = defaultPreferences();
				await repository.upsertPreferences(preferences);
			}
			await ensureSeedServices(repository);
			const subscriptions = await repository.loadSubscriptions();
			const services = await repository.loadServices();
			try {
				await notificationEngine.bootstrap();
				await notificationEngine.syncForSubscriptions(subscriptions);
			} catch {
				// Notifications are best-effort; never block app startup.
			}
			const notifications = await repository.loadNotifications();
			return {
				user,
				subscriptions,
				notifications,
				services,
				preferences,
			};
		},
		resetLocalData: async () => {
			try {
				await notificationEngine.bootstrap();
				await notificationEngine.clearAllScheduled();
			} catch {
				// ignore
			}
			await repository.resetLocalData();
			await repository.clearUserProfile();
			const user = defaultUserProfile();
			await repository.upsertUserProfile(user);
			await repository.clearPreferences();
			const preferences = defaultPreferences();
			await repository.upsertPreferences(preferences);
			await ensureSeedServices(repository);
			const subscriptions = await repository.loadSubscriptions();
			const services = await repository.loadServices();
			try {
				await notificationEngine.syncForSubscriptions(subscriptions);
			} catch {
				// ignore
			}
			const notifications = await repository.loadNotifications();
			return {
				user,
				subscriptions,
				notifications,
				services,
				preferences,
			};
		},
		resyncReminders: async (subscriptions: Subscription[]) => {
			try {
				await notificationEngine.bootstrap();
				await notificationEngine.syncForSubscriptions(subscriptions);
			} catch {
				// best-effort
			}
			return await repository.loadNotifications();
		},
		reloadNotifications: async () => {
			return await repository.loadNotifications();
		},
		updatePreferences: async (preferences: Preferences) => {
			const next: Preferences = {
				...preferences,
				defaultReminderTime: normalizeReminderTime(
					preferences.defaultReminderTime,
				),
				updatedAt: nowIsoUtc(),
			};
			await repository.upsertPreferences(next);
			try {
				const subscriptions = await repository.loadSubscriptions();
				await notificationEngine.bootstrap();
				await notificationEngine.syncForSubscriptions(subscriptions);
			} catch {
				// best-effort resync when reminder defaults change
			}
			return next;
		},
		updateUserProfile: async (profile: UserProfile) => {
			const next: UserProfile = {
				...profile,
				updatedAt: nowIsoUtc(),
			};
			await repository.upsertUserProfile(next);
			return next;
		},
		upsertService: async (service: ServiceCatalogItem) => {
			const next: ServiceCatalogItem = {
				...service,
				name: service.name.trim(),
				plans: (service.plans ?? [])
					.map((p) => String(p).trim())
					.filter(Boolean),
				defaultCategory: service.defaultCategory?.trim() || "Other",
				logoUri: service.logoUri?.trim() || undefined,
				updatedAt: nowIsoUtc(),
			};
			if (!next.createdAt) next.createdAt = next.updatedAt;
			if (!next.plans.length) next.plans = ["Standard"];
			if (!Number.isFinite(next.defaultCost) || next.defaultCost < 0) {
				next.defaultCost = 0;
			}
			await repository.upsertService(next);
			return next;
		},
		deleteService: async (name: string) => {
			await repository.deleteService(name);
		},
		upsertSubscription: async (subscription: Subscription) => {
			const prefs =
				(await repository.loadPreferences()) ?? defaultPreferences();
			const createdAt = subscription.createdAt ?? nowIsoUtc();
			const startDate =
				subscription.startDate ??
				(subscription.createdAt
					? String(subscription.createdAt).slice(0, 10)
					: undefined) ??
				createdAt.slice(0, 10);
			const computedNextPaymentDate =
				subscription.billingCycle && startDate
					? nextPaymentFromStartDate(
							startDate,
							subscription.billingCycle,
						)
					: null;
			const withDefaults: Subscription = {
				...subscription,
				createdAt,
				startDate,
				nextPaymentDate:
					computedNextPaymentDate ?? subscription.nextPaymentDate,
				reminderEnabled:
					subscription.reminderEnabled ??
					prefs.defaultReminderEnabled,
				reminderDaysBefore:
					subscription.reminderDaysBefore ??
					prefs.defaultReminderDaysBefore,
				reminderTime:
					subscription.reminderTime ??
					prefs.defaultReminderTime ??
					DEFAULT_REMINDER_TIME,
			};
			const next: Subscription = {
				...withDefaults,
				reminderTime: normalizeReminderTime(withDefaults.reminderTime),
				reminderDaysBefore: normalizeReminderDaysBefore(
					withDefaults,
					withDefaults.reminderDaysBefore,
				),
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
			try {
				await notificationEngine.bootstrap();
				await notificationEngine.clearAllScheduled();
			} catch {
				// best-effort
			}
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
