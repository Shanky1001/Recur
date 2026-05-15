export type NotificationJobType = "renewalReminder";

// Persisted mapping between our domain + the OS scheduled notification id.
// All timestamps are UTC ISO strings.
export type NotificationJob = {
	id: string; // stable id, e.g. `${subscriptionId}:renewalReminder`
	subscriptionId: string;
	type: NotificationJobType;
	triggerAt: string; // UTC ISO
	expoNotificationId: string; // id returned from scheduleNotificationAsync
	createdAt: string; // UTC ISO
};

export type Preferences = {
	currency: string; // e.g. INR, USD
	defaultReminderDaysBefore: number;
	defaultReminderEnabled: boolean;
	updatedAt?: string; // UTC ISO
};
