import type { BillingCycle } from "@/src/utils/billingCycle";
import { BILLING_CYCLE_OPTIONS } from "@/src/utils/billingCycle";

export const BILLING_CYCLES = BILLING_CYCLE_OPTIONS;
export type { BillingCycle };

export const PAYMENT_METHODS = [
	"PhonePe Autopay",
	"UPI Autopay",
	"Credit Card",
	"Debit Card",
	"Netbanking",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const CATEGORIES = [
	"Entertainment",
	"Productivity",
	"Finance",
	"Shopping",
	"Utilities",
	"Other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export type ServiceConfig = {
	name: string;
	logoUri?: string;
	plans: readonly string[];
	defaultCycle: BillingCycle; // catalog default; user can pick any cycle when adding
	defaultCost: number;
	defaultCategory: string;
	defaultStatus: "active" | "trial";
};

export const SERVICES = [
	{
		name: "Netflix",
		logoUri:
			"https://res.cloudinary.com/donrxmkyd/image/upload/v1778911975/netflix_txm2jd.png",
		plans: ["Mobile", "Basic", "Standard", "Premium"],
		defaultCycle: "Monthly",
		defaultCost: 649,
		defaultCategory: "Entertainment",
		defaultStatus: "active",
	},
	{
		name: "YouTube",
		logoUri:
			"https://res.cloudinary.com/donrxmkyd/image/upload/v1778912098/youtube_ade9or.png",
		plans: ["Individual", "Family", "Student"],
		defaultCycle: "Monthly",
		defaultCost: 149,
		defaultCategory: "Entertainment",
		defaultStatus: "active",
	},
	{
		name: "Notion",
		logoUri:
			"https://res.cloudinary.com/donrxmkyd/image/upload/v1778912439/notion_wgzdcr.png",
		plans: ["Free", "Plus", "Business"],
		defaultCycle: "Monthly",
		defaultCost: 399,
		defaultCategory: "Productivity",
		defaultStatus: "active",
	},
	{
		name: "Spotify",
		logoUri:
			"https://res.cloudinary.com/donrxmkyd/image/upload/v1778912439/spotify_mgr7eb.png",
		plans: ["Individual", "Duo", "Family", "Student"],
		defaultCycle: "Monthly",
		defaultCost: 119,
		defaultCategory: "Entertainment",
		defaultStatus: "active",
	},
	{
		name: "Prime Video",
		logoUri:
			"https://res.cloudinary.com/donrxmkyd/image/upload/v1778912439/primevideo_olngao.png",
		plans: ["Monthly", "Yearly"],
		defaultCycle: "Monthly",
		defaultCost: 299,
		defaultCategory: "Entertainment",
		defaultStatus: "active",
	},
	{
		name: "Disney+",
		logoUri:
			"https://res.cloudinary.com/donrxmkyd/image/upload/v1778912098/DisneyLogo_gtwqwd.png",
		plans: ["Mobile", "Super", "Premium"],
		defaultCycle: "Monthly",
		defaultCost: 299,
		defaultCategory: "Entertainment",
		defaultStatus: "active",
	},
	{
		name: "Others",
		logoUri: "Others",
		plans: ["Mobile", "others"],
		defaultCycle: "Monthly",
		defaultCost: 299,
		defaultCategory: "Entertainment",
		defaultStatus: "active",
	},
] as const satisfies readonly ServiceConfig[];

export type ServiceKey = (typeof SERVICES)[number]["name"];

// Prefer this in app code when you need regular array methods like `.includes()` on `plans`.
// It widens the literal tuple types into the friendly `ServiceConfig` shape.
export const SERVICES_LIST: readonly ServiceConfig[] = SERVICES;
