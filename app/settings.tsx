import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
	Alert,
	Linking,
	Pressable,
	ScrollView,
	Share,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Card from "@/src/components/ui/Card";
import { useAppActions, useAppState } from "@/src/state/appState";

function Divider() {
	return (
		<View style={{ height: 1, backgroundColor: "rgba(8, 17, 38, 0.08)" }} />
	);
}

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<View className="px-4 pt-5">
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
	onPress,
	variant,
	right,
	disabled,
}: {
	icon: React.ComponentProps<typeof Ionicons>["name"];
	label: string;
	subLabel?: string;
	onPress?: () => void;
	variant?: "default" | "danger";
	right?: React.ReactNode;
	disabled?: boolean;
}) {
	const color = variant === "danger" ? "#ef4444" : "#2563EB";
	const bg =
		variant === "danger" ? "rgba(239,68,68,0.08)" : "rgba(37,99,235,0.08)";

	const content = (
		<View className="flex-row items-center px-4 py-4">
			<View
				className="size-11 items-center justify-center rounded-2xl"
				style={{ backgroundColor: bg }}
			>
				<Ionicons name={icon} size={20} color={color} />
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

export default function SettingsScreen() {
	const insets = useSafeAreaInsets();
	const { state, unreadCount } = useAppState();
	const {
		resetLocalData,
		clearAllNotifications,
		markAllNotificationsRead,
		resyncReminders,
	} = useAppActions();
	const [busy, setBusy] = useState<
		null | "reset" | "export" | "clear" | "markRead" | "resync"
	>(null);

	const onReset = () => {
		if (busy) return;
		Alert.alert(
			"Reset local data",
			"This will wipe your local subscriptions & notifications and re-seed from dummy data.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Reset",
					style: "destructive",
					onPress: async () => {
						setBusy("reset");
						try {
							await resetLocalData();
						} finally {
							setBusy(null);
						}
					},
				},
			],
		);
	};

	const onExport = async () => {
		if (busy) return;
		setBusy("export");
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
		} finally {
			setBusy(null);
		}
	};

	const onClearNotifications = () => {
		if (busy) return;
		Alert.alert(
			"Clear notifications",
			"This clears the in-app notification list.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Clear",
					style: "destructive",
					onPress: async () => {
						setBusy("clear");
						try {
							await clearAllNotifications();
						} finally {
							setBusy(null);
						}
					},
				},
			],
		);
	};

	const onMarkAllRead = async () => {
		if (busy) return;
		setBusy("markRead");
		try {
			await markAllNotificationsRead();
		} finally {
			setBusy(null);
		}
	};

	const onResyncReminders = async () => {
		if (busy) return;
		setBusy("resync");
		try {
			await resyncReminders();
			Alert.alert("Resynced", "Reminder schedules were refreshed.");
		} finally {
			setBusy(null);
		}
	};

	return (
		<View className="flex-1 bg-gray-100" style={{ paddingTop: insets.top }}>
			<View className="px-4 pb-3 pt-2">
				<View className="flex-row items-center">
					<Pressable onPress={() => router.back()} hitSlop={10}>
						<Ionicons
							name="chevron-back"
							size={26}
							color="#0f172a"
						/>
					</Pressable>
					<Text className="ml-2 text-2xl font-poppins-bold text-foreground">
						Settings
					</Text>
				</View>
				<Text className="mt-1 text-sm font-poppins-medium text-foreground/60">
					App preferences and device actions.
				</Text>
			</View>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingBottom: Math.max(insets.bottom, 18),
				}}
			>
				<Section title="Notifications">
					<Row
						icon="refresh-outline"
						label="Resync renewal reminders"
						subLabel="Rebuilds scheduled reminders from subscriptions"
						onPress={onResyncReminders}
						disabled={busy !== null}
					/>
					<Divider />
					<Row
						icon="mail-open-outline"
						label="Mark all as read"
						subLabel={`${unreadCount} unread`}
						onPress={onMarkAllRead}
						disabled={busy !== null}
					/>
					<Divider />
					<Row
						icon="trash-outline"
						label="Clear notifications"
						subLabel={`${state.notifications.length} total`}
						variant="danger"
						onPress={onClearNotifications}
						disabled={busy !== null}
					/>
				</Section>

				<Section title="Data & Storage">
					<Row
						icon="download-outline"
						label="Export data"
						subLabel="Share JSON export"
						onPress={onExport}
						disabled={busy !== null}
					/>
					{__DEV__ ? (
						<>
							<Divider />
							<Row
								icon="warning-outline"
								label="Reset local data"
								subLabel="Wipes SQLite and re-seeds from dummy.json"
								variant="danger"
								onPress={onReset}
								disabled={busy !== null}
							/>
						</>
					) : null}
				</Section>

				<Section title="Support">
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
					<Divider />
					<Row
						icon="chatbubble-ellipses-outline"
						label="Contact support"
						subLabel="Email"
						onPress={async () => {
							const url =
								"mailto:support@recur.app?subject=Recur%20Support";
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
				</Section>
			</ScrollView>
		</View>
	);
}
