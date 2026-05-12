import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppActions } from "@/src/state/appState";

export default function SettingsScreen() {
	const insets = useSafeAreaInsets();
	const { resetLocalData } = useAppActions();
	const [resetting, setResetting] = useState(false);

	const onReset = () => {
		if (resetting) return;
		Alert.alert(
			"Reset local data",
			"This will wipe your local subscriptions & notifications and re-seed from dummy data.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Reset",
					style: "destructive",
					onPress: async () => {
						setResetting(true);
						try {
							await resetLocalData();
						} finally {
							setResetting(false);
						}
					},
				},
			],
		);
	};
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
					Settings
				</Text>
				<Text className="mt-2 text-base font-poppins-medium text-white/80">
					Placeholder screen.
				</Text>

				{__DEV__ ? (
					<View className="mt-6 rounded-3xl bg-white/10 p-4">
						<Text className="text-sm font-poppins-semibold text-white/90">
							Developer
						</Text>
						<Text className="mt-1 text-xs font-poppins-medium text-white/70">
							Local-only tools for testing.
						</Text>
						<Pressable
							onPress={onReset}
							disabled={resetting}
							className="mt-3 rounded-2xl bg-white/15 px-4 py-3"
						>
							<Text className="font-poppins-semibold text-white">
								{resetting ? "Resetting…" : "Reset local data"}
							</Text>
							<Text className="mt-1 text-xs font-poppins-medium text-white/70">
								Wipes SQLite and re-seeds from dummy.json
							</Text>
						</Pressable>
					</View>
				) : null}
			</View>
		</LinearGradient>
	);
}
