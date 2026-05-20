import Ionicons from "@expo/vector-icons/Ionicons";
import BottomSheet, {
	BottomSheetFlatList,
	type BottomSheetHandleProps,
} from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CategoryChips from "@/src/components/subscriptions/CategoryChips";
import SubscriptionCard, {
	type Subscription,
} from "@/src/components/subscriptions/SubscriptionCard";
import { useEffectiveColorScheme } from "@/src/hooks/useEffectiveColorScheme";
import { useTabBarContentPadding } from "@/src/hooks/useTabBarContentPadding";

export type SubscriptionsBottomSheetProps = {
	subscriptions: Subscription[];
};

function Handle(_props: BottomSheetHandleProps) {
	return (
		<View className="items-center pb-2 pt-2">
			<Ionicons name="chevron-up" size={24} color="#c0c7d1" />
		</View>
	);
}

export default function SubscriptionsBottomSheet({
	subscriptions,
}: SubscriptionsBottomSheetProps) {
	const isDark = useEffectiveColorScheme() === "dark";
	const insets = useSafeAreaInsets();
	const contentBottomPadding = useTabBarContentPadding(16);
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

	const snapPoints = useMemo(() => ["65%", "100%"], []);

	const renderItem = useCallback(
		({ item }: { item: Subscription }) => (
			<SubscriptionCard
				subscription={item}
				onPress={() =>
					router.push({
						pathname: "/(drawer)/(tabs)/subscriptions/[id]",
						params: { id: item.id, from: "home" },
					})
				}
			/>
		),
		[],
	);

	const keyExtractor = useCallback((item: Subscription) => item.id, []);

	const listHeader = useMemo(() => {
		return (
			<>
				<View className="px-4 pb-2">
					<Text className="text-3xl font-poppins-bold text-foreground">
						My Subscriptions
					</Text>
				</View>

				{subscriptions.length > 0 && categories.length > 1 ? (
					<View className="pb-4">
						<CategoryChips
							categories={categories}
							selected={selectedCategory}
							onSelect={setSelectedCategory}
						/>
					</View>
				) : (
					<View className="pb-4" />
				)}
			</>
		);
	}, [categories, selectedCategory, subscriptions.length]);

	const listEmpty = useMemo(() => {
		const isEmptyAll = subscriptions.length === 0;
		const isFiltered = selectedCategory !== "All";
		const title = isEmptyAll
			? "No subscriptions yet"
			: isFiltered
				? "No subscriptions in this category"
				: "Nothing to show";
		const body = isEmptyAll
			? "Add your first subscription to start tracking renewals."
			: isFiltered
				? "Try switching back to All categories."
				: "";

		return (
			<View className="px-6 py-12 items-center">
				<View className="size-16 items-center justify-center rounded-3xl bg-black/5">
					<Ionicons name="albums-outline" size={28} color="#2563EB" />
				</View>
				<Text className="mt-4 text-xl font-poppins-bold text-foreground">
					{title}
				</Text>
				{body ? (
					<Text className="mt-2 text-sm font-poppins-medium text-foreground/60 text-center">
						{body}
					</Text>
				) : null}

				<View className="mt-6 w-full">
					{isEmptyAll ? (
						<Pressable
							onPress={() => router.push("/add-subscription")}
							className="rounded-2xl bg-blue-600 px-4 py-4"
							style={({ pressed }) => ({
								opacity: pressed ? 0.9 : 1,
							})}
							hitSlop={10}
						>
							<Text className="text-center text-base font-poppins-bold text-white">
								Add subscription
							</Text>
						</Pressable>
					) : null}

					{isFiltered ? (
						<Pressable
							onPress={() => setSelectedCategory("All")}
							className={
								isEmptyAll
									? "mt-3 rounded-2xl border border-border bg-card px-4 py-4"
									: "rounded-2xl border border-border bg-card px-4 py-4"
							}
							style={({ pressed }) => ({
								opacity: pressed ? 0.9 : 1,
							})}
							hitSlop={10}
						>
							<Text className="text-center text-base font-poppins-semibold text-foreground">
								View all
							</Text>
						</Pressable>
					) : null}
				</View>
			</View>
		);
	}, [selectedCategory, subscriptions.length]);

	return (
		<BottomSheet
			index={0}
			snapPoints={snapPoints}
			topInset={insets.top}
			enableDynamicSizing={false}
			enablePanDownToClose={false}
			handleComponent={Handle}
			backgroundStyle={{
				backgroundColor: isDark ? "#111827" : "#ffffff",
				borderTopLeftRadius: 28,
				borderTopRightRadius: 28,
			}}
		>
			<BottomSheetFlatList
				data={filtered}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
				ListHeaderComponent={listHeader}
				ListEmptyComponent={listEmpty}
				ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
				contentContainerStyle={{
					paddingBottom: contentBottomPadding,
					paddingTop: 0,
				}}
				style={{ paddingBottom: 12 }}
			/>
		</BottomSheet>
	);
}
