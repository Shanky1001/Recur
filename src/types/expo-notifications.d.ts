declare module "expo-notifications" {
	export const AndroidImportance: any;

	export function getPermissionsAsync(): Promise<{ status?: string }>;
	export function requestPermissionsAsync(): Promise<{ status?: string }>;

	export function setNotificationChannelAsync(
		channelId: string,
		channel: any,
	): Promise<void>;

	export function setNotificationHandler(handler: {
		handleNotification: () => Promise<{
			shouldShowAlert?: boolean;
			shouldShowBanner?: boolean;
			shouldShowList?: boolean;
			shouldPlaySound?: boolean;
			shouldSetBadge?: boolean;
		}>;
	}): void;

	export function scheduleNotificationAsync(request: {
		content: {
			title: string;
			body?: string;
			data?: Record<string, any>;
			channelId?: string;
		};
		trigger: Date | any;
	}): Promise<string>;

	export function presentNotificationAsync(request: {
		title: string;
		body?: string;
		data?: Record<string, any>;
		channelId?: string;
	}): Promise<string>;

	export function cancelScheduledNotificationAsync(id: string): Promise<void>;
}
