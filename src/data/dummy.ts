import dummyJson from "@/data/dummy.json";

import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";

export type NotificationType = "billing" | "trial" | "insight" | "info";

export type Notification = {
	id: string;
	title: string;
	message: string;
	type: NotificationType;
	subscriptionId?: string;
	createdAt: string;
	read: boolean;
};

export type DummyData = {
	user: {
		name: string;
		avatarUri: string;
		notificationCount: number;
	};
	dashboard: {
		currencySymbol: string;
		totalMonthlySpend: number;
		activeSubscriptions: number;
		pendingThisWeek: number;
	};
	subscriptions: Subscription[];
	notifications: Notification[];
	preferences?: {
		currency: string;
		defaultReminderDaysBefore: number;
		defaultReminderEnabled: boolean;
	};
};

export const seed = dummyJson as unknown as DummyData;
