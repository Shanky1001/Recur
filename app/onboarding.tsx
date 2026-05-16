import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
	Alert,
	Image,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
	PrimaryButton,
	SecondaryButton,
} from "@/src/components/onboarding/OnboardingButtons";
import OnboardingInfoCard from "@/src/components/onboarding/OnboardingInfoCard";
import OnboardingStepHeader from "@/src/components/onboarding/OnboardingStepHeader";
import Card from "@/src/components/ui/Card";
import {
	SERVICES_LIST,
	type BillingCycle,
} from "@/src/constants/subscriptionsCatalog";
import { highlightContent, HighlightItem } from "@/src/data/dummy";
import { useAppActions, usePreferences, useUser } from "@/src/state/appState";

export type StepKey =
	| "welcome"
	| "benefit1"
	| "benefit2"
	| "benefit3"
	| "profile"
	| "notifications"
	| "currency"
	| "quickAdd"
	| "firstSub"
	| "success";

type CurrencyKey = "INR" | "USD" | "EUR" | "GBP";

const names = ["Netflix", "Spotify", "YouTube", "Notion", "Prime Video"];
function currencyToSymbol(currency: string): string {
	switch (currency) {
		case "USD":
			return "$";
		case "EUR":
			return "€";
		case "GBP":
			return "£";
		case "INR":
		default:
			return "₹";
	}
}

function addDays(days: number): string {
	const date = new Date();
	date.setDate(date.getDate() + days);
	return date.toISOString().slice(0, 10);
}

function nextPaymentByCycle(cycle: BillingCycle): string {
	if (cycle === "Yearly") return addDays(365);
	return addDays(30);
}

function monthlyPrice(cycle: BillingCycle, pricePerCycle: number): number {
	if (cycle === "Yearly") return Math.round(pricePerCycle / 12);
	return Math.round(pricePerCycle);
}

export default function OnboardingScreen() {
	const user = useUser();
	const preferences = usePreferences();
	const { updateUserProfile, updatePreferences, addSubscription } =
		useAppActions();

	const steps: StepKey[] = useMemo(
		() => [
			"welcome",
			"benefit1",
			"benefit2",
			"benefit3",
			"profile",
			"notifications",
			"currency",
			"quickAdd",
			"firstSub",
			"success",
		],
		[],
	);

	const [idx, setIdx] = useState(0);
	const step = steps[idx]!;
	const profileStepIndex = 4;
	const successStepIndex = steps.length - 1;

	const [name, setName] = useState(user.name ?? "");
	const [avatarUri, setAvatarUri] = useState(user.avatarUri ?? "");
	const [notifStatus, setNotifStatus] = useState<string | "unknown">(
		"unknown",
	);
	const [currency, setCurrency] = useState<CurrencyKey>(
		(preferences.currency as CurrencyKey) ?? "INR",
	);
	const [selectedService, setSelectedService] = useState<string>("Netflix");
	const [cost, setCost] = useState<string>("");

	const popularServices = useMemo(() => {
		const found = names
			.map((n) => SERVICES_LIST.find((s) => s.name === n))
			.filter((s): s is (typeof SERVICES_LIST)[number] => Boolean(s));
		return found.length ? found : SERVICES_LIST.slice(0, 6);
	}, []);

	const serviceConfig = useMemo(() => {
		return (
			SERVICES_LIST.find((s) => s.name === selectedService) ??
			popularServices[0]!
		);
	}, [popularServices, selectedService]);

	useEffect(() => {
		if (!cost) setCost(String(serviceConfig.defaultCost));
	}, [cost, serviceConfig.defaultCost]);

	const goNext = () => setIdx((n) => Math.min(n + 1, steps.length - 1));
	const goBack = () => setIdx((n) => Math.max(n - 1, 0));

	const finish = async () => {
		await updateUserProfile({
			name: name.trim(),
			avatarUri,
		});
		await updatePreferences({
			currency,
			hasOnboarded: true,
		});
		router.replace("/(drawer)/(tabs)");
	};

	const onSkip = () => {
		// Profile setup is mandatory; skip only fast-forwards.
		setIdx(profileStepIndex);
	};

	const pickPhoto = async () => {
		const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!perm.granted) {
			Alert.alert(
				"Permission needed",
				"Please allow photo access to upload a profile picture.",
			);
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.8,
			allowsEditing: true,
			aspect: [1, 1],
		});
		if (result.canceled) return;
		const uri = result.assets?.[0]?.uri;
		if (uri) setAvatarUri(uri);
	};

	const presetAvatars = useMemo(
		() =>
			[8, 12, 15, 18, 24, 32].map(
				(n) => `https://i.pravatar.cc/150?img=${n}`,
			),
		[],
	);

	useEffect(() => {
		if (!avatarUri) {
			setAvatarUri(presetAvatars[0] ?? "");
		}
	}, [avatarUri, presetAvatars]);

	const requestNotifications = async () => {
		const res = await Notifications.requestPermissionsAsync();
		setNotifStatus(String(res.status ?? "unknown"));
		if (res.status !== "granted") {
			Alert.alert(
				"Notifications disabled",
				"You can enable reminders later from Settings.",
			);
		}
	};

	const addFirstSubscription = async () => {
		if (!cost.trim()) {
			Alert.alert("Invalid amount", "Please enter a valid amount.");
			return;
		}
		const parsed = Number(cost);
		if (!Number.isFinite(parsed) || parsed < 0) {
			Alert.alert("Invalid amount", "Please enter a valid amount.");
			return;
		}

		const idBase = serviceConfig.name.toLowerCase().replace(/\s+/g, "-");
		const id = `${idBase}-${Date.now().toString(36)}`;
		const cycle = serviceConfig.defaultCycle as BillingCycle;
		const pricePerBillingCycle = Math.round(parsed);
		const sym = currencyToSymbol(currency);

		await addSubscription({
			id,
			name: serviceConfig.name,
			category: serviceConfig.defaultCategory ?? "Other",
			status: serviceConfig.defaultStatus,
			planName: serviceConfig.plans[0] ?? "Standard",
			currencySymbol: sym,
			billingCycle: cycle,
			pricePerBillingCycle,
			pricePerMonth: monthlyPrice(cycle, pricePerBillingCycle),
			startDate: new Date().toISOString().slice(0, 10),
			nextPaymentDate: nextPaymentByCycle(cycle),
			logoUri: serviceConfig.logoUri,
		});

		goNext();
	};

	const total = steps.length;
	const stepNumber = idx + 1;

	const renderStepHighlights = (items: HighlightItem[]) => (
		<View className="mt-5 rounded-2xl bg-slate-100/70 px-4 py-4">
			<Text className="text-xs font-poppins-bold uppercase tracking-widest text-foreground/50">
				What this step adds
			</Text>
			<View className="mt-3 gap-2.5">
				{items.map((item) => (
					<View
						key={item.label}
						className="flex-row items-start rounded-xl bg-white/80 px-3 py-2.5"
					>
						<View className="size-6 items-center justify-center rounded-lg bg-blue-50">
							<Ionicons
								name={item.icon}
								size={14}
								color="#2563EB"
							/>
						</View>
						<Text className="ml-2 flex-1 text-sm leading-6 font-poppins-medium text-foreground/70">
							{item.label}
						</Text>
					</View>
				))}
			</View>
		</View>
	);

	return (
		<SafeAreaView className=" bg-slate-50" edges={["top", "bottom"]}>
			<OnboardingStepHeader
				step={stepNumber}
				total={total}
				onBack={idx > 0 ? goBack : undefined}
				onSkip={onSkip}
				showSkip={idx < profileStepIndex}
			/>
			<ScrollView
				className="h-[90%]"
				scrollEnabled={false}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingBottom: 28,
					paddingHorizontal: 16,
					flexGrow: 1,
				}}
			>
				<View className="flex-1 pt-4">
					{step === "welcome" ? (
						<View className="flex-1">
							<View className="flex-1 rounded-3xl border border-slate-100 bg-white px-5 py-6">
								<View className="flex-1">
									<View className="size-14 items-center justify-center rounded-2xl bg-blue-50">
										<Ionicons
											name="sparkles-outline"
											size={28}
											color="#2563EB"
										/>
									</View>
									<Text className="mt-4 text-3xl font-poppins-bold text-foreground">
										Welcome to Recurvo
									</Text>
									<Text className="mt-2 text-base leading-7 font-poppins-medium text-foreground/60">
										Track subscriptions, avoid surprise
										renewals, and stay on top of spending.
									</Text>
									<View className="mt-5 flex-row flex-wrap gap-2">
										<View className="rounded-full bg-slate-100 px-3 py-1.5">
											<Text className="text-xs font-poppins-semibold text-slate-700">
												Offline-first
											</Text>
										</View>
										<View className="rounded-full bg-slate-100 px-3 py-1.5">
											<Text className="text-xs font-poppins-semibold text-slate-700">
												Private by default
											</Text>
										</View>
										<View className="rounded-full bg-slate-100 px-3 py-1.5">
											<Text className="text-xs font-poppins-semibold text-slate-700">
												Smart reminders
											</Text>
										</View>
									</View>

									<View className="mt-auto">
										{renderStepHighlights(
											highlightContent.welcome,
										)}
									</View>
								</View>
							</View>
							<View className="mt-6 pb-2">
								<PrimaryButton
									label="Get Started"
									onPress={goNext}
								/>
							</View>
						</View>
					) : null}

					{step === "benefit1" ? (
						<View className="flex-1 justify-between">
							<OnboardingInfoCard
								title="Renewal reminders"
								description="Get notified before renewals so you can cancel or downgrade on time."
								icon="notifications-outline"
								highlights={highlightContent.benefit1}
							/>
							<View className="mt-6 pb-2">
								<PrimaryButton label="Next" onPress={goNext} />
							</View>
						</View>
					) : null}

					{step === "benefit2" ? (
						<View className="flex-1 justify-between">
							<OnboardingInfoCard
								title="Trial tracking"
								description="Know exactly when trials end, so they don’t silently convert into paid plans."
								icon="flask-outline"
								highlights={highlightContent.benefit2}
							/>
							<View className="mt-6 pb-2">
								<PrimaryButton label="Next" onPress={goNext} />
							</View>
						</View>
					) : null}

					{step === "benefit3" ? (
						<View className="flex-1 justify-between">
							<OnboardingInfoCard
								title="Spending awareness"
								description="See monthly and yearly projections and find easy savings."
								icon="wallet-outline"
								highlights={highlightContent.benefit3}
							/>
							<View className="mt-6 pb-2">
								<PrimaryButton label="Next" onPress={goNext} />
							</View>
						</View>
					) : null}

					{step === "profile" ? (
						<View className="flex-1 justify-between">
							<View>
								<Text className="text-2xl font-poppins-bold text-foreground">
									Basic profile setup
								</Text>
								<Text className="mt-2 text-sm leading-6 font-poppins-medium text-foreground/60">
									What should we call you? (Optional)
								</Text>

								<Card className="mt-4 border border-slate-100 p-4">
									<View className="flex-row items-center">
										<View className="size-16 overflow-hidden rounded-full border border-slate-200 bg-black/10">
											{avatarUri ? (
												<Image
													source={{ uri: avatarUri }}
													className="size-16"
													resizeMode="cover"
												/>
											) : (
												<View className="size-16 items-center justify-center">
													<Ionicons
														name="person"
														size={26}
														color="#64748b"
													/>
												</View>
											)}
										</View>
										<View className="ml-4 flex-1">
											<TextInput
												value={name}
												onChangeText={setName}
												placeholder="e.g. Shashank"
												className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-poppins-semibold"
												placeholderTextColor="#94a3b8"
											/>
										</View>
									</View>

									<View className="mt-4 flex-row gap-3">
										<View className="flex-1">
											<SecondaryButton
												label="Upload photo"
												onPress={pickPhoto}
											/>
										</View>
										<View className="flex-1">
											<SecondaryButton
												label="Choose avatar"
												onPress={() => {
													Alert.alert(
														"Choose avatar",
														"Pick one below.",
													);
												}}
											/>
										</View>
									</View>

									<Text className="mt-5 text-sm font-poppins-semibold text-foreground/60">
										Choose an avatar
									</Text>
									<View className="mt-3 flex-row flex-wrap gap-3">
										{presetAvatars.map((uri) => {
											const active = uri === avatarUri;
											return (
												<Pressable
													key={uri}
													onPress={() =>
														setAvatarUri(uri)
													}
													className={
														active
															? "rounded-full border-2 border-blue-600"
															: "rounded-full border border-slate-200"
													}
													style={{
														overflow: "hidden",
													}}
												>
													<Image
														source={{ uri }}
														style={{
															width: 44,
															height: 44,
														}}
													/>
												</Pressable>
											);
										})}
									</View>
								</Card>
								{renderStepHighlights(highlightContent.profile)}
							</View>

							<View className="mt-4 pb-2">
								<PrimaryButton
									label="Continue"
									disabled={
										name.trim().length === 0 || !avatarUri
									}
									onPress={async () => {
										await updateUserProfile({
											name: name.trim(),
											avatarUri,
										});
										goNext();
									}}
								/>
							</View>
						</View>
					) : null}

					{step === "notifications" ? (
						<View className="flex-1 justify-between">
							<View className="flex-1">
								<Text className="text-2xl font-poppins-bold text-foreground">
									Renewal reminders
								</Text>
								<Text className="mt-2 text-sm leading-6 font-poppins-medium text-foreground/60">
									Enable notifications so we can remind you
									before renewals and trial endings.
								</Text>
								<Card className="mt-4 flex-1 border border-slate-100 px-5 py-5">
									<View className="flex-row items-center">
										<View className="size-10 items-center justify-center rounded-2xl bg-blue-50">
											<Ionicons
												name="notifications-outline"
												size={22}
												color="#2563EB"
											/>
										</View>
										<Text className="ml-3 text-base font-poppins-semibold text-foreground">
											Better experience with reminders
										</Text>
									</View>
									<Text className="mt-2 text-sm font-poppins-medium text-foreground/60">
										We’ll only schedule reminders you
										enable.
									</Text>

									<View className="mt-auto">
										{renderStepHighlights(
											highlightContent.notifications,
										)}
									</View>
								</Card>
							</View>

							<View className="mt-6 flex-row gap-3 pb-2">
								<View className="flex-1">
									<SecondaryButton
										label="Not now"
										onPress={goNext}
									/>
								</View>
								<View className="flex-1">
									<PrimaryButton
										label="Enable"
										onPress={async () => {
											await requestNotifications();
											goNext();
										}}
									/>
								</View>
							</View>

							{notifStatus !== "unknown" ? (
								<Text className="mt-3 pb-1 text-xs font-poppins-semibold text-foreground/50">
									Permission: {String(notifStatus)}
								</Text>
							) : null}
						</View>
					) : null}

					{step === "currency" ? (
						<View className="flex-1 justify-between">
							<View>
								<Text className="text-2xl font-poppins-bold text-foreground">
									Currency selection
								</Text>
								<Text className="mt-2 text-sm leading-6 font-poppins-medium text-foreground/60">
									Choose the currency you want to use.
								</Text>

								<View className="mt-4 flex-row flex-wrap gap-3">
									{(
										[
											{
												key: "INR",
												label: "₹",
												name: "INR",
											},
											{
												key: "USD",
												label: "$",
												name: "USD",
											},
											{
												key: "EUR",
												label: "€",
												name: "EUR",
											},
											{
												key: "GBP",
												label: "£",
												name: "GBP",
											},
										] as const
									).map((opt) => {
										const active = currency === opt.key;
										return (
											<Pressable
												key={opt.key}
												onPress={() =>
													setCurrency(opt.key)
												}
												className={
													active
														? "rounded-2xl bg-blue-600 px-6 py-4"
														: "rounded-2xl border border-slate-200 bg-white px-6 py-4"
												}
											>
												<Text
													className={
														active
															? "text-lg font-poppins-bold text-white"
															: "text-lg font-poppins-bold text-foreground"
													}
												>
													{opt.label}
												</Text>
												<Text
													className={
														active
															? "mt-1 text-xs font-poppins-semibold text-blue-100"
															: "mt-1 text-xs font-poppins-semibold text-foreground/50"
													}
												>
													{opt.name}
												</Text>
											</Pressable>
										);
									})}
								</View>

								{renderStepHighlights(
									highlightContent.currency,
								)}
							</View>

							<View className="mt-6 pb-2">
								<PrimaryButton
									label="Continue"
									onPress={async () => {
										await updatePreferences({ currency });
										goNext();
									}}
								/>
							</View>
						</View>
					) : null}

					{step === "quickAdd" ? (
						<View className="flex-1 justify-between">
							<View>
								<Text className="text-2xl font-poppins-bold text-foreground">
									Quick add popular services
								</Text>
								<Text className="mt-2 text-sm leading-6 font-poppins-medium text-foreground/60">
									Pick one to add first.
								</Text>

								<View className="mt-4 flex-row flex-wrap gap-3">
									{popularServices.map((s) => {
										const active =
											selectedService === s.name;
										return (
											<Pressable
												key={s.name}
												onPress={() => {
													setSelectedService(s.name);
													setCost(
														String(s.defaultCost),
													);
												}}
												className={
													active
														? "rounded-2xl border-2 border-blue-600 bg-blue-50/50 px-4 py-3"
														: "rounded-2xl border border-slate-200 bg-white px-4 py-3"
												}
												style={{ width: "48%" }}
											>
												<View className="flex-row items-center">
													{s.logoUri ? (
														<Image
															source={{
																uri: s.logoUri,
															}}
															style={{
																width: 18,
																height: 18,
															}}
															resizeMode="contain"
														/>
													) : null}
													<Text className="ml-2 text-sm font-poppins-semibold text-foreground">
														{s.name}
													</Text>
												</View>
												<Text className="mt-1 text-xs font-poppins-medium text-foreground/60">
													{currencyToSymbol(currency)}
													{s.defaultCost}/
													{s.defaultCycle === "Yearly"
														? "yr"
														: "mo"}
												</Text>
											</Pressable>
										);
									})}
								</View>

								{renderStepHighlights(
									highlightContent.quickAdd,
								)}
							</View>

							<View className="mt-6 flex-row gap-3 pb-2">
								<View className="flex-1">
									<SecondaryButton
										label="Skip"
										onPress={() => setIdx(successStepIndex)}
									/>
								</View>
								<View className="flex-1">
									<PrimaryButton
										label="Continue"
										onPress={goNext}
									/>
								</View>
							</View>
						</View>
					) : null}

					{step === "firstSub" ? (
						<View className="flex-1 justify-between">
							<View>
								<Text className="text-2xl font-poppins-bold text-foreground">
									Add your first subscription
								</Text>
								<Text className="mt-2 text-sm leading-6 font-poppins-medium text-foreground/60">
									Minimal setup — you can edit details later.
								</Text>

								<Card className="mt-4 border border-slate-100 px-4 py-5">
									<Text className="text-sm font-poppins-semibold text-foreground/60">
										Service
									</Text>
									<Text className="mt-1 text-lg font-poppins-bold text-foreground">
										{serviceConfig.name}
									</Text>
									<Text className="mt-1 text-xs font-poppins-medium text-foreground/50">
										{serviceConfig.defaultCycle} billing
									</Text>

									<View className="mt-4">
										<Text className="text-sm font-poppins-semibold text-foreground/60">
											Amount ({currencyToSymbol(currency)}
											)
										</Text>
										<TextInput
											value={cost}
											onChangeText={setCost}
											keyboardType="numeric"
											className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-poppins-semibold"
											placeholderTextColor="#94a3b8"
										/>
									</View>
								</Card>

								{renderStepHighlights(
									highlightContent.firstSub,
								)}
							</View>

							<View className="mt-6 pb-2">
								<PrimaryButton
									label="Add"
									onPress={addFirstSubscription}
								/>
							</View>
						</View>
					) : null}

					{step === "success" ? (
						<View className="flex-1 justify-between">
							<View className="flex-1 rounded-3xl border border-slate-100 bg-white px-5 py-7">
								<View className="size-16 items-center justify-center rounded-full bg-emerald-50">
									<Ionicons
										name="checkmark"
										size={32}
										color="#059669"
									/>
								</View>
								<Text className="mt-5 text-3xl font-poppins-bold text-foreground">
									You’re all set
								</Text>
								<Text className="mt-2 text-base leading-7 font-poppins-medium text-foreground/60">
									Welcome to your dashboard.
								</Text>

								<View className="mt-auto">
									{renderStepHighlights(
										highlightContent.success,
									)}
								</View>
							</View>
							<View className="mt-6 pb-2">
								<PrimaryButton
									label="Go to dashboard"
									onPress={finish}
								/>
							</View>
						</View>
					) : null}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
