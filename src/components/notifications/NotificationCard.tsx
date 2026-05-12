import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import Card from "@/src/components/ui/Card";
import type { Notification, NotificationType } from "@/src/data/dummy";

function typeIcon(
	type: NotificationType,
): React.ComponentProps<typeof Ionicons>["name"] {
	switch (type) {
		case "billing":
			return "card-outline";
		case "trial":
			return "timer-outline";
		case "insight":
			return "analytics-outline";
		case "info":
		default:
			return "information-circle-outline";
	}
}

function formatShortTime(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	return date.toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export type NotificationCardProps = {
	notification: Notification;
	onPress?: () => void;
	onDelete: () => void;
};

export default function NotificationCard({
	notification,
	onPress,
	onDelete,
}: NotificationCardProps) {
	return (
		<Swipeable
			renderRightActions={() => (
				<Pressable
					onPress={onDelete}
					className="mx-4 mb-3 items-center justify-center rounded-3xl bg-destructive px-6"
				>
					<Ionicons name="trash-outline" size={22} color="white" />
					<Text className="mt-1 text-sm font-poppins-bold text-white">
						Delete
					</Text>
				</Pressable>
			)}
			overshootRight={false}
		>
			<Card
				elevated={false}
				className="mx-4 mb-3 rounded-3xl border border-border px-4 py-4"
			>
				<Pressable
					onPress={onPress}
					style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
				>
					<View className="flex-row">
						<View
							className={
								notification.read
									? "mr-4 size-12 items-center justify-center rounded-2xl bg-slate-100"
									: "mr-4 size-12 items-center justify-center rounded-2xl bg-blue-50"
							}
						>
							<Ionicons
								name={typeIcon(notification.type)}
								size={22}
								color={
									notification.read ? "#334155" : "#2446FF"
								}
							/>
						</View>

						<View className="flex-1">
							<View className="flex-row items-start justify-between">
								<Text
									className={
										notification.read
											? "flex-1 pr-3 text-base font-poppins-bold text-foreground"
											: "flex-1 pr-3 text-base font-poppins-bold text-foreground"
									}
								>
									{notification.title}
								</Text>
								<Text className="text-xs font-poppins-medium text-foreground/50">
									{formatShortTime(notification.createdAt)}
								</Text>
							</View>

							<Text className="mt-2 text-sm font-poppins-medium text-foreground/70">
								{notification.message}
							</Text>

							{notification.read ? null : (
								<View className="mt-3 h-2 w-2 rounded-full bg-accent" />
							)}
						</View>
					</View>
				</Pressable>
			</Card>
		</Swipeable>
	);
}
