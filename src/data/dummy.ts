import type { OnboardingHighlightItem } from "@/src/components/onboarding/OnboardingHighlights";
import type { StepKey } from "@/src/components/onboarding/types";

export type NotificationType = "billing" | "trial" | "insight" | "info";

export type Notification = {
	id: string;
	title: string;
	message: string;
	type: NotificationType;
	subscriptionId?: string;
	createdAt: string;
	read: boolean;
};

export type HighlightItem = OnboardingHighlightItem;

export const OnboardingSteps = [
	"welcome",
	"profile",
	"notifications",
	"currency",
	"quickAdd",
	"firstSub",
	"success",
] as const;
export const highlightContent: Record<StepKey, HighlightItem[]> = {
	welcome: [
		{
			label: "Track renewals in one timeline",
			icon: "calendar-outline",
		},
		{
			label: "Get reminders before charges hit",
			icon: "notifications-outline",
		},
		{
			label: "See monthly and yearly spend instantly",
			icon: "bar-chart-outline",
		},
		{
			label: "Custom reminder timing",
			icon: "time-outline",
		},
		{
			label: "Never miss trial deadlines",
			icon: "hourglass-outline",
		},
		{
			label: "Yearly projection at a glance",
			icon: "pie-chart-outline",
		},
		{ label: "Spot subscriptions to trim", icon: "cut-outline" },
	],
	profile: [
		{
			label: "Personalized greeting on home",
			icon: "hand-left-outline",
		},
		{
			label: "Avatar for quick account identity",
			icon: "person-circle-outline",
		},
		{
			label: "Can be edited anytime in settings",
			icon: "settings-outline",
		},
	],
	notifications: [
		{
			label: "Renewal reminders before due date",
			icon: "calendar-clear-outline",
		},
		{ label: "Trial-end alerts", icon: "flask-outline" },
		{ label: "Enable/disable anytime", icon: "toggle-outline" },
	],
	currency: [
		{
			label: "Accurate totals in your preferred unit",
			icon: "cash-outline",
		},
		{
			label: "Consistent pricing across all screens",
			icon: "wallet-outline",
		},
		{ label: "Change anytime without data loss", icon: "sync-outline" },
	],
	quickAdd: [
		{
			label: "Fast start with popular services",
			icon: "flash-outline",
		},
		{ label: "Pre-filled category and cycle", icon: "apps-outline" },
		{ label: "Edit full details in next step", icon: "create-outline" },
	],
	firstSub: [
		{
			label: "Creates your first active record",
			icon: "add-circle-outline",
		},
		{
			label: "Auto-calculates next payment date",
			icon: "sparkles-outline",
		},
		{
			label: "Feeds dashboard insights instantly",
			icon: "speedometer-outline",
		},
	],
	success: [
		{ label: "Dashboard is ready", icon: "grid-outline" },
		{
			label: "Upcoming renewals already tracked",
			icon: "checkmark-done-outline",
		},
		{ label: "You can add more anytime", icon: "add-outline" },
	],
};

export const featureChips = [
	"Offline-first",
	"Private by default",
	"Smart reminders",
] as const;
export const WelcomeBenefitsList = [
	{
		icon: "notifications-outline" as const,
		label: "Renewal reminders",
		description:
			"Get notified before renewal so you can cancel or downgrade in time.",
	},
	{
		icon: "flask-outline" as const,
		label: "Trial tracking",
		description:
			"Avoid trials silently converting into paid subscriptions.",
	},
	{
		icon: "wallet-outline" as const,
		label: "Spending awareness",
		description:
			"See monthly/yearly projections and spot easy savings quickly.",
	},
] as const;

export const CurrencyOptions = [
	{ key: "INR", label: "₹", name: "INR" },
	{ key: "USD", label: "$", name: "USD" },
	{ key: "EUR", label: "€", name: "EUR" },
	{ key: "GBP", label: "£", name: "GBP" },
];
