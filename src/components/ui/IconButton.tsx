import type React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, Text, View } from "react-native";

export type IconButtonProps = {
	icon: React.ReactNode;
	onPress?: () => void;
	badgeCount?: number;
	badgeMax?: number;
	size?: number;
	style?: StyleProp<ViewStyle>;
	badgeStyle?: StyleProp<ViewStyle>;
};

export default function IconButton({
	icon,
	onPress,
	badgeCount,
	badgeMax = 99,
	size = 44,
	style,
	badgeStyle,
}: IconButtonProps) {
	const showBadge = typeof badgeCount === "number" && badgeCount > 0;
	const badgeText =
		showBadge && badgeCount
			? badgeCount > badgeMax
				? `${badgeMax}+`
				: String(badgeCount)
			: "";

	return (
		<Pressable
			onPress={onPress}
			hitSlop={10}
			style={({ pressed }) => [
				{
					opacity: pressed ? 0.7 : 1,
				},
				style,
			]}
		>
			<View
				className="items-center justify-center rounded-full bg-white"
				style={{ width: size, height: size }}
			>
				{icon}
				{showBadge ? (
					<View
						className="absolute -right-1 -top-1 items-center justify-center rounded-full bg-destructive"
						style={[
							{ minWidth: 18, height: 18, paddingHorizontal: 5 },
							badgeStyle,
						]}
					>
						<Text className="text-xs font-poppins-bold text-white">
							{badgeText}
						</Text>
					</View>
				) : null}
			</View>
		</Pressable>
	);
}
