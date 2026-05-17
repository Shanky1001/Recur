import Ionicons from "@expo/vector-icons/Ionicons";
import {
	DrawerContentScrollView,
	type DrawerContentComponentProps,
} from "@react-navigation/drawer";
import React, { useMemo } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useUser } from "@/src/state/appState";
import { router } from "expo-router";

type DrawerItem = {
	key: string;
	label: string;
	iconName: React.ComponentProps<typeof Ionicons>["name"];
	kind?: "default" | "premium";
	onPress: () => void;
};

export default function AppDrawerContent(props: DrawerContentComponentProps) {
	const insets = useSafeAreaInsets();
	const user = useUser();

	const items = useMemo<DrawerItem[]>(() => {
		return [
			{
				key: "premium",
				label: "Get Premium",
				iconName: "sparkles-outline",
				kind: "premium",
				onPress: () => router.push("/premium"),
			},
			{
				key: "records",
				label: "Records",
				iconName: "bar-chart-outline",
				onPress: () => router.push("/records"),
			},
			{
				key: "cards",
				label: "Cards",
				iconName: "card-outline",
				onPress: () => router.push("/cards"),
			},
			{
				key: "receipts",
				label: "Receipts",
				iconName: "receipt-outline",
				onPress: () => router.push("/receipts"),
			},
			{
				key: "settings",
				label: "Settings",
				iconName: "settings-outline",
				onPress: () => router.push("/settings"),
			},
		];
	}, []);

	return (
		<View
			className="flex-1"
			style={{ paddingTop: Math.max(insets.top, 16) }}
		>
			<DrawerContentScrollView
				{...props}
				contentContainerStyle={{
					paddingBottom: Math.max(insets.bottom, 16),
				}}
			>
				<View className="px-5 pb-4">
					<View className="flex-row items-center justify-between">
						<View className="flex-row items-center">
							<Image
								source={{ uri: user.avatarUri }}
								className="size-14 rounded-full"
								resizeMode="cover"
							/>
							<Text
								className="ml-4 text-2xl font-poppins-bold shrink text-pink-300"
								numberOfLines={1}
								ellipsizeMode="tail"
							>
								{user.name}
							</Text>
						</View>

						<Pressable
							onPress={() => {
								props.navigation.closeDrawer();
								router.push("/edit-profile");
							}}
							hitSlop={10}
						>
							<Ionicons name="pencil" size={18} color="#cbd5e1" />
						</Pressable>
					</View>
				</View>

				<View className="h-px bg-white/10" />

				<View className="px-3 py-4">
					{items.map((item) => {
						const isPremium = item.kind === "premium";
						return (
							<Pressable
								key={item.key}
								onPress={() => {
									props.navigation.closeDrawer();
									item.onPress();
								}}
								className="flex-row items-center rounded-2xl px-4 py-4"
								style={({ pressed }) => ({
									opacity: pressed ? 0.75 : 1,
								})}
							>
								<Ionicons
									name={item.iconName}
									size={22}
									color={isPremium ? "#f59e0b" : "#f472b6"}
								/>
								<Text
									className={
										isPremium
											? "ml-5 text-lg font-poppins-bold text-amber-400"
											: "ml-5 text-lg font-poppins-medium text-white"
									}
								>
									{item.label}
								</Text>
							</Pressable>
						);
					})}
				</View>
			</DrawerContentScrollView>
		</View>
	);
}
