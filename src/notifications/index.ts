import type { AppRepository } from "@/src/repository/appRepository";

import { createExpoNotificationEngine } from "./expoNotificationEngine";
import { createNoopNotificationEngine } from "./noopNotificationEngine";
import type { NotificationEngine } from "./types";

export function createNotificationEngine(
	repository: AppRepository,
	mode: "expo" | "noop" = "expo",
): NotificationEngine {
	return mode === "noop"
		? createNoopNotificationEngine(repository)
		: createExpoNotificationEngine(repository);
}

export type { NotificationEngine } from "./types";
