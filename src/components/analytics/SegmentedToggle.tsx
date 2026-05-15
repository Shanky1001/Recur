import React from "react";
import { Pressable, Text, View } from "react-native";

export type SegmentedOption<T extends string> = {
	key: T;
	label: string;
};

export default function SegmentedToggle<T extends string>({
	value,
	options,
	onChange,
}: {
	value: T;
	options: Array<SegmentedOption<T>>;
	onChange: (next: T) => void;
}) {
	return (
		<View className="flex-row rounded-full bg-black/5 p-1">
			{options.map((opt) => {
				const active = opt.key === value;
				return (
					<Pressable
						key={opt.key}
						onPress={() => onChange(opt.key)}
						className={`rounded-full px-3 py-1.5 ${
							active ? "bg-white" : "bg-transparent"
						}`}
						style={({ pressed }) => ({
							opacity: pressed ? 0.9 : 1,
						})}
					>
						<Text
							className={`text-xs font-poppins-semibold ${
								active
									? "text-foreground"
									: "text-foreground/60"
							}`}
						>
							{opt.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}
