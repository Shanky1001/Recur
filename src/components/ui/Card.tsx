import type React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

export type CardProps = {
	children: React.ReactNode;
	className?: string;
	style?: StyleProp<ViewStyle>;
	elevated?: boolean;
};

const elevatedShadow: ViewStyle = {
	shadowColor: "#000",
	shadowOpacity: 0.08,
	shadowRadius: 18,
	shadowOffset: { width: 0, height: 10 },
	elevation: 6,
};

export default function Card({
	children,
	className,
	style,
	elevated = true,
}: CardProps) {
	return (
		<View
			className={`rounded-3xl bg-white ${className ?? ""}`}
			style={[elevated ? elevatedShadow : null, style]}
		>
			{children}
		</View>
	);
}
