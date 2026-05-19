import Ionicons from "@expo/vector-icons/Ionicons";
import { useColorScheme } from "nativewind";
import type React from "react";
import {
	Image,
	Text,
	View,
	useColorScheme as useSystemColorScheme,
} from "react-native";

import IconButton from "@/src/components/ui/IconButton";

export type HomeHeaderProps = {
	userName: string;
	avatarUri: string;
	notificationCount?: number;
	onPressNotifications?: () => void;
	onPressMenu?: () => void;
};

export default function HomeHeader({
	userName,
	avatarUri,
	notificationCount = 0,
	onPressNotifications,
	onPressMenu,
}: HomeHeaderProps) {
	const { colorScheme } = useColorScheme();
	const systemScheme = useSystemColorScheme();
	const effectiveScheme =
		colorScheme === "system" ? (systemScheme ?? "light") : colorScheme;
	const iconColor = effectiveScheme === "dark" ? "#f8fafc" : "#081126";

	return (
		<View className="flex-row items-center justify-between px-5 pb-4 pt-2">
			<View className="mr-3 flex-1 flex-row items-center">
				<Image
					source={{ uri: avatarUri }}
					className="size-12 rounded-full"
					resizeMode="cover"
				/>
				<Text
					className="ml-4 shrink text-2xl font-poppins-bold text-white"
					numberOfLines={1}
					ellipsizeMode="tail"
				>
					{userName}
				</Text>
			</View>

			<View className="flex-row items-center gap-3">
				<IconButton
					onPress={onPressNotifications}
					badgeCount={notificationCount}
					icon={
						<Ionicons
							name="notifications-outline"
							size={22}
							color={iconColor}
						/>
					}
				/>

				{__DEV__ && (
					<IconButton
						onPress={onPressMenu}
						icon={
							<Ionicons name="menu" size={22} color={iconColor} />
						}
					/>
				)}
			</View>
		</View>
	);
}
