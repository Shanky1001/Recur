import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
	Alert,
	Image,
	Linking,
	Pressable,
	ScrollView,
	Share,
	Switch,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PopoverSelect from "@/src/components/analytics/PopoverSelect";
import TimeField from "@/src/components/forms/TimeField";
import Card from "@/src/components/ui/Card";
import { formatReminderTimeDisplay } from "@/src/utils/reminderSchedule";
import { CurrencyOptions } from "@/src/data/dummy";
import { useTabBarContentPadding } from "@/src/hooks/useTabBarContentPadding";
import {
	useAppActions,
	useAppState,
	useDashboard,
	usePreferences,
	useServices,
	useSubscriptions,
	useUser,
} from "@/src/state/appState";

type CurrencyKey = "INR" | "USD" | "EUR" | "GBP";
type ThemeMode = "system" | "light" | "dark";

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<View className="px-4 pt-4">
			<Text className="mb-2 text-sm font-poppins-semibold text-foreground/70">
				{title}
			</Text>
			<Card elevated>{children}</Card>
		</View>
	);
}

function Row({
	icon,
	label,
	subLabel,
	right,
	onPress,
	disabled,
}: {
	icon: React.ComponentProps<typeof Ionicons>["name"];
	label: string;
	subLabel?: string;
	right?: React.ReactNode;
	onPress?: () => void;
	disabled?: boolean;
}) {
	const content = (
		<View className="flex-row items-center px-4 py-4">
			<View
				className="size-11 items-center justify-center rounded-2xl"
				style={{ backgroundColor: "rgba(37,99,235,0.08)" }}
			>
				<Ionicons name={icon} size={20} color="#2563EB" />
			</View>
			<View className="ml-4 flex-1">
				<Text className="text-base font-poppins-semibold text-foreground">
					{label}
				</Text>
				{subLabel ? (
					<Text className="mt-1 text-xs font-poppins-medium text-foreground/60">
						{subLabel}
					</Text>
				) : null}
			</View>
			{right ?? (
				<Ionicons name="chevron-forward" size={18} color="#94a3b8" />
			)}
		</View>
	);

	if (!onPress)
		return <View style={{ opacity: disabled ? 0.5 : 1 }}>{content}</View>;
	return (
		<Pressable
			onPress={disabled ? undefined : onPress}
			hitSlop={6}
			style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
			disabled={disabled}
		>
			{content}
		</Pressable>
	);
}

function Divider() {
	return <View className="h-px bg-border" />;
}

export default function ProfileScreen() {
	const contentBottomPadding = useTabBarContentPadding(24);
	const user = useUser();
	const dashboard = useDashboard();
	const subscriptions = useSubscriptions();
	const services = useServices();
	const { state } = useAppState();
	const preferences = usePreferences();
	const { clearAllNotifications, upsertSubscription, updatePreferences } =
		useAppActions();

	const currency = (preferences.currency as CurrencyKey) ?? "INR";
	const reminderDaysBefore = String(
		preferences.defaultReminderDaysBefore ?? 3,
	) as "1" | "2" | "3" | "5" | "7";
	const reminderTime = preferences.defaultReminderTime ?? "09:00";
	const notificationsEnabled = Boolean(
		preferences.defaultReminderEnabled ?? true,
	);
	const themeMode = (preferences.themeMode ?? "system") as ThemeMode;
	const [saving, setSaving] = useState(false);

	const overview = useMemo(() => {
		const active = subscriptions.filter(
			(s) => s.status !== "cancelled",
		).length;
		const monthly = dashboard.totalMonthlySpend;
		const yearly = monthly * 12;
		return { active, monthly, yearly };
	}, [dashboard.totalMonthlySpend, subscriptions]);

	const archivedCount = useMemo(
		() => subscriptions.filter((s) => s.status === "cancelled").length,
		[subscriptions],
	);
	const trialCount = useMemo(
		() => subscriptions.filter((s) => s.status === "trial").length,
		[subscriptions],
	);

	const currencySymbol =
		currency === "INR"
			? "₹"
			: currency === "USD"
				? "$"
				: currency === "EUR"
					? "€"
					: "£";

	const onExport = async () => {
		try {
			await Share.share({
				message: JSON.stringify(
					{
						user: state.user,
						dashboard: state.dashboard,
						subscriptions: state.subscriptions,
						notifications: state.notifications,
						preferences: state.preferences,
					},
					null,
					2,
				),
			});
		} catch {
			Alert.alert("Export failed", "Could not export data.");
		}
	};

	const applyReminderTimeToAll = (time: string) => {
		if (saving) return;
		Alert.alert(
			"Apply reminder time",
			`Set reminder time to ${formatReminderTimeDisplay(time)} for all active subscriptions?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Apply",
					onPress: async () => {
						setSaving(true);
						try {
							const targets = subscriptions.filter(
								(s) => s.status !== "cancelled",
							);
							for (const s of targets) {
								await upsertSubscription({
									...s,
									reminderTime: time,
								});
							}
						} finally {
							setSaving(false);
						}
					},
				},
			],
		);
	};

	const applyReminderTimingToAll = (days: number) => {
		if (saving) return;
		Alert.alert(
			"Apply reminder timing",
			`Set reminders to ${days} days before renewal for all active subscriptions?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Apply",
					onPress: async () => {
						setSaving(true);
						try {
							const targets = subscriptions.filter(
								(s) => s.status !== "cancelled",
							);
							for (const s of targets) {
								await upsertSubscription({
									...s,
									reminderDaysBefore: days,
								});
							}
						} finally {
							setSaving(false);
						}
					},
				},
			],
		);
	};

	const toggleNotifications = (next: boolean) => {
		if (saving) return;
		Alert.alert(
			next ? "Enable reminders" : "Disable reminders",
			next
				? "This will turn on renewal reminders for all active subscriptions."
				: "This will turn off renewal reminders for all active subscriptions.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: next ? "Enable" : "Disable",
					style: next ? "default" : "destructive",
					onPress: async () => {
						setSaving(true);
						try {
							await updatePreferences({
								defaultReminderEnabled: next,
							});
							const targets = subscriptions.filter(
								(s) => s.status !== "cancelled",
							);
							for (const s of targets) {
								await upsertSubscription({
									...s,
									reminderEnabled: next,
								});
							}
						} finally {
							setSaving(false);
						}
					},
				},
			],
		);
	};

	return (
		<SafeAreaView edges={["top"]} className="flex-1">
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: contentBottomPadding }}
			>
				<View className="px-4 pt-4">
					<Text className="text-2xl font-poppins-bold text-foreground">
						Profile
					</Text>
				</View>

				<View className="px-4 pt-4">
					<Pressable
						className="bg-white"
						onPress={() => router.push("/edit-profile")}
						hitSlop={10}
						style={({ pressed }) => ({
							opacity: pressed ? 0.92 : 1,
						})}
					>
						<Card className="px-5 py-5">
							<View className="flex-row items-center">
								<Image
									source={{ uri: user.avatarUri }}
									className="size-16 rounded-full"
									resizeMode="cover"
								/>
								<View className="ml-4 flex-1">
									<Text className="text-xl font-poppins-bold text-foreground">
										{user.name}
									</Text>
									<Text className="mt-1 text-sm font-poppins-medium text-foreground/60">
										Tap to edit profile
									</Text>
								</View>
								<Ionicons
									name="pencil"
									size={18}
									color="#94a3b8"
								/>
							</View>
						</Card>
					</Pressable>
				</View>

				<Section title="Overview">
					<View className="flex-row gap-3 px-4 py-4">
						<View className="flex-1 rounded-2xl bg-black/5 px-4 py-3">
							<Text className="text-xs font-poppins-semibold text-foreground/60">
								Active subscriptions
							</Text>
							<Text className="mt-1 text-xl font-poppins-bold text-foreground">
								{overview.active}
							</Text>
						</View>
						<View className="flex-1 rounded-2xl bg-black/5 px-4 py-3">
							<Text className="text-xs font-poppins-semibold text-foreground/60">
								Monthly spend
							</Text>
							<Text className="mt-1 text-xl font-poppins-bold text-foreground">
								{currencySymbol}
								{Math.round(overview.monthly).toLocaleString(
									"en-IN",
								)}
							</Text>
						</View>
						<View className="flex-1 rounded-2xl bg-black/5 px-4 py-3">
							<Text className="text-xs font-poppins-semibold text-foreground/60">
								Yearly projection
							</Text>
							<Text className="mt-1 text-xl font-poppins-bold text-foreground">
								{currencySymbol}
								{Math.round(overview.yearly).toLocaleString(
									"en-IN",
								)}
							</Text>
						</View>
					</View>
				</Section>

				<Section title="Preferences">
					<Row
						icon="cash-outline"
						label="Currency selection"
						subLabel="Saved on this device"
						right={
							<PopoverSelect
								value={currency}
								options={CurrencyOptions}
								onChange={(next) => {
									updatePreferences({ currency: next });
								}}
							/>
						}
					/>
					<Divider />
					<Row
						icon="time-outline"
						label="Reminder lead time"
						subLabel="Days before renewal (capped per billing cycle)"
						right={
							<PopoverSelect
								value={reminderDaysBefore}
								options={[
									{ key: "1", label: "1 day" },
									{ key: "2", label: "2 days" },
									{ key: "3", label: "3 days" },
									{ key: "5", label: "5 days" },
									{ key: "7", label: "7 days" },
								]}
								onChange={(next) => {
									updatePreferences({
										defaultReminderDaysBefore: Number(next),
									});
									applyReminderTimingToAll(Number(next));
								}}
							/>
						}
					/>
					<View className="px-4 pb-2">
						<TimeField
							label="Reminder time"
							subLabel={`Default: ${formatReminderTimeDisplay(reminderTime)} — applies to new subscriptions`}
							value={reminderTime}
							onChange={(next) => {
								updatePreferences({ defaultReminderTime: next });
								applyReminderTimeToAll(next);
							}}
						/>
					</View>
					<Divider />
					<Row
						icon="notifications-outline"
						label="Notification settings"
						subLabel="Renewal reminders"
						right={
							<Switch
								disabled={saving}
								value={notificationsEnabled}
								onValueChange={toggleNotifications}
							/>
						}
					/>
					<Divider />
					<Row
						icon="color-palette-outline"
						label="Theme"
						subLabel="System default with manual override"
						right={
							<PopoverSelect
								value={themeMode}
								options={[
									{ key: "system", label: "System" },
									{ key: "light", label: "Light" },
									{ key: "dark", label: "Dark" },
								]}
								onChange={(next) => {
									updatePreferences({
										themeMode: next as ThemeMode,
									});
								}}
							/>
						}
					/>
				</Section>

				<Section title="Subscription Management">
					<Row
						icon="pricetag-outline"
						label="Manage services"
						subLabel={`${services.length} services`}
						onPress={() => router.push("/manage-services")}
					/>
					<Divider />
					<Row
						icon="archive-outline"
						label="Archived subscriptions"
						subLabel={`${archivedCount} archived`}
						onPress={() =>
							router.push({
								pathname: "/(drawer)/(tabs)/subscriptions",
								params: { status: "cancelled" },
							})
						}
					/>
					<Divider />
					<Row
						icon="flask-outline"
						label="Trial subscriptions"
						subLabel={`${trialCount} trials`}
						onPress={() =>
							router.push({
								pathname: "/(drawer)/(tabs)/subscriptions",
								params: { status: "trial" },
							})
						}
					/>
				</Section>

				<Section title="Data & Storage">
					<Row
						icon="download-outline"
						label="Export data"
						subLabel="Share JSON export"
						onPress={onExport}
					/>
					<Divider />
					<Row
						icon="cloud-upload-outline"
						label="Backup & restore"
						subLabel="Coming later"
						disabled
					/>
					<Divider />
					<Row
						icon="trash-outline"
						label="Clear notification history"
						subLabel="Deletes in-app notification list"
						onPress={() => {
							Alert.alert(
								"Clear notifications",
								"This will remove all notifications from this device.",
								[
									{ text: "Cancel", style: "cancel" },
									{
										text: "Clear",
										style: "destructive",
										onPress: async () => {
											setSaving(true);
											try {
												await clearAllNotifications();
											} finally {
												setSaving(false);
											}
										},
									},
								],
							);
						}}
					/>
				</Section>

				<Section title="Premium (Later)">
					<Row
						icon="sparkles-outline"
						label="Upgrade to premium"
						subLabel="Coming later"
						disabled
					/>
					<Divider />
					<Row
						icon="list-outline"
						label="Premium features list"
						subLabel="Coming later"
						disabled
					/>
				</Section>

				<Section title="Support">
					<Row
						icon="chatbubble-ellipses-outline"
						label="Send feedback"
						subLabel="Email us"
						onPress={async () => {
							const url =
								"mailto:support@recur.app?subject=Recur%20Feedback";
							const can = await Linking.canOpenURL(url);
							if (!can) {
								Alert.alert(
									"Not available",
									"Email app not configured.",
								);
								return;
							}
							await Linking.openURL(url);
						}}
					/>
					<Divider />
					<Row
						icon="star-outline"
						label="Rate app"
						subLabel="Coming later"
						onPress={() => {
							Alert.alert(
								"Rate app",
								"Store link will be added later.",
							);
						}}
					/>
					<Divider />
					<Row
						icon="shield-checkmark-outline"
						label="Privacy policy"
						subLabel="Coming later"
						onPress={() => {
							Alert.alert(
								"Privacy policy",
								"Link will be added later.",
							);
						}}
					/>
					<Divider />
					<Row
						icon="document-text-outline"
						label="Terms & conditions"
						subLabel="Coming later"
						onPress={() => {
							Alert.alert(
								"Terms & conditions",
								"Link will be added later.",
							);
						}}
					/>
				</Section>
			</ScrollView>
		</SafeAreaView>
	);
}
