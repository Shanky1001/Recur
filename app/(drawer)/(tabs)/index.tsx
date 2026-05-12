import Ionicons from "@expo/vector-icons/Ionicons";
import { DrawerActions } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useNavigation } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HomeHeader from "@/src/components/HomeHeader";
import SubscriptionsBottomSheet from "@/src/components/subscriptions/SubscriptionsBottomSheet";
import MetricCard from "@/src/components/ui/MetricCard";
import StatCard from "@/src/components/ui/StatCard";
import {
	useDashboard,
	useSubscriptions,
	useUnreadCount,
	useUser,
} from "@/src/state/appState";
import { pad2 } from "@/src/utils/helper";

export default function App() {
	const insets = useSafeAreaInsets();
	const navigation = useNavigation();
	const user = useUser();
	const dashboard = useDashboard();
	const subscriptions = useSubscriptions();
	const unreadCount = useUnreadCount();
	const spendFormatted = dashboard.totalMonthlySpend.toLocaleString("en-IN");

	return (
		<LinearGradient
			colors={["#3C6BFF", "#2446FF", "#1E3AFF"]}
			start={{ x: 0.1, y: 0.0 }}
			end={{ x: 0.9, y: 1.0 }}
			style={{ flex: 1, paddingTop: insets.top }}
		>
			<View className="flex-1">
				<HomeHeader
					userName={user.name}
					avatarUri={user.avatarUri}
					notificationCount={unreadCount}
					onPressNotifications={() => router.push("/notifications")}
					onPressMenu={() =>
						navigation.dispatch(DrawerActions.openDrawer())
					}
				/>

				<View className="px-3 pt-2">
					<StatCard
						label="Total Monthly Spend"
						value={
							<>
								<Text className="text-3xl font-poppins-bold text-foreground">
									{dashboard.currencySymbol}
								</Text>
								<Text className="ml-2 text-3xl font-poppins-bold text-foreground">
									{spendFormatted}
								</Text>
							</>
						}
						right={
							<View className="size-20 items-center justify-center rounded-3xl bg-blue-50">
								<Ionicons
									name="wallet"
									size={46}
									color="#2446FF"
								/>
							</View>
						}
					/>

					<View className="mt-3 flex-row gap-2">
						<MetricCard
							title="Active Subscriptions"
							value={dashboard.activeSubscriptions}
						/>
						<MetricCard
							title="Pending this week"
							value={pad2(dashboard.pendingThisWeek)}
						/>
					</View>
				</View>

				<SubscriptionsBottomSheet subscriptions={subscriptions} />
			</View>
		</LinearGradient>
	);
}
