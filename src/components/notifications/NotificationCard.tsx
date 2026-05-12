import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import Card from "@/src/components/ui/Card";
import type { Notification, NotificationType } from "@/src/data/dummy";

type Priority = {
	type: NotificationType;
	level: number;
	borderColor: string;
	iconBgUnread: string;
	iconColorUnread: string;
};

// Higher `level` = higher urgency
const PRIORITIES: Priority[] = [
	{
		type: "billing",
		level: 3,
		borderColor: "#ef4444",
		iconBgUnread: "#fee2e2",
		iconColorUnread: "#dc2626",
	},
	{
		type: "trial",
		level: 2,
		borderColor: "#3b82f6",
		iconBgUnread: "#dbeafe",
		iconColorUnread: "#2563eb",
	},
	{
		type: "insight",
		level: 1,
		borderColor: "#a855f7",
		iconBgUnread: "#f3e8ff",
		iconColorUnread: "#7e22ce",
	},
	{
		type: "info",
		level: 0,
		borderColor: "#94a3b8",
		iconBgUnread: "#e2e8f0",
		iconColorUnread: "#334155",
	},
];

function getPriority(type: NotificationType): Priority {
	return (
		PRIORITIES.find((p) => p.type === type) ??
		PRIORITIES[PRIORITIES.length - 1]!
	);
}

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
	const priority = getPriority(notification.type);
	const isUnread = !notification.read;
	const iconBg = isUnread ? priority.iconBgUnread : "#f1f5f9";
	const iconColor = isUnread ? priority.iconColorUnread : "#64748b";
	const containerOpacity = notification.read ? 0.62 : 1;
	const borderColor = notification.read
		? "rgba(148,163,184,0.45)"
		: priority.borderColor;
	const borderWidth = notification.read ? 1 : 1.5;

	return (
		<Swipeable
			renderRightActions={() => (
				<Pressable
					onPress={onDelete}
					className="mx-4 mb-2 items-center justify-center rounded-2xl bg-destructive px-4"
					style={{ width: 92 }}
				>
					<Ionicons name="trash-outline" size={20} color="white" />
					<Text className="mt-1 text-xs font-poppins-bold text-white">
						Delete
					</Text>
				</Pressable>
			)}
			overshootRight={false}
		>
			<Card
				elevated={false}
				className="mx-4 mb-2 rounded-2xl border bg-white px-3 py-3"
				style={{ borderColor, borderWidth }}
			>
				<Pressable
					onPress={onPress}
					style={({ pressed }) => ({
						opacity: (pressed ? 0.82 : 1) * containerOpacity,
					})}
				>
					<View className="flex-row">
						<View
							className="mr-3 items-center justify-center rounded-2xl"
							style={{
								width: 40,
								height: 40,
								backgroundColor: iconBg,
							}}
						>
							<Ionicons
								name={typeIcon(notification.type)}
								size={20}
								color={iconColor}
							/>
						</View>

						<View className="flex-1">
							<View className="flex-row items-center justify-between">
								<Text className="flex-1 pr-2 text-sm font-poppins-bold text-foreground">
									{notification.title}
								</Text>
								<View className="flex-row items-center">
									{isUnread ? (
										<View
											className="mr-2 h-2 w-2 rounded-full"
											style={{
												backgroundColor: "#fbbf24",
											}}
										/>
									) : null}
									<Text className="text-[11px] font-poppins-medium text-foreground/50">
										{formatShortTime(
											notification.createdAt,
										)}
									</Text>
								</View>
							</View>

							<Text className="mt-1 text-xs font-poppins-medium text-foreground/70">
								{notification.message}
							</Text>
						</View>
					</View>
				</Pressable>
			</Card>
		</Swipeable>
	);
}
