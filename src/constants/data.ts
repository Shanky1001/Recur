import { getIcon } from "./icons";

export const BOTTOM_TABS = [
	{
		name: "index",
		title: "Home",
		icon: getIcon("home-filled", "MaterialIcons"),
	},
	{
		name: "subscriptions",
		title: "Subscriptions",
		icon: getIcon("wallet", "MaterialIcons"),
	},
	{
		name: "analytics",
		title: "Insights",
		icon: getIcon("analytics", "Ionicons"),
	},
	{
		name: "profile",
		title: "Profile",
		icon: getIcon("user", "FontAwesome"),
	},
];
