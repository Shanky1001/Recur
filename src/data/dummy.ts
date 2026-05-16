import { StepKey } from "@/app/onboarding";
import dummyJson from "@/data/dummy.json";

import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";
import Ionicons from "@expo/vector-icons/Ionicons";

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

export const seed = dummyJson as unknown as DummyData;

export type HighlightItem = {
	label: string;
	icon: React.ComponentProps<typeof Ionicons>["name"];
};

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
	],
	benefit1: [
		{ label: "Custom reminder timing", icon: "time-outline" },
		{ label: "Same-day renewal alert", icon: "alarm-outline" },
		{
			label: "Easy cancel before auto-charge",
			icon: "close-circle-outline",
		},
	],
	benefit2: [
		{ label: "Never miss trial deadlines", icon: "hourglass-outline" },
		{
			label: "Avoid accidental conversions",
			icon: "shield-checkmark-outline",
		},
		{
			label: "Stay aware of upcoming costs",
			icon: "trending-up-outline",
		},
	],
	benefit3: [
		{ label: "Monthly spend visibility", icon: "stats-chart-outline" },
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
