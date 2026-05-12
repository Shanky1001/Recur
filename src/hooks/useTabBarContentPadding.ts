import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "@/src/constants/theme";

// Returns bottom padding that ensures scroll content clears the custom tab bar.
export function useTabBarContentPadding(extra: number = 24): number {
	const insets = useSafeAreaInsets();
	const tabbarBottom = Math.max(
		insets.bottom,
		theme.components.tabbar.horizontalInset,
	);
	return tabbarBottom + theme.components.tabbar.height + extra;
}
