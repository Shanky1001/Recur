import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useMemo, useState } from "react";
import {
	Alert,
	Image,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	Switch,
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
	CATEGORIES,
	PAYMENT_METHODS,
	SERVICES_LIST,
	type BillingCycle,
	type Category,
	type PaymentMethod,
	type ServiceKey,
} from "@/src/constants/subscriptionsCatalog";
import {
	useAppActions,
	useDashboard,
	usePreferences,
	useSubscriptions,
} from "@/src/state/appState";
import { router } from "expo-router";

function addBillingCycle(date: Date, cycle: BillingCycle): Date {
	const d = new Date(date);
	if (cycle === "Yearly") {
		d.setFullYear(d.getFullYear() + 1);
		return d;
	}
	d.setMonth(d.getMonth() + 1);
	return d;
}

export default function AddSubscriptionScreen() {
	const insets = useSafeAreaInsets();
	const dashboard = useDashboard();
	const preferences = usePreferences();
	const subscriptions = useSubscriptions();
	const { addSubscription } = useAppActions();

	const [service, setService] = useState<ServiceKey>("Netflix");
	const serviceConfig = useMemo(
		() =>
			SERVICES_LIST.find((s) => s.name === service) ?? SERVICES_LIST[0]!,
		[service],
	);

	const [plan, setPlan] = useState<string>(serviceConfig.plans[0]!);
	const [billingCycle, setBillingCycle] = useState<BillingCycle>(
		serviceConfig.defaultCycle,
	);
	const [startDate, setStartDate] = useState(new Date().toISOString());
	const [cost, setCost] = useState(String(serviceConfig.defaultCost));
	const [paymentMethod, setPaymentMethod] = useState<
		PaymentMethod | undefined
	>(PAYMENT_METHODS[0]);
	const [reminderEnabled, setReminderEnabled] = useState(
		Boolean(preferences.defaultReminderEnabled ?? true),
	);
	const [category, setCategory] = useState<Category>(
		serviceConfig.defaultCategory ?? "Other",
	);
	const [status, setStatus] = useState<SubscriptionStatus>(
		serviceConfig.defaultStatus,
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

	// keep plan valid when service changes
	React.useEffect(() => {
		setPlan((prev) =>
			serviceConfig.plans.includes(prev) ? prev : serviceConfig.plans[0]!,
		);
		setBillingCycle(serviceConfig.defaultCycle);
		setCost(String(serviceConfig.defaultCost));
		setCategory(serviceConfig.defaultCategory ?? "Other");
		setStatus(serviceConfig.defaultStatus);
	}, [serviceConfig]);

	const saveSubscription = async () => {
		if (!startDate.trim()) return;
		if (!cost.trim()) return;
		const parsedCost = Number(cost);
		if (
			!service ||
			!plan ||
			!Number.isFinite(parsedCost) ||
			parsedCost < 0
		) {
			return;
		}

		const idBase = service.toLowerCase().replace(/\s+/g, "-");
		const id = `${idBase}-${Date.now().toString(36)}`;

		const nextPaymentDate = addBillingCycle(
			new Date(startDate),
			billingCycle,
		).toISOString();
		const pricePerBillingCycle = Math.round(parsedCost);
		const pricePerMonth =
			billingCycle === "Yearly"
				? Math.round(parsedCost / 12)
				: pricePerBillingCycle;

		await addSubscription({
			id,
			name: service,
			category,
			status,
			planName: plan,
			currencySymbol: dashboard.currencySymbol,
			billingCycle,
			pricePerBillingCycle,
			pricePerMonth,
			paymentMethod,
			reminderEnabled,
			reminderDaysBefore: preferences.defaultReminderDaysBefore ?? 3,
			startDate: startDate.trim(),
			nextPaymentDate,
			logoUri: serviceConfig.logoUri,
		});

		router.back();
	};

	const onSave = () => {
		const normalizedService = service.trim().toLowerCase();
		const duplicateCount = subscriptions.filter(
			(s) => s.name.trim().toLowerCase() === normalizedService,
		).length;

		if (duplicateCount > 0) {
			Alert.alert(
				"Subscription already exists",
				`You already have ${duplicateCount} ${service} subscription${
					duplicateCount > 1 ? "s" : ""
				}. Do you still want to create another one?`,
				[
					{ text: "Cancel", style: "cancel" },
					{
						text: "Create",
						style: "default",
						onPress: saveSubscription,
					},
				],
			);
			return;
		}

		saveSubscription();
	};

	return (
		<View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
			<View className="flex-row items-center p-3 bg-white">
				<Pressable
					onPress={() => router.back()}
					hitSlop={10}
					className="size-11 items-center justify-center rounded-full border border-border bg-white"
				>
					<Ionicons name="chevron-back" size={22} color="#081126" />
				</Pressable>
				<Text className="ml-4 text-xl font-poppins-bold text-foreground">
					Add Subscription
				</Text>
			</View>

			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				className="flex-1"
			>
				<ScrollView
					showsVerticalScrollIndicator={false}
					className="bg-gray-100"
					contentContainerStyle={{ paddingBottom: 120 }}
				>
					<Card
						elevated={false}
						className="rounded-3xl bg-slate-50 p-3 m-2"
					>
						<SelectField
							label="Service Name"
							value={service}
							left={
								serviceConfig.logoUri ? (
									<Image
										source={{
											uri: serviceConfig.logoUri,
										}}
										className="w-5 h-5"
										resizeMode="contain"
									/>
								) : null
							}
							onPress={() =>
								setPicker({
									open: true,
									title: "Service Name",
									items: SERVICES_LIST.map((s) => ({
										label: s.name,
										value: s.name,
										left: s.logoUri ? (
											<Image
												source={{ uri: s.logoUri }}
												style={{
													width: 20,
													height: 20,
												}}
												resizeMode="contain"
											/>
										) : null,
									})),
									selected: service,
									onSelect: (v) =>
										setService(v as ServiceKey),
								})
							}
						/>

						<SelectField
							label="Plan Name"
							value={plan}
							onPress={() =>
								setPicker({
									open: true,
									title: "Plan Name",
									items: serviceConfig.plans.map((p) => ({
										label: p,
										value: p,
									})),
									selected: plan,
									onSelect: (v) => setPlan(v),
								})
							}
						/>
					</Card>

					<Card
						elevated={false}
						className="rounded-3xl bg-slate-50 p-3 m-2"
					>
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
									{dashboard.currencySymbol}
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
									onSelect: (v) =>
										setPaymentMethod(v as PaymentMethod),
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

						<View className="flex-row items-center justify-between rounded-2xl border border-border bg-white px-4 py-4">
							<View className="flex-1 pr-4">
								<Text className="text-sm font-poppins-bold text-foreground">
									Reminder
								</Text>
								<Text className="mt-1 text-xs font-poppins-medium text-foreground/60">
									Get notified 3 days before renewal
								</Text>
							</View>
							<Switch
								value={reminderEnabled}
								onValueChange={setReminderEnabled}
							/>
						</View>
					</Card>

					<Card
						elevated={false}
						className="rounded-3xl bg-slate-50 p-3 m-2"
					>
						<SelectField
							label="Subscription Category (optional)"
							value={category}
							onPress={() =>
								setPicker({
									open: true,
									title: "Category",
									items: CATEGORIES.map((c) => ({
										label: c,
										value: c,
									})),
									selected: category,
									onSelect: (v) => setCategory(v as Category),
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
						className="my-4 items-center justify-center rounded-2xl bg-blue-600 py-4"
						style={({ pressed }) => ({
							opacity: pressed ? 0.9 : 1,
						})}
					>
						<Text className="text-base font-poppins-bold text-white">
							Save Subscription
						</Text>
					</Pressable>
				</View>
			</KeyboardAvoidingView>

			<BottomSheetPicker
				open={picker.open}
				title={picker.open ? picker.title : ""}
				items={picker.open ? picker.items : []}
				selected={picker.open ? picker.selected : undefined}
				onSelect={(v) => picker.open && picker.onSelect(v)}
				onClose={() => setPicker({ open: false })}
			/>
		</View>
	);
}
