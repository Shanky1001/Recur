import React from "react";
import { Text, TouchableOpacity } from "react-native";

interface UIButtonInterface {
	text?: string;
	type: "primary" | "secondary";
	variant?: "small" | "medium" | "large";
	state: "default" | "disabled" | "loading";
	onPress?: () => void;
}

const UIButton = ({
	text = "Button",
	type,
	variant,
	state,
	onPress,
}: UIButtonInterface) => {
	const color = type ? (type === "primary" ? "blue" : "gray") : "white";
	const size = variant === "small" ? 10 : variant === "medium" ? 15 : 20;

	return (
		<TouchableOpacity
			disabled={state === "disabled"}
			onPress={onPress}
			style={{
				padding: size,
				backgroundColor: color,
				borderRadius: 5,
				opacity: state === "disabled" ? 0.5 : 1,
			}}
		>
			<Text style={{ color: "white" }}>{text}</Text>
		</TouchableOpacity>
	);
};

export default UIButton;
