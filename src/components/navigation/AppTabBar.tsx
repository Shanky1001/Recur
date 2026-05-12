import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { useMemo } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BOTTOM_TABS } from "@/src/constants/data";
import { getIcon } from "@/src/constants/icons";
import { theme } from "@/src/constants/theme";

const {
	components: { tabbar },
	colors,
} = theme;

const PLUS_SIZE = 64;

export default function AppTabBar({
	state,
	descriptors,
	navigation,
}: BottomTabBarProps) {
	const insets = useSafeAreaInsets();

	const orderedRoutes = useMemo(() => {
		const routeByName = new Map(
			state.routes.map((r) => [r.name, r] as const),
		);
		return BOTTOM_TABS.map((t) => routeByName.get(t.name)).filter(Boolean);
	}, [state.routes]);

	const leftRoutes = orderedRoutes.slice(0, 2);
	const rightRoutes = orderedRoutes.slice(2, 4);

	const tabbarBottom = Math.max(insets.bottom, tabbar.horizontalInset);

	const renderTab = (routeName: string) => {
		const routeIndex = state.routes.findIndex((r) => r.name === routeName);
		const isFocused = routeIndex === state.index;
		const tabConfig = BOTTOM_TABS.find((t) => t.name === routeName);
		if (!tabConfig) return null;

		const onPress = () => {
			const event = navigation.emit({
				type: "tabPress",
				target: state.routes[routeIndex]?.key,
				canPreventDefault: true,
			});
			if (!isFocused && !event.defaultPrevented) {
				navigation.navigate(routeName as never);
			}
		};

		const onLongPress = () => {
			navigation.emit({
				type: "tabLongPress",
				target: state.routes[routeIndex]?.key,
			});
		};

		return (
			<Pressable
				key={routeName}
				accessibilityRole="button"
				accessibilityState={isFocused ? { selected: true } : {}}
				onPress={onPress}
				onLongPress={onLongPress}
				style={({ pressed }) => ({
					flex: 1,
					opacity: pressed ? 0.75 : 1,
				})}
			>
				<View className="tabs-icon">
					<View
						className={`tabs-pill ${isFocused ? "tabs-active" : ""}`}
					>
						{tabConfig.icon ?? null}
					</View>
				</View>
			</Pressable>
		);
	};

	return (
		<View
			pointerEvents="box-none"
			style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
		>
			<View
				style={{
					position: "absolute",
					left: tabbar.horizontalInset,
					right: tabbar.horizontalInset,
					bottom: tabbarBottom,
					height: tabbar.height,
					borderRadius: tabbar.radius,
					backgroundColor: colors.primary,
					paddingHorizontal: 14,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<View
					style={{
						flex: 1,
						flexDirection: "row",
						justifyContent: "space-around",
					}}
				>
					{leftRoutes.map((r) => renderTab(r!.name))}
				</View>

				<View style={{ width: PLUS_SIZE }} />

				<View
					style={{
						flex: 1,
						flexDirection: "row",
						justifyContent: "space-around",
					}}
				>
					{rightRoutes.map((r) => renderTab(r!.name))}
				</View>

				<Pressable
					onPress={() => {
						// TODO: hook up create/add flow
					}}
					style={({ pressed }) => ({
						position: "absolute",
						left: "50%",
						top: -(PLUS_SIZE * 0.6),
						transform: [{ translateX: -(PLUS_SIZE / 2) }],
						width: PLUS_SIZE,
						height: PLUS_SIZE,
						borderRadius: PLUS_SIZE / 2,
						backgroundColor: "white",
						alignItems: "center",
						justifyContent: "center",
						opacity: pressed ? 0.85 : 1,
						shadowColor: "#000",
						shadowOpacity: 0.18,
						shadowRadius: 18,
						shadowOffset: { width: 0, height: 10 },
						elevation: 10,
					})}
					accessibilityRole="button"
					accessibilityLabel="Add"
				>
					{getIcon("add", "MaterialIcons", 40, "black")}
				</Pressable>
			</View>
		</View>
	);
}
