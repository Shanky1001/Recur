import React, {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useReducer,
} from "react";

import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";
import { seed, type DummyData, type Notification } from "@/src/data/dummy";
import {
	cancelSubscription as dbCancelSubscription,
	clearNotifications as dbClearNotifications,
	deleteNotification as dbDeleteNotification,
	markAllNotificationsRead as dbMarkAllNotificationsRead,
	markNotificationRead as dbMarkNotificationRead,
	resetLocalData as dbResetLocalData,
	initSqlite,
	loadNotifications,
	loadSubscriptions,
	nowIsoUtc,
	seedIfEmpty,
	upsertNotification,
	upsertSubscription,
} from "@/src/db/sqlite";

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
	| {
			type: "app/hydrate";
			subscriptions: Subscription[];
			notifications: Notification[];
	  }
	| { type: "notifications/clearAll" }
	| { type: "notifications/markAllRead" }
	| { type: "notifications/deleteById"; id: string }
	| { type: "notifications/markRead"; id: string }
	| { type: "notifications/snooze"; id: string; snoozed: Notification }
	| { type: "subscriptions/cancel"; id: string }
	| { type: "subscriptions/add"; subscription: Subscription };

function addHours(iso: string, hours: number): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	date.setHours(date.getHours() + hours);
	return date.toISOString();
}

function deriveDashboard(
	base: Dashboard,
	subscriptions: Subscription[],
): Dashboard {
	const activeCount = subscriptions.filter(
		(s) => s.status !== "cancelled",
	).length;
	const monthlySpend = subscriptions
		.filter((s) => s.status !== "cancelled")
		.reduce(
			(sum, s) =>
				sum + (Number.isFinite(s.pricePerMonth) ? s.pricePerMonth : 0),
			0,
		);

	return {
		...base,
		activeSubscriptions: activeCount,
		totalMonthlySpend: monthlySpend,
	};
}

function reducer(state: AppState, action: Action): AppState {
	switch (action.type) {
		case "app/hydrate": {
			const dashboard = deriveDashboard(
				state.dashboard,
				action.subscriptions,
			);
			return {
				...state,
				subscriptions: action.subscriptions,
				notifications: action.notifications,
				dashboard,
			};
		}
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
		case "notifications/snooze":
			return {
				...state,
				notifications: state.notifications
					.map((n) => (n.id === action.id ? { ...n, read: true } : n))
					.concat([action.snoozed]),
			};
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
				dashboard: deriveDashboard(state.dashboard, nextSubscriptions),
			};
		}
		case "subscriptions/add": {
			const nextSubscriptions = [
				action.subscription,
				...state.subscriptions,
			];
			return {
				...state,
				subscriptions: nextSubscriptions,
				dashboard: deriveDashboard(state.dashboard, nextSubscriptions),
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

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				await initSqlite();
				await seedIfEmpty(seed.subscriptions, seed.notifications);
				const [subs, notifs] = await Promise.all([
					loadSubscriptions(),
					loadNotifications(),
				]);
				if (cancelled) return;
				dispatch({
					type: "app/hydrate",
					subscriptions: subs,
					notifications: notifs,
				});
			} catch {
				// If SQLite fails (e.g., web), fall back to in-memory seed.
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

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
	const notifications = useNotificationsList();
	return useMemo(
		() => ({
			resetLocalData: async () => {
				await dbResetLocalData(seed.subscriptions, seed.notifications);
				const [subs, notifs] = await Promise.all([
					loadSubscriptions(),
					loadNotifications(),
				]);
				dispatch({
					type: "app/hydrate",
					subscriptions: subs,
					notifications: notifs,
				});
			},
			clearAllNotifications: async () => {
				await dbClearNotifications();
				dispatch({ type: "notifications/clearAll" });
			},
			markAllNotificationsRead: async () => {
				await dbMarkAllNotificationsRead();
				dispatch({ type: "notifications/markAllRead" });
			},
			deleteNotification: async (id: string) => {
				await dbDeleteNotification(id);
				dispatch({ type: "notifications/deleteById", id });
			},
			markNotificationRead: async (id: string) => {
				await dbMarkNotificationRead(id);
				dispatch({ type: "notifications/markRead", id });
			},
			snoozeNotification: async (id: string, hours: number = 24) => {
				const existing = notifications.find((n) => n.id === id);
				if (!existing) return;
				const snoozed: Notification = {
					...existing,
					id: `${existing.id}-snooze-${Date.now()}`,
					read: false,
					createdAt: addHours(nowIsoUtc(), hours),
				};
				// Persist: mark original read + insert snoozed notification
				await dbMarkNotificationRead(id);
				await upsertNotification(snoozed);
				dispatch({ type: "notifications/snooze", id, snoozed });
			},
			cancelSubscription: async (id: string) => {
				await dbCancelSubscription(id);
				dispatch({ type: "subscriptions/cancel", id });
			},
			addSubscription: async (subscription: Subscription) => {
				await upsertSubscription(subscription);
				dispatch({ type: "subscriptions/add", subscription });
			},
		}),
		[dispatch, notifications],
	);
}
