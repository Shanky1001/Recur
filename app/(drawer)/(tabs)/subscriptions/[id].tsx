import { useLocalSearchParams } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SubscriptionDetail() {
	const { id } = useLocalSearchParams<{ id?: string }>();

	return (
		<SafeAreaView>
			<View className="px-5 py-4">
				<Text className="text-2xl font-poppins-bold text-foreground">
					Subscription
				</Text>
				<Text className="mt-2 text-base font-poppins-medium text-foreground/70">
					{id ?? "Unknown"}
				</Text>
			</View>
		</SafeAreaView>
	);
}
