import React from "react";

import AppTabBar from "@/src/components/navigation/AppTabBar";
import { Tabs } from "expo-router";

export default function TabsLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarShowLabel: false,
			}}
			tabBar={(props) => <AppTabBar {...props} />}
		>
			{/* Hide nested routes from the bottom tab bar */}
			<Tabs.Screen name="subscriptions/[id]" options={{ href: null }} />
		</Tabs>
	);
}
