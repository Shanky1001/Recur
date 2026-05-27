import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";

import { AppSplashScreen } from "@/src/components/ui/AppSplashScreen";
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
	const [showCustomSplash, setShowCustomSplash] = useState(true);
	const [fontsLoaded] = useFonts({
		"Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
		"Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
		"Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
		"Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
		"Poppins-Thin": require("../assets/fonts/Poppins-Thin.ttf"),
		"Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
	});

	useEffect(() => {
		if (fontsLoaded) {
			void SplashScreen.hideAsync();
			const splashTimer = setTimeout(() => {
				setShowCustomSplash(false);
			}, 1800);

			return () => clearTimeout(splashTimer);
		}
	}, [fontsLoaded]);

	if (!fontsLoaded || showCustomSplash) {
		return (
			<>
				<StatusBar barStyle="light-content" translucent={false} />
				<AppSplashScreen />
			</>
		);
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
