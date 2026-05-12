import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RecordsScreen() {
	const insets = useSafeAreaInsets();
	return (
		<LinearGradient
			colors={["#3C6BFF", "#2446FF", "#1E3AFF"]}
			style={{ flex: 1, paddingTop: insets.top }}
		>
			<View className="px-5 pb-4 pt-2">
				<Pressable onPress={() => router.back()} hitSlop={10}>
					<Ionicons name="chevron-back" size={26} color="white" />
				</Pressable>
				<Text className="mt-4 text-3xl font-poppins-bold text-white">
					Records
				</Text>
				<Text className="mt-2 text-base font-poppins-medium text-white/80">
					Placeholder screen.
				</Text>
			</View>
		</LinearGradient>
	);
}
