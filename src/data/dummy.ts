import type { OnboardingHighlightItem } from "@/src/components/onboarding/OnboardingHighlights";
import type { StepKey } from "@/src/components/onboarding/types";

import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";

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

export type DummyData = {
	user: {
		name: string;
		avatarUri: string;
		notificationCount: number;
	};
	dashboard: {
		currencySymbol: string;
		totalMonthlySpend: number;
		activeSubscriptions: number;
		pendingThisWeek: number;
	};
	subscriptions: Subscription[];
	notifications: Notification[];
	preferences?: {
		currency: string;
		defaultReminderDaysBefore: number;
		defaultReminderEnabled: boolean;
		hasOnboarded?: boolean;
	};
};

export const seed: DummyData = {
	user: {
		name: "Shashank Rai",
		avatarUri: "https://i.pravatar.cc/150?img=12",
		notificationCount: 7,
	},
	dashboard: {
		currencySymbol: "₹",
		totalMonthlySpend: 1270,
		activeSubscriptions: 12,
		pendingThisWeek: 3,
	},
	subscriptions: [
		{
			id: "netflix",
			name: "Netflix",
			category: "Entertainment",
			status: "active",
			planName: "Premium",
			pricePerMonth: 649,
			currencySymbol: "₹",
			billingCycle: "Monthly",
			paymentMethod: "Visa •••• 1234",
			reminderEnabled: true,
			reminderDaysBefore: 3,
			createdAt: "2026-02-12T00:00:00.000Z",
			nextPaymentDate: "2026-06-12",
			logoUri: "https://cdn.simpleicons.org/netflix/E50914",
		},
		{
			id: "youtube",
			name: "YouTube",
			category: "Entertainment",
			status: "trial",
			planName: "Premium",
			pricePerMonth: 149,
			currencySymbol: "₹",
			billingCycle: "Monthly",
			paymentMethod: "UPI",
			reminderEnabled: true,
			reminderDaysBefore: 2,
			createdAt: "2026-05-04T00:00:00.000Z",
			nextPaymentDate: "2026-06-04",
			logoUri: "https://cdn.simpleicons.org/youtube/FF0000",
		},
		{
			id: "notion",
			name: "Notion",
			category: "Productivity",
			status: "active",
			planName: "Plus",
			pricePerMonth: 399,
			currencySymbol: "₹",
			billingCycle: "Monthly",
			paymentMethod: "Mastercard •••• 9876",
			reminderEnabled: false,
			reminderDaysBefore: 3,
			createdAt: "2025-11-20T00:00:00.000Z",
			nextPaymentDate: "2026-05-20",
			logoUri: "https://cdn.simpleicons.org/notion/000000",
		},
	],
	notifications: [
		{
			id: "n1",
			title: "Payment due tomorrow",
			message: "Netflix Premium will renew on 12 June.",
			type: "billing",
			subscriptionId: "netflix",
			createdAt: "2026-05-11T10:30:00.000Z",
			read: false,
		},
		{
			id: "n2",
			title: "Free trial ending",
			message: "Your YouTube Premium trial ends on 4 June.",
			type: "trial",
			subscriptionId: "youtube",
			createdAt: "2026-05-11T08:10:00.000Z",
			read: false,
		},
		{
			id: "n3",
			title: "New subscription added",
			message: "Notion Plus was added to your subscriptions.",
			type: "info",
			createdAt: "2026-05-10T14:05:00.000Z",
			read: true,
		},
		{
			id: "n4",
			title: "Spending insight",
			message: "Your monthly spend is up 12% vs last month.",
			type: "insight",
			createdAt: "2026-05-10T09:20:00.000Z",
			read: false,
		},
		{
			id: "n5",
			title: "Reminder set",
			message: "We'll remind you 2 days before each renewal.",
			type: "info",
			createdAt: "2026-05-09T18:45:00.000Z",
			read: true,
		},
	],
	preferences: {
		currency: "INR",
		defaultReminderDaysBefore: 3,
		defaultReminderEnabled: true,
		hasOnboarded: false,
	},
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
