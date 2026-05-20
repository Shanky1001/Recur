import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
	Alert,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BottomSheetPicker, {
	type PickerItem,
} from "@/src/components/forms/BottomSheetPicker";
import DateField from "@/src/components/forms/DateField";
import SelectField from "@/src/components/forms/SelectField";
import type { SubscriptionStatus } from "@/src/components/subscriptions/SubscriptionCard";
import Card from "@/src/components/ui/Card";
import {
	BILLING_CYCLES,
	PAYMENT_METHODS,
	type BillingCycle,
	type PaymentMethod,
} from "@/src/constants/subscriptionsCatalog";
import { useAppActions, useSubscriptions } from "@/src/state/appState";
import { monthlyPrice } from "@/src/utils/helper";
import { addBillingCycle } from "@/src/utils/billingCycle";

export default function EditSubscriptionScreen() {
	const insets = useSafeAreaInsets();
	const { id } = useLocalSearchParams<{ id: string }>();
	const subscriptions = useSubscriptions();
	const { upsertSubscription } = useAppActions();

	const subscription = useMemo(
		() => subscriptions.find((s) => s.id === id),
		[subscriptions, id],
	);

	const [saving, setSaving] = useState(false);

	const [planName, setPlanName] = useState(subscription?.planName ?? "");
	const [billingCycle, setBillingCycle] = useState<BillingCycle>(
		(subscription?.billingCycle as BillingCycle) ?? "Monthly",
	);
	const [startDate, setStartDate] = useState(
		subscription?.startDate ??
			(subscription?.createdAt
				? String(subscription.createdAt)
				: new Date().toISOString()),
	);
	const [cost, setCost] = useState(
		String(
			subscription?.pricePerBillingCycle ??
				subscription?.pricePerMonth ??
				0,
		),
	);
	const [paymentMethod, setPaymentMethod] = useState<
		PaymentMethod | undefined
	>(subscription?.paymentMethod as any);
	const [status, setStatus] = useState<SubscriptionStatus>(
		subscription?.status ?? "active",
	);

	const [picker, setPicker] = useState<
		| {
				open: true;
				title: string;
				items: PickerItem<string>[];
				selected?: string;
				onSelect: (value: string) => void;
		  }
		| { open: false }
	>({ open: false });

	if (!subscription) {
		return (
			<View
				className="flex-1 bg-gray-100"
				style={{ paddingTop: insets.top }}
			>
				<View className="px-4 py-3">
					<Pressable onPress={() => router.back()} hitSlop={10}>
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

	const currencySymbol = subscription.currencySymbol;

	const onSave = async () => {
		if (saving) return;
		if (!planName.trim()) {
			Alert.alert("Plan name required", "Please enter a plan name.");
			return;
		}
		if (!cost.trim()) {
			Alert.alert("Invalid amount", "Please enter a valid amount.");
			return;
		}
		if (!startDate.trim()) return;

		const parsed = Number(cost);
		if (!Number.isFinite(parsed) || parsed < 0) {
			Alert.alert("Invalid amount", "Please enter a valid amount.");
			return;
		}

		setSaving(true);
		try {
			const pricePerBillingCycle = Math.round(parsed);
			await upsertSubscription({
				...subscription,
				status,
				planName: planName.trim(),
				billingCycle,
				startDate: startDate.trim(),
				pricePerBillingCycle,
				pricePerMonth: monthlyPrice(billingCycle, pricePerBillingCycle),
				paymentMethod,
			});
			router.back();
		} finally {
			setSaving(false);
		}
	};

	return (
		<View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
			<View className="flex-row items-center p-3 bg-white">
				<Pressable
					onPress={() => router.back()}
					hitSlop={10}
					className="size-11 items-center justify-center rounded-full border border-border bg-white"
				>
					<Ionicons
						name="chevron-back"
						size={22}
						className="text-foreground"
					/>
				</Pressable>
				<Text className="ml-4 text-xl font-poppins-bold text-foreground">
					Edit Subscription
				</Text>
			</View>

			<ScrollView
				showsVerticalScrollIndicator={false}
				className="bg-gray-100"
				contentContainerStyle={{ paddingBottom: 120 }}
			>
				<Card elevated={false} className="rounded-3xl  p-3 m-2">
					<View className="pb-4">
						<Text className="text-sm font-poppins-bold text-foreground">
							Subscription
						</Text>
						<View className="mt-2 rounded-2xl border border-border bg-white px-4 py-4">
							<Text className="text-base font-poppins-bold text-foreground">
								{subscription.name}
							</Text>
							<Text className="mt-1 text-xs font-poppins-medium text-foreground/60">
								{subscription.category}
							</Text>
						</View>
					</View>

					<View className="pb-4">
						<Text className="text-sm font-poppins-bold text-foreground">
							Plan name
						</Text>
						<View className="mt-2 rounded-2xl border border-border bg-white px-4 py-4">
							<TextInput
								value={planName}
								onChangeText={setPlanName}
								placeholder="e.g. Premium"
								placeholderTextColor="#94a3b8"
								className="text-base font-poppins-medium text-foreground"
							/>
						</View>
					</View>
				</Card>

				<Card elevated={false} className="rounded-3xl p-3 m-2">
					<SelectField
						label="Billing Cycle"
						value={billingCycle}
						onPress={() =>
							setPicker({
								open: true,
								title: "Billing Cycle",
								items: BILLING_CYCLES.map((c) => ({
									label: c,
									value: c,
								})),
								selected: billingCycle,
								onSelect: (v) =>
									setBillingCycle(v as BillingCycle),
							})
						}
					/>

					<DateField
						label="Start date & time"
						subLabel="When the subscription started (or will start)"
						value={startDate}
						onChange={setStartDate}
					/>

					<View className="pb-4">
						<Text className="text-sm font-poppins-bold text-foreground">
							Status
						</Text>
						<View className="mt-2 flex-row rounded-2xl border border-border bg-white p-1">
							<Pressable
								onPress={() => setStatus("active")}
								className={
									status === "active"
										? "flex-1 rounded-xl bg-blue-600 px-4 py-3"
										: "flex-1 rounded-xl px-4 py-3"
								}
							>
								<Text
									className={
										status === "active"
											? "text-center text-sm font-poppins-bold text-white"
											: "text-center text-sm font-poppins-semibold text-foreground"
									}
								>
									Active
								</Text>
							</Pressable>
							<Pressable
								onPress={() => setStatus("trial")}
								className={
									status === "trial"
										? "flex-1 rounded-xl bg-blue-600 px-4 py-3"
										: "flex-1 rounded-xl px-4 py-3"
								}
							>
								<Text
									className={
										status === "trial"
											? "text-center text-sm font-poppins-bold text-white"
											: "text-center text-sm font-poppins-semibold text-foreground"
									}
								>
									Trial
								</Text>
							</Pressable>
						</View>
					</View>

					<View className="pb-4">
						<Text className="text-sm font-poppins-bold text-foreground">
							Cost per billing cycle
						</Text>
						<View className="mt-2 flex-row items-center rounded-2xl border border-border bg-white px-4 py-4">
							<TextInput
								value={cost}
								onChangeText={setCost}
								keyboardType="numeric"
								placeholder="0"
								className="flex-1 text-base font-poppins-medium text-foreground"
							/>
							<Text className="text-base font-poppins-bold text-foreground/70">
								{currencySymbol}
							</Text>
						</View>
					</View>

					<SelectField
						label="Payment method (optional)"
						value={paymentMethod}
						placeholder="Select"
						onPress={() =>
							setPicker({
								open: true,
								title: "Payment method",
								items: PAYMENT_METHODS.map((p) => ({
									label: p,
									value: p,
								})),
								selected: paymentMethod,
								onSelect: (v) => setPaymentMethod(v as any),
							})
						}
					/>
				</Card>
			</ScrollView>

			<View
				className="absolute left-0 right-0 border-t border-border bg-white px-5"
				style={{
					paddingBottom: Math.max(insets.bottom, 16),
					bottom: 0,
				}}
			>
				<Pressable
					onPress={onSave}
					disabled={saving}
					className="my-4 items-center justify-center rounded-2xl bg-blue-600 py-4"
					style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
				>
					<Text className="text-base font-poppins-bold text-white">
						{saving ? "Saving…" : "Save changes"}
					</Text>
				</Pressable>
			</View>

			<BottomSheetPicker
				open={picker.open}
				title={picker.open ? picker.title : ""}
				items={picker.open ? picker.items : []}
				selected={picker.open ? picker.selected : undefined}
				onSelect={picker.open ? picker.onSelect : () => {}}
				onClose={() => setPicker({ open: false })}
			/>
		</View>
	);
}
