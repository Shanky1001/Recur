import React from "react";

import AppTabBar from "@/src/components/navigation/AppTabBar";
import { usePreferences } from "@/src/state/appState";
import { Tabs } from "expo-router";

export default function TabsLayout() {
	const { themeMode } = usePreferences();
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarShowLabel: false,
				sceneStyle: {
					backgroundColor:
						themeMode === "dark" ? "#0b1220" : "#ffffff",
				},
			}}
			tabBar={(props) => <AppTabBar {...props} />}
		>
			{/* Hide nested routes from the bottom tab bar */}
			<Tabs.Screen name="subscriptions/[id]" options={{ href: null }} />
		</Tabs>
	);
}
