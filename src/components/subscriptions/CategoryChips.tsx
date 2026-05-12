import type React from "react";
import { Pressable, ScrollView, Text } from "react-native";

export type CategoryChipsProps = {
	categories: string[];
	selected: string;
	onSelect: (category: string) => void;
};

export default function CategoryChips({
	categories,
	selected,
	onSelect,
}: CategoryChipsProps) {
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
		>
			{categories.map((category) => {
				const isSelected = category === selected;
				return (
					<Pressable
						key={category}
						onPress={() => onSelect(category)}
						className={
							isSelected
								? "rounded-xl bg-foreground px-5 py-3"
								: "rounded-xl border border-border bg-white px-5 py-3"
						}
					>
						<Text
							className={
								isSelected
									? "text-base font-poppins-medium text-white"
									: "text-base font-poppins-medium text-foreground"
							}
						>
							{category}
						</Text>
					</Pressable>
				);
			})}
		</ScrollView>
	);
}
