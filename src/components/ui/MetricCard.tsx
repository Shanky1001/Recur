import type React from "react";
import { Text } from "react-native";

import Card from "@/src/components/ui/Card";

export type MetricCardProps = {
	title: string;
	value: string | number;
	className?: string;
	subtitle?: string;
};

export default function MetricCard({
	title,
	value,
	subtitle,
	className,
}: MetricCardProps) {
	return (
		<Card className={`flex-1 px-5 py-4 ${className ?? ""}`}>
			<Text className="text-base font-poppins-medium text-foreground/80">
				{title}
			</Text>
			<Text className="mt-2 text-3xl font-poppins-bold text-foreground">
				{value}
			</Text>
			{subtitle ? (
				<Text className="mt-1 text-sm text-foreground/60">
					{subtitle}
				</Text>
			) : null}
		</Card>
	);
}
