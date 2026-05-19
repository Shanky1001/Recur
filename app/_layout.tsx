import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import {
	StatusBar,
	useColorScheme as useSystemColorScheme,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";

import { AppStateProvider, usePreferences } from "@/src/state/appState";

SplashScreen.preventAutoHideAsync();

function ThemeController() {
	const preferences = usePreferences();
	const { setColorScheme } = useColorScheme();
	const systemScheme = useSystemColorScheme();

	const preferredMode =
		preferences.themeMode === "light" || preferences.themeMode === "dark"
			? preferences.themeMode
			: "system";

	useEffect(() => {
		setColorScheme(preferredMode);
	}, [preferredMode, setColorScheme]);

	const effectiveScheme =
		preferredMode === "system" ? (systemScheme ?? "light") : preferredMode;

	return (
		<StatusBar
			barStyle={
				effectiveScheme === "dark" ? "light-content" : "dark-content"
			}
			translucent={false}
		/>
	);
}

export default function RootLayout() {
	const [fontsLoaded] = useFonts({
		"Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
		"Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
		"Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
		"Poppins-Thin": require("../assets/fonts/Poppins-Thin.ttf"),
		"Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
	});
	useEffect(() => {
		if (fontsLoaded) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded]);

	if (!fontsLoaded) {
		return null;
	}
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<AppStateProvider>
				<ThemeController />
				<Stack screenOptions={{ headerShown: false }} />
			</AppStateProvider>
		</GestureHandlerRootView>
	);
}
