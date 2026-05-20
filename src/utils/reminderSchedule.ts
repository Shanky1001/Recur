import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";
import type { Preferences } from "@/src/repository/models";

import { maxReminderDaysBefore } from "./billingCycle";
import { parseIsoLike } from "./helper";

export const DEFAULT_REMINDER_TIME = "09:00";

const REMINDER_TIME_RE = /^(\d{1,2}):(\d{2})$/;

export function parseReminderTime(
	value?: string | null,
): { hours: number; minutes: number } | null {
	if (!value) return null;
	const m = String(value).trim().match(REMINDER_TIME_RE);
	if (!m) return null;
	const hours = Number(m[1]);
	const minutes = Number(m[2]);
	if (
		!Number.isFinite(hours) ||
		!Number.isFinite(minutes) ||
		hours < 0 ||
		hours > 23 ||
		minutes < 0 ||
		minutes > 59
	) {
		return null;
	}
	return { hours, minutes };
}

export function formatReminderTime(hours: number, minutes: number): string {
	return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatReminderTimeDisplay(value?: string | null): string {
	const parsed = parseReminderTime(value ?? DEFAULT_REMINDER_TIME);
	if (!parsed) return DEFAULT_REMINDER_TIME;
	const d = new Date();
	d.setHours(parsed.hours, parsed.minutes, 0, 0);
	return d.toLocaleTimeString(undefined, {
		hour: "numeric",
		minute: "2-digit",
	});
}

export function normalizeReminderTime(value?: string | null): string {
	return parseReminderTime(value)?.hours != null
		? formatReminderTime(
				parseReminderTime(value)!.hours,
				parseReminderTime(value)!.minutes,
			)
		: DEFAULT_REMINDER_TIME;
}

export function reminderTimeForSubscription(
	subscription: Subscription,
	preferences?: Pick<Preferences, "defaultReminderTime"> | null,
): string {
	return normalizeReminderTime(
		subscription.reminderTime ?? preferences?.defaultReminderTime,
	);
}

export function normalizeReminderDaysBefore(
	subscription: Subscription,
	raw?: number | null,
): number {
	const cycleMax = maxReminderDaysBefore(subscription.billingCycle);
	const fallback = 3;
	const value = raw ?? subscription.reminderDaysBefore ?? fallback;
	if (!Number.isFinite(value)) return Math.min(fallback, cycleMax);
	return Math.max(0, Math.min(cycleMax, Math.round(value)));
}

export function applyReminderTimeToDate(
	date: Date,
	timeHHmm: string,
): Date {
	const parsed = parseReminderTime(timeHHmm) ?? parseReminderTime(DEFAULT_REMINDER_TIME)!;
	const next = new Date(date);
	next.setHours(parsed.hours, parsed.minutes, 0, 0);
	return next;
}

export function subtractCalendarDays(date: Date, days: number): Date {
	return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}

export type ReminderScheduleInput = {
	subscription: Subscription;
	preferences?: Pick<
		Preferences,
		"defaultReminderTime" | "defaultReminderDaysBefore"
	> | null;
};

/**
 * When to fire the renewal reminder: (next payment − lead days) at the user's chosen clock time.
 */
export function buildRenewalReminderTrigger(
	input: ReminderScheduleInput,
): Date | null {
	const { subscription, preferences } = input;
	const enabled = subscription.reminderEnabled ?? true;
	if (!enabled) return null;
	if (subscription.status === "cancelled" || subscription.status === "paused") {
		return null;
	}

	const renewal = parseIsoLike(subscription.nextPaymentDate);
	if (!renewal) return null;

	const daysBefore = normalizeReminderDaysBefore(
		subscription,
		subscription.reminderDaysBefore ?? preferences?.defaultReminderDaysBefore,
	);
	const time = reminderTimeForSubscription(subscription, preferences);

	const dayAnchor = subtractCalendarDays(renewal, daysBefore);
	return applyReminderTimeToDate(dayAnchor, time);
}

export function renewalInstant(
	subscription: Subscription,
	preferences?: Pick<Preferences, "defaultReminderTime"> | null,
): Date | null {
	const renewal = parseIsoLike(subscription.nextPaymentDate);
	if (!renewal) return null;
	const time = reminderTimeForSubscription(subscription, preferences);
	return applyReminderTimeToDate(renewal, time);
}
