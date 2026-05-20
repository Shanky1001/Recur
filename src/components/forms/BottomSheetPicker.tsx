import { useEffectiveColorScheme } from "@/src/hooks/useEffectiveColorScheme";
import BottomSheet, {
	BottomSheetBackdrop,
	BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import React, { useCallback } from "react";
import { Pressable, Text, View } from "react-native";

export type PickerItem<T extends string> = {
	label: string;
	value: T;
	left?: React.ReactNode;
};

export type BottomSheetPickerProps<T extends string> = {
	open: boolean;
	title: string;
	items: PickerItem<T>[];
	selected?: T;
	onSelect: (value: T) => void;
	onClose: () => void;
};

export default function BottomSheetPicker<T extends string>({
	open,
	title,
	items,
	selected,
	onSelect,
	onClose,
}: BottomSheetPickerProps<T>) {
	const isDark = useEffectiveColorScheme() === "dark";
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

	if (!open) return null;
	return (
		<BottomSheet
			index={0}
			snapPoints={["60%"]}
			enableDynamicSizing={false}
			enablePanDownToClose
			backdropComponent={renderBackdrop}
			onClose={onClose}
			backgroundStyle={{
				backgroundColor: isDark ? "#1f2937" : "white",
				borderTopLeftRadius: 24,
				borderTopRightRadius: 24,
			}}
			handleIndicatorStyle={{
				backgroundColor: isDark ? "#4b5563" : "#cbd5e1",
			}}
		>
			<View className="px-5 pb-3">
				<Text className="text-base font-poppins-bold text-foreground">
					{title}
				</Text>
			</View>

			<BottomSheetFlatList
				data={items}
				keyExtractor={(it) => it.value}
				renderItem={({ item }) => {
					const isSelected = selected === item.value;
					return (
						<Pressable
							onPress={() => {
								onSelect(item.value);
								onClose();
							}}
							className="mx-4 mb-2 flex-row items-center rounded-2xl border border-border bg-white px-4 py-3"
							style={({ pressed }) => ({
								opacity: pressed ? 0.85 : 1,
							})}
						>
							{item.left ? (
								<View className="mr-3">{item.left}</View>
							) : null}
							<Text
								className={
									isSelected
										? "flex-1 text-sm font-poppins-bold text-foreground"
										: "flex-1 text-sm font-poppins-medium text-foreground"
								}
							>
								{item.label}
							</Text>
							{isSelected ? (
								<Text className="text-sm font-poppins-bold text-success">
									✓
								</Text>
							) : null}
						</Pressable>
					);
				}}
				showsVerticalScrollIndicator={false}
			/>
		</BottomSheet>
	);
}
