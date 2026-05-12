import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
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
		if (selectedCategory === "All") return subscriptions;
		return subscriptions.filter((s) => s.category === selectedCategory);
	}, [subscriptions, selectedCategory]);

	return (
		<View className="flex-1 bg-gray-100" style={{ paddingTop: insets.top }}>
			<View className="flex-row items-center justify-between px-4 py-3">
				<Text className="text-2xl font-poppins-bold text-foreground">
					Subscriptions
				</Text>
				<Pressable
					onPress={() => router.push("/add-subscription")}
					hitSlop={10}
					className="size-11 items-center justify-center rounded-full border border-border bg-white"
				>
					<Ionicons name="add" size={24} color="#081126" />
				</Pressable>
			</View>

			<View className="pb-3">
				<CategoryChips
					categories={categories}
					selected={selectedCategory}
					onSelect={setSelectedCategory}
				/>
			</View>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingBottom: contentBottomPadding,
				}}
			>
				{filtered.length === 0 ? (
					<View className="px-4 py-10">
						<Text className="text-base font-poppins-medium text-foreground/60">
							No subscriptions yet.
						</Text>
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
