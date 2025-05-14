import { 
  User, InsertUser, 
  Product, InsertProduct,
  PriceHistory, InsertPriceHistory,
  PriceAlert, InsertPriceAlert
} from "@shared/schema";

export interface IStorage {
  // User Methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Product Methods
  getProduct(id: number): Promise<Product | undefined>;
  getProductsByUserId(userId: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProductPrice(id: number, price: number): Promise<Product>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Price History Methods
  getPriceHistoryForProduct(productId: number): Promise<PriceHistory[]>;
  addPriceHistory(priceHistory: InsertPriceHistory): Promise<PriceHistory>;
  
  // Price Alerts Methods
  getAlertsForProduct(productId: number): Promise<PriceAlert[]>;
  getAlertsByUserId(userId: number): Promise<PriceAlert[]>;
  createAlert(alert: InsertPriceAlert): Promise<PriceAlert>;
  updateAlertStatus(id: number, active: boolean): Promise<PriceAlert>;
  deleteAlert(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private priceHistory: Map<number, PriceHistory>;
  private priceAlerts: Map<number, PriceAlert>;
  
  private currentUserId: number;
  private currentProductId: number;
  private currentPriceHistoryId: number;
  private currentPriceAlertId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.priceHistory = new Map();
    this.priceAlerts = new Map();
    
    this.currentUserId = 1;
    this.currentProductId = 1;
    this.currentPriceHistoryId = 1;
    this.currentPriceAlertId = 1;
  }

  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  // Product Methods
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductsByUserId(userId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.userId === userId
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const now = new Date();
    const product: Product = { 
      ...insertProduct, 
      id, 
      lastChecked: now, 
      createdAt: now 
    };
    this.products.set(id, product);
    return product;
  }

  async updateProductPrice(id: number, price: number): Promise<Product> {
    const product = this.products.get(id);
    if (!product) {
      throw new Error(`Product with id ${id} not found`);
    }
    
    const updatedProduct = { 
      ...product, 
      currentPrice: price, 
      lastChecked: new Date() 
    };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Price History Methods
  async getPriceHistoryForProduct(productId: number): Promise<PriceHistory[]> {
    return Array.from(this.priceHistory.values())
      .filter((history) => history.productId === productId)
      .sort((a, b) => {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });
  }

  async addPriceHistory(insertPriceHistory: InsertPriceHistory): Promise<PriceHistory> {
    const id = this.currentPriceHistoryId++;
    const now = new Date();
    const priceHistory: PriceHistory = {
      ...insertPriceHistory, 
      id, 
      timestamp: now
    };
    this.priceHistory.set(id, priceHistory);
    return priceHistory;
  }

  // Price Alerts Methods
  async getAlertsForProduct(productId: number): Promise<PriceAlert[]> {
    return Array.from(this.priceAlerts.values()).filter(
      (alert) => alert.productId === productId
    );
  }

  async getAlertsByUserId(userId: number): Promise<PriceAlert[]> {
    const userProducts = await this.getProductsByUserId(userId);
    const productIds = userProducts.map(p => p.id);
    
    return Array.from(this.priceAlerts.values()).filter(
      (alert) => productIds.includes(alert.productId)
    );
  }

  async createAlert(insertAlert: InsertPriceAlert): Promise<PriceAlert> {
    const id = this.currentPriceAlertId++;
    const now = new Date();
    const alert: PriceAlert = { 
      ...insertAlert, 
      id, 
      createdAt: now 
    };
    this.priceAlerts.set(id, alert);
    return alert;
  }

  async updateAlertStatus(id: number, active: boolean): Promise<PriceAlert> {
    const alert = this.priceAlerts.get(id);
    if (!alert) {
      throw new Error(`Alert with id ${id} not found`);
    }
    
    const updatedAlert = { ...alert, active };
    this.priceAlerts.set(id, updatedAlert);
    return updatedAlert;
  }

  async deleteAlert(id: number): Promise<boolean> {
    return this.priceAlerts.delete(id);
  }
}

export const storage = new MemStorage();
