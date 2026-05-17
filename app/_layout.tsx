import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";

import { AppStateProvider } from "@/src/state/appState";
import { StatusBar } from "react-native";

SplashScreen.preventAutoHideAsync();

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
				<StatusBar barStyle={"dark-content"} />
				<Stack screenOptions={{ headerShown: false }} />
			</AppStateProvider>
		</GestureHandlerRootView>
	);
}
