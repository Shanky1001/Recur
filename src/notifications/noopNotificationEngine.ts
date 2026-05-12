import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";
import type { AppRepository } from "@/src/repository/appRepository";

import type { NotificationEngine, SnoozeArgs, SnoozeResult } from "./types";

export function createNoopNotificationEngine(
	repository: AppRepository,
): NotificationEngine {
	return {
		bootstrap: async () => {
			await repository.init();
		},
		syncForSubscriptions: async (_subscriptions: Subscription[]) => {
			// no-op
		},
		onSubscriptionUpserted: async (_subscription) => {
			// no-op
		},
		onSubscriptionCancelled: async (_subscriptionId) => {
			// no-op
		},
		onSubscriptionDeleted: async (_subscriptionId) => {
			// no-op
		},
		snoozeNotification: async (
			_args: SnoozeArgs,
		): Promise<SnoozeResult> => {
			return null;
		},
		clearAllScheduled: async () => {
			// no-op
		},
	};
}
