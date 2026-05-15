import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Text, View } from "react-native";

import { PrimaryButton } from "@/src/components/onboarding/OnboardingButtons";
import Card from "@/src/components/ui/Card";

export default function OnboardingInfoCard({
	title,
	description,
	icon,
	actionLabel,
	onAction,
}: {
	title: string;
	description: string;
	icon?: React.ComponentProps<typeof Ionicons>["name"];
	actionLabel?: string;
	onAction?: () => void;
}) {
	const showAction = Boolean(actionLabel && onAction);

	return (
		<Card className="px-5 py-5">
			{icon ? (
				<View className="flex-row items-center">
					<Ionicons name={icon} size={22} color="#2563EB" />
					<Text className="ml-3 text-xl font-poppins-bold text-foreground">
						{title}
					</Text>
				</View>
			) : (
				<Text className="text-xl font-poppins-bold text-foreground">
					{title}
				</Text>
			)}

			<Text className="mt-2 text-sm font-poppins-medium text-foreground/60">
				{description}
			</Text>

			{showAction ? (
				<View className="mt-5">
					<PrimaryButton label={actionLabel!} onPress={onAction!} />
				</View>
			) : null}
		</Card>
	);
}
