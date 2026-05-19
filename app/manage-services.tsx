import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
	Alert,
	Image,
	KeyboardAvoidingView,
	Platform,
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
import SelectField from "@/src/components/forms/SelectField";
import Card from "@/src/components/ui/Card";
import {
	BILLING_CYCLES,
	type BillingCycle,
	type ServiceConfig,
} from "@/src/constants/subscriptionsCatalog";
import { useAppActions, useServices } from "@/src/state/appState";

function parsePlans(input: string): string[] {
	return input
		.split(",")
		.map((p) => p.trim())
		.filter(Boolean);
}

export default function ManageServicesScreen() {
	const insets = useSafeAreaInsets();
	const services = useServices();
	const { upsertService, deleteService } = useAppActions();

	const [name, setName] = useState("");
	const [logoUri, setLogoUri] = useState("");
	const [plansInput, setPlansInput] = useState("Standard");
	const [defaultCycle, setDefaultCycle] = useState<BillingCycle>("Monthly");
	const [defaultCost, setDefaultCost] = useState("0");
	const [defaultCategory, setDefaultCategory] = useState("Other");
	const [defaultStatus, setDefaultStatus] = useState<"active" | "trial">(
		"active",
	);
	const [saving, setSaving] = useState(false);
	const didNavigateAfterSaveRef = useRef(false);

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

	const categorySuggestions = useMemo(() => {
		const set = new Set<string>(["Other"]);
		for (const s of services) {
			if (s.defaultCategory?.trim()) set.add(s.defaultCategory.trim());
		}
		return Array.from(set).sort((a, b) => a.localeCompare(b));
	}, [services]);

	const onSave = async () => {
		if (saving) return;
		if (!name.trim()) {
			Alert.alert("Name required", "Please enter a service name.");
			return;
		}

		const parsedCost = Number(defaultCost);
		if (!Number.isFinite(parsedCost) || parsedCost < 0) {
			Alert.alert("Invalid cost", "Please enter a valid default cost.");
			return;
		}

		const plans = parsePlans(plansInput);
		if (!plans.length) {
			Alert.alert("Plans required", "Add at least one plan.");
			return;
		}

		const payload: ServiceConfig = {
			name: name.trim(),
			logoUri: logoUri.trim() || undefined,
			plans,
			defaultCycle,
			defaultCost: Math.round(parsedCost),
			defaultCategory: defaultCategory.trim() || "Other",
			defaultStatus,
		};

		setSaving(true);
		try {
			await upsertService(payload);
			didNavigateAfterSaveRef.current = false;
			const navigateToProfile = () => {
				if (didNavigateAfterSaveRef.current) return;
				didNavigateAfterSaveRef.current = true;
				router.replace("/profile");
			};
			Alert.alert(
				"Saved",
				"Service added successfully.",
				[
					{
						text: "Okay",
						onPress: navigateToProfile,
					},
				],
				{
					cancelable: false,
					onDismiss: navigateToProfile,
				},
			);
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
					Manage Services
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
					<Card elevated={false} className="rounded-3xl p-3 m-2">
						<Text className="pb-2 text-sm font-poppins-bold text-foreground">
							Create custom service
						</Text>

						<View className="pb-4">
							<Text className="text-sm font-poppins-bold text-foreground">
								Service name
							</Text>
							<View className="mt-2 rounded-2xl border border-border bg-white px-4 py-4">
								<TextInput
									value={name}
									onChangeText={setName}
									placeholder="e.g. Netflix"
									placeholderTextColor="#94a3b8"
									className="text-base font-poppins-medium text-foreground"
								/>
							</View>
						</View>

						<View className="pb-4">
							<Text className="text-sm font-poppins-bold text-foreground">
								Logo URL (optional)
							</Text>
							<View className="mt-2 rounded-2xl border border-border bg-white px-4 py-4">
								<TextInput
									value={logoUri}
									onChangeText={setLogoUri}
									placeholder="https://..."
									placeholderTextColor="#94a3b8"
									autoCapitalize="none"
									className="text-base font-poppins-medium text-foreground"
								/>
							</View>
						</View>

						<View className="pb-4">
							<Text className="text-sm font-poppins-bold text-foreground">
								Plans (comma separated)
							</Text>
							<View className="mt-2 rounded-2xl border border-border bg-white px-4 py-4">
								<TextInput
									value={plansInput}
									onChangeText={setPlansInput}
									placeholder="Mobile, Basic, Standard, Premium"
									placeholderTextColor="#94a3b8"
									className="text-base font-poppins-medium text-foreground"
								/>
							</View>
						</View>

						<SelectField
							label="Default billing cycle"
							value={defaultCycle}
							onPress={() =>
								setPicker({
									open: true,
									title: "Default billing cycle",
									items: BILLING_CYCLES.map((c) => ({
										label: c,
										value: c,
									})),
									selected: defaultCycle,
									onSelect: (v) =>
										setDefaultCycle(v as BillingCycle),
								})
							}
						/>

						<View className="pb-4">
							<Text className="text-sm font-poppins-bold text-foreground">
								Default cost
							</Text>
							<View className="mt-2 rounded-2xl border border-border bg-white px-4 py-4">
								<TextInput
									value={defaultCost}
									onChangeText={setDefaultCost}
									keyboardType="numeric"
									placeholder="649"
									placeholderTextColor="#94a3b8"
									className="text-base font-poppins-medium text-foreground"
								/>
							</View>
						</View>

						<View className="pb-4">
							<Text className="text-sm font-poppins-bold text-foreground">
								Default category
							</Text>
							<View className="mt-2 rounded-2xl border border-border bg-white px-4 py-4">
								<TextInput
									value={defaultCategory}
									onChangeText={setDefaultCategory}
									placeholder="Entertainment"
									placeholderTextColor="#94a3b8"
									className="text-base font-poppins-medium text-foreground"
								/>
							</View>
							<View className="mt-2 flex-row flex-wrap gap-2">
								{categorySuggestions.map((c) => (
									<Pressable
										key={c}
										onPress={() => setDefaultCategory(c)}
										className="rounded-full border border-border bg-white px-3 py-1"
									>
										<Text className="text-xs font-poppins-semibold text-foreground/70">
											{c}
										</Text>
									</Pressable>
								))}
							</View>
						</View>

						<View className="pb-4">
							<Text className="text-sm font-poppins-bold text-foreground">
								Default status
							</Text>
							<View className="mt-2 flex-row rounded-2xl border border-border bg-white p-1">
								<Pressable
									onPress={() => setDefaultStatus("active")}
									className={
										defaultStatus === "active"
											? "flex-1 rounded-xl bg-blue-600 px-4 py-3"
											: "flex-1 rounded-xl px-4 py-3"
									}
								>
									<Text
										className={
											defaultStatus === "active"
												? "text-center text-sm font-poppins-bold text-white"
												: "text-center text-sm font-poppins-semibold text-foreground"
										}
									>
										Active
									</Text>
								</Pressable>
								<Pressable
									onPress={() => setDefaultStatus("trial")}
									className={
										defaultStatus === "trial"
											? "flex-1 rounded-xl bg-blue-600 px-4 py-3"
											: "flex-1 rounded-xl px-4 py-3"
									}
								>
									<Text
										className={
											defaultStatus === "trial"
												? "text-center text-sm font-poppins-bold text-white"
												: "text-center text-sm font-poppins-semibold text-foreground"
										}
									>
										Trial
									</Text>
								</Pressable>
							</View>
						</View>
					</Card>

					<View className="px-2 pt-1 pb-2">
						<Text className="px-2 text-sm font-poppins-semibold text-foreground/70">
							Available services ({services.length})
						</Text>
					</View>
					{services.map((s) => (
						<Card
							key={s.name}
							elevated={false}
							className="rounded-3xl bg-white p-3 m-2 border border-border"
						>
							<View className="flex-row items-center">
								{s.logoUri ? (
									<Image
										source={{ uri: s.logoUri }}
										className="h-8 w-8"
										resizeMode="contain"
									/>
								) : (
									<View className="h-8 w-8 rounded-full items-center justify-center">
										<Text className="text-xs font-poppins-bold text-foreground">
											{s.name.slice(0, 1).toUpperCase()}
										</Text>
									</View>
								)}
								<View className="ml-3 flex-1">
									<Text className="text-sm font-poppins-bold text-foreground">
										{s.name}
									</Text>
									<Text className="text-xs font-poppins-medium text-foreground/60">
										{s.defaultCycle} • {s.defaultCategory} •{" "}
										{s.defaultStatus}
									</Text>
								</View>
								<Pressable
									onPress={() => {
										Alert.alert(
											"Delete service",
											`Remove ${s.name} from service options?`,
											[
												{
													text: "Cancel",
													style: "cancel",
												},
												{
													text: "Delete",
													style: "destructive",
													onPress: async () => {
														await deleteService(
															s.name,
														);
													},
												},
											],
										);
									}}
									className="rounded-full border border-border px-3 py-1"
								>
									<Text className="text-xs font-poppins-semibold text-red-600">
										Delete
									</Text>
								</Pressable>
							</View>
						</Card>
					))}
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
						style={({ pressed }) => ({
							opacity: pressed ? 0.9 : 1,
						})}
					>
						<Text className="text-base font-poppins-bold text-white">
							{saving ? "Saving..." : "Save Service"}
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
