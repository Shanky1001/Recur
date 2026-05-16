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
	const progress = Math.max(0, Math.min(1, step / total));

	return (
		<View className="px-4 pt-2">
			<View className="flex-row items-center justify-between">
				<Pressable
					onPress={onBack}
					disabled={!onBack}
					hitSlop={10}
					className="size-9 items-center justify-center rounded-full border border-slate-200 bg-white"
					style={({ pressed }) => ({
						opacity: !onBack ? 0 : pressed ? 0.75 : 1,
					})}
				>
					<Ionicons name="chevron-back" size={20} color="#0f172a" />
				</Pressable>
				<Text className="text-xs font-poppins-semibold uppercase tracking-widest text-foreground/50">
					Step {step} of {total}
				</Text>
				{showSkip ? (
					<Pressable
						onPress={onSkip}
						hitSlop={10}
						className="rounded-full border border-slate-200 bg-white px-3 py-1.5"
					>
						<Text className="text-sm font-poppins-semibold text-blue-600">
							Skip
						</Text>
					</Pressable>
				) : (
					<View style={{ width: 36 }} />
				)}
			</View>

			<View className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
				<View
					className="h-2 rounded-full bg-blue-600"
					style={{ width: `${progress * 100}%` }}
				/>
			</View>
		</View>
	);
}
