import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useRef, useState } from "react";
import {
	Dimensions,
	Modal,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";

export type SelectOption<T extends string> = {
	key: T;
	label: string;
	name?: string;
};

export default function PopoverSelect<T extends string>({
	value,
	options,
	onChange,
	accentColor = "#2563EB",
}: {
	value: T;
	options: SelectOption<T>[];
	onChange: (next: T) => void;
	accentColor?: string;
}) {
	const triggerRef = useRef<View>(null);
	const [open, setOpen] = useState(false);
	const [anchor, setAnchor] = useState<{
		x: number;
		y: number;
		width: number;
		height: number;
	} | null>(null);

	const selected = options.find((o) => o.key === value) ?? options[0];

	const close = () => setOpen(false);
	const openPopover = () => {
		triggerRef.current?.measureInWindow((x, y, width, height) => {
			setAnchor({ x, y, width, height });
			setOpen(true);
		});
	};

	const menuWidth = 160;
	const rowH = 44;
	const menuHeight = options.length * rowH;

	return (
		<>
			<Pressable
				onPress={openPopover}
				hitSlop={10}
				style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
			>
				<View ref={triggerRef} className="flex-row items-center">
					<Text
						className="text-base font-poppins-semibold"
						style={{ color: accentColor }}
					>
						{selected?.name ?? selected?.label ?? value}
					</Text>
					<Ionicons
						name="chevron-down"
						size={16}
						color={accentColor}
					/>
				</View>
			</Pressable>

			<Modal
				transparent
				visible={open}
				animationType="fade"
				onRequestClose={close}
			>
				<Pressable style={StyleSheet.absoluteFill} onPress={close} />
				{anchor
					? (() => {
							const { width: screenW, height: screenH } =
								Dimensions.get("window");
							const margin = 8;
							const preferTop =
								anchor.y +
									anchor.height +
									margin +
									menuHeight +
									16 >
								screenH;
							const top = preferTop
								? Math.max(
										margin,
										anchor.y - menuHeight - margin,
									)
								: anchor.y + anchor.height + margin;
							const left = Math.min(
								screenW - menuWidth - margin,
								Math.max(
									margin,
									anchor.x + anchor.width - menuWidth,
								),
							);

							return (
								<View
									style={{
										position: "absolute",
										top,
										left,
										width: menuWidth,
										borderRadius: 14,
										overflow: "hidden",
										backgroundColor: "white",
										shadowColor: "#000",
										shadowOpacity: 0.14,
										shadowRadius: 18,
										shadowOffset: { width: 0, height: 10 },
										elevation: 14,
									}}
								>
									{options.map((opt, idx) => {
										const active = opt.key === value;
										return (
											<View key={opt.key}>
												<Pressable
													onPress={() => {
														close();
														onChange(opt.key);
													}}
													className="flex-row items-center justify-between px-4"
													style={({ pressed }) => ({
														height: rowH,
														backgroundColor: pressed
															? "rgba(37,99,235,0.06)"
															: "transparent",
													})}
												>
													<Text className="text-sm font-poppins-semibold text-foreground">
														{opt.name ?? opt.label}
													</Text>
													{active ? (
														<Ionicons
															name="checkmark"
															size={18}
															color={accentColor}
														/>
													) : null}
												</Pressable>
												{idx < options.length - 1 ? (
													<View
														style={{
															height: StyleSheet.hairlineWidth,
															backgroundColor:
																"rgba(8, 17, 38, 0.10)",
														}}
													/>
												) : null}
											</View>
										);
									})}
								</View>
							);
						})()
					: null}
			</Modal>
		</>
	);
}
