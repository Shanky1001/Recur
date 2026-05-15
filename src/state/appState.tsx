import React, { useEffect, useMemo } from "react";
import { Provider } from "react-redux";

import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";
import type { DummyData, Notification } from "@/src/data/dummy";
import {
	addSubscription,
	cancelSubscription,
	clearAllNotifications,
	deleteNotification,
	deleteSubscription,
	hydrateApp,
	markAllNotificationsRead,
	markNotificationRead,
	resetLocalData,
	resyncReminders,
	snoozeNotification,
	updatePreferences,
	upsertSubscription,
} from "@/src/store/appSlice";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { store, type RootState } from "@/src/store/store";

type User = {
	name: string;
	avatarUri: string;
};

type Dashboard = DummyData["dashboard"];

export type AppState = {
	user: User;
	dashboard: Dashboard;
	subscriptions: Subscription[];
	notifications: Notification[];
	preferences: {
		currency: string;
		defaultReminderDaysBefore: number;
		defaultReminderEnabled: boolean;
	};
};

function AppBootstrap({ children }: { children: React.ReactNode }) {
	const dispatch = useAppDispatch();
	useEffect(() => {
		dispatch(hydrateApp());
	}, [dispatch]);
	return <>{children}</>;
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
	return (
		<Provider store={store}>
			<AppBootstrap>{children}</AppBootstrap>
		</Provider>
	);
}

export function useAppState() {
	const app = useAppSelector((s: RootState) => s.app);
	const unreadCount = useMemo(
		() => app.notifications.filter((n) => !n.read).length,
		[app.notifications],
	);
	const state: AppState = {
		user: app.user,
		dashboard: app.dashboard,
		subscriptions: app.subscriptions,
		notifications: app.notifications,
		preferences: app.preferences,
	};
	return { state, unreadCount };
}

export function useUser() {
	return useAppSelector((s: RootState) => s.app.user);
}

export function useDashboard() {
	return useAppSelector((s: RootState) => s.app.dashboard);
}

export function useSubscriptions() {
	return useAppSelector((s: RootState) => s.app.subscriptions);
}

export function useNotificationsList() {
	return useAppSelector((s: RootState) => s.app.notifications);
}

export function usePreferences() {
	return useAppSelector((s: RootState) => s.app.preferences);
}

export function useUnreadCount() {
	return useAppState().unreadCount;
}

export function useAppActions() {
	const dispatch = useAppDispatch();
	return useMemo(
		() => ({
			resetLocalData: async () => {
				await dispatch(resetLocalData()).unwrap();
			},
			clearAllNotifications: async () => {
				await dispatch(clearAllNotifications()).unwrap();
			},
			resyncReminders: async () => {
				await dispatch(resyncReminders()).unwrap();
			},
			updatePreferences: async (partial: {
				currency?: string;
				defaultReminderDaysBefore?: number;
				defaultReminderEnabled?: boolean;
			}) => {
				await dispatch(updatePreferences(partial)).unwrap();
			},
			markAllNotificationsRead: async () => {
				await dispatch(markAllNotificationsRead()).unwrap();
			},
			deleteNotification: async (id: string) => {
				await dispatch(deleteNotification(id)).unwrap();
			},
			markNotificationRead: async (id: string) => {
				await dispatch(markNotificationRead(id)).unwrap();
			},
			snoozeNotification: async (id: string, hours: number = 24) => {
				await dispatch(snoozeNotification({ id, hours })).unwrap();
			},
			cancelSubscription: async (id: string) => {
				await dispatch(cancelSubscription(id)).unwrap();
			},
			deleteSubscription: async (id: string) => {
				await dispatch(deleteSubscription(id)).unwrap();
			},
			upsertSubscription: async (subscription: Subscription) => {
				await dispatch(upsertSubscription(subscription)).unwrap();
			},
			addSubscription: async (subscription: Subscription) => {
				await dispatch(addSubscription(subscription)).unwrap();
			},
		}),
		[dispatch],
	);
}
