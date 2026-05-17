import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Text, View } from "react-native";

export type OnboardingHighlightItem = {
	label: string;
	icon: React.ComponentProps<typeof Ionicons>["name"];
};

export default function OnboardingHighlights({
	items,
	title = "What this step adds",
}: {
	items: OnboardingHighlightItem[];
	title?: string;
}) {
	if (!items.length) return null;

	return (
		<View className="mt-5 rounded-2xl bg-slate-100/70 px-4 py-4">
			<Text className="text-xs font-poppins-bold uppercase tracking-widest text-foreground/50">
				{title}
			</Text>
			<View className="mt-3 gap-2.5">
				{items.map((item) => (
					<View
						key={item.label}
						className="flex-row items-start rounded-xl bg-white/80 px-3 py-2.5"
					>
						<View className="size-6 items-center justify-center rounded-lg bg-blue-50">
							<Ionicons
								name={item.icon}
								size={14}
								color="#2563EB"
							/>
						</View>
						<Text className="ml-2 flex-1 text-sm leading-6 font-poppins-medium text-foreground/70">
							{item.label}
						</Text>
					</View>
				))}
			</View>
		</View>
	);
}
