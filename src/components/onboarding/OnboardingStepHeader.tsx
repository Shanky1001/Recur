import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, Text, View } from "react-native";

export default function OnboardingStepHeader({
	step,
	total,
	onBack,
	onSkip,
	showSkip,
}: {
	step: number;
	total: number;
	onBack?: () => void;
	onSkip: () => void;
	showSkip: boolean;
}) {
	return (
		<View className="px-4 pt-2">
			<View className="flex-row items-center justify-between">
				<Pressable
					onPress={onBack}
					disabled={!onBack}
					hitSlop={10}
					style={({ pressed }) => ({
						opacity: !onBack ? 0 : pressed ? 0.7 : 1,
					})}
				>
					<Ionicons name="chevron-back" size={26} color="#0f172a" />
				</Pressable>
				<Text className="text-xs font-poppins-semibold text-foreground/50">
					{step}/{total}
				</Text>
				{showSkip ? (
					<Pressable onPress={onSkip} hitSlop={10}>
						<Text className="text-sm font-poppins-semibold text-blue-600">
							Skip
						</Text>
					</Pressable>
				) : (
					<View style={{ width: 36 }} />
				)}
			</View>
		</View>
	);
}
