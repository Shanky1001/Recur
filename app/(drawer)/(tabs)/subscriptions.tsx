import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CategoryChips from "@/src/components/subscriptions/CategoryChips";
import SubscriptionCard from "@/src/components/subscriptions/SubscriptionCard";
import { useTabBarContentPadding } from "@/src/hooks/useTabBarContentPadding";
import { useSubscriptions } from "@/src/state/appState";

export default function SubscriptionsScreen() {
	const insets = useSafeAreaInsets();
	const contentBottomPadding = useTabBarContentPadding(24);
	const { status } = useLocalSearchParams<{ status?: string }>();
	const subscriptions = useSubscriptions();
	const [selectedCategory, setSelectedCategory] = useState("All");

	const categories = useMemo(() => {
		const unique = Array.from(
			new Set(subscriptions.map((s) => s.category)),
		);
		unique.sort((a, b) => a.localeCompare(b));
		return ["All", ...unique];
	}, [subscriptions]);

	const filtered = useMemo(() => {
		let list = subscriptions;
		if (
			status === "trial" ||
			status === "cancelled" ||
			status === "active"
		) {
			list = list.filter((s) => s.status === status);
		}
		if (selectedCategory === "All") return list;
		return list.filter((s) => s.category === selectedCategory);
	}, [subscriptions, selectedCategory, status]);

	return (
		<View className="flex-1" style={{ paddingTop: insets.top }}>
			<View className="flex-row items-center justify-between px-4 py-3">
				<View>
					<Text className="text-2xl font-poppins-bold text-foreground">
						Subscriptions
					</Text>
					{status ? (
						<Text className="mt-0.5 text-xs font-poppins-medium text-foreground/60">
							Filtered: {status}
						</Text>
					) : null}
				</View>
				<Pressable
					onPress={() => router.push("/add-subscription")}
					hitSlop={10}
					className="size-11 items-center justify-center rounded-full border border-border bg-white"
				>
					<Ionicons
						name="add"
						size={24}
						className="text-foreground"
					/>
				</Pressable>
			</View>

			<View className="pb-3">
				{subscriptions.length > 0 && categories.length > 1 ? (
					<CategoryChips
						categories={categories}
						selected={selectedCategory}
						onSelect={setSelectedCategory}
					/>
				) : null}
			</View>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingBottom: contentBottomPadding,
				}}
			>
				{filtered.length === 0 ? (
					<View className="px-6 py-14 items-center">
						<View className="size-16 items-center justify-center rounded-3xl bg-white border border-border">
							<Ionicons
								name="sparkles-outline"
								size={28}
								color="#2563EB"
							/>
						</View>
						<Text className="mt-4 text-xl font-poppins-bold text-foreground">
							{subscriptions.length === 0
								? "No subscriptions yet"
								: "No matching subscriptions"}
						</Text>
						<Text className="mt-2 text-sm font-poppins-medium text-foreground/60 text-center">
							{subscriptions.length === 0
								? "Add your first subscription to start tracking renewals and spend."
								: "Try clearing filters or add a new subscription."}
						</Text>

						<View className="mt-6 w-full">
							<Pressable
								onPress={() => router.push("/add-subscription")}
								hitSlop={10}
								className="rounded-2xl bg-blue-600 px-4 py-4"
								style={({ pressed }) => ({
									opacity: pressed ? 0.9 : 1,
								})}
							>
								<Text className="text-center text-base font-poppins-bold text-white">
									Add subscription
								</Text>
							</Pressable>

							{status || selectedCategory !== "All" ? (
								<Pressable
									onPress={() => {
										setSelectedCategory("All");
										if (status) {
											router.replace(
												"/(drawer)/(tabs)/subscriptions",
											);
										}
									}}
									hitSlop={10}
									className="mt-3 rounded-2xl border border-border bg-white px-4 py-4"
									style={({ pressed }) => ({
										opacity: pressed ? 0.9 : 1,
									})}
								>
									<Text className="text-center text-base font-poppins-semibold text-foreground">
										Clear filters
									</Text>
								</Pressable>
							) : null}
						</View>
					</View>
				) : (
					filtered.map((s) => (
						<View key={s.id} className="mb-4">
							<SubscriptionCard
								subscription={s}
								onPress={() =>
									router.push({
										pathname:
											"/(drawer)/(tabs)/subscriptions/[id]",
										params: {
											id: s.id,
											from: "subscriptions",
										},
									})
								}
							/>
						</View>
					))
				)}
			</ScrollView>
		</View>
	);
}
