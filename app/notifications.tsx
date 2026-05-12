import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import NotificationActionsSheet, {
	type NotificationAction,
} from "@/src/components/notifications/NotificationActionsSheet";
import NotificationCard from "@/src/components/notifications/NotificationCard";
import { useAppActions, useNotificationsList } from "@/src/state/appState";
import { router } from "expo-router";
import { useMemo, useState } from "react";

import type { Notification } from "@/src/data/dummy";

function HeaderButton({
	label,
	onPress,
}: {
	label: string;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			className="rounded-lg border border-white/20 bg-white/10 px-3 py-2"
			style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
		>
			<Text className="text-xs font-poppins-bold text-white">
				{label}
			</Text>
		</Pressable>
	);
}

export default function NotificationsScreen() {
	const insets = useSafeAreaInsets();
	const notifications = useNotificationsList();
	const {
		clearAllNotifications,
		markAllNotificationsRead,
		deleteNotification,
		markNotificationRead,
		snoozeNotification,
		cancelSubscription,
	} = useAppActions();
	const [selected, setSelected] = useState<Notification | null>(null);
	const action = (a: NotificationAction) => a;

	const actions = useMemo<NotificationAction[]>(() => {
		if (!selected) return [];

		if (selected.type === "trial") {
			const subscriptionId = selected.subscriptionId;
			return [
				action({
					key: "remind",
					label: "Remind me later",
					subtitle: "We'll remind you again tomorrow",
					iconName: "time-outline",
					onPress: () => {
						snoozeNotification(selected.id, 24);
						setSelected(null);
					},
				}),
				...(subscriptionId
					? [
							action({
								key: "cancel",
								label: "Mark as cancelled",
								subtitle:
									"Stop future renewals for this subscription",
								iconName: "close-circle-outline",
								variant: "danger",
								onPress: () => {
									cancelSubscription(subscriptionId);
									markNotificationRead(selected.id);
									setSelected(null);
								},
							}),
							action({
								key: "open",
								label: "Open subscription",
								subtitle: "View details",
								iconName: "arrow-forward-circle-outline",
								onPress: () => {
									markNotificationRead(selected.id);
									setSelected(null);
									router.push({
										pathname: "/subscriptions/[id]",
										params: { id: subscriptionId },
									});
								},
							}),
						]
					: []),
			];
		}

		if (selected.type === "billing") {
			const subscriptionId = selected.subscriptionId;
			return [
				action({
					key: "paid",
					label: "Mark as paid",
					subtitle: "Remove this reminder",
					iconName: "checkmark-circle-outline",
					onPress: () => {
						markNotificationRead(selected.id);
						setSelected(null);
					},
				}),
				...(subscriptionId
					? [
							action({
								key: "cancel",
								label: "Mark as cancelled",
								subtitle:
									"Stop future renewals for this subscription",
								iconName: "close-circle-outline",
								variant: "danger",
								onPress: () => {
									cancelSubscription(subscriptionId);
									markNotificationRead(selected.id);
									setSelected(null);
								},
							}),
						]
					: []),
			];
		}

		// No actions for generic info/insight.
		return [];
	}, [cancelSubscription, deleteNotification, selected, snoozeNotification]);

	const onCardPress = (n: Notification) => {
		// Only open actions for trial/billing. Others remain simple "mark read".
		if (n.type === "trial" || n.type === "billing") {
			markNotificationRead(n.id);
			setSelected(n);
			return;
		}
		markNotificationRead(n.id);
	};

	return (
		<LinearGradient
			colors={["#3C6BFF", "#2446FF", "#1E3AFF"]}
			start={{ x: 0.1, y: 0.0 }}
			end={{ x: 0.9, y: 1.0 }}
			style={{ flex: 1, paddingTop: insets.top }}
		>
			<View className="px-5 pb-2 pt-1">
				<View className="flex-row items-center justify-between">
					<Pressable onPress={() => router.back()} hitSlop={10}>
						<Ionicons name="chevron-back" size={24} color="white" />
					</Pressable>
					<Text className="text-lg font-poppins-bold text-white">
						Notifications
					</Text>
					<View className="w-6" />
				</View>

				<View className="mt-3 flex-row gap-3">
					<HeaderButton
						label="Clear all"
						onPress={clearAllNotifications}
					/>
					<HeaderButton
						label="Mark all read"
						onPress={markAllNotificationsRead}
					/>
				</View>
			</View>

			<View className="flex-1 overflow-hidden rounded-t-3xl bg-white pt-2">
				{notifications.length === 0 ? (
					<View className="flex-1 items-center justify-center px-6">
						<Ionicons
							name="notifications-off-outline"
							size={46}
							color="#94a3b8"
						/>
						<Text className="mt-4 text-lg font-poppins-bold text-foreground">
							{"You're all caught up"}
						</Text>
						<Text className="mt-2 text-center text-sm font-poppins-medium text-foreground/60">
							No notifications to show right now.
						</Text>
					</View>
				) : (
					<ScrollView
						showsVerticalScrollIndicator={false}
						contentContainerStyle={{
							paddingBottom: Math.max(insets.bottom, 16),
							paddingTop: 6,
						}}
					>
						{notifications.map((n) => (
							<NotificationCard
								key={n.id}
								notification={n}
								onPress={() => onCardPress(n)}
								onDelete={() => deleteNotification(n.id)}
							/>
						))}
					</ScrollView>
				)}
			</View>

			<NotificationActionsSheet
				notification={selected}
				actions={actions}
				onClose={() => setSelected(null)}
			/>
		</LinearGradient>
	);
}
