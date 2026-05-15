import React from "react";
import { Pressable, Text } from "react-native";

export function PrimaryButton({
	label,
	onPress,
	disabled,
}: {
	label: string;
	onPress: () => void;
	disabled?: boolean;
}) {
	return (
		<Pressable
			onPress={disabled ? undefined : onPress}
			hitSlop={8}
			disabled={disabled}
			className={
				disabled
					? "rounded-2xl bg-blue-600/40 px-4 py-4"
					: "rounded-2xl bg-blue-600 px-4 py-4"
			}
			style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
		>
			<Text className="text-center text-base font-poppins-bold text-white">
				{label}
			</Text>
		</Pressable>
	);
}

export function SecondaryButton({
	label,
	onPress,
}: {
	label: string;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			hitSlop={8}
			className="rounded-2xl border border-border bg-white px-4 py-4"
			style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
		>
			<Text className="text-center text-base font-poppins-semibold text-foreground">
				{label}
			</Text>
		</Pressable>
	);
}
