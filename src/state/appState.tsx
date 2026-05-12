import React, { createContext, useContext, useMemo, useReducer } from "react";

import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";
import { seed, type DummyData, type Notification } from "@/src/data/dummy";

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
};

type Action =
	| { type: "notifications/clearAll" }
	| { type: "notifications/markAllRead" }
	| { type: "notifications/deleteById"; id: string }
	| { type: "notifications/markRead"; id: string }
	| { type: "notifications/snooze"; id: string; hours: number }
	| { type: "subscriptions/cancel"; id: string }
	| { type: "subscriptions/add"; subscription: Subscription };

function addHours(iso: string, hours: number): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	date.setHours(date.getHours() + hours);
	return date.toISOString();
}

function reducer(state: AppState, action: Action): AppState {
	switch (action.type) {
		case "notifications/clearAll":
			return { ...state, notifications: [] };
		case "notifications/markAllRead":
			return {
				...state,
				notifications: state.notifications.map((n) => ({
					...n,
					read: true,
				})),
			};
		case "notifications/deleteById":
			return {
				...state,
				notifications: state.notifications.filter(
					(n) => n.id !== action.id,
				),
			};
		case "notifications/markRead":
			return {
				...state,
				notifications: state.notifications.map((n) =>
					n.id === action.id ? { ...n, read: true } : n,
				),
			};
		case "notifications/snooze": {
			const existing = state.notifications.find(
				(n) => n.id === action.id,
			);
			if (!existing) return state;

			const nowIso = new Date().toISOString();
			const snoozed = {
				...existing,
				id: `${existing.id}-snooze-${Date.now()}`,
				read: false,
				createdAt: addHours(nowIso, action.hours),
				message: existing.message,
			};

			return {
				...state,
				notifications: state.notifications
					.map((n) => (n.id === action.id ? { ...n, read: true } : n))
					.concat([snoozed]),
			};
		}
		case "subscriptions/cancel": {
			let didChange = false;
			const nextSubscriptions = state.subscriptions.map((s) => {
				if (s.id !== action.id) return s;
				if (s.status === "cancelled") return s;
				didChange = true;
				return { ...s, status: "cancelled" as const };
			});
			if (!didChange) return state;

			return {
				...state,
				subscriptions: nextSubscriptions,
				dashboard: {
					...state.dashboard,
					activeSubscriptions: Math.max(
						0,
						state.dashboard.activeSubscriptions - 1,
					),
				},
			};
		}
		case "subscriptions/add": {
			const nextSubscriptions = [
				action.subscription,
				...state.subscriptions,
			];
			const shouldCountAsActive =
				action.subscription.status !== "cancelled";
			return {
				...state,
				subscriptions: nextSubscriptions,
				dashboard: {
					...state.dashboard,
					activeSubscriptions: shouldCountAsActive
						? state.dashboard.activeSubscriptions + 1
						: state.dashboard.activeSubscriptions,
				},
			};
		}
		default:
			return state;
	}
}

function createInitialState(): AppState {
	return {
		user: {
			name: seed.user.name,
			avatarUri: seed.user.avatarUri,
		},
		dashboard: seed.dashboard,
		subscriptions: seed.subscriptions,
		notifications: seed.notifications,
	};
}

type AppStateContextValue = {
	state: AppState;
	dispatch: React.Dispatch<Action>;
	unreadCount: number;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
	const [state, dispatch] = useReducer(
		reducer,
		undefined,
		createInitialState,
	);

	const unreadCount = useMemo(
		() => state.notifications.filter((n) => !n.read).length,
		[state.notifications],
	);

	const value = useMemo<AppStateContextValue>(
		() => ({ state, dispatch, unreadCount }),
		[state, unreadCount],
	);

	return (
		<AppStateContext.Provider value={value}>
			{children}
		</AppStateContext.Provider>
	);
}

export function useAppState() {
	const ctx = useContext(AppStateContext);
	if (!ctx) {
		throw new Error("useAppState must be used within AppStateProvider");
	}
	return ctx;
}

// Selector hooks (public API): components should prefer these over `useAppState()`.
// This keeps the rest of the app insulated from AppState shape changes.
export function useUser() {
	return useAppState().state.user;
}

export function useDashboard() {
	return useAppState().state.dashboard;
}

export function useSubscriptions() {
	return useAppState().state.subscriptions;
}

export function useNotificationsList() {
	return useAppState().state.notifications;
}

export function useUnreadCount() {
	return useAppState().unreadCount;
}

export function useAppActions() {
	const { dispatch } = useAppState();
	return useMemo(
		() => ({
			clearAllNotifications: () =>
				dispatch({ type: "notifications/clearAll" }),
			markAllNotificationsRead: () =>
				dispatch({ type: "notifications/markAllRead" }),
			deleteNotification: (id: string) =>
				dispatch({ type: "notifications/deleteById", id }),
			markNotificationRead: (id: string) =>
				dispatch({ type: "notifications/markRead", id }),
			snoozeNotification: (id: string, hours: number = 24) =>
				dispatch({ type: "notifications/snooze", id, hours }),
			cancelSubscription: (id: string) =>
				dispatch({ type: "subscriptions/cancel", id }),
			addSubscription: (subscription: Subscription) =>
				dispatch({ type: "subscriptions/add", subscription }),
		}),
		[dispatch],
	);
}
