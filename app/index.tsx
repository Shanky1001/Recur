import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { hydrateApp } from "@/src/store/appSlice";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";

export default function AppEntry() {
	const dispatch = useAppDispatch();
	const hydrated = useAppSelector((s) => s.app.hydrated);
	const hydrateError = useAppSelector((s) => s.app.hydrateError);
	const hasOnboarded = useAppSelector((s) => s.app.preferences.hasOnboarded);

	if (hydrateError && !hydrated) {
		return (
			<View className="flex-1 items-center justify-center bg-background px-8">
				<Text className="text-center text-lg font-poppins-bold text-foreground">
					Could not load your data
				</Text>
				<Text className="mt-2 text-center text-sm font-poppins-medium text-foreground/60">
					{hydrateError}
				</Text>
				<Pressable
					onPress={() => dispatch(hydrateApp())}
					className="mt-6 rounded-2xl bg-blue-600 px-6 py-3"
					style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
				>
					<Text className="text-sm font-poppins-bold text-white">
						Retry
					</Text>
				</Pressable>
			</View>
		);
	}

	if (!hydrated) {
		return (
			<View className="flex-1 items-center justify-center bg-background">
				<ActivityIndicator size="large" color="#2563EB" />
				<Text className="mt-4 text-sm font-poppins-medium text-foreground/60">
					Loading…
				</Text>
			</View>
		);
	}

	return hasOnboarded ? (
		<Redirect href="/(drawer)/(tabs)" />
	) : (
		<Redirect href="/onboarding" />
	);
}
