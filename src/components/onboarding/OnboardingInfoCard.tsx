import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Text, View } from "react-native";

import { PrimaryButton } from "@/src/components/onboarding/OnboardingButtons";
import Card from "@/src/components/ui/Card";

export default function OnboardingInfoCard({
	title,
	description,
	icon,
	highlights,
	actionLabel,
	onAction,
}: {
	title: string;
	description: string;
	icon?: React.ComponentProps<typeof Ionicons>["name"];
	highlights?: {
		label: string;
		icon: React.ComponentProps<typeof Ionicons>["name"];
	}[];
	actionLabel?: string;
	onAction?: () => void;
}) {
	const showAction = Boolean(actionLabel && onAction);

	return (
		<Card className="border border-slate-100 px-5 py-6 flex-1">
			{icon ? (
				<View className="flex-row items-center">
					<View className="size-11 items-center justify-center rounded-2xl bg-blue-50">
						<Ionicons name={icon} size={22} color="#2563EB" />
					</View>
					<Text className="ml-3 flex-1 text-xl font-poppins-bold text-foreground">
						{title}
					</Text>
				</View>
			) : (
				<Text className="text-xl font-poppins-bold text-foreground">
					{title}
				</Text>
			)}

			<Text className="mt-3 text-sm leading-6 font-poppins-medium text-foreground/60">
				{description}
			</Text>

			{highlights?.length ? (
				<View className="mt-5 rounded-2xl bg-slate-100/70 px-4 py-4">
					<Text className="text-xs font-poppins-bold uppercase tracking-widest text-foreground/50">
						What you get
					</Text>
					<View className="mt-3 gap-2.5">
						{highlights.map((item) => (
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
			) : null}

			{showAction ? (
				<View className="mt-6">
					<PrimaryButton label={actionLabel!} onPress={onAction!} />
				</View>
			) : null}
		</Card>
	);
}
