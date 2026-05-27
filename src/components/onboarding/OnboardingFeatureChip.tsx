import React from "react";
import { Text, View } from "react-native";

export default function OnboardingFeatureChip({ label }: { label: string }) {
	return (
		<View className="rounded-full bg-slate-100 px-3 py-1.5">
			<Text className="text-xs font-poppins-semibold text-black/70">
				{label}
			</Text>
		</View>
	);
}
