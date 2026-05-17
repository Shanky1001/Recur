import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView } from "react-native";
import Animated, {
	SlideInLeft,
	SlideInRight,
	SlideOutLeft,
	SlideOutRight,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import OnboardingStepContent from "@/src/components/onboarding/OnboardingStepContent";
import OnboardingStepHeader from "@/src/components/onboarding/OnboardingStepHeader";
import type { CurrencyKey } from "@/src/components/onboarding/types";
import {
	SERVICES_LIST,
	type BillingCycle,
} from "@/src/constants/subscriptionsCatalog";
import { OnboardingSteps } from "@/src/data/dummy";
import { useAppActions, usePreferences, useUser } from "@/src/state/appState";
import {
	currencyToSymbol,
	getPresetAvatarUrls,
	monthlyPrice,
	nextPaymentByCycle,
} from "@/src/utils/helper";

const names = ["Netflix", "Spotify", "YouTube", "Notion", "Prime Video"];
const presetAvatars = getPresetAvatarUrls();

export default function OnboardingScreen() {
	const user = useUser();
	const preferences = usePreferences();
	const { updateUserProfile, updatePreferences, addSubscription } =
		useAppActions();

	const [idx, setIdx] = useState(0);
	const step = OnboardingSteps[idx]!;
	const profileStepIndex = OnboardingSteps.indexOf("profile");
	const successStepIndex = OnboardingSteps.length - 1;

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
	const [navDirection, setNavDirection] = useState<1 | -1>(1);

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

	const goNext = () => {
		setNavDirection(1);
		setIdx((n) => Math.min(n + 1, OnboardingSteps.length - 1));
	};
	const goBack = () => {
		setNavDirection(-1);
		setIdx((n) => Math.max(n - 1, 0));
	};

	const goToStep = (nextIndex: number) => {
		setNavDirection(nextIndex >= idx ? 1 : -1);
		setIdx(Math.max(0, Math.min(nextIndex, OnboardingSteps.length - 1)));
	};

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
		goToStep(profileStepIndex);
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

	useEffect(() => {
		if (!avatarUri) {
			setAvatarUri(presetAvatars[0] ?? "");
		}
	}, [avatarUri]);

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

	const total = OnboardingSteps.length;
	const stepNumber = idx + 1;
	const enteringAnimation =
		navDirection === 1
			? SlideInRight.duration(280)
			: SlideInLeft.duration(280);
	const exitingAnimation =
		navDirection === 1
			? SlideOutLeft.duration(220)
			: SlideOutRight.duration(220);

	return (
		<SafeAreaView className="flex-1 bg-slate-50" edges={["top", "bottom"]}>
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
				<Animated.View
					key={step}
					className="flex-1 pt-4"
					entering={enteringAnimation}
					exiting={exitingAnimation}
				>
					<OnboardingStepContent
						step={step}
						name={name}
						avatarUri={avatarUri}
						presetAvatars={presetAvatars}
						onChangeName={setName}
						onPickPhoto={pickPhoto}
						onSelectAvatar={setAvatarUri}
						onContinueProfile={async () => {
							await updateUserProfile({
								name: name.trim(),
								avatarUri,
							});
							goNext();
						}}
						isProfileContinueDisabled={!avatarUri}
						notifStatus={notifStatus}
						onEnableNotifications={async () => {
							await requestNotifications();
							goNext();
						}}
						onSkipNotifications={goNext}
						currency={currency}
						onSelectCurrency={setCurrency}
						onContinueCurrency={async () => {
							await updatePreferences({ currency });
							goNext();
						}}
						popularServices={popularServices}
						selectedService={selectedService}
						onSelectService={setSelectedService}
						cost={cost}
						onChangeCost={setCost}
						serviceConfig={serviceConfig}
						onSkipQuickAdd={() => goToStep(successStepIndex)}
						onContinueQuickAdd={goNext}
						onAddFirstSubscription={addFirstSubscription}
						onFinish={finish}
						onNext={goNext}
					/>
				</Animated.View>
			</ScrollView>
		</SafeAreaView>
	);
}
