import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertTransactionSchema, insertUpiIdSchema, insertAdminUserSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import { nanoid } from "nanoid";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Auth middleware for admin users
const requireAdminAuth = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const adminUser = await storage.getAdminUserByUsername(decoded.username);
    
    if (!adminUser) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.adminUser = adminUser;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Super admin only middleware
const requireSuperAdmin = (req: any, res: any, next: any) => {
  if (req.adminUser?.role !== "super_admin") {
    return res.status(403).json({ message: "Super admin access required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Replit Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin authentication routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const adminUser = await storage.getAdminUserByUsername(username);
      if (!adminUser) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, adminUser.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      await storage.updateAdminUserLastLogin(adminUser.id);

      const token = jwt.sign(
        { username: adminUser.username, role: adminUser.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        token,
        user: {
          id: adminUser.id,
          username: adminUser.username,
          role: adminUser.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Payment routes
  app.post("/api/payment/generate", async (req, res) => {
    try {
      const { amount, description } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }

      // Get the least recently used active UPI ID
      const activeUpiIds = await storage.getActiveUpiIds();
      if (activeUpiIds.length === 0) {
        return res.status(500).json({ message: "No active UPI IDs available" });
      }

      const selectedUpiId = activeUpiIds[0];
      const txnId = `TXN${Date.now()}${nanoid(6)}`;
      
      // Generate UPI payment URL
      const upiUrl = `upi://pay?pa=${selectedUpiId.upiId}&pn=Demo%20Merchant&am=${amount}&cu=INR&tr=${txnId}${description ? `&tn=${encodeURIComponent(description)}` : ''}`;
      
      // Generate QR code
      const qrCode = await QRCode.toDataURL(upiUrl);

      // Create transaction record
      const transaction = await storage.createTransaction({
        txnId,
        amount: amount.toString(),
        description: description || null,
        upiId: selectedUpiId.upiId,
        qrCode,
        status: "pending",
      });

      // Update UPI ID last used timestamp
      await storage.updateUpiIdLastUsed(selectedUpiId.upiId);

      res.json({
        txnId: transaction.txnId,
        amount: transaction.amount,
        upiId: transaction.upiId,
        qrCode: transaction.qrCode,
        status: transaction.status,
      });
    } catch (error) {
      console.error("Generate payment error:", error);
      res.status(500).json({ message: "Failed to generate payment" });
    }
  });

  app.get("/api/payment/status/:txnId", async (req, res) => {
    try {
      const { txnId } = req.params;
      
      const transaction = await storage.getTransactionByTxnId(txnId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      res.json({
        txnId: transaction.txnId,
        status: transaction.status,
        amount: transaction.amount,
        updatedAt: transaction.updatedAt,
      });
    } catch (error) {
      console.error("Get payment status error:", error);
      res.status(500).json({ message: "Failed to get payment status" });
    }
  });

  app.post("/api/payment/confirm/:txnId", requireAdminAuth, async (req, res) => {
    try {
      const { txnId } = req.params;
      
      const transaction = await storage.getTransactionByTxnId(txnId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      if (transaction.status !== "pending") {
        return res.status(400).json({ message: "Transaction is not pending" });
      }

      await storage.updateTransactionStatus(txnId, "success");

      res.json({ message: "Payment confirmed successfully" });
    } catch (error) {
      console.error("Confirm payment error:", error);
      res.status(500).json({ message: "Failed to confirm payment" });
    }
  });

  app.post("/api/payment/reject/:txnId", requireAdminAuth, async (req, res) => {
    try {
      const { txnId } = req.params;
      
      const transaction = await storage.getTransactionByTxnId(txnId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      if (transaction.status !== "pending") {
        return res.status(400).json({ message: "Transaction is not pending" });
      }

      await storage.updateTransactionStatus(txnId, "failed");

      res.json({ message: "Payment rejected successfully" });
    } catch (error) {
      console.error("Reject payment error:", error);
      res.status(500).json({ message: "Failed to reject payment" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", requireAdminAuth, async (req, res) => {
    try {
      const stats = await storage.getTransactionStats();
      res.json(stats);
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  app.get("/api/admin/transactions", requireAdminAuth, async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({ message: "Failed to get transactions" });
    }
  });

  app.get("/api/admin/transactions/pending", requireAdminAuth, async (req, res) => {
    try {
      const transactions = await storage.getPendingTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Get pending transactions error:", error);
      res.status(500).json({ message: "Failed to get pending transactions" });
    }
  });

  // Super admin only routes
  app.post("/api/admin/subadmins", requireAdminAuth, requireSuperAdmin, async (req, res) => {
    try {
      const result = insertAdminUserSchema.safeParse({
        ...req.body,
        role: "sub_admin",
      });
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.issues });
      }

      const { username, password } = result.data;
      
      // Check if username already exists
      const existing = await storage.getAdminUserByUsername(username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const subAdmin = await storage.createAdminUser({
        username,
        password: hashedPassword,
        role: "sub_admin",
        active: true,
      });

      res.json({
        id: subAdmin.id,
        username: subAdmin.username,
        role: subAdmin.role,
        createdAt: subAdmin.createdAt,
      });
    } catch (error) {
      console.error("Create sub admin error:", error);
      res.status(500).json({ message: "Failed to create sub admin" });
    }
  });

  app.get("/api/admin/upiids", requireAdminAuth, requireSuperAdmin, async (req, res) => {
    try {
      const upiIds = await storage.getAllUpiIds();
      res.json(upiIds);
    } catch (error) {
      console.error("Get UPI IDs error:", error);
      res.status(500).json({ message: "Failed to get UPI IDs" });
    }
  });

  app.post("/api/admin/upiids", requireAdminAuth, requireSuperAdmin, async (req, res) => {
    try {
      const result = insertUpiIdSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.issues });
      }

      const upiId = await storage.createUpiId(result.data);
      res.json(upiId);
    } catch (error) {
      console.error("Create UPI ID error:", error);
      res.status(500).json({ message: "Failed to create UPI ID" });
    }
  });

  app.patch("/api/admin/upiids/:id/toggle", requireAdminAuth, requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { active } = req.body;
      
      await storage.toggleUpiIdStatus(id, active);
      res.json({ message: "UPI ID status updated" });
    } catch (error) {
      console.error("Toggle UPI ID error:", error);
      res.status(500).json({ message: "Failed to update UPI ID" });
    }
  });

  app.delete("/api/admin/upiids/:id", requireAdminAuth, requireSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUpiId(id);
      res.json({ message: "UPI ID deleted" });
    } catch (error) {
      console.error("Delete UPI ID error:", error);
      res.status(500).json({ message: "Failed to delete UPI ID" });
    }
  });

  // SMS webhook simulation endpoint
  app.post("/api/webhook/sms", async (req, res) => {
    try {
      const { txnId, status, amount, bankReference } = req.body;
      
      if (!txnId || !status) {
        return res.status(400).json({ message: "txnId and status are required" });
      }

      const transaction = await storage.getTransactionByTxnId(txnId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Simulate SMS confirmation logic
      if (status === "success" && transaction.status === "pending") {
        await storage.updateTransactionStatus(txnId, "success");
        
        // Log the webhook activity
        console.log(`SMS Webhook: Transaction ${txnId} confirmed via SMS simulation`);
        
        res.json({ 
          message: "Payment confirmed via SMS webhook", 
          txnId,
          bankReference: bankReference || `REF${Date.now()}`
        });
      } else if (status === "failed") {
        await storage.updateTransactionStatus(txnId, "failed");
        res.json({ message: "Payment failed via SMS webhook", txnId });
      } else {
        res.status(400).json({ message: "Invalid status or transaction already processed" });
      }
    } catch (error) {
      console.error("SMS webhook error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // Enhanced analytics endpoint
  app.get("/api/admin/analytics", requireAdminAuth, async (req, res) => {
    try {
      const { period = "7d" } = req.query;
      
      // Calculate date range based on period
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case "24h":
          startDate.setHours(now.getHours() - 24);
          break;
        case "7d":
          startDate.setDate(now.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(now.getDate() - 30);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }

      const analytics = await storage.getAnalytics(startDate, now);
      res.json(analytics);
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Transaction history with filters
  app.get("/api/admin/transactions/history", requireAdminAuth, async (req, res) => {
    try {
      const { status, startDate, endDate, limit = 50 } = req.query;
      const transactions = await storage.getTransactionHistory({
        status: status as string,
        startDate: startDate as string,
        endDate: endDate as string,
        limit: parseInt(limit as string)
      });
      res.json(transactions);
    } catch (error) {
      console.error("Transaction history error:", error);
      res.status(500).json({ message: "Failed to fetch transaction history" });
    }
  });

  // Bulk UPI ID management
  app.post("/api/admin/upiids/bulk", requireAdminAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { upiIds } = req.body;
      
      if (!Array.isArray(upiIds) || upiIds.length === 0) {
        return res.status(400).json({ message: "UPI IDs array is required" });
      }

      const results = [];
      for (const upiId of upiIds) {
        try {
          const result = await storage.createUpiId({ upiId, active: true });
          results.push({ upiId, status: "success", data: result });
        } catch (error) {
          results.push({ upiId, status: "error", error: error instanceof Error ? error.message : "Unknown error" });
        }
      }

      res.json({ message: "Bulk UPI ID creation completed", results });
    } catch (error) {
      console.error("Bulk UPI ID error:", error);
      res.status(500).json({ message: "Failed to create UPI IDs in bulk" });
    }
  });

  // Seed route for initial setup
  app.post("/api/seed", async (req, res) => {
    try {
      // Create super admin
      const superAdminPassword = await bcrypt.hash("123456", 10);
      await storage.createAdminUser({
        username: "superadmin",
        password: superAdminPassword,
        role: "super_admin",
        active: true,
      });

      // Create sub admin
      const subAdminPassword = await bcrypt.hash("123456", 10);
      await storage.createAdminUser({
        username: "subadmin",
        password: subAdminPassword,
        role: "sub_admin",
        active: true,
      });

      // Create multiple demo UPI IDs for rotation
      const demoUpiIds = ["demo@ybl", "merchant@paytm", "shop@phonepe", "store@gpay"];
      for (const upiId of demoUpiIds) {
        try {
          await storage.createUpiId({
            upiId,
            active: true,
          });
        } catch (error) {
          // UPI ID might already exist, continue
        }
      }

      res.json({ message: "Seed data created successfully" });
    } catch (error) {
      console.error("Seed error:", error);
      res.status(500).json({ message: "Failed to seed data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
