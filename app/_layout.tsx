import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";

import {
	useApplyThemeMode,
	useEffectiveColorScheme,
} from "@/src/hooks/useEffectiveColorScheme";
import { AppStateProvider } from "@/src/state/appState";

SplashScreen.preventAutoHideAsync();

function ThemeController() {
	useApplyThemeMode();
	const effectiveScheme = useEffectiveColorScheme();

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
