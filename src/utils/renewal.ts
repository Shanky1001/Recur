import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";
import { addBillingCycle } from "@/src/utils/billingCycle";
import { parseIsoLike } from "@/src/utils/helper";

function maxWindowDays(cycle: Subscription["billingCycle"]): number {
	const c = cycle ?? "Monthly";
	if (c === "Weekly") return 14;
	if (c === "Quarterly") return 120;
	if (c === "HalfYearly") return 220;
	if (c === "Yearly") return 400;
	return 62;
}

// Normalizes subscription.nextPaymentDate to the nearest upcoming renewal based on billingCycle.
// Useful when seed/data contains a far-future date for a monthly/weekly plan.
// Returns a UTC ISO string.
export function computeNextRenewalIso(
	subscription: Subscription,
	now: Date = new Date(),
): string | null {
	const parsed = parseIsoLike(subscription.nextPaymentDate);
	if (!parsed) return null;

	const cycle = subscription.billingCycle ?? "Monthly";
	const windowMs = maxWindowDays(cycle) * 24 * 60 * 60 * 1000;

	let target = new Date(parsed);
	// If it's in the past, roll forward.
	let guard = 0;
	while (target.getTime() < now.getTime() && guard < 400) {
		target = addBillingCycle(target, cycle, 1);
		guard++;
	}

	// If it's too far in the future for the cycle, pull it back by whole cycles.
	guard = 0;
	while (target.getTime() - now.getTime() > windowMs && guard < 400) {
		target = addBillingCycle(target, cycle, -1);
		guard++;
		// Ensure we don't end up in the past.
		if (target.getTime() < now.getTime()) {
			target = addBillingCycle(target, cycle, 1);
			break;
		}
	}

	return target.toISOString();
}
