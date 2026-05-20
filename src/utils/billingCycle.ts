import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";

export type BillingCycle =
	| "Weekly"
	| "Monthly"
	| "Quarterly"
	| "HalfYearly"
	| "Yearly";

export const BILLING_CYCLE_OPTIONS: BillingCycle[] = [
	"Weekly",
	"Monthly",
	"Quarterly",
	"HalfYearly",
	"Yearly",
];

export function billingCycleLabel(cycle?: Subscription["billingCycle"]): string {
	switch (cycle) {
		case "Weekly":
			return "Weekly";
		case "Quarterly":
			return "Quarterly";
		case "HalfYearly":
			return "Half-yearly";
		case "Yearly":
			return "Yearly";
		case "Monthly":
		default:
			return "Monthly";
	}
}

export function billingCycleShortSuffix(
	cycle?: Subscription["billingCycle"],
): string {
	switch (cycle) {
		case "Yearly":
			return "yr";
		case "Weekly":
			return "wk";
		case "Quarterly":
			return "qtr";
		case "HalfYearly":
			return "6mo";
		case "Monthly":
		default:
			return "mo";
	}
}

/** Upper bound for “days before renewal” so lead time never exceeds one billing period. */
export function maxReminderDaysBefore(
	cycle?: Subscription["billingCycle"],
): number {
	switch (cycle) {
		case "Weekly":
			return 6;
		case "Monthly":
			return 28;
		case "Quarterly":
			return 89;
		case "HalfYearly":
			return 180;
		case "Yearly":
			return 365;
		default:
			return 28;
	}
}

export function addBillingCycle(
	date: Date,
	cycle: Subscription["billingCycle"] | BillingCycle,
	dir: 1 | -1 = 1,
): Date {
	const d = new Date(date);
	const step = dir;
	const c = cycle ?? "Monthly";
	if (c === "Weekly") {
		d.setDate(d.getDate() + step * 7);
		return d;
	}
	if (c === "Quarterly") {
		d.setMonth(d.getMonth() + step * 3);
		return d;
	}
	if (c === "HalfYearly") {
		d.setMonth(d.getMonth() + step * 6);
		return d;
	}
	if (c === "Yearly") {
		d.setFullYear(d.getFullYear() + step);
		return d;
	}
	d.setMonth(d.getMonth() + step);
	return d;
}
