import type FontAwesome from "@expo/vector-icons/FontAwesome";
import type Ionicons from "@expo/vector-icons/Ionicons";
import type MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type React from "react";

type BottomTabIcon = {
	name:
		| React.ComponentProps<typeof MaterialIcons>["name"]
		| React.ComponentProps<typeof FontAwesome>["name"]
		| React.ComponentProps<typeof Ionicons>["name"];
	pack: "MaterialIcons" | "FontAwesome" | "Ionicons";
};

export const BOTTOM_TABS = [
	{
		name: "index",
		title: "Home",
		icon: { name: "home-filled", pack: "MaterialIcons" } as BottomTabIcon,
	},
	{
		name: "subscriptions",
		title: "Subscriptions",
		icon: { name: "wallet", pack: "MaterialIcons" } as BottomTabIcon,
	},
	{
		name: "analytics",
		title: "Insights",
		icon: { name: "analytics", pack: "Ionicons" } as BottomTabIcon,
	},
	{
		name: "profile",
		title: "Profile",
		icon: { name: "user", pack: "FontAwesome" } as BottomTabIcon,
	},
];
