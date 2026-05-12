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
	| { type: "notifications/markRead"; id: string };

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
		}),
		[dispatch],
	);
}
