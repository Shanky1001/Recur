import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function App() {
	return (
		<View className="flex-1 items-center justify-center bg-white">
			<Text className="text-2xl text-success font-poppins-bold">
				Welcome to Recur!
			</Text>
			<Link href="/onboarding" className="mt-4 text-blue-500">
				Go to onboarding
			</Link>
		</View>
	);
}
