import { Redirect } from "expo-router";
import React from "react";

import { useAppSelector } from "@/src/store/hooks";

export default function AppEntry() {
	const hydrated = useAppSelector((s) => s.app.hydrated);
	const hasOnboarded = useAppSelector((s) => s.app.preferences.hasOnboarded);

	if (!hydrated) return null;

	return hasOnboarded ? (
		<Redirect href="/(drawer)/(tabs)" />
	) : (
		<Redirect href="/onboarding" />
	);
}
