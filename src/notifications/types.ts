import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";
import type { Notification } from "@/src/data/dummy";

export type SnoozeArgs = {
	id: string;
	hours: number;
	notifications: Notification[];
};

export type SnoozeResult = { id: string; snoozed: Notification } | null;

export interface NotificationEngine {
	bootstrap: () => Promise<void>;
	syncForSubscriptions: (subscriptions: Subscription[]) => Promise<void>;
	onSubscriptionUpserted: (subscription: Subscription) => Promise<void>;
	onSubscriptionCancelled: (subscriptionId: string) => Promise<void>;
	onSubscriptionDeleted: (subscriptionId: string) => Promise<void>;

	// Notification actions
	snoozeNotification: (args: SnoozeArgs) => Promise<SnoozeResult>;
	clearAllScheduled: () => Promise<void>;
}
