import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import DonutChart, {
	type DonutDatum,
} from "@/src/components/analytics/DonutChart";
import PopoverSelect from "@/src/components/analytics/PopoverSelect";
import type { Subscription } from "@/src/components/subscriptions/SubscriptionCard";
import Card from "@/src/components/ui/Card";
import { useTabBarContentPadding } from "@/src/hooks/useTabBarContentPadding";
import { useSubscriptions } from "@/src/state/appState";
import { formatDateLong, parseIsoLike } from "@/src/utils/helper";
import { computeNextRenewalIso } from "@/src/utils/renewal";

type Period = "Monthly" | "Yearly";

const PALETTE = [
	"#1D4ED8",
	"#3B82F6",
	"#93C5FD",
	"#60A5FA",
	"#2563EB",
	"#A5B4FC",
	"#38BDF8",
] as const;

function costForPeriod(period: Period, sub: Subscription): number {
	const cycle = sub.billingCycle ?? "Monthly";
	const perCycle = sub.pricePerBillingCycle ?? sub.pricePerMonth;
	if (!Number.isFinite(perCycle)) return 0;
	if (period === "Monthly") {
		if (cycle === "Yearly") return perCycle / 12;
		if (cycle === "Weekly") return perCycle * 4.345;
		return perCycle;
	}
	// Yearly
	if (cycle === "Yearly") return perCycle;
	if (cycle === "Weekly") return perCycle * 52;
	return perCycle * 12;
}

function formatCompact(amount: number) {
	const rounded = Math.round(amount);
	return rounded.toLocaleString("en-IN");
}

function clamp(n: number, min: number, max: number) {
	return Math.max(min, Math.min(max, n));
}

function daysUntil(iso: string): number | null {
	const dt = parseIsoLike(iso);
	if (!dt) return null;
	const diffMs = dt.getTime() - Date.now();
	return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

const Analytics = () => {
	const contentBottomPadding = useTabBarContentPadding(24);
	const subscriptions = useSubscriptions();
	const [period, setPeriod] = useState<Period>("Monthly");
	const [selectedCategory, setSelectedCategory] = useState<string | null>(
		null,
	);

	const activeSubs = useMemo(
		() => subscriptions.filter((s) => s.status !== "cancelled"),
		[subscriptions],
	);

	const currencySymbol = useMemo(
		() => activeSubs[0]?.currencySymbol ?? "₹",
		[activeSubs],
	);

	const totalSpend = useMemo(() => {
		return activeSubs.reduce((sum, s) => sum + costForPeriod(period, s), 0);
	}, [activeSubs, period]);

	const breakdown = useMemo(() => {
		const map = new Map<string, { total: number; names: string[] }>();
		for (const s of activeSubs) {
			const key = s.category ?? "Other";
			const cur = map.get(key) ?? { total: 0, names: [] };
			cur.total += costForPeriod(period, s);
			if (cur.names.length < 4) cur.names.push(s.name);
			map.set(key, cur);
		}
		const items = Array.from(map.entries())
			.map(([category, info]) => ({ category, ...info }))
			.filter((x) => x.total > 0)
			.sort((a, b) => b.total - a.total);
		return items;
	}, [activeSubs, period]);

	const donutData: DonutDatum[] = useMemo(() => {
		return breakdown.map((b, idx) => ({
			label: b.category,
			value: b.total,
			color: PALETTE[idx % PALETTE.length]!,
			subLabel: `${currencySymbol} ${formatCompact(b.total)} • ${b.names.join(", ")}`,
		}));
	}, [breakdown, currencySymbol]);

	const paymentBreakdown = useMemo(() => {
		const map = new Map<string, number>();
		for (const s of activeSubs) {
			const key = (s.paymentMethod?.trim() || "Unknown") as string;
			map.set(key, (map.get(key) ?? 0) + costForPeriod(period, s));
		}
		return Array.from(map.entries())
			.map(([method, total]) => ({ method, total }))
			.sort((a, b) => b.total - a.total);
	}, [activeSubs, period]);

	const renewalRisk = useMemo(() => {
		const maxMonthly = Math.max(
			...activeSubs.map((s) => costForPeriod("Monthly", s)),
			1,
		);
		const items = activeSubs
			.map((s) => {
				const effectiveIso =
					computeNextRenewalIso(s) ?? s.nextPaymentDate;
				const dueIn = daysUntil(effectiveIso);
				const monthlyCost = costForPeriod("Monthly", s);
				const dueSoon =
					dueIn == null
						? 0
						: dueIn <= 0
							? 80
							: dueIn <= 3
								? 70
								: dueIn <= 7
									? 55
									: dueIn <= 14
										? 35
										: dueIn <= 30
											? 20
											: 8;
				const costScore = clamp((monthlyCost / maxMonthly) * 30, 0, 30);
				const reminderPenalty = (s.reminderEnabled ?? true) ? 0 : 20;
				const trialPenalty = s.status === "trial" ? 15 : 0;
				const paymentPenalty = s.paymentMethod ? 0 : 5;
				const score = clamp(
					Math.round(
						dueSoon +
							costScore +
							reminderPenalty +
							trialPenalty +
							paymentPenalty,
					),
					0,
					100,
				);
				const level =
					score >= 70 ? "High" : score >= 40 ? "Medium" : "Low";
				return {
					subscription: s,
					score,
					level,
					dueIn,
					effectiveIso,
				};
			})
			.sort((a, b) => b.score - a.score);

		return {
			top: items.slice(0, 3),
			highCount: items.filter((i) => i.level === "High").length,
		};
	}, [activeSubs]);

	const trialInsights = useMemo(() => {
		const trials = subscriptions.filter((s) => s.status === "trial");
		const endingSoon = trials
			.map((s) => ({
				s,
				dueIn: daysUntil(computeNextRenewalIso(s) ?? s.nextPaymentDate),
			}))
			.filter((x) => x.dueIn != null && x.dueIn <= 7)
			.sort((a, b) => (a.dueIn ?? 0) - (b.dueIn ?? 0));
		return {
			activeCount: trials.length,
			endingSoon: endingSoon.slice(0, 3),
			endingSoonCount: endingSoon.length,
		};
	}, [subscriptions]);

	const savings = useMemo(() => {
		const cancelled = subscriptions.filter((s) => s.status === "cancelled");
		const savedMonthly = cancelled.reduce(
			(sum, s) => sum + costForPeriod("Monthly", s),
			0,
		);
		return { savedMonthly };
	}, [subscriptions]);

	const suggested = useMemo(() => {
		// Pick a high-cost active subscription as a suggestion.
		const sorted = [...activeSubs].sort(
			(a, b) => costForPeriod("Monthly", b) - costForPeriod("Monthly", a),
		);
		return sorted[0] ?? null;
	}, [activeSubs]);

	return (
		<SafeAreaView edges={["top"]} className="flex-1 bg-gray-100">
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: contentBottomPadding }}
			>
				<View className="px-4 pt-4">
					<Text className="text-2xl font-poppins-bold text-foreground">
						Insights
					</Text>
				</View>

				<View className="px-4 pt-4">
					<Card className="overflow-hidden" elevated>
						<View className="absolute left-0 top-6 h-12 w-1 rounded-r bg-blue-600" />
						<View className="px-5 py-5">
							<View className="flex-row items-center justify-between">
								<Text className="text-base font-poppins-medium text-foreground/70">
									Total Spent
								</Text>
								<PopoverSelect
									value={period}
									options={[
										{ key: "Monthly", label: "Monthly" },
										{ key: "Yearly", label: "Yearly" },
									]}
									onChange={setPeriod}
								/>
							</View>
							<View className="mt-3 flex-row items-end">
								<Text className="text-3xl font-poppins-bold text-foreground">
									{currencySymbol}
								</Text>
								<Text className="ml-2 text-4xl font-poppins-bold text-foreground">
									{formatCompact(totalSpend)}
								</Text>
							</View>
							<Text className="mt-2 text-xs font-poppins-medium text-foreground/50">
								Recurring spend ({period.toLowerCase()})
							</Text>
						</View>
					</Card>
				</View>

				<View className="px-4 pt-4">
					<Card elevated>
						<View className="px-5 py-5">
							<View className="flex-row items-center justify-between">
								<Text className="text-lg font-poppins-bold text-foreground">
									Spending Breakdown
								</Text>
								<PopoverSelect
									value={period}
									options={[
										{ key: "Monthly", label: "Monthly" },
										{ key: "Yearly", label: "Yearly" },
									]}
									onChange={setPeriod}
								/>
							</View>

							<View className="mt-5 items-center">
								{donutData.length === 0 ? (
									<Text className="text-sm font-poppins-medium text-foreground/60">
										No data yet.
									</Text>
								) : (
									<DonutChart
										data={donutData}
										onSelect={(idx) => {
											if (idx == null)
												setSelectedCategory(null);
											else
												setSelectedCategory(
													donutData[idx]?.label ??
														null,
												);
										}}
									/>
								)}
							</View>

							<View className="mt-4">
								{breakdown.slice(0, 6).map((b, idx) => {
									const color =
										PALETTE[idx % PALETTE.length]!;
									const total = totalSpend || 1;
									const pct = Math.round(
										(b.total / total) * 100,
									);
									const active =
										selectedCategory == null ||
										selectedCategory === b.category;
									return (
										<Pressable
											key={b.category}
											onPress={() =>
												setSelectedCategory((cur) =>
													cur === b.category
														? null
														: b.category,
												)
											}
											className="flex-row items-center justify-between py-2"
											style={({ pressed }) => ({
												opacity: pressed ? 0.85 : 1,
											})}
										>
											<View className="flex-row items-center">
												<View
													style={{
														width: 18,
														height: 18,
														borderRadius: 5,
														backgroundColor: color,
														opacity: active
															? 1
															: 0.35,
													}}
												/>
												<Text className="ml-3 text-base font-poppins-semibold text-foreground">
													{b.category}
												</Text>
												<Text className="ml-2 text-sm font-poppins-medium text-foreground/60">
													{pct}%
												</Text>
											</View>
											<Text className="text-base font-poppins-bold text-foreground">
												{currencySymbol}{" "}
												{formatCompact(b.total)}
											</Text>
										</Pressable>
									);
								})}
							</View>
						</View>
					</Card>
				</View>

				<View className="px-4 pt-4">
					<Card elevated>
						<View className="px-5 py-5">
							<View className="flex-row items-center justify-between">
								<Text className="text-lg font-poppins-bold text-foreground">
									Renewal risk
								</Text>
								<View className="rounded-full bg-red-50 px-3 py-1.5">
									<Text className="text-xs font-poppins-semibold text-red-600">
										{renewalRisk.highCount} high
									</Text>
								</View>
							</View>

							<Text className="mt-2 text-sm font-poppins-medium text-foreground/60">
								Score considers due date, cost, reminders,
								trial.
							</Text>

							<View className="mt-4">
								{renewalRisk.top.length === 0 ? (
									<Text className="text-sm font-poppins-medium text-foreground/60">
										No subscriptions yet.
									</Text>
								) : (
									renewalRisk.top.map((item) => (
										<Pressable
											key={item.subscription.id}
											onPress={() => {
												router.push({
													pathname:
														"/(drawer)/(tabs)/subscriptions/[id]",
													params: {
														id: item.subscription
															.id,
														from: "analytics",
													},
												});
											}}
											className="flex-row items-center justify-between py-3"
											style={({ pressed }) => ({
												opacity: pressed ? 0.85 : 1,
											})}
										>
											<View className="flex-1 pr-4">
												<Text className="text-sm font-poppins-semibold text-foreground">
													{item.subscription.name}
												</Text>
												<Text className="mt-1 text-xs font-poppins-medium text-foreground/60">
													Due{" "}
													{formatDateLong(
														item.subscription
															.nextPaymentDate,
													)}
													{item.dueIn != null
														? ` • in ${item.dueIn}d`
														: ""}
													{(item.subscription
														.reminderEnabled ??
													true)
														? ""
														: " • reminders off"}
												</Text>
											</View>
											<View className="items-end">
												<Text className="text-base font-poppins-bold text-foreground">
													{item.score}
												</Text>
												<Text
													className={`mt-0.5 text-xs font-poppins-semibold ${
														item.level === "High"
															? "text-red-600"
															: item.level ===
																  "Medium"
																? "text-amber-600"
																: "text-emerald-600"
													}`}
												>
													{item.level}
												</Text>
											</View>
										</Pressable>
									))
								)}
							</View>
						</View>
					</Card>
				</View>

				<View className="px-4 pt-4">
					<Card elevated>
						<View className="px-5 py-5">
							<Text className="text-lg font-poppins-bold text-foreground">
								Payment methods
							</Text>
							<Text className="mt-2 text-sm font-poppins-medium text-foreground/60">
								Breakdown of recurring spend by payment method.
							</Text>
							<View className="mt-4">
								{paymentBreakdown.length === 0 ? (
									<Text className="text-sm font-poppins-medium text-foreground/60">
										No data yet.
									</Text>
								) : (
									paymentBreakdown
										.slice(0, 5)
										.map((m, idx) => {
											const color =
												PALETTE[idx % PALETTE.length]!;
											return (
												<View key={m.method}>
													<View className="flex-row items-center justify-between py-3">
														<View className="flex-row items-center">
															<View
																style={{
																	width: 10,
																	height: 10,
																	borderRadius: 99,
																	backgroundColor:
																		color,
																}}
															/>
															<Text className="ml-3 text-sm font-poppins-semibold text-foreground">
																{m.method}
															</Text>
														</View>
														<Text className="text-sm font-poppins-bold text-foreground">
															{currencySymbol}{" "}
															{formatCompact(
																m.total,
															)}
														</Text>
													</View>
													<View
														style={{
															height: 1,
															backgroundColor:
																"rgba(8, 17, 38, 0.08)",
														}}
													/>
												</View>
											);
										})
								)}
							</View>
						</View>
					</Card>
				</View>

				<View className="px-4 pt-4">
					<Card elevated>
						<View className="px-5 py-5">
							<View className="flex-row items-center justify-between">
								<Text className="text-lg font-poppins-bold text-foreground">
									Trial insights
								</Text>
								<View className="rounded-full bg-blue-50 px-3 py-1.5">
									<Text className="text-xs font-poppins-semibold text-blue-700">
										{trialInsights.activeCount} active
									</Text>
								</View>
							</View>

							<Text className="mt-2 text-sm font-poppins-medium text-foreground/60">
								Trials use the next payment date as the end
								date.
							</Text>

							<View className="mt-4">
								{trialInsights.endingSoon.length === 0 ? (
									<Text className="text-sm font-poppins-medium text-foreground/60">
										No trials ending in 7 days.
									</Text>
								) : (
									trialInsights.endingSoon.map(
										({ s, dueIn }) => (
											<View key={s.id}>
												<View className="flex-row items-center justify-between py-3">
													<Text className="text-sm font-poppins-semibold text-foreground">
														{s.name}
													</Text>
													<View className="items-end">
														<Text className="text-xs font-poppins-medium text-foreground/60">
															Ends{" "}
															{formatDateLong(
																s.nextPaymentDate,
															)}
														</Text>
														<Text className="mt-1 text-sm font-poppins-bold text-foreground">
															{dueIn != null
																? `${dueIn} days`
																: "—"}
														</Text>
													</View>
												</View>
												<View
													style={{
														height: 1,
														backgroundColor:
															"rgba(8, 17, 38, 0.08)",
													}}
												/>
											</View>
										),
									)
								)}
							</View>
						</View>
					</Card>
				</View>

				<View className="px-4 pt-4">
					<Card elevated>
						<View className="px-5 py-5">
							<View className="flex-row items-center">
								<View className="size-12 items-center justify-center rounded-2xl bg-blue-50">
									{suggested?.logoUri ? (
										<Image
											source={{ uri: suggested.logoUri }}
											style={{ width: 36, height: 36 }}
											resizeMode="contain"
										/>
									) : (
										<Text className="text-lg font-poppins-bold text-blue-600">
											{(suggested?.name ?? "?")
												.slice(0, 1)
												.toUpperCase()}
										</Text>
									)}
								</View>
								<View className="ml-4 flex-1">
									<Text className="text-base font-poppins-semibold text-foreground">
										Potential savings
									</Text>
									<Text className="mt-1 text-sm font-poppins-medium text-foreground/60">
										Review high-cost subscriptions to save
										money.
									</Text>
								</View>
							</View>

							<Pressable
								onPress={() => {
									if (!suggested) return;
									router.push({
										pathname:
											"/(drawer)/(tabs)/subscriptions/[id]",
										params: {
											id: suggested.id,
											from: "analytics",
										},
									});
								}}
								hitSlop={10}
								className="mt-4 flex-row items-center"
								style={({ pressed }) => ({
									opacity: pressed ? 0.85 : 1,
								})}
							>
								<Text className="text-base font-poppins-semibold text-blue-600">
									Cancel Subscription
								</Text>
								<Ionicons
									name="chevron-forward"
									size={18}
									color="#2563EB"
								/>
							</Pressable>

							<View
								style={{
									marginTop: 14,
									height: 1,
									backgroundColor: "rgba(8, 17, 38, 0.08)",
								}}
							/>

							<Text className="mt-4 text-sm font-poppins-medium text-foreground/70">
								You saved {currencySymbol}
								{formatCompact(savings.savedMonthly)} last month
								by cancelling unused subs.
							</Text>
						</View>
					</Card>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

export default Analytics;
