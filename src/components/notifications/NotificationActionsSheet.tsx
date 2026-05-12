import Ionicons from "@expo/vector-icons/Ionicons";
import BottomSheet, {
	BottomSheetBackdrop,
	BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, Text, View } from "react-native";

import type { Notification } from "@/src/data/dummy";

export type NotificationAction = {
	key: string;
	label: string;
	subtitle?: string;
	iconName: React.ComponentProps<typeof Ionicons>["name"];
	variant?: "default" | "danger";
	onPress: () => void;
};

export type NotificationActionsSheetProps = {
	notification: Notification | null;
	actions: NotificationAction[];
	onClose: () => void;
};

export default function NotificationActionsSheet({
	notification,
	actions,
	onClose,
}: NotificationActionsSheetProps) {
	const sheetRef = useRef<BottomSheet>(null);
	const snapPoints = useMemo(() => ["38%"], []);

	useEffect(() => {
		if (notification && actions.length > 0) {
			sheetRef.current?.snapToIndex(0);
		} else {
			sheetRef.current?.close();
		}
	}, [actions.length, notification]);

	const renderBackdrop = useCallback(
		(props: any) => (
			<BottomSheetBackdrop
				{...props}
				appearsOnIndex={0}
				disappearsOnIndex={-1}
				onPress={onClose}
			/>
		),
		[onClose],
	);

	return (
		<BottomSheet
			ref={sheetRef}
			index={-1}
			snapPoints={snapPoints}
			enablePanDownToClose
			backdropComponent={renderBackdrop}
			onClose={onClose}
			backgroundStyle={{
				backgroundColor: "white",
				borderTopLeftRadius: 24,
				borderTopRightRadius: 24,
			}}
			handleIndicatorStyle={{ backgroundColor: "#cbd5e1" }}
		>
			<BottomSheetView className="px-5 pb-5">
				<View className="pb-3">
					<Text className="text-base font-poppins-bold text-foreground">
						Actions
					</Text>
					{notification ? (
						<Text className="mt-1 text-xs font-poppins-medium text-foreground/60">
							{notification.title}
						</Text>
					) : null}
				</View>

				<View className="gap-3">
					{actions.map((action) => {
						const isDanger = action.variant === "danger";
						return (
							<Pressable
								key={action.key}
								onPress={action.onPress}
								className={
									"flex-row items-center rounded-2xl border border-border bg-white px-4 py-3"
								}
								style={({ pressed }) => ({
									opacity: pressed ? 0.85 : 1,
								})}
							>
								<View
									className={
										"mr-3 items-center justify-center rounded-xl"
									}
									style={{
										width: 36,
										height: 36,
										backgroundColor: isDanger
											? "#fee2e2"
											: "#f1f5f9",
									}}
								>
									<Ionicons
										name={action.iconName}
										size={18}
										color={isDanger ? "#dc2626" : "#334155"}
									/>
								</View>

								<View className="flex-1">
									<Text
										className={
											isDanger
												? "text-sm font-poppins-bold text-destructive"
												: "text-sm font-poppins-bold text-foreground"
										}
									>
										{action.label}
									</Text>
									{action.subtitle ? (
										<Text className="mt-0.5 text-xs font-poppins-medium text-foreground/60">
											{action.subtitle}
										</Text>
									) : null}
								</View>
							</Pressable>
						);
					})}
				</View>
			</BottomSheetView>
		</BottomSheet>
	);
}
