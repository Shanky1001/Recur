import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import NotificationCard from "@/src/components/notifications/NotificationCard";
import { useAppActions, useNotificationsList } from "@/src/state/appState";
import { router } from "expo-router";

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
			className="rounded-xl border border-white/20 bg-white/10 px-4 py-2"
			style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
		>
			<Text className="text-sm font-poppins-bold text-white">
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
	} = useAppActions();

	return (
		<LinearGradient
			colors={["#3C6BFF", "#2446FF", "#1E3AFF"]}
			start={{ x: 0.1, y: 0.0 }}
			end={{ x: 0.9, y: 1.0 }}
			style={{ flex: 1, paddingTop: insets.top }}
		>
			<View className="px-5 pb-4 pt-2">
				<View className="flex-row items-center justify-between">
					<Pressable onPress={() => router.back()} hitSlop={10}>
						<Ionicons name="chevron-back" size={26} color="white" />
					</Pressable>
					<Text className="text-xl font-poppins-bold text-white">
						Notifications
					</Text>
					<View className="w-6" />
				</View>

				<View className="mt-4 flex-row gap-3">
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

			<View className="flex-1 overflow-hidden rounded-t-3xl bg-white pt-4">
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
							paddingTop: 8,
						}}
					>
						{notifications.map((n) => (
							<NotificationCard
								key={n.id}
								notification={n}
								onPress={() => markNotificationRead(n.id)}
								onDelete={() => deleteNotification(n.id)}
							/>
						))}
					</ScrollView>
				)}
			</View>
		</LinearGradient>
	);
}
