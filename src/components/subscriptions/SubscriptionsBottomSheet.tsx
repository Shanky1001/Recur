import Ionicons from "@expo/vector-icons/Ionicons";
import BottomSheet, {
	BottomSheetFlatList,
	type BottomSheetHandleProps,
} from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CategoryChips from "@/src/components/subscriptions/CategoryChips";
import SubscriptionCard, {
	type Subscription,
} from "@/src/components/subscriptions/SubscriptionCard";
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

				<View className="pb-4">
					<CategoryChips
						categories={categories}
						selected={selectedCategory}
						onSelect={setSelectedCategory}
					/>
				</View>
			</>
		);
	}, [categories, selectedCategory]);

	return (
		<BottomSheet
			index={0}
			snapPoints={snapPoints}
			topInset={insets.top}
			enableDynamicSizing={false}
			enablePanDownToClose={false}
			handleComponent={Handle}
			backgroundStyle={{
				backgroundColor: "white",
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
