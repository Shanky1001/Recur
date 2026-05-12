import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { G, Path } from "react-native-svg";

export type DonutDatum = {
	label: string;
	value: number;
	color: string;
	subLabel?: string;
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
	const angleRad = ((angleDeg - 90) * Math.PI) / 180;
	return {
		x: cx + r * Math.cos(angleRad),
		y: cy + r * Math.sin(angleRad),
	};
}

function describeDonutSlice(
	cx: number,
	cy: number,
	outerR: number,
	innerR: number,
	startAngle: number,
	endAngle: number,
) {
	const startOuter = polarToCartesian(cx, cy, outerR, endAngle);
	const endOuter = polarToCartesian(cx, cy, outerR, startAngle);
	const startInner = polarToCartesian(cx, cy, innerR, startAngle);
	const endInner = polarToCartesian(cx, cy, innerR, endAngle);
	const largeArc = endAngle - startAngle > 180 ? 1 : 0;

	return [
		`M ${startOuter.x} ${startOuter.y}`,
		`A ${outerR} ${outerR} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
		`L ${startInner.x} ${startInner.y}`,
		`A ${innerR} ${innerR} 0 ${largeArc} 1 ${endInner.x} ${endInner.y}`,
		"Z",
	].join(" ");
}

export default function DonutChart({
	data,
	size = 220,
	thickness = 26,
	onSelect,
}: {
	data: DonutDatum[];
	size?: number;
	thickness?: number;
	onSelect?: (index: number | null) => void;
}) {
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

	const safeData = useMemo(
		() => data.filter((d) => Number.isFinite(d.value) && d.value > 0),
		[data],
	);
	const total = useMemo(
		() => safeData.reduce((sum, d) => sum + d.value, 0),
		[safeData],
	);

	const slices = useMemo(() => {
		const cx = size / 2;
		const cy = size / 2;
		const outerR = size / 2;
		const innerR = Math.max(outerR - thickness, 0);
		let angle = 0;

		return safeData.map((d, idx) => {
			const sweep = total === 0 ? 0 : (d.value / total) * 360;
			const start = angle;
			const end = angle + sweep;
			angle = end;
			return {
				idx,
				d,
				start,
				end,
				path: describeDonutSlice(cx, cy, outerR, innerR, start, end),
				midAngle: start + sweep / 2,
				cx,
				cy,
				outerR,
			};
		});
	}, [safeData, size, thickness, total]);

	const selected =
		selectedIndex == null
			? null
			: (slices.find((s) => s.idx === selectedIndex) ?? null);

	return (
		<View style={{ alignItems: "center" }}>
			<View style={{ width: size, height: size }}>
				<Svg width={size} height={size}>
					<G>
						{slices.map((s) => {
							const isSelected = selectedIndex === s.idx;
							return (
								<Path
									key={`${s.d.label}-${s.idx}`}
									d={s.path}
									fill={s.d.color}
									opacity={
										selectedIndex == null
											? 1
											: isSelected
												? 1
												: 0.35
									}
									onPress={() => {
										const next = isSelected ? null : s.idx;
										setSelectedIndex(next);
										onSelect?.(next);
									}}
								/>
							);
						})}
					</G>
				</Svg>

				{selected
					? (() => {
							const tipW = 190;
							const tipH = 64;
							const p = polarToCartesian(
								selected.cx,
								selected.cy,
								selected.outerR * 0.85,
								selected.midAngle,
							);
							const left = Math.min(
								size - tipW - 6,
								Math.max(6, p.x - tipW / 2),
							);
							const top = Math.min(
								size - tipH - 6,
								Math.max(6, p.y - tipH / 2),
							);
							const percent =
								total === 0
									? 0
									: Math.round(
											(selected.d.value / total) * 100,
										);
							return (
								<View
									pointerEvents="none"
									style={{
										position: "absolute",
										left,
										top,
										width: tipW,
										height: tipH,
										borderRadius: 12,
										backgroundColor: "#111827",
										paddingHorizontal: 12,
										paddingVertical: 10,
										shadowColor: "#000",
										shadowOpacity: 0.2,
										shadowRadius: 16,
										shadowOffset: { width: 0, height: 10 },
										elevation: 10,
									}}
								>
									<Text
										style={{
											color: "white",
											fontSize: 14,
											fontWeight: "700",
										}}
									>
										{selected.d.label} — {percent}%
									</Text>
									{selected.d.subLabel ? (
										<Text
											style={{
												color: "rgba(255,255,255,0.8)",
												marginTop: 4,
												fontSize: 12,
											}}
										>
											{selected.d.subLabel}
										</Text>
									) : null}
								</View>
							);
						})()
					: null}
			</View>

			{selectedIndex != null ? (
				<Pressable
					onPress={() => {
						setSelectedIndex(null);
						onSelect?.(null);
					}}
					hitSlop={10}
					style={{ marginTop: 8 }}
				>
					<Text className="text-xs font-poppins-medium text-foreground/60">
						Tap to clear
					</Text>
				</Pressable>
			) : null}
		</View>
	);
}
