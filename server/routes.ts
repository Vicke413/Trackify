import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scrapeProduct } from "./scraper";
import { 
  insertUserSchema, 
  insertProductSchema, 
  insertPriceAlertSchema 
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import session from "express-session";
import MemoryStore from "memorystore";

// Extend express-session with custom properties
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  console.log("Session check:", req.session.id, "User ID:", req.session.userId);
  
  if (req.session && req.session.userId) {
    return next();
  }
  
  console.log("Authentication failed - no session userId");
  res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session
  const SessionStore = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "price-tracker-secret",
      resave: true,
      saveUninitialized: true,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        sameSite: "lax"
      },
      store: new SessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    })
  );

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = await insertUserSchema.extend({
        confirmPassword: z.string().min(6),
      }).superRefine(({ password, confirmPassword }, ctx) => {
        if (password !== confirmPassword) {
          ctx.addIssue({
            code: "custom",
            message: "Passwords do not match",
            path: ["confirmPassword"],
          });
        }
      }).parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(validatedData.password, salt);

      // Create user
      const user = await storage.createUser({
        username: validatedData.username,
        email: validatedData.email,
        password: hashedPassword,
      });

      // Set session
      req.session.userId = user.id;
      
      // Save session before sending response
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Error saving session" });
        }
        
        res.status(201).json({ 
          id: user.id,
          username: user.username,
          email: user.email
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      console.error("Register error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = z.object({
        username: z.string(),
        password: z.string(),
      }).parse(req.body);

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session
      req.session.userId = user.id;
      
      // Save session before sending response
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Error saving session" });
        }
        
        res.status(200).json({ 
          id: user.id,
          username: user.username,
          email: user.email
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "User not found" });
      }

      res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email
      });
    } catch (error) {
      console.error("Auth/me error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Product routes
  app.post("/api/products", isAuthenticated, async (req, res) => {
    try {
      const { url } = z.object({
        url: z.string().url(),
      }).parse(req.body);

      // Scrape product info
      const scrapedProduct = await scrapeProduct(url);

      // Create product in database
      const product = await storage.createProduct({
        userId: req.session.userId!,
        url,
        name: scrapedProduct.name,
        imageUrl: scrapedProduct.imageUrl,
        currentPrice: scrapedProduct.price.toString(), // Convert to string for numeric field
        currency: scrapedProduct.currency,
      });

      // Add initial price history entry
      await storage.addPriceHistory({
        productId: product.id,
        price: scrapedProduct.price.toString(), // Convert to string for numeric field
      });

      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      console.error("Add product error:", error);
      res.status(500).json({ 
        message: "Failed to add product", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.get("/api/products", isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getProductsByUserId(req.session.userId!);
      res.status(200).json(products);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Make sure user owns the product
      if (product.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to access this product" });
      }
      
      res.status(200).json(product);
    } catch (error) {
      console.error("Get product error:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.delete("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Make sure user owns the product
      if (product.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to delete this product" });
      }
      
      await storage.deleteProduct(id);
      res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.post("/api/products/:id/refresh", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Make sure user owns the product
      if (product.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to refresh this product" });
      }
      
      // Scrape updated product info
      const scrapedProduct = await scrapeProduct(product.url);
      
      // Update product with new price
      const updatedProduct = await storage.updateProductPrice(id, scrapedProduct.price.toString());
      
      // Add price history entry if price changed
      if (Number(product.currentPrice) !== scrapedProduct.price) {
        await storage.addPriceHistory({
          productId: product.id,
          price: scrapedProduct.price.toString(), // Convert to string for numeric field
        });
      }
      
      res.status(200).json(updatedProduct);
    } catch (error) {
      console.error("Refresh product error:", error);
      res.status(500).json({ message: "Failed to refresh product price" });
    }
  });

  // Price history routes
  app.get("/api/products/:id/history", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Make sure user owns the product
      if (product.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to access this product" });
      }
      
      const priceHistory = await storage.getPriceHistoryForProduct(id);
      res.status(200).json(priceHistory);
    } catch (error) {
      console.error("Get price history error:", error);
      res.status(500).json({ message: "Failed to fetch price history" });
    }
  });

  // Price alert routes
  app.post("/api/products/:id/alerts", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Make sure user owns the product
      if (product.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to add alerts for this product" });
      }
      
      const validatedData = insertPriceAlertSchema.parse({
        ...req.body,
        productId: id,
      });
      
      const alert = await storage.createAlert(validatedData);
      res.status(201).json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      console.error("Create alert error:", error);
      res.status(500).json({ message: "Failed to create price alert" });
    }
  });

  app.get("/api/products/:id/alerts", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Make sure user owns the product
      if (product.userId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized to access alerts for this product" });
      }
      
      const alerts = await storage.getAlertsForProduct(id);
      res.status(200).json(alerts);
    } catch (error) {
      console.error("Get alerts error:", error);
      res.status(500).json({ message: "Failed to fetch price alerts" });
    }
  });

  app.put("/api/alerts/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { active } = z.object({
        active: z.boolean(),
      }).parse(req.body);
      
      // Find the alert
      const product = await storage.updateAlertStatus(id, active);
      res.status(200).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      console.error("Update alert error:", error);
      res.status(500).json({ message: "Failed to update price alert" });
    }
  });

  app.delete("/api/alerts/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAlert(id);
      res.status(200).json({ message: "Price alert deleted successfully" });
    } catch (error) {
      console.error("Delete alert error:", error);
      res.status(500).json({ message: "Failed to delete price alert" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
