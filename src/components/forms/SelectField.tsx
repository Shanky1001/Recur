import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, Text, View } from "react-native";

export type SelectFieldProps = {
	label: string;
	value?: string;
	placeholder?: string;
	left?: React.ReactNode;
	onPress: () => void;
};

export default function SelectField({
	label,
	value,
	placeholder = "Select",
	left,
	onPress,
}: SelectFieldProps) {
	return (
		<View className="pb-4">
			<Text className="text-sm font-poppins-bold text-foreground">
				{label}
			</Text>
			<Pressable
				onPress={onPress}
				className="mt-2 flex-row items-center rounded-2xl border border-border bg-white px-4 py-4"
				style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
			>
				{left ? <View className="mr-3">{left}</View> : null}
				<Text
					className={
						value
							? "flex-1 text-base font-poppins-medium text-foreground"
							: "flex-1 text-base font-poppins-medium text-foreground/50"
					}
				>
					{value ?? placeholder}
				</Text>
				<Ionicons name="chevron-down" size={18} color="#64748b" />
			</Pressable>
		</View>
	);
}
