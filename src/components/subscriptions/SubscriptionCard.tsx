import type React from "react";
import { Image, Text, View } from "react-native";

import Card from "@/src/components/ui/Card";
import { formatDateLong } from "@/src/utils/helper";

export type SubscriptionStatus = "active" | "trial" | "paused" | "cancelled";

export type Subscription = {
	id: string;
	name: string;
	category: string;
	status: SubscriptionStatus;
	planName: string;
	pricePerMonth: number;
	currencySymbol: string;
	billingCycle?: "Monthly" | "Yearly" | "Weekly";
	pricePerBillingCycle?: number;
	paymentMethod?: string;
	reminderEnabled?: boolean;
	reminderDaysBefore?: number;
	nextPaymentDate: string;
	logoUri?: string;
};

function StatusPill({ status }: { status: SubscriptionStatus }) {
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

export default function SubscriptionCard({
	subscription,
}: {
	subscription: Subscription;
}) {
	return (
		<Card
			elevated={false}
			className="mx-4 rounded-3xl border border-border px-4 py-4"
		>
			<View className="flex-row items-center justify-between">
				<View className="flex-row items-center">
					<View className="size-12 overflow-hidden rounded-xl bg-white">
						{subscription.logoUri ? (
							<Image
								source={{ uri: subscription.logoUri }}
								className="size-12"
								resizeMode="contain"
							/>
						) : (
							<View className="size-12 items-center justify-center rounded-xl bg-foreground">
								<Text className="text-lg font-poppins-bold text-white">
									{subscription.name
										.slice(0, 1)
										.toUpperCase()}
								</Text>
							</View>
						)}
					</View>
					<Text className="ml-4 text-xl font-poppins-bold text-foreground">
						{subscription.name}
					</Text>
				</View>
				<StatusPill status={subscription.status} />
			</View>

			<View className="mt-4 h-px bg-border/60" />

			<View className="mt-4 flex-row justify-between">
				<View className="flex-1 pr-4">
					<Text className="text-base font-poppins-medium text-foreground/60">
						Plan
					</Text>
					<Text className="mt-1 text-base font-poppins-bold text-foreground">
						{subscription.planName} – {subscription.currencySymbol}
						{subscription.pricePerBillingCycle ??
							subscription.pricePerMonth}
						/
						{subscription.billingCycle === "Yearly"
							? "yr"
							: subscription.billingCycle === "Weekly"
								? "wk"
								: "mo"}
					</Text>
				</View>
				<View className="flex-1 items-end">
					<Text className="text-base font-poppins-medium text-foreground/60">
						Next payment
					</Text>
					<Text className="mt-1 text-base font-poppins-bold text-foreground">
						{formatDateLong(subscription.nextPaymentDate)}
					</Text>
				</View>
			</View>
		</Card>
	);
}
