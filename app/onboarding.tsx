import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
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
import { useAppActions, usePreferences, useUser } from "@/src/state/appState";

type StepKey =
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
		const names = [
			"Netflix",
			"Spotify",
			"YouTube",
			"Notion",
			"Prime Video",
		];
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

	React.useEffect(() => {
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

	React.useEffect(() => {
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

	return (
		<SafeAreaView className="flex-1 bg-gray-100" edges={["top"]}>
			<OnboardingStepHeader
				step={stepNumber}
				total={total}
				onBack={idx > 0 ? goBack : undefined}
				onSkip={onSkip}
				showSkip={idx < profileStepIndex}
			/>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 24 }}
			>
				<View className="px-4 pt-4">
					{step === "welcome" ? (
						<View>
							<Text className="text-3xl font-poppins-bold text-foreground">
								Welcome
							</Text>
							<Text className="mt-2 text-base font-poppins-medium text-foreground/60">
								Track subscriptions, avoid surprise renewals,
								and stay on top of spending.
							</Text>
							<View className="mt-6">
								<PrimaryButton
									label="Get Started"
									onPress={goNext}
								/>
							</View>
						</View>
					) : null}

					{step === "benefit1" ? (
						<OnboardingInfoCard
							title="Renewal reminders"
							description="Get notified before renewals so you can cancel or downgrade on time."
							icon="notifications-outline"
							actionLabel="Next"
							onAction={goNext}
						/>
					) : null}

					{step === "benefit2" ? (
						<OnboardingInfoCard
							title="Trial tracking"
							description="Know exactly when trials end, so they don’t silently convert into paid plans."
							icon="flask-outline"
							actionLabel="Next"
							onAction={goNext}
						/>
					) : null}

					{step === "benefit3" ? (
						<OnboardingInfoCard
							title="Spending awareness"
							description="See monthly and yearly projections and find easy savings."
							icon="wallet-outline"
							actionLabel="Next"
							onAction={goNext}
						/>
					) : null}

					{step === "profile" ? (
						<View>
							<Text className="text-2xl font-poppins-bold text-foreground">
								Basic profile setup
							</Text>
							<Text className="mt-2 text-sm font-poppins-medium text-foreground/60">
								What should we call you? (Optional)
							</Text>

							<Card className="mt-4 px-4 py-4">
								<View className="flex-row items-center">
									<View className="size-16 overflow-hidden rounded-full bg-black/10">
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
											className="rounded-2xl border border-border bg-white px-4 py-3 text-base font-poppins-semibold"
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

								<View className="mt-4 flex-row flex-wrap gap-3">
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
														: "rounded-full border border-border"
												}
												style={{ overflow: "hidden" }}
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

							<View className="mt-6">
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
						<View>
							<Text className="text-2xl font-poppins-bold text-foreground">
								Renewal reminders
							</Text>
							<Text className="mt-2 text-sm font-poppins-medium text-foreground/60">
								Enable notifications so we can remind you before
								renewals and trial endings.
							</Text>
							<Card className="mt-4 px-5 py-5">
								<View className="flex-row items-center">
									<Ionicons
										name="notifications-outline"
										size={24}
										color="#2563EB"
									/>
									<Text className="ml-3 text-base font-poppins-semibold text-foreground">
										Better experience with reminders
									</Text>
								</View>
								<Text className="mt-2 text-sm font-poppins-medium text-foreground/60">
									We’ll only schedule reminders you enable.
								</Text>
							</Card>

							<View className="mt-6 flex-row gap-3">
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
								<Text className="mt-3 text-xs font-poppins-semibold text-foreground/50">
									Permission: {String(notifStatus)}
								</Text>
							) : null}
						</View>
					) : null}

					{step === "currency" ? (
						<View>
							<Text className="text-2xl font-poppins-bold text-foreground">
								Currency selection
							</Text>
							<Text className="mt-2 text-sm font-poppins-medium text-foreground/60">
								Choose the currency you want to use.
							</Text>

							<View className="mt-4 flex-row flex-wrap gap-3">
								{(
									[
										{ key: "INR", label: "₹" },
										{ key: "USD", label: "$" },
										{ key: "EUR", label: "€" },
										{ key: "GBP", label: "£" },
									] as const
								).map((opt) => {
									const active = currency === opt.key;
									return (
										<Pressable
											key={opt.key}
											onPress={() => setCurrency(opt.key)}
											className={
												active
													? "rounded-2xl bg-blue-600 px-6 py-4"
													: "rounded-2xl border border-border bg-white px-6 py-4"
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
										</Pressable>
									);
								})}
							</View>

							<View className="mt-6">
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
						<View>
							<Text className="text-2xl font-poppins-bold text-foreground">
								Quick add popular services
							</Text>
							<Text className="mt-2 text-sm font-poppins-medium text-foreground/60">
								Pick one to add first.
							</Text>

							<View className="mt-4 flex-row flex-wrap gap-3">
								{popularServices.map((s) => {
									const active = selectedService === s.name;
									return (
										<Pressable
											key={s.name}
											onPress={() => {
												setSelectedService(s.name);
												setCost(String(s.defaultCost));
											}}
											className={
												active
													? "rounded-2xl border-2 border-blue-600 bg-white px-4 py-3"
													: "rounded-2xl border border-border bg-white px-4 py-3"
											}
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

							<View className="mt-6 flex-row gap-3">
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
						<View>
							<Text className="text-2xl font-poppins-bold text-foreground">
								Add your first subscription
							</Text>
							<Text className="mt-2 text-sm font-poppins-medium text-foreground/60">
								Minimal setup — you can edit details later.
							</Text>

							<Card className="mt-4 px-4 py-4">
								<Text className="text-sm font-poppins-semibold text-foreground/60">
									Service
								</Text>
								<Text className="mt-1 text-lg font-poppins-bold text-foreground">
									{serviceConfig.name}
								</Text>

								<View className="mt-4">
									<Text className="text-sm font-poppins-semibold text-foreground/60">
										Amount ({currencyToSymbol(currency)})
									</Text>
									<TextInput
										value={cost}
										onChangeText={setCost}
										keyboardType="numeric"
										className="mt-2 rounded-2xl border border-border bg-white px-4 py-3 text-base font-poppins-semibold"
										placeholderTextColor="#94a3b8"
									/>
								</View>
							</Card>

							<View className="mt-6">
								<PrimaryButton
									label="Add"
									onPress={addFirstSubscription}
								/>
							</View>
						</View>
					) : null}

					{step === "success" ? (
						<View>
							<Text className="text-3xl font-poppins-bold text-foreground">
								You’re all set
							</Text>
							<Text className="mt-2 text-base font-poppins-medium text-foreground/60">
								Welcome to your dashboard.
							</Text>
							<View className="mt-6">
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
