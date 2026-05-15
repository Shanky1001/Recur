import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";
import { seed, type DummyData, type Notification } from "@/src/data/dummy";
import { appService } from "@/src/services/appService";
import { parseIsoLike } from "@/src/utils/helper";

export type PreferencesState = {
	currency: string;
	defaultReminderDaysBefore: number;
	defaultReminderEnabled: boolean;
};

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
	preferences: PreferencesState;
	hydrated: boolean;
};

function deriveDashboard(
	base: Dashboard,
	subscriptions: Subscription[],
): Dashboard {
	const activeSubscriptions = subscriptions.filter(
		(s) => s.status !== "cancelled",
	);

	const start = new Date();
	start.setHours(0, 0, 0, 0);
	const end = new Date(start);
	end.setDate(end.getDate() + 7);
	end.setHours(23, 59, 59, 999);
	const pendingThisWeek = activeSubscriptions.filter((s) => {
		const next = parseIsoLike(s.nextPaymentDate);
		if (!next) return false;
		const t = next.getTime();
		return t >= start.getTime() && t <= end.getTime();
	}).length;

	const monthlySpend = activeSubscriptions.reduce(
		(sum, s) =>
			sum + (Number.isFinite(s.pricePerMonth) ? s.pricePerMonth : 0),
		0,
	);

	return {
		...base,
		activeSubscriptions: activeSubscriptions.length,
		totalMonthlySpend: monthlySpend,
		pendingThisWeek,
	};
}

export const hydrateApp = createAsyncThunk("app/hydrate", async () => {
	return await appService.hydrate();
});

export const resetLocalData = createAsyncThunk(
	"app/resetLocalData",
	async () => {
		return await appService.resetLocalData();
	},
);

export const updatePreferences = createAsyncThunk(
	"preferences/update",
	async (partial: Partial<PreferencesState>, { getState }) => {
		const state = getState() as { app: AppState };
		const next: PreferencesState = {
			...state.app.preferences,
			...partial,
		};
		await appService.updatePreferences(next);
		return next;
	},
);

export const addSubscription = createAsyncThunk(
	"subscriptions/add",
	async (subscription: Subscription) => {
		return await appService.upsertSubscription(subscription);
	},
);

export const upsertSubscription = createAsyncThunk(
	"subscriptions/upsert",
	async (subscription: Subscription) => {
		return await appService.upsertSubscription(subscription);
	},
);

export const cancelSubscription = createAsyncThunk(
	"subscriptions/cancel",
	async (id: string) => {
		await appService.cancelSubscription(id);
		return id;
	},
);

export const deleteSubscription = createAsyncThunk(
	"subscriptions/delete",
	async (id: string) => {
		await appService.deleteSubscription(id);
		return id;
	},
);

export const clearAllNotifications = createAsyncThunk(
	"notifications/clearAll",
	async () => {
		await appService.clearAllNotifications();
		return true;
	},
);

export const resyncReminders = createAsyncThunk(
	"notifications/resyncReminders",
	async (_, { getState }) => {
		const state = getState() as { app: AppState };
		await appService.resyncReminders(state.app.subscriptions);
		return true;
	},
);

export const markAllNotificationsRead = createAsyncThunk(
	"notifications/markAllRead",
	async () => {
		await appService.markAllNotificationsRead();
		return true;
	},
);

export const deleteNotification = createAsyncThunk(
	"notifications/deleteById",
	async (id: string) => {
		await appService.deleteNotification(id);
		return id;
	},
);

export const markNotificationRead = createAsyncThunk(
	"notifications/markRead",
	async (id: string) => {
		await appService.markNotificationRead(id);
		return id;
	},
);

export const snoozeNotification = createAsyncThunk(
	"notifications/snooze",
	async (args: { id: string; hours?: number }, { getState }) => {
		const state = getState() as { app: AppState };
		return await appService.snoozeNotification({
			id: args.id,
			hours: args.hours ?? 24,
			notifications: state.app.notifications,
		});
	},
);

const initialState: AppState = {
	user: {
		name: seed.user.name,
		avatarUri: seed.user.avatarUri,
	},
	dashboard: seed.dashboard,
	subscriptions: seed.subscriptions,
	notifications: seed.notifications,
	preferences: {
		currency: seed.preferences?.currency ?? "INR",
		defaultReminderDaysBefore:
			seed.preferences?.defaultReminderDaysBefore ?? 3,
		defaultReminderEnabled:
			seed.preferences?.defaultReminderEnabled ?? true,
	},
	hydrated: false,
};

const appSlice = createSlice({
	name: "app",
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(hydrateApp.fulfilled, (state, action) => {
				state.subscriptions = action.payload.subscriptions;
				state.notifications = action.payload.notifications;
				state.preferences = {
					currency: action.payload.preferences.currency,
					defaultReminderDaysBefore:
						action.payload.preferences.defaultReminderDaysBefore,
					defaultReminderEnabled:
						action.payload.preferences.defaultReminderEnabled,
				};
				state.dashboard = deriveDashboard(
					state.dashboard,
					state.subscriptions,
				);
				state.hydrated = true;
			})
			.addCase(resetLocalData.fulfilled, (state, action) => {
				state.subscriptions = action.payload.subscriptions;
				state.notifications = action.payload.notifications;
				state.preferences = {
					currency: action.payload.preferences.currency,
					defaultReminderDaysBefore:
						action.payload.preferences.defaultReminderDaysBefore,
					defaultReminderEnabled:
						action.payload.preferences.defaultReminderEnabled,
				};
				state.dashboard = deriveDashboard(
					state.dashboard,
					state.subscriptions,
				);
				state.hydrated = true;
			})
			.addCase(updatePreferences.fulfilled, (state, action) => {
				state.preferences = action.payload;
			})
			.addCase(addSubscription.fulfilled, (state, action) => {
				state.subscriptions = [action.payload, ...state.subscriptions];
				state.dashboard = deriveDashboard(
					state.dashboard,
					state.subscriptions,
				);
			})
			.addCase(upsertSubscription.fulfilled, (state, action) => {
				const idx = state.subscriptions.findIndex(
					(s) => s.id === action.payload.id,
				);
				if (idx >= 0) state.subscriptions[idx] = action.payload;
				else state.subscriptions.unshift(action.payload);
				state.dashboard = deriveDashboard(
					state.dashboard,
					state.subscriptions,
				);
			})
			.addCase(cancelSubscription.fulfilled, (state, action) => {
				for (const sub of state.subscriptions) {
					if (sub.id === action.payload) {
						sub.status = "cancelled";
						break;
					}
				}
				state.dashboard = deriveDashboard(
					state.dashboard,
					state.subscriptions,
				);
			})
			.addCase(deleteSubscription.fulfilled, (state, action) => {
				state.subscriptions = state.subscriptions.filter(
					(s) => s.id !== action.payload,
				);
				state.dashboard = deriveDashboard(
					state.dashboard,
					state.subscriptions,
				);
			})
			.addCase(clearAllNotifications.fulfilled, (state) => {
				state.notifications = [];
			})
			.addCase(markAllNotificationsRead.fulfilled, (state) => {
				state.notifications = state.notifications.map((n) => ({
					...n,
					read: true,
				}));
			})
			.addCase(deleteNotification.fulfilled, (state, action) => {
				state.notifications = state.notifications.filter(
					(n) => n.id !== action.payload,
				);
			})
			.addCase(markNotificationRead.fulfilled, (state, action) => {
				state.notifications = state.notifications.map((n) =>
					n.id === action.payload ? { ...n, read: true } : n,
				);
			})
			.addCase(snoozeNotification.fulfilled, (state, action) => {
				if (!action.payload) return;
				const { id, snoozed } = action.payload;
				state.notifications = state.notifications
					.map((n) => (n.id === id ? { ...n, read: true } : n))
					.concat([snoozed]);
			});
	},
});

export default appSlice.reducer;
