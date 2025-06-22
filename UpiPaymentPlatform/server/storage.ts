import {
  users,
  upiIds,
  transactions,
  adminUsers,
  type User,
  type UpsertUser,
  type UpiId,
  type InsertUpiId,
  type Transaction,
  type InsertTransaction,
  type AdminUser,
  type InsertAdminUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Admin user operations
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser>;
  updateAdminUserLastLogin(id: number): Promise<void>;
  
  // UPI ID operations
  getAllUpiIds(): Promise<UpiId[]>;
  getActiveUpiIds(): Promise<UpiId[]>;
  createUpiId(upiId: InsertUpiId): Promise<UpiId>;
  updateUpiIdLastUsed(upiId: string): Promise<void>;
  toggleUpiIdStatus(id: number, active: boolean): Promise<void>;
  deleteUpiId(id: number): Promise<void>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionByTxnId(txnId: string): Promise<Transaction | undefined>;
  updateTransactionStatus(txnId: string, status: "pending" | "success" | "failed"): Promise<void>;
  getAllTransactions(): Promise<Transaction[]>;
  getPendingTransactions(): Promise<Transaction[]>;
  getTransactionStats(): Promise<{
    totalRevenue: string;
    totalTransactions: number;
    pendingTransactions: number;
    todayTransactions: number;
  }>;
  
  // Enhanced analytics and filtering
  getAnalytics(startDate: Date, endDate: Date): Promise<{
    totalRevenue: string;
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    pendingTransactions: number;
    averageTransactionValue: string;
    dailyStats: Array<{
      date: string;
      transactions: number;
      revenue: string;
    }>;
  }>;
  getTransactionHistory(filters: {
    status?: string;
    startDate?: string;
    endDate?: string;
    limit: number;
  }): Promise<Transaction[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Admin user operations
  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    const [adminUser] = await db
      .select()
      .from(adminUsers)
      .where(and(eq(adminUsers.username, username), eq(adminUsers.active, true)));
    return adminUser;
  }

  async createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser> {
    const [newAdminUser] = await db
      .insert(adminUsers)
      .values(adminUser)
      .returning();
    return newAdminUser;
  }

  async updateAdminUserLastLogin(id: number): Promise<void> {
    await db
      .update(adminUsers)
      .set({ lastLogin: new Date() })
      .where(eq(adminUsers.id, id));
  }

  // UPI ID operations
  async getAllUpiIds(): Promise<UpiId[]> {
    return await db.select().from(upiIds).orderBy(desc(upiIds.createdAt));
  }

  async getActiveUpiIds(): Promise<UpiId[]> {
    return await db
      .select()
      .from(upiIds)
      .where(eq(upiIds.active, true))
      .orderBy(upiIds.lastUsed);
  }

  async createUpiId(upiIdData: InsertUpiId): Promise<UpiId> {
    const [newUpiId] = await db
      .insert(upiIds)
      .values(upiIdData)
      .returning();
    return newUpiId;
  }

  async updateUpiIdLastUsed(upiId: string): Promise<void> {
    await db
      .update(upiIds)
      .set({ lastUsed: new Date() })
      .where(eq(upiIds.upiId, upiId));
  }

  async toggleUpiIdStatus(id: number, active: boolean): Promise<void> {
    await db
      .update(upiIds)
      .set({ active })
      .where(eq(upiIds.id, id));
  }

  async deleteUpiId(id: number): Promise<void> {
    await db.delete(upiIds).where(eq(upiIds.id, id));
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getTransactionByTxnId(txnId: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.txnId, txnId));
    return transaction;
  }

  async updateTransactionStatus(
    txnId: string,
    status: "pending" | "success" | "failed"
  ): Promise<void> {
    await db
      .update(transactions)
      .set({ status, updatedAt: new Date() })
      .where(eq(transactions.txnId, txnId));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt));
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.status, "pending"))
      .orderBy(desc(transactions.createdAt));
  }

  async getTransactionStats(): Promise<{
    totalRevenue: string;
    totalTransactions: number;
    pendingTransactions: number;
    todayTransactions: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalRevenueResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(eq(transactions.status, "success"));

    const [totalTransactionsResult] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(transactions);

    const [pendingTransactionsResult] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .where(eq(transactions.status, "pending"));

    const [todayTransactionsResult] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .where(sql`${transactions.createdAt} >= ${today}`);

    return {
      totalRevenue: totalRevenueResult?.total || "0",
      totalTransactions: totalTransactionsResult?.count || 0,
      pendingTransactions: pendingTransactionsResult?.count || 0,
      todayTransactions: todayTransactionsResult?.count || 0,
    };
  }

  async getAnalytics(startDate: Date, endDate: Date): Promise<{
    totalRevenue: string;
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    pendingTransactions: number;
    averageTransactionValue: string;
    dailyStats: Array<{
      date: string;
      transactions: number;
      revenue: string;
    }>;
  }> {
    // Get overall stats for the period
    const [totalRevenueResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.status, "success"),
          sql`${transactions.createdAt} >= ${startDate}`,
          sql`${transactions.createdAt} <= ${endDate}`
        )
      );

    const [totalTransactionsResult] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .where(
        and(
          sql`${transactions.createdAt} >= ${startDate}`,
          sql`${transactions.createdAt} <= ${endDate}`
        )
      );

    const [successfulTransactionsResult] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.status, "success"),
          sql`${transactions.createdAt} >= ${startDate}`,
          sql`${transactions.createdAt} <= ${endDate}`
        )
      );

    const [failedTransactionsResult] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.status, "failed"),
          sql`${transactions.createdAt} >= ${startDate}`,
          sql`${transactions.createdAt} <= ${endDate}`
        )
      );

    const [pendingTransactionsResult] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.status, "pending"),
          sql`${transactions.createdAt} >= ${startDate}`,
          sql`${transactions.createdAt} <= ${endDate}`
        )
      );

    // Calculate average transaction value
    const totalRevenue = parseFloat(totalRevenueResult?.total || "0");
    const successfulCount = successfulTransactionsResult?.count || 0;
    const averageTransactionValue = successfulCount > 0 ? (totalRevenue / successfulCount).toFixed(2) : "0";

    // Get daily stats
    const dailyStatsResult = await db
      .select({
        date: sql<string>`DATE(${transactions.createdAt})`,
        transactions: sql<number>`COUNT(*)`,
        revenue: sql<string>`COALESCE(SUM(CASE WHEN ${transactions.status} = 'success' THEN ${transactions.amount} ELSE 0 END), 0)`,
      })
      .from(transactions)
      .where(
        and(
          sql`${transactions.createdAt} >= ${startDate}`,
          sql`${transactions.createdAt} <= ${endDate}`
        )
      )
      .groupBy(sql`DATE(${transactions.createdAt})`)
      .orderBy(sql`DATE(${transactions.createdAt})`);

    return {
      totalRevenue: totalRevenueResult?.total || "0",
      totalTransactions: totalTransactionsResult?.count || 0,
      successfulTransactions: successfulTransactionsResult?.count || 0,
      failedTransactions: failedTransactionsResult?.count || 0,
      pendingTransactions: pendingTransactionsResult?.count || 0,
      averageTransactionValue,
      dailyStats: dailyStatsResult || [],
    };
  }

  async getTransactionHistory(filters: {
    status?: string;
    startDate?: string;
    endDate?: string;
    limit: number;
  }): Promise<Transaction[]> {
    const conditions = [];
    
    if (filters.status) {
      conditions.push(eq(transactions.status, filters.status as any));
    }
    
    if (filters.startDate) {
      conditions.push(sql`${transactions.createdAt} >= ${new Date(filters.startDate)}`);
    }
    
    if (filters.endDate) {
      conditions.push(sql`${transactions.createdAt} <= ${new Date(filters.endDate)}`);
    }
    
    if (conditions.length > 0) {
      return await db
        .select()
        .from(transactions)
        .where(and(...conditions))
        .orderBy(desc(transactions.createdAt))
        .limit(filters.limit);
    }
    
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(filters.limit);
  }
}

export const storage = new DatabaseStorage();
