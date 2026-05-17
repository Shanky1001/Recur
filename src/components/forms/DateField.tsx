import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker, {
	DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useMemo, useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";

import { parseIsoLike } from "@/src/utils/helper";

function toIsoDateTime(d: Date): string {
	return d.toISOString();
}

function fromIsoDateTime(value?: string): Date {
	const parsed = value ? parseIsoLike(value) : null;
	return parsed ?? new Date();
}

function toDisplay(value: string): string {
	const parsed = parseIsoLike(value);
	if (!parsed) return value;
	return parsed.toLocaleString();
}

export default function DateField({
	label,
	value,
	onChange,
	subLabel,
}: {
	label: string;
	value?: string; // ISO date-time preferred
	onChange: (nextIsoDateTime: string) => void;
	subLabel?: string;
}) {
	const [open, setOpen] = useState(false);
	const [androidMode, setAndroidMode] = useState<"date" | "time">("date");
	const [androidTempDate, setAndroidTempDate] = useState<Date | null>(null);
	const current = useMemo(() => fromIsoDateTime(value), [value]);

	const close = () => {
		setOpen(false);
		setAndroidMode("date");
		setAndroidTempDate(null);
	};
	const openPicker = () => {
		if (Platform.OS === "android") {
			setAndroidMode("date");
			setAndroidTempDate(current);
		}
		setOpen(true);
	};

	const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
		// Android emits "dismissed" when user cancels.
		if (Platform.OS === "android") {
			if (event.type === "dismissed") {
				close();
				return;
			}

			if (androidMode === "date") {
				if (selected) {
					setAndroidTempDate(selected);
				}
				setAndroidMode("time");
				return;
			}

			const base = androidTempDate ?? current;
			const picked = selected ?? base;
			const merged = new Date(base);
			merged.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
			onChange(toIsoDateTime(merged));
			close();
			return;
		}

		const next = selected ?? current;
		onChange(toIsoDateTime(next));
	};

	return (
		<View className="pb-4">
			<Text className="text-sm font-poppins-bold text-foreground">
				{label}
			</Text>
			{subLabel ? (
				<Text className="mt-1 text-xs font-poppins-medium text-foreground/60">
					{subLabel}
				</Text>
			) : null}

			<Pressable
				onPress={openPicker}
				hitSlop={10}
				className="mt-2 flex-row items-center rounded-2xl border border-border bg-white px-4 py-4"
				style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
			>
				<Ionicons name="calendar-outline" size={18} color="#64748b" />
				<Text className="ml-3 flex-1 text-base font-poppins-medium text-foreground">
					{value
						? toDisplay(value)
						: toDisplay(toIsoDateTime(current))}
				</Text>
				<Ionicons name="chevron-down" size={18} color="#64748b" />
			</Pressable>

			{Platform.OS === "android" && open ? (
				<DateTimePicker
					mode={androidMode}
					value={androidTempDate ?? current}
					onChange={handleChange}
					display="default"
				/>
			) : null}

			{Platform.OS === "ios" ? (
				<Modal
					transparent
					visible={open}
					animationType="fade"
					onRequestClose={close}
				>
					<Pressable
						style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }}
						onPress={close}
					/>
					<View
						style={{
							position: "absolute",
							left: 16,
							right: 16,
							bottom: 24,
						}}
					>
						<View className="rounded-3xl bg-white p-4">
							<View className="flex-row items-center justify-between">
								<Text className="text-base font-poppins-bold text-foreground">
									Select date & time
								</Text>
								<Pressable onPress={close} hitSlop={10}>
									<Text className="text-sm font-poppins-semibold text-blue-600">
										Done
									</Text>
								</Pressable>
							</View>
							<DateTimePicker
								mode="datetime"
								value={current}
								onChange={handleChange}
								display="spinner"
							/>
						</View>
					</View>
				</Modal>
			) : null}
		</View>
	);
}
