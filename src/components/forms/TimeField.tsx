import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker, {
	type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useMemo, useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";

import {
	formatReminderTime,
	formatReminderTimeDisplay,
	parseReminderTime,
} from "@/src/utils/reminderSchedule";

function timeToDate(hhmm: string): Date {
	const parsed = parseReminderTime(hhmm);
	const d = new Date();
	if (parsed) {
		d.setHours(parsed.hours, parsed.minutes, 0, 0);
	} else {
		d.setHours(9, 0, 0, 0);
	}
	return d;
}

export default function TimeField({
	label,
	value,
	onChange,
	subLabel,
}: {
	label: string;
	value?: string;
	onChange: (nextHHmm: string) => void;
	subLabel?: string;
}) {
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState<Date>(() => timeToDate(value ?? "09:00"));
	const current = useMemo(
		() => timeToDate(value ?? "09:00"),
		[value],
	);

	const close = () => setOpen(false);

	const openPicker = () => {
		setDraft(current);
		setOpen(true);
	};

	const commitDraft = () => {
		onChange(formatReminderTime(draft.getHours(), draft.getMinutes()));
		close();
	};

	const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
		if (Platform.OS === "android") {
			if (event.type === "dismissed") {
				close();
				return;
			}
			const picked = selected ?? current;
			onChange(
				formatReminderTime(picked.getHours(), picked.getMinutes()),
			);
			close();
			return;
		}
		if (selected) setDraft(selected);
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
				<Ionicons name="time-outline" size={18} color="#64748b" />
				<Text className="ml-3 flex-1 text-base font-poppins-medium text-foreground">
					{formatReminderTimeDisplay(value)}
				</Text>
				<Ionicons name="chevron-down" size={18} color="#64748b" />
			</Pressable>

			{Platform.OS === "android" && open ? (
				<DateTimePicker
					mode="time"
					value={current}
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
									Select time
								</Text>
								<Pressable onPress={commitDraft} hitSlop={10}>
									<Text className="text-sm font-poppins-semibold text-blue-600">
										Done
									</Text>
								</Pressable>
							</View>
							<DateTimePicker
								mode="time"
								value={draft}
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
