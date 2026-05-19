import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
	Alert,
	Image,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Card from "@/src/components/ui/Card";
import { useAppActions, useUser } from "@/src/state/appState";
import { getPresetAvatarUrls } from "@/src/utils/helper";

function PrimaryButton({
	label,
	onPress,
	disabled,
}: {
	label: string;
	onPress: () => void;
	disabled?: boolean;
}) {
	return (
		<Pressable
			onPress={disabled ? undefined : onPress}
			disabled={disabled}
			hitSlop={10}
			className={
				disabled
					? "rounded-2xl bg-blue-600/40 px-4 py-4"
					: "rounded-2xl bg-blue-600 px-4 py-4"
			}
			style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
		>
			<Text className="text-center text-base font-poppins-bold text-white">
				{label}
			</Text>
		</Pressable>
	);
}

function SecondaryButton({
	label,
	onPress,
}: {
	label: string;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			hitSlop={10}
			className="rounded-2xl border border-border bg-card px-4 py-4"
			style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
		>
			<Text className="text-center text-base font-poppins-semibold text-foreground">
				{label}
			</Text>
		</Pressable>
	);
}

const presetAvatars = getPresetAvatarUrls();
export default function EditProfileScreen() {
	const insets = useSafeAreaInsets();
	const user = useUser();
	const { updateUserProfile } = useAppActions();

	const [name, setName] = useState(user.name ?? "");
	const [avatarUri, setAvatarUri] = useState(
		user.avatarUri || presetAvatars[0] || "",
	);
	const [saving, setSaving] = useState(false);

	const pickPhoto = async () => {
		const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!perm.granted) {
			Alert.alert(
				"Permission needed",
				"Please allow photo access to upload a profile picture.",
			);
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.8,
			allowsEditing: true,
			aspect: [1, 1],
		});
		if (result.canceled) return;
		const uri = result.assets?.[0]?.uri;
		if (uri) setAvatarUri(uri);
	};

	const onSave = async () => {
		if (saving) return;
		if (!name.trim()) {
			Alert.alert("Name required", "Please enter your name.");
			return;
		}
		if (!avatarUri) {
			Alert.alert("Avatar required", "Please choose an avatar.");
			return;
		}

		setSaving(true);
		try {
			await updateUserProfile({ name: name.trim(), avatarUri });
			router.back();
		} finally {
			setSaving(false);
		}
	};

	return (
		<View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
			<View className="flex-row items-center px-4 py-3">
				<Pressable onPress={() => router.back()} hitSlop={10}>
					<Ionicons
						name="chevron-back"
						size={26}
						className="text-foreground"
					/>
				</Pressable>
				<Text className="ml-2 text-2xl font-poppins-bold text-foreground">
					Edit Profile
				</Text>
			</View>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{
					paddingBottom: Math.max(insets.bottom, 18),
				}}
			>
				<View className="px-4 pt-3">
					<Card className="px-5 py-5">
						<View className="flex-row items-center">
							<View className="size-18 overflow-hidden rounded-full bg-black/10">
								{avatarUri ? (
									<Image
										source={{ uri: avatarUri }}
										style={{ width: 72, height: 72 }}
										resizeMode="cover"
									/>
								) : null}
							</View>
							<View className="ml-4 flex-1">
								<Text className="text-sm font-poppins-semibold text-foreground/60">
									Name
								</Text>
								<TextInput
									value={name}
									onChangeText={setName}
									placeholder="What should we call you?"
									placeholderTextColor="#94a3b8"
									className="mt-2 rounded-2xl border border-border bg-card px-4 py-3 text-base font-poppins-semibold text-foreground"
								/>
							</View>
						</View>

						<View className="mt-4 flex-row gap-3">
							<View className="flex-1">
								<SecondaryButton
									label="Upload photo"
									onPress={pickPhoto}
								/>
							</View>
							<View className="flex-1">
								<SecondaryButton
									label="Use default"
									onPress={() =>
										setAvatarUri(presetAvatars[0] ?? "")
									}
								/>
							</View>
						</View>
					</Card>
				</View>

				<View className="px-4 pt-5">
					<Text className="mb-2 text-sm font-poppins-semibold text-foreground/70">
						Choose an avatar
					</Text>
					<Card elevated>
						<View className="flex-row flex-wrap gap-3 px-4 py-4">
							{presetAvatars.map((uri) => {
								const active = uri === avatarUri;
								return (
									<Pressable
										key={uri}
										onPress={() => setAvatarUri(uri)}
										style={{
											borderRadius: 999,
											overflow: "hidden",
											borderWidth: active ? 2 : 1,
											borderColor: active
												? "#2563EB"
												: "rgba(8, 17, 38, 0.12)",
										}}
									>
										<Image
											source={{ uri }}
											style={{ width: 52, height: 52 }}
										/>
									</Pressable>
								);
							})}
						</View>
					</Card>
				</View>

				<View className="px-4 pt-5">
					<PrimaryButton
						label={saving ? "Saving…" : "Save"}
						onPress={onSave}
						disabled={saving}
					/>
				</View>
			</ScrollView>
		</View>
	);
}
