import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Category = "Food" | "Transport" | "Shopping" | "Bills" | "Entertainment" | "Other";
export type Wallet = "UPI" | "Cash" | "Card";

export type Transaction = {
  id: string;
  merchant: string;
  amount: number;
  category: Category;
  wallet: Wallet;
  note?: string;
  createdAt: string;
};

export type Goal = {
  id: string;
  name: string;
  emoji: string;
  target: number;
  saved: number;
  dueLabel: string;
  accent: string;
};

export type Quest = {
  id: string;
  title: string;
  subtitle: string;
  reward: number;
  progress: number;
  total: number;
  completed: boolean;
  icon: string;
};

type StoreState = {
  transactions: Transaction[];
  goals: Goal[];
  quests: Quest[];
  monthlyBudget: number;
  xp: number;
  coins: number;
  streak: number;
  lastSavedAt: string | null;
  budgetMonth: string;
  profileName: string;
  avatar: string;
};

type AddExpenseInput = Omit<Transaction, "id" | "createdAt">;

type StoreContextValue = StoreState & {
  hydrated: boolean;
  addExpense: (expense: AddExpenseInput) => { exceeded: boolean; remaining: number };
  mergeTransactions: (transactions: Transaction[]) => void;
  replaceTransactions: (transactions: Transaction[]) => void;
  setBudgetMonth: (month: string) => void;
  setMonthlyBudget: (amount: number) => void;
  completeQuest: (questId: string) => void;
  addToGoal: (goalId: string, amount: number) => void;
  adjustGoal: (goalId: string, amount: number) => void;
  createGoal: (input: Omit<Goal, "id" | "saved">) => void;
  setProfile: (profileName: string, avatar: string) => void;
  switchUser: (userId: string | null, reset?: boolean) => Promise<Transaction[]>;
  totalSpent: number;
  categoryTotals: Record<Category, number>;
  availableMonths: string[];
};

const STORAGE_KEY = "xpense.local.v1";

const defaultTransactions: Transaction[] = [
  { id: "t1", merchant: "Chai Point", amount: 180, category: "Food", wallet: "UPI", createdAt: "2026-09-01T09:40:00.000Z", note: "Morning chai" },
  { id: "t2", merchant: "Uber", amount: 240, category: "Transport", wallet: "Card", createdAt: "2026-08-31T17:20:00.000Z" },
  { id: "t3", merchant: "Netflix", amount: 199, category: "Entertainment", wallet: "UPI", createdAt: "2026-08-30T12:00:00.000Z" },
  { id: "t4", merchant: "BigBasket", amount: 840, category: "Food", wallet: "Card", createdAt: "2026-08-29T18:30:00.000Z" },
  { id: "t5", merchant: "Myntra", amount: 1299, category: "Shopping", wallet: "UPI", createdAt: "2026-08-28T11:15:00.000Z" },
];

const defaultGoals: Goal[] = [
  { id: "g1", name: "New laptop", emoji: "💻", target: 65000, saved: 38200, dueLabel: "Due in 4 months", accent: "#F97316" },
  { id: "g2", name: "Goa trip", emoji: "🏝️", target: 18000, saved: 9600, dueLabel: "Due in 2 months", accent: "#14B8A6" },
  { id: "g3", name: "Emergency fund", emoji: "🛟", target: 30000, saved: 12000, dueLabel: "No due date", accent: "#8B5CF6" },
];

const defaultQuests: Quest[] = [
  { id: "q1", title: "Log 5 days straight", subtitle: "Keep your habit alive", reward: 120, progress: 4, total: 5, completed: false, icon: "local-fire-department" },
  { id: "q2", title: "No-spend weekend", subtitle: "Saturday + Sunday", reward: 200, progress: 2, total: 2, completed: true, icon: "weekend" },
  { id: "q3", title: "Save ₹500 this week", subtitle: "Move money to a goal vault", reward: 80, progress: 320, total: 500, completed: false, icon: "savings" },
  { id: "q4", title: "Money lesson", subtitle: "Learn about credit scores", reward: 40, progress: 0, total: 1, completed: false, icon: "school" },
  { id: "q5", title: "Review your month", subtitle: "Open your spending insights", reward: 60, progress: 0, total: 1, completed: false, icon: "assessment" },
  { id: "q6", title: "Add to any vault", subtitle: "Make one flexible deposit", reward: 90, progress: 0, total: 1, completed: false, icon: "account-balance" },
  { id: "q7", title: "Keep a clean streak", subtitle: "Log today’s spending", reward: 70, progress: 0, total: 1, completed: false, icon: "check-circle" },
];

const initialState: StoreState = {
  transactions: defaultTransactions,
  goals: defaultGoals,
  quests: defaultQuests,
  monthlyBudget: 18000,
  xp: 1260,
  coins: 840,
  streak: 12,
  lastSavedAt: null,
  budgetMonth: "2026-09",
  profileName: "User",
  avatar: "🙂",
};

const emptyState: StoreState = { ...initialState, transactions: [], goals: [], quests: [], xp: 0, coins: 0, streak: 0 };

const StoreContext = createContext<StoreContextValue | null>(null);

export function XPenseProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoreState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [storageUserId, setStorageUserId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(`${STORAGE_KEY}.guest`)
      .then((value) => {
        if (value) {
          try {
            setState({ ...initialState, ...JSON.parse(value) });
          } catch {
            // Keep safe defaults if a previous local snapshot is corrupt.
          }
        }
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(`${STORAGE_KEY}.${storageUserId ?? "guest"}`, JSON.stringify({ ...state, lastSavedAt: new Date().toISOString() })).catch(() => undefined);
  }, [state, hydrated, storageUserId]);

  const addExpense = (expense: AddExpenseInput) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const spentThisMonth = state.transactions.filter((transaction) => transaction.createdAt.slice(0, 7) === currentMonth).reduce((sum, transaction) => sum + transaction.amount, 0);
    const remaining = state.monthlyBudget - spentThisMonth - expense.amount;
    setState((current) => ({
      ...current,
      transactions: [{ ...expense, id: `t-${Date.now()}`, createdAt: new Date().toISOString() }, ...current.transactions],
      xp: current.xp + 15,
      coins: current.coins + 5,
    }));
    return { exceeded: remaining < 0, remaining };
  };

  const mergeTransactions = (remoteTransactions: Transaction[]) => {
    setState((current) => ({ ...current, transactions: mergeTransactionsById(current.transactions, remoteTransactions) }));
  };

  const replaceTransactions = (transactions: Transaction[]) => setState((current) => ({ ...current, transactions }));

  const setBudgetMonth = (month: string) => setState((current) => ({ ...current, budgetMonth: month }));

  const setMonthlyBudget = (amount: number) => { if (Number.isFinite(amount) && amount > 0) setState((current) => ({ ...current, monthlyBudget: Math.round(amount) })); };

  const completeQuest = (questId: string) => {
    setState((current) => {
      const quest = current.quests.find((item) => item.id === questId);
      if (!quest || quest.completed) return current;
      return {
        ...current,
        quests: current.quests.map((item) => item.id === questId ? { ...item, completed: true, progress: item.total } : item),
        xp: current.xp + quest.reward,
        coins: current.coins + quest.reward,
      };
    });
  };

  const adjustGoal = (goalId: string, amount: number) => {
    if (!Number.isFinite(amount) || amount === 0) return;
    setState((current) => ({
      ...current,
      goals: current.goals.map((goal) => goal.id === goalId ? { ...goal, saved: Math.max(0, Math.min(goal.target, goal.saved + amount)) } : goal),
      xp: amount > 0 ? current.xp + 25 : current.xp,
      coins: amount > 0 ? current.coins + 10 : current.coins,
    }));
  };

  const addToGoal = (goalId: string, amount: number) => adjustGoal(goalId, amount);

  const createGoal = (input: Omit<Goal, "id" | "saved">) => setState((current) => ({ ...current, goals: [...current.goals, { ...input, id: `g-${Date.now()}`, saved: 0 }] }));

  const setProfile = (profileName: string, avatar: string) => setState((current) => ({ ...current, profileName: profileName.trim() || "User", avatar }));

  const switchUser = async (userId: string | null, reset = false): Promise<Transaction[]> => {
    const nextState = reset ? emptyState : (() => null)();
    if (nextState) {
      setStorageUserId(userId);
      setState(nextState);
      setHydrated(true);
      await AsyncStorage.removeItem(`${STORAGE_KEY}.${userId ?? "guest"}`);
      return [];
    }
    const value = await AsyncStorage.getItem(`${STORAGE_KEY}.${userId ?? "guest"}`);
    const loaded = value ? { ...emptyState, ...JSON.parse(value) } : userId ? emptyState : initialState;
    setStorageUserId(userId);
    setState(loaded);
    setHydrated(true);
    return loaded.transactions;
  };

  const value = useMemo<StoreContextValue>(() => {
    const availableMonths = Array.from(new Set([state.budgetMonth, ...state.transactions.map((transaction) => transaction.createdAt.slice(0, 7))])).sort().reverse();
    const monthTransactions = state.transactions.filter((transaction) => transaction.createdAt.slice(0, 7) === state.budgetMonth);
    const categoryTotals: Record<Category, number> = { Food: 0, Transport: 0, Shopping: 0, Bills: 0, Entertainment: 0, Other: 0 };
    monthTransactions.forEach((transaction) => { categoryTotals[transaction.category] += transaction.amount; });
    return {
      ...state,
      hydrated,
      addExpense,
      mergeTransactions,
      replaceTransactions,
      setBudgetMonth,
      setMonthlyBudget,
      completeQuest,
      addToGoal,
      adjustGoal,
      createGoal,
      setProfile,
      switchUser,
      totalSpent: monthTransactions.reduce((sum, transaction) => sum + transaction.amount, 0),
      categoryTotals,
      availableMonths,
    };
  }, [state, hydrated]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useXPense() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useXPense must be used inside XPenseProvider");
  return context;
}

export const categoryMeta: Record<Category, { icon: string; color: string; limit: number }> = {
  Food: { icon: "restaurant", color: "#F97316", limit: 5500 },
  Transport: { icon: "directions-car", color: "#3B82F6", limit: 2500 },
  Shopping: { icon: "shopping-bag", color: "#A855F7", limit: 3200 },
  Bills: { icon: "receipt-long", color: "#14B8A6", limit: 2800 },
  Entertainment: { icon: "movie", color: "#EC4899", limit: 1800 },
  Other: { icon: "more-horiz", color: "#64748B", limit: 2200 },
};

export function mergeTransactionsById(local: Transaction[], remote: Transaction[]) {
  const merged = new Map<string, Transaction>();
  [...local, ...remote].forEach((transaction) => merged.set(transaction.id, transaction));
  return Array.from(merged.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function formatINR(amount: number) {
  const rounded = Math.round(amount);
  return rounded < 0 ? `-₹${Math.abs(rounded).toLocaleString("en-IN")}` : `₹${rounded.toLocaleString("en-IN")}`;
}

export function formatDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
