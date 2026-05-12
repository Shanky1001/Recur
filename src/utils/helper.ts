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
