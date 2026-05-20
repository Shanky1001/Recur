import type { BillingCycle } from "@/src/utils/billingCycle";
import { addBillingCycle } from "@/src/utils/billingCycle";

export function pad2(value: number): string {
	return String(value).padStart(2, "0");
}

export function formatCurrency(amount: number, currencySymbol: string): string {
	return `${currencySymbol} ${amount}`;
}

const MONTHS = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
] as const;

export function formatDateLong(isoDate: string): string {
	const date = new Date(isoDate);
	if (Number.isNaN(date.getTime())) return isoDate;

	const day = date.getDate();
	const month = MONTHS[date.getMonth()] ?? "";
	const year = date.getFullYear();
	return `${day} ${month}, ${year}`;
}

export function parseIsoLike(isoLike: string): Date | null {
	const d = new Date(isoLike);
	if (!Number.isNaN(d.getTime())) return d;

	// Support yyyy-mm-dd (treat as UTC midnight)
	if (/^\d{4}-\d{2}-\d{2}$/.test(isoLike)) {
		const d2 = new Date(`${isoLike}T00:00:00.000Z`);
		if (!Number.isNaN(d2.getTime())) return d2;
	}

	return null;
}

export function currencyToSymbol(currency: string): string {
	switch (currency) {
		case "USD":
			return "$";
		case "EUR":
			return "€";
		case "GBP":
			return "£";
		case "INR":
		default:
			return "₹";
	}
}

export function addDays(days: number): string {
	const date = new Date();
	date.setDate(date.getDate() + days);
	return date.toISOString().slice(0, 10);
}

/** Next renewal from today, advancing one billing period for the given cycle. */
export function nextPaymentByCycle(cycle: BillingCycle): string {
	return addBillingCycle(new Date(), cycle, 1).toISOString();
}

export function nextPaymentFromStartDate(
	startDate: string,
	cycle: BillingCycle | "Weekly",
	now: Date = new Date(),
): string | null {
	const start = parseIsoLike(startDate);
	if (!start) return null;

	let next = addBillingCycle(start, cycle, 1);
	while (next.getTime() <= now.getTime()) {
		next = addBillingCycle(next, cycle, 1);
	}

	return next.toISOString();
}

export function monthlyPrice(
	cycle: BillingCycle,
	pricePerCycle: number,
): number {
	if (cycle === "Yearly") return Math.round(pricePerCycle / 12);
	if (cycle === "HalfYearly") return Math.round(pricePerCycle / 6);
	if (cycle === "Quarterly") return Math.round(pricePerCycle / 3);
	if (cycle === "Weekly") return Math.round((pricePerCycle * 52) / 12);
	return Math.round(pricePerCycle);
}

export function annualPrice(
	cycle: BillingCycle,
	pricePerCycle: number,
): number {
	if (cycle === "Yearly") return Math.round(pricePerCycle);
	if (cycle === "HalfYearly") return Math.round(pricePerCycle * 2);
	if (cycle === "Quarterly") return Math.round(pricePerCycle * 4);
	if (cycle === "Weekly") return Math.round(pricePerCycle * 52);
	return Math.round(pricePerCycle * 12);
}

/** Normalized spend for analytics monthly vs yearly views. */
export function spendForPeriod(
	period: "Monthly" | "Yearly",
	cycle: BillingCycle,
	pricePerCycle: number,
): number {
	if (!Number.isFinite(pricePerCycle)) return 0;
	return period === "Monthly"
		? monthlyPrice(cycle, pricePerCycle)
		: annualPrice(cycle, pricePerCycle);
}

export function getPresetAvatarUrls(): string[] {
	return [8, 12, 15, 18, 24, 32].map(
		(n) => `https://i.pravatar.cc/150?img=${n}`,
	);
}
