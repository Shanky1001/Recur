import React from "react";
import { Text, View } from "react-native";

import type { SubscriptionStatus } from "@/src/components/subscriptions/SubscriptionCard";

export default function SubscriptionStatusPill({
	status,
}: {
	status: SubscriptionStatus;
}) {
	const label =
		status === "trial"
			? "Free Trial"
			: status === "cancelled"
				? "Cancelled"
				: status === "paused"
					? "Paused"
					: "Active";
	const pillClassName =
		status === "trial"
			? "bg-blue-50"
			: status === "cancelled"
				? "bg-slate-100"
				: status === "paused"
					? "bg-orange-50"
					: "bg-green-50";
	const textClassName =
		status === "trial"
			? "text-subscription"
			: status === "cancelled"
				? "text-slate-600"
				: status === "paused"
					? "text-orange-600"
					: "text-success";

	return (
		<View className={`rounded-lg px-3 py-2 ${pillClassName}`}>
			<Text className={`text-sm font-poppins-bold ${textClassName}`}>
				{label}
			</Text>
		</View>
	);
}
