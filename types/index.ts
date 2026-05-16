// src/types/index.ts
import type { Category, RecurringFreq, RecurringRule, Transaction, TransactionType, User } from "@prisma/client";

// ─── Re-exports from Prisma ───────────────────────────────────────────────────
export type { Category, RecurringFreq, RecurringRule, Transaction, TransactionType, User };

// ─── Extended types ───────────────────────────────────────────────────────────
export type TransactionWithCategory = Transaction & {
  category: Category;
};

export type CategoryWithStats = Category & {
  _count: { transactions: number };
  totalAmount: number;
};

// ─── Dashboard types ──────────────────────────────────────────────────────────
export interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  incomeChange: number;
  expenseChange: number;
  savingsRate: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
  count: number;
}

// ─── Form types ───────────────────────────────────────────────────────────────
export interface TransactionFormData {
  amount: number;
  description: string;
  type: TransactionType;
  date: Date;
  categoryId: string;
  isRecurring: boolean;
  notes?: string;
}

export interface CategoryFormData {
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

// ─── Action Results ───────────────────────────────────────────────────────────
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Filters ─────────────────────────────────────────────────────────────────
export interface TransactionFilters {
  type?: TransactionType;
  categoryId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}