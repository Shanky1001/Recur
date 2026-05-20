import React from "react";

import AppTabBar from "@/src/components/navigation/AppTabBar";
import { useEffectiveColorScheme } from "@/src/hooks/useEffectiveColorScheme";
import { Tabs } from "expo-router";

export default function TabsLayout() {
	const effectiveScheme = useEffectiveColorScheme();
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarShowLabel: false,
				sceneStyle: {
					backgroundColor:
						effectiveScheme === "dark" ? "#0b1220" : "#ffffff",
				},
			}}
			tabBar={(props) => <AppTabBar {...props} />}
		>
			{/* Hide nested routes from the bottom tab bar */}
			<Tabs.Screen name="subscriptions/[id]" options={{ href: null }} />
		</Tabs>
	);
}
