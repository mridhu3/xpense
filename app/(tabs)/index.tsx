import { router } from "expo-router";
import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { AICoach } from "@/components/ai-coach";
import { Card, colors, Currency, IconBubble, LogoMark, ProgressBar, SectionTitle } from "@/components/xpense-ui";
import { categoryMeta, formatDate, formatINR, useXPense, type Category, type Transaction } from "@/lib/xpense-store";

const categoryOrder: Category[] = ["Food", "Transport", "Shopping", "Bills", "Entertainment"];

export default function HomeScreen() {
  const { transactions, goals, totalSpent, monthlyBudget, categoryTotals, xp, budgetMonth, availableMonths, setBudgetMonth, profileName } = useXPense();
  const monthIndex = availableMonths.indexOf(budgetMonth);
  const changeMonth = (direction: number) => { const next = availableMonths[monthIndex + direction]; if (next) setBudgetMonth(next); };
  const budgetPercent = Math.min(totalSpent / monthlyBudget, 1);
  const remaining = Math.max(monthlyBudget - totalSpent, 0);
  const forecast = Math.round(totalSpent * 1.18);
  const firstName = profileName.split(" ")[0] || "User";
  const topTransactions = useMemo(() => transactions.slice(0, 4), [transactions]);

  return (
    <ScreenContainer edges={["top", "left", "right"]} style={styles.screen}>
      <FlatList
        data={topTransactions}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View><LogoMark /><Text style={styles.greeting}>Good afternoon, {firstName} <Text style={styles.wave}>✦</Text></Text><Text style={styles.subGreeting}>Here’s your money snapshot</Text></View>
              <Pressable onPress={() => router.push("/settings")} style={({ pressed }) => [styles.bellButton, pressed && { opacity: 0.6 }]}><MaterialIcons name="notifications-none" size={23} color={colors.ink} /><View style={styles.notificationDot} /></Pressable>
            </View>

            <Card dark style={styles.balanceCard}>
              <View style={styles.balanceTop}><Text style={styles.balanceLabel}>AVAILABLE TO SPEND</Text><View style={styles.onTrack}><MaterialIcons name="trending-up" size={13} color="#8FE4C0" /><Text style={styles.onTrackText}>On track</Text></View></View>
              <Currency amount={remaining} color="#FFFFFF" style={styles.balanceAmount} />
              <Text style={styles.balanceHint}>of {formatINR(monthlyBudget)} monthly budget left</Text>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceStats}><View><Text style={styles.darkStatLabel}>Spent this month</Text><Currency amount={totalSpent} color="#FFFFFF" style={styles.darkStatValue} /></View><View><Text style={styles.darkStatLabel}>7-day forecast</Text><Currency amount={forecast} color="#FFFFFF" style={styles.darkStatValue} /></View><View style={styles.xpBadge}><Text style={styles.xpBadgeText}>LVL 08</Text><Text style={styles.xpBadgeSub}>{xp.toLocaleString("en-IN")} XP</Text></View></View>
            </Card>

            <Card style={styles.budgetCard}>
              <View style={styles.budgetCopy}><View style={styles.monthRow}><Text style={styles.cardEyebrow}>MONTHLY BUDGET</Text><View style={styles.monthControls}><Pressable onPress={() => changeMonth(1)} disabled={monthIndex >= availableMonths.length - 1} style={styles.monthArrow}><MaterialIcons name="chevron-left" size={17} color={colors.muted} /></Pressable><Text style={styles.monthLabel}>{formatMonth(budgetMonth)}</Text><Pressable onPress={() => changeMonth(-1)} disabled={monthIndex <= 0} style={styles.monthArrow}><MaterialIcons name="chevron-right" size={17} color={colors.muted} /></Pressable></View></View><Text style={styles.budgetTitle}>{formatINR(totalSpent)} <Text style={styles.budgetOf}>/ {formatINR(monthlyBudget)}</Text></Text><ProgressBar value={totalSpent} total={monthlyBudget} color={colors.orange} height={10} /><Text style={styles.budgetCaption}>{Math.round(budgetPercent * 100)}% used · {formatINR(remaining)} remaining</Text></View>
              <View style={styles.ring}><View style={styles.ringInner}><Text style={styles.ringPercent}>{Math.round(budgetPercent * 100)}%</Text><Text style={styles.ringLabel}>used</Text></View></View>
            </Card>

            <View style={styles.insight}><View style={styles.insightIcon}><MaterialIcons name="auto-awesome" size={21} color={colors.orange} /></View><View style={styles.insightText}><Text style={styles.insightLabel}>SMART NUDGE</Text><Text style={styles.insightBody}>You’re on pace to overspend <Text style={styles.insightStrong}>Dining by ₹620</Text> this month.</Text></View><Pressable onPress={() => router.push("/activity")}><MaterialIcons name="chevron-right" size={24} color={colors.orange} /></Pressable></View>
            <AICoach spent={totalSpent} budget={monthlyBudget} categories={categoryTotals} goalCount={goals.length} />

            <SectionTitle title="Spending by category" action="See all" onAction={() => router.push("/activity")} />
            <View style={styles.categoryRow}>{categoryOrder.map((category) => { const meta = categoryMeta[category]; const value = categoryTotals[category]; return <Pressable key={category} onPress={() => router.push("/activity")} style={({ pressed }) => [styles.categoryCard, pressed && { opacity: 0.72 }]}><IconBubble name={meta.icon as never} color={`${meta.color}18`} iconColor={meta.color} size={42} /><Text style={styles.categoryName}>{category}</Text><Text style={styles.categoryValue}>{formatINR(value)}</Text><ProgressBar value={value} total={meta.limit} color={meta.color} height={5} /></Pressable>; })}</View>

            <SectionTitle title="Goal vaults" action="Manage" onAction={() => router.push("/goals")} />
            <View style={styles.goalsRow}>{goals.slice(0, 2).map((goal) => <Pressable key={goal.id} onPress={() => router.push("/goals")} style={({ pressed }) => [styles.goalCard, pressed && { opacity: 0.72 }]}><View style={styles.goalTop}><Text style={styles.goalEmoji}>{goal.emoji}</Text><Text style={styles.goalPercent}>{Math.round((goal.saved / goal.target) * 100)}%</Text></View><Text style={styles.goalName}>{goal.name}</Text><Currency amount={goal.saved} color={colors.ink} style={styles.goalSaved} /><Text style={styles.goalTarget}>of {formatINR(goal.target)}</Text><ProgressBar value={goal.saved} total={goal.target} color={goal.accent} height={7} /><Text style={styles.goalDue}>{goal.dueLabel}</Text></Pressable>)}</View>

            <SectionTitle title="Recent expenses" action="View all" onAction={() => router.push("/activity")} />
          </View>
        }
        renderItem={({ item }) => <TransactionRow transaction={item} />}
        ListEmptyComponent={<Text style={styles.emptyText}>Your recent expenses will appear here.</Text>}
        ListFooterComponent={<Pressable onPress={() => router.push("/add")} style={({ pressed }) => [styles.addExpenseButton, pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }]}><MaterialIcons name="add" size={20} color="#fff" /><Text style={styles.addExpenseText}>Add expense</Text></Pressable>}
      />
    </ScreenContainer>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const meta = categoryMeta[transaction.category];
  return <View style={styles.transactionRow}><IconBubble name={meta.icon as never} color={`${meta.color}18`} iconColor={meta.color} size={44} /><View style={styles.transactionInfo}><Text style={styles.transactionMerchant}>{transaction.merchant}</Text><Text style={styles.transactionMeta}>{transaction.category} · {transaction.wallet} · {formatDate(transaction.createdAt)}</Text></View><Text style={styles.transactionAmount}>−{formatINR(transaction.amount)}</Text></View>;
}

function formatMonth(value: string) {
  return new Date(`${value}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.canvas },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 36 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 19 },
  greeting: { color: colors.ink, fontSize: 17, fontWeight: "800", marginTop: 15, letterSpacing: -0.2 },
  wave: { color: colors.orange, fontSize: 16 },
  subGreeting: { color: colors.muted, fontSize: 13, marginTop: 4 },
  bellButton: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  notificationDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.orange, position: "absolute", right: 9, top: 8, borderWidth: 1.5, borderColor: colors.card },
  balanceCard: { padding: 20, borderRadius: 26, marginBottom: 14 },
  balanceTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  balanceLabel: { color: "#A4B7C3", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  onTrack: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#224A4C", borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5 },
  onTrackText: { color: "#8FE4C0", fontSize: 11, fontWeight: "800" },
  balanceAmount: { fontSize: 33, marginTop: 20, letterSpacing: -1.2 },
  balanceHint: { color: "#A4B7C3", fontSize: 12, marginTop: 4 },
  balanceDivider: { height: 1, backgroundColor: "#2D4653", marginVertical: 18 },
  balanceStats: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  darkStatLabel: { color: "#8DA5B2", fontSize: 10, marginBottom: 4 },
  darkStatValue: { fontSize: 15 },
  xpBadge: { alignItems: "flex-end" },
  xpBadgeText: { color: colors.yellow, fontWeight: "900", fontSize: 12, letterSpacing: 0.5 },
  xpBadgeSub: { color: "#8DA5B2", fontSize: 10, marginTop: 3 },
  budgetCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 18, marginBottom: 14 },
  budgetCopy: { flex: 1, paddingRight: 12 },
  monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  monthControls: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.line, borderRadius: 10 },
  monthArrow: { paddingHorizontal: 3, paddingVertical: 2 },
  monthLabel: { color: colors.ink, fontSize: 10, fontWeight: "800", minWidth: 58, textAlign: "center" },
  cardEyebrow: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  budgetTitle: { color: colors.ink, fontSize: 20, fontWeight: "900", marginTop: 7, marginBottom: 12 },
  budgetOf: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  budgetCaption: { color: colors.muted, fontSize: 11, marginTop: 8 },
  ring: { width: 87, height: 87, borderRadius: 44, borderWidth: 9, borderColor: colors.orangeSoft, borderTopColor: colors.orange, borderRightColor: colors.orange, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-35deg" }] },
  ringInner: { alignItems: "center", transform: [{ rotate: "35deg" }] },
  ringPercent: { color: colors.ink, fontSize: 15, fontWeight: "900" },
  ringLabel: { color: colors.muted, fontSize: 9, marginTop: 1 },
  insight: { backgroundColor: colors.orangeSoft, borderRadius: 18, padding: 13, flexDirection: "row", alignItems: "center", marginBottom: 25 },
  insightIcon: { width: 36, height: 36, borderRadius: 13, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  insightText: { flex: 1, paddingHorizontal: 11 },
  insightLabel: { color: colors.orange, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  insightBody: { color: colors.ink, fontSize: 12, lineHeight: 17, marginTop: 3 },
  insightStrong: { fontWeight: "900" },
  categoryRow: { flexDirection: "row", gap: 10, marginBottom: 25 },
  categoryCard: { width: 104, backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 11 },
  categoryName: { color: colors.ink, fontSize: 12, fontWeight: "800", marginTop: 10 },
  categoryValue: { color: colors.muted, fontSize: 11, marginTop: 4, marginBottom: 8 },
  goalsRow: { flexDirection: "row", gap: 10, marginBottom: 25 },
  goalCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 19, padding: 13, width: "48%" },
  goalTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  goalEmoji: { fontSize: 23 },
  goalPercent: { color: colors.orange, fontSize: 12, fontWeight: "900" },
  goalName: { color: colors.ink, fontSize: 13, fontWeight: "800", marginTop: 12 },
  goalSaved: { fontSize: 15, marginTop: 7 },
  goalTarget: { color: colors.muted, fontSize: 10, marginTop: 2, marginBottom: 10 },
  goalDue: { color: colors.muted, fontSize: 10, marginTop: 7 },
  transactionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.line },
  transactionInfo: { flex: 1, marginLeft: 12 },
  transactionMerchant: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  transactionMeta: { color: colors.muted, fontSize: 11, marginTop: 4 },
  transactionAmount: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  emptyText: { color: colors.muted, paddingVertical: 18, textAlign: "center" },
  addExpenseButton: { marginTop: 18, backgroundColor: colors.orange, borderRadius: 16, minHeight: 50, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  addExpenseText: { color: "#fff", fontWeight: "900", fontSize: 14 },
});
