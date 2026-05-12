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
