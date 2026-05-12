import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
	Alert,
	Image,
	Pressable,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";
import SubscriptionStatusPill from "@/src/components/subscriptions/SubscriptionStatusPill";
import Card from "@/src/components/ui/Card";
import { useAppActions, useSubscriptions } from "@/src/state/appState";
import { formatCurrency, formatDateLong } from "@/src/utils/helper";

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<Card
			elevated={false}
			className="mx-4 mt-4 rounded-3xl border border-border bg-white p-4"
		>
			<View className="relative">
				<View className="absolute bottom-3 left-0 top-3 w-1 rounded-r bg-blue-600" />
				<Text className="pl-4 text-base font-poppins-bold text-foreground">
					{title}
				</Text>
				<View className="mt-4 pl-4">{children}</View>
			</View>
		</Card>
	);
}

function Row({ label, value }: { label: string; value: string }) {
	const dividerStyle = styles.divider;
	return (
		<View>
			<View className="flex-row items-center justify-between py-3">
				<Text className="text-sm font-poppins-medium text-foreground/60">
					{label}
				</Text>
				<Text className="max-w-[55%] text-right text-sm font-poppins-bold text-foreground">
					{value}
				</Text>
			</View>
			<View style={dividerStyle} />
		</View>
	);
}

const styles = StyleSheet.create({
	divider: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: "rgba(8, 17, 38, 0.12)",
	},
});

function parseIso(isoLike: string): Date | null {
	const d = new Date(isoLike);
	if (!Number.isNaN(d.getTime())) return d;

	if (/^\d{4}-\d{2}-\d{2}$/.test(isoLike)) {
		const d2 = new Date(`${isoLike}T00:00:00.000Z`);
		if (!Number.isNaN(d2.getTime())) return d2;
	}
	return null;
}

function subtractBillingCycle(
	date: Date,
	cycle: Subscription["billingCycle"],
): Date {
	const d = new Date(date);
	if (cycle === "Yearly") {
		d.setFullYear(d.getFullYear() - 1);
		return d;
	}
	if (cycle === "Weekly") {
		d.setDate(d.getDate() - 7);
		return d;
	}
	d.setMonth(d.getMonth() - 1);
	return d;
}

function buildDeductions(
	subscription: Subscription,
): { amount: string; date: string }[] {
	const amountNumber =
		subscription.pricePerBillingCycle ?? subscription.pricePerMonth;
	const amount = formatCurrency(amountNumber, subscription.currencySymbol);

	const next = parseIso(subscription.nextPaymentDate);
	if (!next) return [];

	const cycle = subscription.billingCycle ?? "Monthly";
	const one = subtractBillingCycle(next, cycle);
	const two = subtractBillingCycle(one, cycle);
	const three = subtractBillingCycle(two, cycle);

	return [one, two, three].map((dt) => ({
		amount,
		date: formatDateLong(dt.toISOString()),
	}));
}

export default function SubscriptionDetailsScreen() {
	const insets = useSafeAreaInsets();
	const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
	const subscriptions = useSubscriptions();
	const { cancelSubscription, upsertSubscription } = useAppActions();
	const [saving, setSaving] = useState(false);

	const onBack = () => {
		if (router.canGoBack()) {
			router.back();
			return;
		}
		if (from === "home") {
			router.replace("/(drawer)/(tabs)");
			return;
		}
		router.replace("/(drawer)/(tabs)/subscriptions");
	};

	const subscription = useMemo(
		() => subscriptions.find((s) => s.id === id),
		[subscriptions, id],
	);

	const deductions = useMemo(
		() => (subscription ? buildDeductions(subscription) : []),
		[subscription],
	);

	if (!subscription) {
		return (
			<View
				className="flex-1 bg-gray-100"
				style={{ paddingTop: insets.top }}
			>
				<View className="px-4 py-3">
					<Pressable onPress={onBack} hitSlop={10}>
						<Ionicons
							name="chevron-back"
							size={26}
							color="#081126"
						/>
					</Pressable>
					<Text className="mt-4 text-2xl font-poppins-bold text-foreground">
						Subscription not found
					</Text>
					<Text className="mt-2 text-sm font-poppins-medium text-foreground/60">
						It may have been removed.
					</Text>
				</View>
			</View>
		);
	}

	const reminderEnabled = subscription.reminderEnabled ?? true;
	const reminderDaysBefore = subscription.reminderDaysBefore ?? 3;

	const onToggleReminder = async (next: boolean) => {
		setSaving(true);
		try {
			await upsertSubscription({
				...subscription,
				reminderEnabled: next,
				reminderDaysBefore,
			});
		} finally {
			setSaving(false);
		}
	};

	const onCancel = () => {
		if (saving) return;
		Alert.alert(
			"Cancel subscription",
			"This will mark the subscription as cancelled.",
			[
				{ text: "Keep", style: "cancel" },
				{
					text: "Cancel",
					style: "destructive",
					onPress: async () => {
						setSaving(true);
						try {
							await cancelSubscription(subscription.id);
							router.back();
						} finally {
							setSaving(false);
						}
					},
				},
			],
		);
	};

	const onChangePlan = () => {
		Alert.alert("Change plan", "Plan editing UI isn’t implemented yet.");
	};

	const billingCycleLabel = subscription.billingCycle ?? "Monthly";
	const costPerCycle =
		subscription.pricePerBillingCycle ?? subscription.pricePerMonth;
	const costSuffix =
		subscription.billingCycle === "Yearly"
			? "yr"
			: subscription.billingCycle === "Weekly"
				? "wk"
				: "month";

	return (
		<View className="flex-1 bg-gray-100" style={{ paddingTop: insets.top }}>
			<View className="flex-row items-center px-4 py-3">
				<Pressable
					onPress={onBack}
					hitSlop={10}
					className="size-11 items-center justify-center rounded-full border border-border bg-white"
				>
					<Ionicons name="chevron-back" size={22} color="#081126" />
				</Pressable>
				<Text className="ml-4 text-xl font-poppins-bold text-foreground">
					Subscription Details
				</Text>
			</View>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 140 }}
			>
				<Card
					elevated={false}
					className="mx-4 mt-2 rounded-3xl border border-border bg-white p-4"
				>
					<View className="flex-row items-center justify-between">
						<View className="flex-row items-center">
							<View className="size-14 overflow-hidden rounded-2xl bg-slate-50">
								{subscription.logoUri ? (
									<Image
										source={{ uri: subscription.logoUri }}
										className="size-14"
										resizeMode="contain"
									/>
								) : (
									<View className="size-14 items-center justify-center rounded-2xl bg-foreground">
										<Text className="text-xl font-poppins-bold text-white">
											{subscription.name
												.slice(0, 1)
												.toUpperCase()}
										</Text>
									</View>
								)}
							</View>
							<View className="ml-4">
								<Text className="text-xl font-poppins-bold text-foreground">
									{subscription.name}
								</Text>
								<Text className="mt-1 text-sm font-poppins-medium text-foreground/60">
									{subscription.category}
								</Text>
							</View>
						</View>
						<SubscriptionStatusPill status={subscription.status} />
					</View>
				</Card>

				<Card
					elevated={false}
					className="mx-4 mt-4 rounded-3xl border border-border bg-white p-4"
				>
					<View className="flex-row items-center justify-between">
						<View className="flex-1 pr-4">
							<Text className="text-sm font-poppins-bold text-foreground">
								Reminder
							</Text>
							<Text className="mt-1 text-xs font-poppins-medium text-foreground/60">
								Get notified {reminderDaysBefore} days before
								renewal
							</Text>
						</View>
						<Switch
							disabled={saving}
							value={reminderEnabled}
							onValueChange={onToggleReminder}
						/>
					</View>
				</Card>

				<Section title="Plan Details">
					<Row label="Plan Name" value={subscription.planName} />
					<Row label="Features" value="—" />
					<Row label="Usage Limit" value="—" />
				</Section>

				<Section title="Billing Details">
					<Row label="Billing Cycle" value={billingCycleLabel} />
					<Row
						label="Cost per billing cycle"
						value={`${formatCurrency(costPerCycle, subscription.currencySymbol)}/${costSuffix}`}
					/>
					<Row
						label="Active Since"
						value={
							subscription.createdAt
								? formatDateLong(subscription.createdAt)
								: "—"
						}
					/>
				</Section>

				<Section title="Deductions">
					{deductions.length === 0 ? (
						<Text className="py-2 text-sm font-poppins-medium text-foreground/60">
							No deductions yet.
						</Text>
					) : (
						deductions.map((d, idx) => (
							<View key={`${d.date}-${idx}`}>
								<View className="flex-row items-center justify-between py-3">
									<Text className="text-sm font-poppins-bold text-foreground">
										{d.amount}
									</Text>
									<Text className="text-xs font-poppins-medium text-foreground/60">
										{d.date}
									</Text>
								</View>
								<View style={styles.divider} />
							</View>
						))
					)}
				</Section>
			</ScrollView>

			<View
				className="absolute left-0 right-0 border-t border-border bg-gray-100 px-4"
				style={{
					paddingBottom: Math.max(insets.bottom, 16),
					bottom: 0,
				}}
			>
				<View className="flex-row gap-3 py-4">
					<Pressable
						onPress={onCancel}
						disabled={saving || subscription.status === "cancelled"}
						className="flex-1 items-center justify-center rounded-2xl border border-red-400 bg-white py-4"
						style={({ pressed }) => ({
							opacity: pressed ? 0.9 : 1,
						})}
					>
						<Text className="text-base font-poppins-bold text-red-500">
							{subscription.status === "cancelled"
								? "Cancelled"
								: "Cancel"}
						</Text>
					</Pressable>
					<Pressable
						onPress={onChangePlan}
						disabled={saving}
						className="flex-1 items-center justify-center rounded-2xl bg-blue-600 py-4"
						style={({ pressed }) => ({
							opacity: pressed ? 0.9 : 1,
						})}
					>
						<Text className="text-base font-poppins-bold text-white">
							Change Plan
						</Text>
					</Pressable>
				</View>
			</View>
		</View>
	);
}
