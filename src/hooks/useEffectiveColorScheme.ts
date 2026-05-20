import { useEffect } from "react";
import {
	Appearance,
	type ColorSchemeName,
	useColorScheme,
} from "react-native";

import { usePreferences } from "@/src/state/appState";

export type ThemeMode = "system" | "light" | "dark";

export type EffectiveColorScheme = "light" | "dark";

export function resolveEffectiveColorScheme(
	themeMode: ThemeMode | undefined,
	deviceScheme: ColorSchemeName | null | undefined,
): EffectiveColorScheme {
	if (themeMode === "light" || themeMode === "dark") return themeMode;
	return deviceScheme === "dark" ? "dark" : "light";
}

/** Applies user theme preference to the app (NativeWind v5 uses Appearance API). */
export function applyThemeMode(themeMode: ThemeMode): void {
	if (themeMode === "system") {
		// null clears the override so the app follows the OS again.
		Appearance.setColorScheme(null);
		return;
	}
	Appearance.setColorScheme(themeMode);
}

/** Resolved light/dark for styling; honors user preference and OS when set to system. */
export function useEffectiveColorScheme(): EffectiveColorScheme {
	const preferences = usePreferences();
	const deviceScheme = useColorScheme();
	const themeMode = (preferences.themeMode ?? "system") as ThemeMode;

	return resolveEffectiveColorScheme(themeMode, deviceScheme);
}

/** Sync stored preference → Appearance whenever it changes. */
export function useApplyThemeMode(): void {
	const preferences = usePreferences();
	const themeMode = (preferences.themeMode ?? "system") as ThemeMode;

	useEffect(() => {
		applyThemeMode(themeMode);
	}, [themeMode]);
}
