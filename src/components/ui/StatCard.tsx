import type React from "react";
import { Text, View } from "react-native";

import Card from "@/src/components/ui/Card";

export type StatCardProps = {
	label: string;
	value: React.ReactNode;
	right?: React.ReactNode;
	className?: string;
};

export default function StatCard({
	label,
	value,
	right,
	className,
}: StatCardProps) {
	return (
		<Card className={`px-5 py-5 ${className ?? ""}`}>
			<View className="flex-row items-center justify-between">
				<View className="flex-1 pr-4">
					<Text className="text-lg font-poppins-medium text-foreground/70">
						{label}
					</Text>
					<View className="mt-3 flex-row items-end">{value}</View>
				</View>
				{right ? (
					<View className="items-end justify-center">{right}</View>
				) : null}
			</View>
		</Card>
	);
}
