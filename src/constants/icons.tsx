import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type React from "react";

type MaterialIconsName = React.ComponentProps<typeof MaterialIcons>["name"];
type FontAwesomeName = React.ComponentProps<typeof FontAwesome>["name"];
type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];
type AntDesignName = React.ComponentProps<typeof AntDesign>["name"];

export function getIcon(
	name: MaterialIconsName | FontAwesomeName | IoniconsName | AntDesignName,
	packageName: "MaterialIcons" | "FontAwesome" | "Ionicons" | "AntDesign",
	size: number = 24,
	color: string = "white",
): React.ReactElement | undefined {
	if (packageName === "MaterialIcons") {
		return (
			<MaterialIcons
				name={name as MaterialIconsName}
				size={size}
				color={color}
			/>
		);
	} else if (packageName === "FontAwesome") {
		return (
			<FontAwesome
				name={name as FontAwesomeName}
				size={size}
				color={color}
			/>
		);
	} else if (packageName === "Ionicons") {
		return (
			<Ionicons name={name as IoniconsName} size={size} color={color} />
		);
	} else if (packageName === "AntDesign") {
		return (
			<AntDesign name={name as AntDesignName} size={size} color={color} />
		);
	}
	return undefined;
}
