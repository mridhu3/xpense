import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { ScreenContainer } from "@/components/screen-container";
import { Card, colors, Currency, IconBubble, ProgressBar, SectionTitle } from "@/components/xpense-ui";
import { categoryMeta, formatDate, formatINR, useXPense, type Category, type Transaction } from "@/lib/xpense-store";

const filters: Array<"All" | Category> = ["All", "Food", "Transport", "Shopping", "Entertainment"];

export default function ActivityScreen() {
  const { transactions, categoryTotals, totalSpent, monthlyBudget } = useXPense();
  const [filter, setFilter] = useState<"All" | Category>("All");
  const filtered = useMemo(() => filter === "All" ? transactions : transactions.filter((item) => item.category === filter), [filter, transactions]);
  const biggest = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  return <ScreenContainer edges={["top", "left", "right"]} style={styles.screen}>
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      ListHeaderComponent={<View>
        <View style={styles.topRow}><View><Text style={styles.pageTitle}>Activity</Text><Text style={styles.pageSubtitle}>Your money, in motion</Text></View><View style={styles.monthPill}><Text style={styles.monthText}>September</Text><MaterialIcons name="keyboard-arrow-down" size={17} color={colors.ink} /></View></View>
        <Card dark style={styles.analyticsCard}><View style={styles.analyticsTop}><View><Text style={styles.darkEyebrow}>TOTAL SPEND</Text><Currency amount={totalSpent} color="#fff" style={styles.analyticsAmount} /><Text style={styles.darkCaption}>{Math.round((totalSpent / monthlyBudget) * 100)}% of monthly budget</Text></View><View style={styles.analyticsCircle}><MaterialIcons name="insights" size={25} color={colors.orange} /></View></View><View style={styles.chart}><View style={[styles.chartBar, { height: 26 }]} /><View style={[styles.chartBar, { height: 42 }]} /><View style={[styles.chartBar, { height: 34 }]} /><View style={[styles.chartBar, { height: 60, backgroundColor: colors.orange }]} /><View style={[styles.chartBar, { height: 50 }]} /><View style={[styles.chartBar, { height: 70, backgroundColor: "#FFB08B" }]} /><View style={[styles.chartBar, { height: 58 }]} /></View><View style={styles.chartLabels}><Text style={styles.chartLabelText}>Mon</Text><Text style={styles.chartLabelText}>Tue</Text><Text style={styles.chartLabelText}>Wed</Text><Text style={styles.chartLabelText}>Thu</Text><Text style={styles.chartLabelText}>Fri</Text><Text style={styles.chartLabelText}>Sat</Text><Text style={styles.chartLabelText}>Sun</Text></View></Card>
        <View style={styles.filterRow}>{filters.map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text></Pressable>)}</View>
        <View style={styles.insightRow}><MaterialIcons name="auto-awesome" size={18} color={colors.orange} /><Text style={styles.insightCopy}>Most of your spend is <Text style={styles.insightBold}>{biggest?.[0] ?? "Food"}</Text> · tap a category to dig deeper.</Text></View>
        <SectionTitle title={filter === "All" ? "All transactions" : `${filter} transactions`} action={`${filtered.length} items`} />
      </View>}
      renderItem={({ item }) => <ActivityRow transaction={item} />}
      ListEmptyComponent={<View style={styles.empty}><MaterialIcons name="search-off" size={28} color={colors.muted} /><Text style={styles.emptyText}>No transactions in this category yet.</Text></View>}
    />
  </ScreenContainer>;
}

function ActivityRow({ transaction }: { transaction: Transaction }) {
  const meta = categoryMeta[transaction.category];
  return <View style={styles.row}><IconBubble name={meta.icon as never} color={`${meta.color}18`} iconColor={meta.color} size={45} /><View style={styles.rowCopy}><Text style={styles.merchant}>{transaction.merchant}</Text><Text style={styles.meta}>{transaction.category} · {transaction.wallet} · {formatDate(transaction.createdAt)}</Text></View><Text style={styles.amount}>−{formatINR(transaction.amount)}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.canvas }, content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }, pageTitle: { color: colors.ink, fontSize: 28, fontWeight: "900", letterSpacing: -0.8 }, pageSubtitle: { color: colors.muted, fontSize: 13, marginTop: 4 },
  monthPill: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 13, paddingHorizontal: 11, paddingVertical: 9, flexDirection: "row", alignItems: "center", gap: 3 }, monthText: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  analyticsCard: { padding: 20, borderRadius: 24, marginBottom: 17 }, analyticsTop: { flexDirection: "row", justifyContent: "space-between" }, darkEyebrow: { color: "#9FB3BE", fontSize: 10, letterSpacing: 1, fontWeight: "900" }, analyticsAmount: { fontSize: 29, marginTop: 9 }, darkCaption: { color: "#9FB3BE", fontSize: 11, marginTop: 4 }, analyticsCircle: { width: 48, height: 48, backgroundColor: "#254354", borderRadius: 17, justifyContent: "center", alignItems: "center" }, chart: { height: 84, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 18, paddingHorizontal: 8 }, chartBar: { width: 20, backgroundColor: "#4D6571", borderRadius: 5 }, chartLabels: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 8, marginTop: 8 }, chartLabelText: { color: "#9FB3BE", fontSize: 9 },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 15 }, filter: { borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 8 }, filterActive: { backgroundColor: colors.orange, borderColor: colors.orange }, filterText: { color: colors.muted, fontSize: 11, fontWeight: "700" }, filterTextActive: { color: "#fff" },
  insightRow: { backgroundColor: colors.yellowSoft, borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 22 }, insightCopy: { color: colors.ink, flex: 1, fontSize: 12, lineHeight: 17 }, insightBold: { fontWeight: "900" }, row: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 12 }, rowCopy: { flex: 1, marginLeft: 12 }, merchant: { color: colors.ink, fontSize: 14, fontWeight: "800" }, meta: { color: colors.muted, fontSize: 11, marginTop: 4 }, amount: { color: colors.ink, fontWeight: "900", fontSize: 14 }, empty: { alignItems: "center", padding: 32 }, emptyText: { color: colors.muted, marginTop: 10 },
});
