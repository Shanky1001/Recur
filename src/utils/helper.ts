import type { BillingCycle } from "@/src/constants/subscriptionsCatalog";

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

export function nextPaymentByCycle(cycle: BillingCycle): string {
	if (cycle === "Yearly") return addDays(365);
	return addDays(30);
}

export function monthlyPrice(
	cycle: BillingCycle,
	pricePerCycle: number,
): number {
	if (cycle === "Yearly") return Math.round(pricePerCycle / 12);
	return Math.round(pricePerCycle);
}

export function getPresetAvatarUrls(): string[] {
	return [8, 12, 15, 18, 24, 32].map(
		(n) => `https://i.pravatar.cc/150?img=${n}`,
	);
}
