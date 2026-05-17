import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Alert, Image, Pressable, Text, TextInput, View } from "react-native";

import {
	PrimaryButton,
	SecondaryButton,
} from "@/src/components/onboarding/OnboardingButtons";
import OnboardingFeatureChip from "@/src/components/onboarding/OnboardingFeatureChip";
import type { CurrencyKey, StepKey } from "@/src/components/onboarding/types";
import Card from "@/src/components/ui/Card";
import type { ServiceConfig } from "@/src/constants/subscriptionsCatalog";
import {
	CurrencyOptions,
	featureChips,
	WelcomeBenefitsList,
} from "@/src/data/dummy";
import { currencyToSymbol } from "@/src/utils/helper";

type OnboardingStepContentProps = {
	step: StepKey;
	name: string;
	avatarUri: string;
	presetAvatars: string[];
	onChangeName: (value: string) => void;
	onPickPhoto: () => void;
	onSelectAvatar: (value: string) => void;
	onContinueProfile: () => void;
	isProfileContinueDisabled: boolean;
	notifStatus: string | "unknown";
	onEnableNotifications: () => void;
	onSkipNotifications: () => void;
	currency: CurrencyKey;
	onSelectCurrency: (value: CurrencyKey) => void;
	onContinueCurrency: () => void;
	popularServices: readonly ServiceConfig[];
	selectedService: string;
	onSelectService: (value: string) => void;
	cost: string;
	onChangeCost: (value: string) => void;
	serviceConfig: ServiceConfig;
	onSkipQuickAdd: () => void;
	onContinueQuickAdd: () => void;
	onAddFirstSubscription: () => void;
	onFinish: () => void;
	onNext: () => void;
};

export default function OnboardingStepContent({
	step,
	name,
	avatarUri,
	presetAvatars,
	onChangeName,
	onPickPhoto,
	onSelectAvatar,
	onContinueProfile,
	isProfileContinueDisabled,
	notifStatus,
	onEnableNotifications,
	onSkipNotifications,
	currency,
	onSelectCurrency,
	onContinueCurrency,
	popularServices,
	selectedService,
	onSelectService,
	cost,
	onChangeCost,
	serviceConfig,
	onSkipQuickAdd,
	onContinueQuickAdd,
	onAddFirstSubscription,
	onFinish,
	onNext,
}: OnboardingStepContentProps) {
	if (step === "welcome") {
		return (
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
							Track subscriptions, avoid surprise renewals, and
							stay on top of spending.
						</Text>
						<View className="mt-5 flex-row flex-wrap gap-2">
							{featureChips.map((chip) => (
								<OnboardingFeatureChip
									key={chip}
									label={chip}
								/>
							))}
						</View>

						<View className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
							<Text className="text-xs font-poppins-bold uppercase tracking-widest text-foreground/50">
								Core benefits
							</Text>
							<View className="mt-3 gap-2.5">
								{WelcomeBenefitsList.map((benefit) => (
									<View
										key={benefit.label}
										className="rounded-xl bg-white px-3 py-3"
									>
										<View className="flex-row items-center">
											<View className="size-7 items-center justify-center rounded-lg bg-blue-50">
												<Ionicons
													name={benefit.icon}
													size={14}
													color="#2563EB"
												/>
											</View>
											<Text className="ml-2 text-sm font-poppins-semibold text-foreground">
												{benefit.label}
											</Text>
										</View>
										<Text className="mt-1 text-xs leading-5 font-poppins-medium text-foreground/60">
											{benefit.description}
										</Text>
									</View>
								))}
							</View>
						</View>
					</View>
				</View>
				<View className="mt-6 pb-2">
					<PrimaryButton label="Get Started" onPress={onNext} />
				</View>
			</View>
		);
	}

	if (step === "profile") {
		return (
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
									onChangeText={onChangeName}
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
									onPress={onPickPhoto}
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
										onPress={() => onSelectAvatar(uri)}
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
				</View>

				<View className="mt-4 pb-2">
					<PrimaryButton
						label="Continue"
						disabled={isProfileContinueDisabled}
						onPress={onContinueProfile}
					/>
				</View>
			</View>
		);
	}

	if (step === "notifications") {
		return (
			<View className="flex-1 justify-between">
				<View className="flex-1">
					<Text className="text-2xl font-poppins-bold text-foreground">
						Renewal reminders
					</Text>
					<Text className="mt-2 text-sm leading-6 font-poppins-medium text-foreground/60">
						Enable notifications so we can remind you before
						renewals and trial endings.
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
							We’ll only schedule reminders you enable.
						</Text>
					</Card>
				</View>

				<View className="mt-6 flex-row gap-3 pb-2">
					<View className="flex-1">
						<SecondaryButton
							label="Not now"
							onPress={onSkipNotifications}
						/>
					</View>
					<View className="flex-1">
						<PrimaryButton
							label="Enable"
							onPress={onEnableNotifications}
						/>
					</View>
				</View>

				{notifStatus !== "unknown" ? (
					<Text className="mt-3 pb-1 text-xs font-poppins-semibold text-foreground/50">
						Permission: {String(notifStatus)}
					</Text>
				) : null}
			</View>
		);
	}

	if (step === "currency") {
		return (
			<View className="flex-1 justify-between">
				<View>
					<Text className="text-2xl font-poppins-bold text-foreground">
						Currency selection
					</Text>
					<Text className="mt-2 text-sm leading-6 font-poppins-medium text-foreground/60">
						Choose the currency you want to use.
					</Text>

					<View className="mt-4 flex-row flex-wrap gap-3">
						{CurrencyOptions.map((opt) => {
							const active = currency === opt.key;
							return (
								<Pressable
									key={opt.key}
									onPress={() =>
										onSelectCurrency(opt.key as CurrencyKey)
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
				</View>

				<View className="mt-6 pb-2">
					<PrimaryButton
						label="Continue"
						onPress={onContinueCurrency}
					/>
				</View>
			</View>
		);
	}

	if (step === "quickAdd") {
		return (
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
							const active = selectedService === s.name;
							return (
								<Pressable
									key={s.name}
									onPress={() => {
										onSelectService(s.name);
										onChangeCost(String(s.defaultCost));
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
												source={{ uri: s.logoUri }}
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
				</View>

				<View className="mt-6 flex-row gap-3 pb-2">
					<View className="flex-1">
						<SecondaryButton
							label="Skip"
							onPress={onSkipQuickAdd}
						/>
					</View>
					<View className="flex-1">
						<PrimaryButton
							label="Continue"
							onPress={onContinueQuickAdd}
						/>
					</View>
				</View>
			</View>
		);
	}

	if (step === "firstSub") {
		return (
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
								Amount ({currencyToSymbol(currency)})
							</Text>
							<TextInput
								value={cost}
								onChangeText={onChangeCost}
								keyboardType="numeric"
								className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-poppins-semibold"
								placeholderTextColor="#94a3b8"
							/>
						</View>
					</Card>
				</View>

				<View className="mt-6 pb-2">
					<PrimaryButton
						label="Add"
						onPress={onAddFirstSubscription}
					/>
				</View>
			</View>
		);
	}

	return (
		<View className="flex-1 justify-between">
			<View className="flex-1 rounded-3xl border border-slate-100 bg-white px-5 py-7">
				<View className="size-16 items-center justify-center rounded-full bg-emerald-50">
					<Ionicons name="checkmark" size={32} color="#059669" />
				</View>
				<Text className="mt-5 text-3xl font-poppins-bold text-foreground">
					You’re all set
				</Text>
				<Text className="mt-2 text-base leading-7 font-poppins-medium text-foreground/60">
					Welcome to your dashboard.
				</Text>
			</View>
			<View className="mt-6 pb-2">
				<PrimaryButton label="Go to dashboard" onPress={onFinish} />
			</View>
		</View>
	);
}
