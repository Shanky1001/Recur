import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
	Alert,
	Dimensions,
	Image,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PopoverSelect from "@/src/components/analytics/PopoverSelect";
import TimeField from "@/src/components/forms/TimeField";
import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";
import SubscriptionStatusPill from "@/src/components/subscriptions/SubscriptionStatusPill";
import Card from "@/src/components/ui/Card";
import { useTabBarContentPadding } from "@/src/hooks/useTabBarContentPadding";
import {
	useAppActions,
	usePreferences,
	useSubscriptions,
} from "@/src/state/appState";
import {
	billingCycleLabel,
	billingCycleShortSuffix,
	maxReminderDaysBefore,
} from "@/src/utils/billingCycle";
import {
	formatCurrency,
	formatDateLong,
	parseIsoLike,
} from "@/src/utils/helper";
import {
	formatReminderTimeDisplay,
	normalizeReminderDaysBefore,
} from "@/src/utils/reminderSchedule";
import { computeNextRenewalIso } from "@/src/utils/renewal";

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

function addBillingCycle(
	date: Date,
	cycle: Subscription["billingCycle"],
): Date {
	const d = new Date(date);
	if (cycle === "Yearly") {
		d.setFullYear(d.getFullYear() + 1);
		return d;
	}
	if (cycle === "Weekly") {
		d.setDate(d.getDate() + 7);
		return d;
	}
	d.setMonth(d.getMonth() + 1);
	return d;
}

function buildDeductions(
	subscription: Subscription,
): { amount: string; date: string }[] {
	const amountNumber =
		subscription.pricePerBillingCycle ?? subscription.pricePerMonth;
	const amount = formatCurrency(amountNumber, subscription.currencySymbol);
	const startedAt = subscription.startDate
		? parseIsoLike(subscription.startDate)
		: subscription.createdAt
			? parseIsoLike(subscription.createdAt)
			: null;
	if (!startedAt) return [];

	const cycle = subscription.billingCycle ?? "Monthly";
	const effectiveNextIso =
		computeNextRenewalIso(subscription) ?? subscription.nextPaymentDate;
	const next = parseIsoLike(effectiveNextIso);
	if (!next) return [];

	// First possible deduction happens after 1 full cycle since createdAt.
	const firstDeduction = addBillingCycle(startedAt, cycle);
	const now = new Date();

	// Start from the last payment date (one cycle before next).
	let cursor = subtractBillingCycle(next, cycle);
	const out: { amount: string; date: string }[] = [];
	let guard = 0;
	while (guard < 24) {
		guard++;
		if (cursor.getTime() < firstDeduction.getTime()) break;
		if (cursor.getTime() > now.getTime()) {
			cursor = subtractBillingCycle(cursor, cycle);
			continue;
		}
		out.push({ amount, date: formatDateLong(cursor.toISOString()) });
		if (out.length >= 6) break;
		cursor = subtractBillingCycle(cursor, cycle);
	}

	return out;
}

export default function SubscriptionDetailsScreen() {
	const insets = useSafeAreaInsets();
	const contentBottomPadding = useTabBarContentPadding(24);
	const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
	const subscriptions = useSubscriptions();
	const preferences = usePreferences();
	const { cancelSubscription, deleteSubscription, upsertSubscription } =
		useAppActions();
	const [saving, setSaving] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [menuAnchor, setMenuAnchor] = useState<{
		x: number;
		y: number;
		width: number;
		height: number;
	} | null>(null);
	const menuButtonRef = useRef<View>(null);
	const openMenu = () => {
		menuButtonRef.current?.measureInWindow((x, y, width, height) => {
			setMenuAnchor({ x, y, width, height });
			setMenuOpen(true);
		});
	};
	const closeMenu = () => setMenuOpen(false);

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

	const maxLeadDays = subscription
		? maxReminderDaysBefore(subscription.billingCycle)
		: 28;
	const reminderDaysBefore = subscription
		? normalizeReminderDaysBefore(
				subscription,
				subscription.reminderDaysBefore ??
					preferences.defaultReminderDaysBefore ??
					3,
			)
		: 3;
	const leadDayOptions = useMemo(() => {
		const candidates = [1, 2, 3, 5, 7, 14, 28].filter((d) => d <= maxLeadDays);
		if (!candidates.includes(reminderDaysBefore)) {
			candidates.push(reminderDaysBefore);
		}
		return [...new Set(candidates)]
			.sort((a, b) => a - b)
			.map((d) => ({
				key: String(d),
				label: d === 1 ? "1 day" : `${d} days`,
			}));
	}, [maxLeadDays, reminderDaysBefore]);

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
							className="text-foreground"
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
	const reminderTime =
		subscription.reminderTime ??
		preferences.defaultReminderTime ??
		"09:00";

	const persistReminder = async (
		partial: Partial<
			Pick<
				Subscription,
				"reminderEnabled" | "reminderDaysBefore" | "reminderTime"
			>
		>,
	) => {
		setSaving(true);
		try {
			await upsertSubscription({
				...subscription,
				reminderEnabled,
				reminderDaysBefore,
				reminderTime,
				...partial,
			});
		} finally {
			setSaving(false);
		}
	};

	const onToggleReminder = async (next: boolean) => {
		await persistReminder({ reminderEnabled: next });
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
							closeMenu();
							onBack();
						} finally {
							setSaving(false);
						}
					},
				},
			],
		);
	};

	const onDelete = () => {
		if (saving) return;
		Alert.alert(
			"Delete subscription",
			"This will permanently remove the subscription from this device.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						setSaving(true);
						try {
							await deleteSubscription(subscription.id);
							closeMenu();
							onBack();
						} finally {
							setSaving(false);
						}
					},
				},
			],
		);
	};

	const onChangePlan = () => {
		router.push({
			pathname: "/edit-subscription/[id]",
			params: { id: subscription.id },
		});
	};

	const cycleLabel = billingCycleLabel(subscription.billingCycle);
	const costPerCycle =
		subscription.pricePerBillingCycle ?? subscription.pricePerMonth;
	const costSuffix = billingCycleShortSuffix(subscription.billingCycle);

	return (
		<View className="flex-1 bg-gray-100" style={{ paddingTop: insets.top }}>
			<View className="flex-row items-center px-4 py-3">
				<Pressable
					onPress={onBack}
					hitSlop={10}
					className="size-11 items-center justify-center rounded-full border border-border bg-white"
				>
					<Ionicons
						name="chevron-back"
						size={22}
						className="text-foreground"
					/>
				</Pressable>
				<Text className="ml-4 flex-1 text-xl font-poppins-bold text-foreground">
					Subscription Details
				</Text>
				<Pressable
					ref={menuButtonRef}
					onPress={openMenu}
					hitSlop={10}
					className="size-11 items-center justify-center rounded-full border border-border bg-white"
				>
					<Ionicons
						name="ellipsis-vertical"
						size={20}
						className="text-foreground"
					/>
				</Pressable>
			</View>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingBottom: contentBottomPadding,
				}}
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
								{reminderEnabled
									? `${reminderDaysBefore} day${reminderDaysBefore === 1 ? "" : "s"} before ${cycleLabel.toLowerCase()} renewal at ${formatReminderTimeDisplay(reminderTime)}`
									: "Renewal reminders off"}
							</Text>
						</View>
						<Switch
							disabled={saving}
							value={reminderEnabled}
							onValueChange={onToggleReminder}
						/>
					</View>
					{reminderEnabled ? (
						<View className="mt-4 border-t border-border pt-4">
							<View className="flex-row items-center justify-between">
								<Text className="text-sm font-poppins-semibold text-foreground">
									Lead time
								</Text>
								<PopoverSelect
									value={String(reminderDaysBefore)}
									options={leadDayOptions}
									onChange={(next) => {
										void persistReminder({
											reminderDaysBefore: Number(next),
										});
									}}
								/>
							</View>
							<TimeField
								label="Notification time"
								subLabel="Local time on your device"
								value={reminderTime}
								onChange={(next) => {
									void persistReminder({ reminderTime: next });
								}}
							/>
						</View>
					) : null}
				</Card>

				<Section title="Plan Details">
					<Row label="Plan Name" value={subscription.planName} />
					<Row label="Features" value="—" />
					<Row label="Usage Limit" value="—" />
				</Section>

				<Section title="Billing Details">
					<Row label="Billing Cycle" value={cycleLabel} />
					<Row
						label="Cost per billing cycle"
						value={`${formatCurrency(costPerCycle, subscription.currencySymbol)}/${costSuffix}`}
					/>
					<Row
						label="Active Since"
						value={
							subscription.startDate
								? formatDateLong(subscription.startDate)
								: subscription.createdAt
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

			<Modal
				transparent
				visible={menuOpen}
				animationType="fade"
				onRequestClose={closeMenu}
			>
				<View style={{ flex: 1 }}>
					<Pressable
						style={StyleSheet.absoluteFill}
						onPress={closeMenu}
					/>
					{(() => {
						if (!menuAnchor) return null;
						const { width: screenWidth, height: screenHeight } =
							Dimensions.get("window");
						const popoverWidth = 220;
						const popoverHeight = 180;
						const margin = 8;
						const preferTop =
							menuAnchor.y +
								menuAnchor.height +
								margin +
								popoverHeight +
								16 >
							screenHeight;

						const top = preferTop
							? Math.max(
									margin + insets.top,
									menuAnchor.y - popoverHeight - margin,
								)
							: menuAnchor.y + menuAnchor.height + margin;

						const left = Math.min(
							screenWidth - popoverWidth - margin,
							Math.max(
								margin,
								menuAnchor.x + menuAnchor.width - popoverWidth,
							),
						);

						return (
							<View
								style={{
									position: "absolute",
									top,
									left,
									width: popoverWidth,
								}}
							>
								<View
									style={{
										borderRadius: 16,
										overflow: "hidden",
										shadowColor: "#000",
										shadowOpacity: 0.12,
										shadowRadius: 16,
										shadowOffset: { width: 0, height: 8 },
										elevation: 12,
									}}
									className="bg-white"
								>
									<Pressable
										onPress={() => {
											closeMenu();
											onChangePlan();
										}}
										disabled={saving}
										className="flex-row items-center px-4 py-4"
										style={({ pressed }) => ({
											opacity: pressed ? 0.75 : 1,
										})}
									>
										<Ionicons
											name="swap-horizontal"
											size={20}
											className="text-foreground"
										/>
										<Text className="ml-3 text-base font-poppins-semibold text-foreground">
											Change Plan
										</Text>
									</Pressable>

									<View style={styles.divider} />

									<Pressable
										onPress={() => {
											closeMenu();
											onCancel();
										}}
										disabled={
											saving ||
											subscription.status === "cancelled"
										}
										className="flex-row items-center px-4 py-4"
										style={({ pressed }) => ({
											opacity: pressed ? 0.75 : 1,
										})}
									>
										<Ionicons
											name="pause-circle"
											size={20}
											className="text-foreground"
										/>
										<Text className="ml-3 text-base font-poppins-semibold text-foreground">
											{subscription.status === "cancelled"
												? "Cancelled"
												: "Cancel"}
										</Text>
									</Pressable>

									<View style={styles.divider} />

									<Pressable
										onPress={() => {
											closeMenu();
											onDelete();
										}}
										disabled={saving}
										className="flex-row items-center px-4 py-4"
										style={({ pressed }) => ({
											opacity: pressed ? 0.75 : 1,
										})}
									>
										<Ionicons
											name="trash"
											size={20}
											color="#ef4444"
										/>
										<Text className="ml-3 text-base font-poppins-semibold text-red-500">
											Delete
										</Text>
									</Pressable>
								</View>
							</View>
						);
					})()}
				</View>
			</Modal>
		</View>
	);
}
