import { BOTTOM_TABS } from "@/src/constants/data";
import { theme } from "@/src/constants/theme";
import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabIconProps = {
	icon?: React.ReactElement<{ className?: string }>;
	focused: boolean;
};
const {
	components: { tabbar },
	colors,
} = theme;
const TabsLayout = () => {
	const insets = useSafeAreaInsets();
	const TabIcon = ({ icon, focused }: TabIconProps) => {
		return (
			<View className="tabs-icon">
				<View className={`tabs-pill ${focused && "tabs-active"}`}>
					{icon
						? React.cloneElement(icon, {
								className: "tabs-glyph",
							})
						: null}
				</View>
			</View>
		);
	};
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarShowLabel: false,
				tabBarStyle: {
					position: "absolute",
					bottom: Math.max(insets.bottom, tabbar.horizontalInset),
					height: tabbar.height,
					marginHorizontal: tabbar.horizontalInset,
					borderRadius: tabbar.radius,
					backgroundColor: colors.primary,
					borderTopWidth: 0,
					elevation: 0,
				},
				tabBarItemStyle: {
					paddingVertical: tabbar.height / 2 - tabbar.iconFrame / 1.6,
				},
				tabBarIconStyle: {
					width: tabbar.iconFrame,
					height: tabbar.iconFrame,
					alignItems: "center",
				},
			}}
		>
			{BOTTOM_TABS.map((tab) => (
				<Tabs.Screen
					key={tab.name}
					name={tab.name}
					options={{
						title: tab.title,
						tabBarIcon: ({ focused }) => (
							<TabIcon icon={tab.icon} focused={focused} />
						),
					}}
				/>
			))}
		</Tabs>
	);
};

export default TabsLayout;
