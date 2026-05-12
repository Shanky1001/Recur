import { Drawer } from "expo-router/drawer";
import React from "react";
import { useWindowDimensions } from "react-native";

import AppDrawerContent from "@/src/components/navigation/AppDrawerContent";

export default function DrawerLayout() {
	const { width } = useWindowDimensions();
	const drawerWidth = Math.min(360, Math.round(width * 0.84));

	return (
		<Drawer
			drawerContent={(props) => <AppDrawerContent {...props} />}
			screenOptions={{
				headerShown: false,
				drawerPosition: "right",
				drawerType: "front",
				overlayColor: "rgba(0,0,0,0.55)",
				drawerStyle: {
					backgroundColor: "rgba(0,0,0,0.7)",
					width: drawerWidth,
				},
			}}
		>
			<Drawer.Screen
				name="(tabs)"
				options={{
					title: "",
					drawerLabel: () => null,
					drawerItemStyle: { height: 0 },
				}}
			/>
		</Drawer>
	);
}
