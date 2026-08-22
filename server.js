import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { books as mockBooks, categories as mockCategories } from './src/data/mockData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'bookhub_super_secret_key_12345';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_secret_key'
});

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// Database Setup
let db;
let isSQLite = false;
const sqliteDbPath = path.join(__dirname, 'database.sqlite');
const jsonDbPath = path.join(__dirname, 'database.json');

// Abstract DB Helper
const DB = {
  // Initialize Database
  init() {
    return new Promise((resolve) => {
      // First try SQLite
      try {
        db = new sqlite3.Database(sqliteDbPath, async (err) => {
          if (err) {
            console.error('Failed to connect to SQLite, falling back to JSON DB:', err.message);
            this.initJson();
            resolve();
          } else {
            console.log('Connected to SQLite database.');
            isSQLite = true;
            try {
              await this.initSqliteTables();
              await this.seedData();
              resolve();
            } catch (initErr) {
              console.error('SQLite initialization/seeding failed, falling back to JSON DB:', initErr.message);
              isSQLite = false;
              try { db.close(); } catch (e) {}
              this.initJson();
              resolve();
            }
          }
        });
      } catch (e) {
        console.error('SQLite module failed to initialize, falling back to JSON DB:', e.message);
        this.initJson();
        resolve();
      }
    });
  },

  // Initialize JSON Database fallback
  initJson() {
    console.log('Using JSON file database at:', jsonDbPath);
    if (fs.existsSync(jsonDbPath)) {
      try {
        this.jsonData = JSON.parse(fs.readFileSync(jsonDbPath, 'utf8'));
      } catch (e) {
        console.error('Error reading JSON DB, initializing empty:', e.message);
        this.resetJsonData();
      }
    } else {
      this.resetJsonData();
    }
    this.seedJsonData();
  },

  resetJsonData() {
    this.jsonData = {
      users: [],
      books: [],
      categories: [],
      cart_items: [],
      wishlist_items: [],
      orders: [],
      order_items: []
    };
    this.saveJson();
  },

  saveJson() {
    try {
      fs.writeFileSync(jsonDbPath, JSON.stringify(this.jsonData, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to save JSON DB:', e.message);
    }
  },

  // Create SQLite Tables
  async initSqliteTables() {
    const run = (query) => new Promise((res, rej) => db.run(query, (err) => err ? rej(err) : res()));
    await run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      isAdmin INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    await run(`CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      rating REAL DEFAULT 5.0,
      image TEXT,
      isBestSeller INTEGER DEFAULT 0,
      isNewArrival INTEGER DEFAULT 0,
      isPublishedByUs INTEGER DEFAULT 0,
      stock INTEGER DEFAULT 10
    )`);
    await run(`CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      count INTEGER DEFAULT 0,
      image TEXT
    )`);
    await run(`CREATE TABLE IF NOT EXISTS cart_items (
      userId INTEGER NOT NULL,
      bookId INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY(userId, bookId),
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(bookId) REFERENCES books(id) ON DELETE CASCADE
    )`);
    await run(`CREATE TABLE IF NOT EXISTS wishlist_items (
      userId INTEGER NOT NULL,
      bookId INTEGER NOT NULL,
      PRIMARY KEY(userId, bookId),
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(bookId) REFERENCES books(id) ON DELETE CASCADE
    )`);
    await run(`CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      userId INTEGER NOT NULL,
      date TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      shippingAddress TEXT NOT NULL,
      paymentMethod TEXT NOT NULL,
      paymentStatus TEXT NOT NULL DEFAULT 'Pending',
      paymentGateway TEXT,
      razorpayOrderId TEXT,
      razorpayPaymentId TEXT,
      subtotal REAL,
      tax REAL,
      shipping REAL,
      discount REAL,
      email TEXT,
      phone TEXT,
      firstName TEXT,
      lastName TEXT,
      city TEXT,
      state TEXT,
      zipCode TEXT,
      country TEXT,
      shippingMethod TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    )`);
    await run(`CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId TEXT NOT NULL,
      bookId INTEGER NOT NULL,
      qty INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY(orderId) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY(bookId) REFERENCES books(id) ON DELETE CASCADE
    )`);

    // Run schema migrations for existing databases that don't have the new columns
    const columnsToMigration = [
      { name: 'paymentStatus', type: "TEXT NOT NULL DEFAULT 'Pending'" },
      { name: 'paymentGateway', type: 'TEXT' },
      { name: 'razorpayOrderId', type: 'TEXT' },
      { name: 'razorpayPaymentId', type: 'TEXT' },
      { name: 'subtotal', type: 'REAL' },
      { name: 'tax', type: 'REAL' },
      { name: 'shipping', type: 'REAL' },
      { name: 'discount', type: 'REAL' },
      { name: 'email', type: 'TEXT' },
      { name: 'phone', type: 'TEXT' },
      { name: 'firstName', type: 'TEXT' },
      { name: 'lastName', type: 'TEXT' },
      { name: 'city', type: 'TEXT' },
      { name: 'state', type: 'TEXT' },
      { name: 'zipCode', type: 'TEXT' },
      { name: 'country', type: 'TEXT' },
      { name: 'shippingMethod', type: 'TEXT' },
      { name: 'createdAt', type: "DATETIME DEFAULT CURRENT_TIMESTAMP" },
      { name: 'updatedAt', type: "DATETIME DEFAULT CURRENT_TIMESTAMP" }
    ];

    for (const col of columnsToMigration) {
      try {
        await run(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Successfully migrated database column: orders.${col.name}`);
      } catch (err) {
        // Ignored. The column likely already exists.
      }
    }
  },

  // Seed Data for SQLite and JSON
  async seedData() {
    const get = (query) => new Promise((res, rej) => db.get(query, (err, row) => err ? rej(err) : res(row)));
    const run = (query, params) => new Promise((res, rej) => db.run(query, params, (err) => err ? rej(err) : res()));

    // Seed Admin
    const adminCheck = await get("SELECT * FROM users WHERE email = 'admin@bookhub.com'");
    if (!adminCheck) {
      const hashedPw = await bcrypt.hash('admin123', 10);
      await run("INSERT INTO users (name, email, password, isAdmin) VALUES (?, ?, ?, ?)", ['Admin User', 'admin@bookhub.com', hashedPw, 1]);
    }

    // Seed Mock Customers
    const mockCustomers = [
      { name: 'John Doe', email: 'john@example.com', password: 'password123' },
      { name: 'Jane Smith', email: 'jane@example.com', password: 'password123' },
      { name: 'Mike Johnson', email: 'mike@example.com', password: 'password123' },
      { name: 'Sarah Williams', email: 'sarah@example.com', password: 'password123', status: 'Disabled' },
      { name: 'David Brown', email: 'david@example.com', password: 'password123' },
    ];
    for (const cust of mockCustomers) {
      const custCheck = await get(`SELECT * FROM users WHERE email = ?`, [cust.email]);
      if (!custCheck) {
        const hashedPw = await bcrypt.hash(cust.password, 10);
        await run("INSERT INTO users (name, email, password, isAdmin, status) VALUES (?, ?, ?, ?, ?)", [cust.name, cust.email, hashedPw, 0, cust.status || 'Active']);
      }
    }

    // Seed Categories
    const catCount = await get("SELECT COUNT(*) as count FROM categories");
    if (catCount.count === 0) {
      for (const cat of mockCategories) {
        await run("INSERT INTO categories (id, name, count, image) VALUES (?, ?, ?, ?)", [cat.id, cat.name, cat.count, cat.image]);
      }
    }

    // Seed Books
    const bookCount = await get("SELECT COUNT(*) as count FROM books");
    if (bookCount.count === 0) {
      for (const book of mockBooks) {
        await run(`INSERT INTO books (id, title, author, category, price, description, rating, image, isBestSeller, isNewArrival, isPublishedByUs, stock) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                   [book.id, book.title, book.author, book.category, book.price, book.description, book.rating, book.image, book.isBestSeller ? 1 : 0, book.isNewArrival ? 1 : 0, book.isPublishedByUs ? 1 : 0, 10]);
      }
    }
  },

  async seedJsonData() {
    // Seed Admin
    const adminCheck = this.jsonData.users.find(u => u.email === 'admin@bookhub.com');
    if (!adminCheck) {
      const hashedPw = await bcrypt.hash('admin123', 10);
      this.jsonData.users.push({
        id: 1,
        name: 'Admin User',
        email: 'admin@bookhub.com',
        password: hashedPw,
        isAdmin: 1,
        status: 'Active',
        createdAt: new Date().toISOString()
      });
    }

    // Seed Mock Customers
    const mockCustomers = [
      { id: 2, name: 'John Doe', email: 'john@example.com', password: 'password123', status: 'Active' },
      { id: 3, name: 'Jane Smith', email: 'jane@example.com', password: 'password123', status: 'Active' },
      { id: 4, name: 'Mike Johnson', email: 'mike@example.com', password: 'password123', status: 'Active' },
      { id: 5, name: 'Sarah Williams', email: 'sarah@example.com', password: 'password123', status: 'Disabled' },
      { id: 6, name: 'David Brown', email: 'david@example.com', password: 'password123', status: 'Active' },
    ];
    for (const cust of mockCustomers) {
      const custCheck = this.jsonData.users.find(u => u.email === cust.email);
      if (!custCheck) {
        const hashedPw = await bcrypt.hash(cust.password, 10);
        this.jsonData.users.push({
          id: cust.id,
          name: cust.name,
          email: cust.email,
          password: hashedPw,
          isAdmin: 0,
          status: cust.status,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Seed Categories
    if (this.jsonData.categories.length === 0) {
      this.jsonData.categories = mockCategories.map(cat => ({ ...cat }));
    }

    // Seed Books
    if (this.jsonData.books.length === 0) {
      this.jsonData.books = mockBooks.map(book => ({
        ...book,
        isBestSeller: book.isBestSeller ? 1 : 0,
        isNewArrival: book.isNewArrival ? 1 : 0,
        isPublishedByUs: book.isPublishedByUs ? 1 : 0,
        stock: 10
      }));
    }
    this.saveJson();
  },

  // Helper Methods for SQLite Operations
  sqliteGet(query, params = []) {
    return new Promise((res, rej) => db.get(query, params, (err, row) => err ? rej(err) : res(row)));
  },
  sqliteAll(query, params = []) {
    return new Promise((res, rej) => db.all(query, params, (err, rows) => err ? rej(err) : res(rows)));
  },
  sqliteRun(query, params = []) {
    return new Promise((res, rej) => db.run(query, params, function(err) { err ? rej(err) : res(this); }));
  },

  // USER OPERATIONS
  async getUserByEmail(email) {
    if (isSQLite) {
      return await this.sqliteGet("SELECT * FROM users WHERE email = ?", [email]);
    } else {
      return this.jsonData.users.find(u => u.email === email);
    }
  },

  async getUserById(id) {
    if (isSQLite) {
      return await this.sqliteGet("SELECT * FROM users WHERE id = ?", [id]);
    } else {
      return this.jsonData.users.find(u => u.id === Number(id));
    }
  },

  async createUser(name, email, password) {
    const hashedPw = await bcrypt.hash(password, 10);
    if (isSQLite) {
      const result = await this.sqliteRun("INSERT INTO users (name, email, password, isAdmin, status) VALUES (?, ?, ?, 0, 'Active')", [name, email, hashedPw]);
      return { id: result.lastID, name, email, isAdmin: 0, status: 'Active' };
    } else {
      const nextId = this.jsonData.users.length > 0 ? Math.max(...this.jsonData.users.map(u => u.id)) + 1 : 1;
      const newUser = { id: nextId, name, email, password: hashedPw, isAdmin: 0, status: 'Active', createdAt: new Date().toISOString() };
      this.jsonData.users.push(newUser);
      this.saveJson();
      const { password: _, ...userNoPw } = newUser;
      return userNoPw;
    }
  },

  async getAllUsers() {
    if (isSQLite) {
      return await this.sqliteAll("SELECT id, name, email, isAdmin, status, createdAt FROM users WHERE isAdmin = 0");
    } else {
      return this.jsonData.users.filter(u => u.isAdmin === 0).map(({ password, ...u }) => u);
    }
  },

  async updateUserStatus(id, status) {
    if (isSQLite) {
      await this.sqliteRun("UPDATE users SET status = ? WHERE id = ?", [status, id]);
    } else {
      const user = this.jsonData.users.find(u => u.id === Number(id));
      if (user) {
        user.status = status;
        this.saveJson();
      }
    }
  },

  // BOOK OPERATIONS
  async getBooks(keyword = '') {
    if (isSQLite) {
      if (keyword) {
        return await this.sqliteAll("SELECT * FROM books WHERE title LIKE ? OR author LIKE ?", [`%${keyword}%`, `%${keyword}%`]);
      }
      return await this.sqliteAll("SELECT * FROM books");
    } else {
      let result = this.jsonData.books;
      if (keyword) {
        const q = keyword.toLowerCase();
        result = result.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
      }
      return result;
    }
  },

  async getBookById(id) {
    if (isSQLite) {
      return await this.sqliteGet("SELECT * FROM books WHERE id = ?", [id]);
    } else {
      return this.jsonData.books.find(b => b.id === Number(id));
    }
  },

  async createBook(bookData) {
    const { title, author, category, price, description, rating, image, isBestSeller, isNewArrival, isPublishedByUs, stock } = bookData;
    if (isSQLite) {
      const result = await this.sqliteRun(`INSERT INTO books (title, author, category, price, description, rating, image, isBestSeller, isNewArrival, isPublishedByUs, stock)
                                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                           [title, author, category, Number(price), description, Number(rating || 5), image, isBestSeller ? 1 : 0, isNewArrival ? 1 : 0, isPublishedByUs ? 1 : 0, Number(stock || 10)]);
      return { id: result.lastID, ...bookData };
    } else {
      const nextId = this.jsonData.books.length > 0 ? Math.max(...this.jsonData.books.map(b => b.id)) + 1 : 1;
      const newBook = { id: nextId, ...bookData, price: Number(price), rating: Number(rating || 5), stock: Number(stock || 10), isBestSeller: isBestSeller ? 1 : 0, isNewArrival: isNewArrival ? 1 : 0, isPublishedByUs: isPublishedByUs ? 1 : 0 };
      this.jsonData.books.push(newBook);
      this.saveJson();
      return newBook;
    }
  },

  async updateBook(id, bookData) {
    const { title, author, category, price, description, image, isBestSeller, isNewArrival, isPublishedByUs, stock } = bookData;
    if (isSQLite) {
      await this.sqliteRun(`UPDATE books SET title = ?, author = ?, category = ?, price = ?, description = ?, image = ?, isBestSeller = ?, isNewArrival = ?, isPublishedByUs = ?, stock = ?
                            WHERE id = ?`,
                            [title, author, category, Number(price), description, image, isBestSeller ? 1 : 0, isNewArrival ? 1 : 0, isPublishedByUs ? 1 : 0, Number(stock), id]);
      return { id, ...bookData };
    } else {
      const idx = this.jsonData.books.findIndex(b => b.id === Number(id));
      if (idx !== -1) {
        this.jsonData.books[idx] = { ...this.jsonData.books[idx], ...bookData, price: Number(price), stock: Number(stock), isBestSeller: isBestSeller ? 1 : 0, isNewArrival: isNewArrival ? 1 : 0, isPublishedByUs: isPublishedByUs ? 1 : 0 };
        this.saveJson();
        return this.jsonData.books[idx];
      }
      return null;
    }
  },

  async deleteBook(id) {
    if (isSQLite) {
      await this.sqliteRun("DELETE FROM books WHERE id = ?", [id]);
    } else {
      this.jsonData.books = this.jsonData.books.filter(b => b.id !== Number(id));
      this.saveJson();
    }
  },

  // CATEGORY OPERATIONS
  async getCategories() {
    if (isSQLite) {
      return await this.sqliteAll("SELECT * FROM categories");
    } else {
      return this.jsonData.categories;
    }
  },

  async createCategory(catData) {
    const { name, count, image } = catData;
    if (isSQLite) {
      const result = await this.sqliteRun("INSERT INTO categories (name, count, image) VALUES (?, ?, ?)", [name, Number(count || 0), image]);
      return { id: result.lastID, ...catData };
    } else {
      const nextId = this.jsonData.categories.length > 0 ? Math.max(...this.jsonData.categories.map(c => c.id)) + 1 : 1;
      const newCategory = { id: nextId, name, count: Number(count || 0), image };
      this.jsonData.categories.push(newCategory);
      this.saveJson();
      return newCategory;
    }
  },

  async updateCategory(id, catData) {
    const { name, count, image } = catData;
    if (isSQLite) {
      await this.sqliteRun("UPDATE categories SET name = ?, count = ?, image = ? WHERE id = ?", [name, Number(count), image, id]);
      return { id, ...catData };
    } else {
      const idx = this.jsonData.categories.findIndex(c => c.id === Number(id));
      if (idx !== -1) {
        this.jsonData.categories[idx] = { ...this.jsonData.categories[idx], name, count: Number(count), image };
        this.saveJson();
        return this.jsonData.categories[idx];
      }
      return null;
    }
  },

  async deleteCategory(id) {
    if (isSQLite) {
      await this.sqliteRun("DELETE FROM categories WHERE id = ?", [id]);
    } else {
      this.jsonData.categories = this.jsonData.categories.filter(c => c.id !== Number(id));
      this.saveJson();
    }
  },

  // CART OPERATIONS
  async getCart(userId) {
    if (isSQLite) {
      const items = await this.sqliteAll(`SELECT c.bookId, c.quantity, b.title, b.author, b.category, b.price, b.image, b.stock
                                          FROM cart_items c JOIN books b ON c.bookId = b.id WHERE c.userId = ?`, [userId]);
      return items.map(item => ({
        id: item.bookId,
        title: item.title,
        author: item.author,
        category: item.category,
        price: item.price,
        image: item.image,
        stock: item.stock,
        quantity: item.quantity
      }));
    } else {
      const userCartItems = this.jsonData.cart_items.filter(c => c.userId === userId);
      return userCartItems.map(item => {
        const book = this.jsonData.books.find(b => b.id === item.bookId);
        return book ? { ...book, quantity: item.quantity } : null;
      }).filter(Boolean);
    }
  },

  async addToCart(userId, bookId, quantity) {
    if (isSQLite) {
      await this.sqliteRun("INSERT INTO cart_items (userId, bookId, quantity) VALUES (?, ?, ?) ON CONFLICT(userId, bookId) DO UPDATE SET quantity = quantity + EXCLUDED.quantity", [userId, bookId, quantity]);
    } else {
      const item = this.jsonData.cart_items.find(c => c.userId === userId && c.bookId === Number(bookId));
      if (item) {
        item.quantity += Number(quantity);
      } else {
        this.jsonData.cart_items.push({ userId, bookId: Number(bookId), quantity: Number(quantity) });
      }
      this.saveJson();
    }
  },

  async updateCartItem(userId, bookId, quantity) {
    if (isSQLite) {
      if (quantity <= 0) {
        await this.sqliteRun("DELETE FROM cart_items WHERE userId = ? AND bookId = ?", [userId, bookId]);
      } else {
        await this.sqliteRun("UPDATE cart_items SET quantity = ? WHERE userId = ? AND bookId = ?", [quantity, userId, bookId]);
      }
    } else {
      if (quantity <= 0) {
        this.jsonData.cart_items = this.jsonData.cart_items.filter(c => !(c.userId === userId && c.bookId === Number(bookId)));
      } else {
        const item = this.jsonData.cart_items.find(c => c.userId === userId && c.bookId === Number(bookId));
        if (item) {
          item.quantity = Number(quantity);
        }
      }
      this.saveJson();
    }
  },

  async removeFromCart(userId, bookId) {
    if (isSQLite) {
      await this.sqliteRun("DELETE FROM cart_items WHERE userId = ? AND bookId = ?", [userId, bookId]);
    } else {
      this.jsonData.cart_items = this.jsonData.cart_items.filter(c => !(c.userId === userId && c.bookId === Number(bookId)));
      this.saveJson();
    }
  },

  async clearCart(userId) {
    if (isSQLite) {
      await this.sqliteRun("DELETE FROM cart_items WHERE userId = ?", [userId]);
    } else {
      this.jsonData.cart_items = this.jsonData.cart_items.filter(c => c.userId !== userId);
      this.saveJson();
    }
  },

  async mergeCart(userId, cartItems) {
    for (const item of cartItems) {
      await this.addToCart(userId, item.id, item.quantity);
    }
  },

  // WISHLIST OPERATIONS
  async getWishlist(userId) {
    if (isSQLite) {
      const items = await this.sqliteAll(`SELECT w.bookId, b.title, b.author, b.category, b.price, b.image, b.stock, b.rating
                                          FROM wishlist_items w JOIN books b ON w.bookId = b.id WHERE w.userId = ?`, [userId]);
      return items.map(item => ({
        id: item.bookId,
        title: item.title,
        author: item.author,
        category: item.category,
        price: item.price,
        image: item.image,
        stock: item.stock,
        rating: item.rating
      }));
    } else {
      const userWishItems = this.jsonData.wishlist_items.filter(w => w.userId === userId);
      return userWishItems.map(item => {
        return this.jsonData.books.find(b => b.id === item.bookId);
      }).filter(Boolean);
    }
  },

  async toggleWishlist(userId, bookId) {
    if (isSQLite) {
      const exists = await this.sqliteGet("SELECT 1 FROM wishlist_items WHERE userId = ? AND bookId = ?", [userId, bookId]);
      if (exists) {
        await this.sqliteRun("DELETE FROM wishlist_items WHERE userId = ? AND bookId = ?", [userId, bookId]);
        return { action: 'removed' };
      } else {
        await this.sqliteRun("INSERT INTO wishlist_items (userId, bookId) VALUES (?, ?)", [userId, bookId]);
        return { action: 'added' };
      }
    } else {
      const idx = this.jsonData.wishlist_items.findIndex(w => w.userId === userId && w.bookId === Number(bookId));
      if (idx !== -1) {
        this.jsonData.wishlist_items.splice(idx, 1);
        this.saveJson();
        return { action: 'removed' };
      } else {
        this.jsonData.wishlist_items.push({ userId, bookId: Number(bookId) });
        this.saveJson();
        return { action: 'added' };
      }
    }
  },

  async removeFromWishlist(userId, bookId) {
    if (isSQLite) {
      await this.sqliteRun("DELETE FROM wishlist_items WHERE userId = ? AND bookId = ?", [userId, bookId]);
    } else {
      this.jsonData.wishlist_items = this.jsonData.wishlist_items.filter(w => !(w.userId === userId && w.bookId === Number(bookId)));
      this.saveJson();
    }
  },

  // ORDER OPERATIONS
  async createOrder(userId, orderData) {
    const { 
      firstName, lastName, address, city, state, zipCode, country, 
      shippingMethod, paymentMethod, total, items, 
      paymentStatus = 'Pending', paymentGateway = null, 
      razorpayOrderId = null, razorpayPaymentId = null,
      subtotal = 0, tax = 0, shipping = 0, discount = 0,
      email = '', phone = ''
    } = orderData;
    
    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const shippingAddress = `${firstName} ${lastName}, ${address}, ${city}, ${state} ${zipCode}, ${country}`;
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (isSQLite) {
      await this.sqliteRun(
        `INSERT INTO orders (
          id, userId, date, total, status, shippingAddress, paymentMethod,
          paymentStatus, paymentGateway, razorpayOrderId, razorpayPaymentId,
          subtotal, tax, shipping, discount, email, phone,
          firstName, lastName, city, state, zipCode, country, shippingMethod
        ) VALUES (?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId, userId, date, Number(total), shippingAddress, paymentMethod,
          paymentStatus, paymentGateway, razorpayOrderId, razorpayPaymentId,
          Number(subtotal), Number(tax), Number(shipping), Number(discount), email, phone,
          firstName, lastName, city, state, zipCode, country, shippingMethod
        ]
      );
      
      for (const item of items) {
        await this.sqliteRun("INSERT INTO order_items (orderId, bookId, qty, price) VALUES (?, ?, ?, ?)", [orderId, item.id, item.quantity, item.price]);
        // Reduce book stock
        await this.sqliteRun("UPDATE books SET stock = MAX(0, stock - ?) WHERE id = ?", [item.quantity, item.id]);
      }
      await this.clearCart(userId);
      return { 
        id: orderId, status: 'Pending', date, total, shippingAddress, 
        paymentStatus, paymentGateway, razorpayOrderId, razorpayPaymentId,
        subtotal, tax, shipping, discount, email, phone,
        firstName, lastName, city, state, zipCode, country, shippingMethod
      };
    } else {
      const newOrder = {
        id: orderId,
        userId,
        date,
        total: Number(total),
        status: 'Pending',
        shippingAddress,
        paymentMethod,
        paymentStatus,
        paymentGateway,
        razorpayOrderId,
        razorpayPaymentId,
        subtotal: Number(subtotal),
        tax: Number(tax),
        shipping: Number(shipping),
        discount: Number(discount),
        email,
        phone,
        firstName,
        lastName,
        city,
        state,
        zipCode,
        country,
        shippingMethod,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.jsonData.orders.push(newOrder);

      for (const item of items) {
        this.jsonData.order_items.push({
          orderId,
          bookId: item.id,
          qty: item.quantity,
          price: item.price
        });
        // Reduce stock
        const book = this.jsonData.books.find(b => b.id === item.id);
        if (book) {
          book.stock = Math.max(0, book.stock - item.quantity);
        }
      }

      this.jsonData.cart_items = this.jsonData.cart_items.filter(c => c.userId !== userId);
      this.saveJson();
      return newOrder;
    }
  },

  async getOrders(userId, isAdmin = false) {
    if (isSQLite) {
      if (isAdmin) {
        const orders = await this.sqliteAll(`SELECT o.*, u.name as customer, u.email FROM orders o JOIN users u ON o.userId = u.id`);
        for (let o of orders) {
          const items = await this.sqliteAll(`SELECT oi.qty, oi.price, b.title, b.author FROM order_items oi JOIN books b ON oi.bookId = b.id WHERE oi.orderId = ?`, [o.id]);
          o.items = items.length;
          o.orderItems = items;
        }
        return orders;
      } else {
        const orders = await this.sqliteAll("SELECT * FROM orders WHERE userId = ? ORDER BY date DESC", [userId]);
        for (let o of orders) {
          const items = await this.sqliteAll(`SELECT oi.qty, oi.price, b.title, b.author FROM order_items oi JOIN books b ON oi.bookId = b.id WHERE oi.orderId = ?`, [o.id]);
          o.items = items;
        }
        return orders;
      }
    } else {
      let orders = this.jsonData.orders;
      if (!isAdmin) {
        orders = orders.filter(o => o.userId === userId);
      }
      return orders.map(o => {
        const user = this.jsonData.users.find(u => u.id === o.userId);
        const oItems = this.jsonData.order_items.filter(oi => oi.orderId === o.id).map(oi => {
          const book = this.jsonData.books.find(b => b.id === oi.bookId);
          return {
            qty: oi.qty,
            price: oi.price,
            title: book ? book.title : 'Unknown Book',
            author: book ? book.author : 'Unknown Author'
          };
        });
        return {
          ...o,
          customer: user ? user.name : 'Unknown User',
          email: user ? user.email : '',
          items: isAdmin ? oItems.length : oItems,
          orderItems: oItems
        };
      });
    }
  },

  async getOrderById(id, userId, isAdmin = false) {
    if (isSQLite) {
      let order;
      if (isAdmin) {
        order = await this.sqliteGet(`SELECT o.*, u.name as customer, u.email FROM orders o JOIN users u ON o.userId = u.id WHERE o.id = ?`, [id]);
      } else {
        order = await this.sqliteGet("SELECT * FROM orders WHERE id = ? AND userId = ?", [id, userId]);
      }
      if (order) {
        const items = await this.sqliteAll(`SELECT oi.qty, oi.price, b.title, b.author FROM order_items oi JOIN books b ON oi.bookId = b.id WHERE oi.orderId = ?`, [id]);
        order.items = items;
      }
      return order;
    } else {
      const order = this.jsonData.orders.find(o => o.id === id && (isAdmin || o.userId === userId));
      if (!order) return null;
      const user = this.jsonData.users.find(u => u.id === order.userId);
      const items = this.jsonData.order_items.filter(oi => oi.orderId === order.id).map(oi => {
        const book = this.jsonData.books.find(b => b.id === oi.bookId);
        return {
          qty: oi.qty,
          price: oi.price,
          title: book ? book.title : 'Unknown Book',
          author: book ? book.author : 'Unknown Author'
        };
      });
      return {
        ...order,
        customer: user ? user.name : 'Unknown User',
        email: user ? user.email : '',
        items
      };
    }
  },

  async updateOrderStatus(id, status) {
    if (isSQLite) {
      await this.sqliteRun("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
    } else {
      const order = this.jsonData.orders.find(o => o.id === id);
      if (order) {
        order.status = status;
        this.saveJson();
      }
    }
  },

  async trackOrder(orderId, email) {
    if (isSQLite) {
      const order = await this.sqliteGet(`SELECT o.*, u.email FROM orders o JOIN users u ON o.userId = u.id WHERE o.id = ? AND u.email = ?`, [orderId, email]);
      if (order) {
        const items = await this.sqliteAll(`SELECT oi.qty, oi.price, b.title, b.author FROM order_items oi JOIN books b ON oi.bookId = b.id WHERE oi.orderId = ?`, [orderId]);
        order.items = items;
      }
      return order;
    } else {
      const order = this.jsonData.orders.find(o => o.id.toLowerCase() === orderId.toLowerCase());
      if (!order) return null;
      const user = this.jsonData.users.find(u => u.id === order.userId);
      if (!user || user.email.toLowerCase() !== email.toLowerCase()) return null;
      const items = this.jsonData.order_items.filter(oi => oi.orderId === order.id).map(oi => {
        const book = this.jsonData.books.find(b => b.id === oi.bookId);
        return {
          qty: oi.qty,
          price: oi.price,
          title: book ? book.title : 'Unknown Book',
          author: book ? book.author : 'Unknown Author'
        };
      });
      return {
        ...order,
        items
      };
    }
  }
};

// Initialize DB before starting server
await DB.init();

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized access. Token required.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired session. Please log in again.' });
    req.user = user;
    next();
  });
};

// Admin Middleware
const requireAdmin = async (req, res, next) => {
  const userRecord = await DB.getUserById(req.user.id);
  if (!userRecord || userRecord.isAdmin !== 1) {
    return res.status(403).json({ message: 'Forbidden. Admin privileges required.' });
  }
  next();
};

// API ROUTES

// Auth Endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required.' });

    const existingUser = await DB.getUserByEmail(email);
    if (existingUser) return res.status(400).json({ message: 'An account with this email already exists.' });

    const user = await DB.createUser(name, email, password);
    const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, username: user.name, isAdmin: user.isAdmin });
  } catch (err) {
    res.status(500).json({ message: 'Server error during signup.', error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    const user = await DB.getUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });
    if (user.status === 'Disabled') return res.status(403).json({ message: 'Your account is disabled. Contact support.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password.' });

    const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.name, name: user.name, isAdmin: user.isAdmin });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login.', error: err.message });
  }
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await DB.getUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const { password, ...userNoPw } = user;
    res.json(userNoPw);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching profile.', error: err.message });
  }
});

// Books Endpoints
app.get('/api/books', async (req, res) => {
  try {
    const keyword = req.query.keyword || '';
    const books = await DB.getBooks(keyword);
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching books.' });
  }
});

app.get('/api/books/:id', async (req, res) => {
  try {
    const book = await DB.getBookById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found.' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching book details.' });
  }
});

app.post('/api/books', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const newBook = await DB.createBook(req.body);
    res.status(201).json(newBook);
  } catch (err) {
    res.status(500).json({ message: 'Server error creating book.', error: err.message });
  }
});

app.put('/api/books/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const updated = await DB.updateBook(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Book not found.' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating book.', error: err.message });
  }
});

app.delete('/api/books/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await DB.deleteBook(req.params.id);
    res.json({ message: 'Book successfully deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting book.' });
  }
});

// Categories Endpoints
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await DB.getCategories();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching categories.' });
  }
});

app.post('/api/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const newCat = await DB.createCategory(req.body);
    res.status(201).json(newCat);
  } catch (err) {
    res.status(500).json({ message: 'Server error creating category.' });
  }
});

app.put('/api/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const updated = await DB.updateCategory(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Category not found.' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating category.' });
  }
});

app.delete('/api/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await DB.deleteCategory(req.params.id);
    res.json({ message: 'Category successfully deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting category.' });
  }
});

// Cart Endpoints
app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    const cart = await DB.getCart(req.user.id);
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Server error loading cart.' });
  }
});

app.post('/api/cart', authenticateToken, async (req, res) => {
  try {
    const { bookId, quantity } = req.body;
    await DB.addToCart(req.user.id, bookId, quantity || 1);
    const cart = await DB.getCart(req.user.id);
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Server error adding to cart.' });
  }
});

app.put('/api/cart/:bookId', authenticateToken, async (req, res) => {
  try {
    const { quantity } = req.body;
    await DB.updateCartItem(req.user.id, req.params.bookId, quantity);
    const cart = await DB.getCart(req.user.id);
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating quantity.' });
  }
});

app.delete('/api/cart/:bookId', authenticateToken, async (req, res) => {
  try {
    await DB.removeFromCart(req.user.id, req.params.bookId);
    const cart = await DB.getCart(req.user.id);
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Server error removing item from cart.' });
  }
});

app.post('/api/cart/merge', authenticateToken, async (req, res) => {
  try {
    const { items } = req.body;
    if (items && Array.isArray(items)) {
      await DB.mergeCart(req.user.id, items);
    }
    const cart = await DB.getCart(req.user.id);
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: 'Server error merging cart.' });
  }
});

// Wishlist Endpoints
app.get('/api/wishlist', authenticateToken, async (req, res) => {
  try {
    const wishlist = await DB.getWishlist(req.user.id);
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ message: 'Server error loading wishlist.' });
  }
});

app.post('/api/wishlist/:bookId', authenticateToken, async (req, res) => {
  try {
    const result = await DB.toggleWishlist(req.user.id, req.params.bookId);
    const wishlist = await DB.getWishlist(req.user.id);
    res.json({ wishlist, ...result });
  } catch (err) {
    res.status(500).json({ message: 'Server error toggling wishlist.' });
  }
});

app.delete('/api/wishlist/:bookId', authenticateToken, async (req, res) => {
  try {
    await DB.removeFromWishlist(req.user.id, req.params.bookId);
    const wishlist = await DB.getWishlist(req.user.id);
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ message: 'Server error removing item from wishlist.' });
  }
});

// Verification helper for email sending
const sendConfirmationEmail = async (order) => {
  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const emailFrom = process.env.EMAIL_FROM || '"Book Hub" <noreply@bookhub.com>';

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.log('--- Order Confirmation Email Log (Dry Run) ---');
      console.log(`To: ${order.email}`);
      console.log(`Subject: Order Confirmation - Order #${order.id}`);
      console.log(`Order Total: $${order.total.toFixed(2)}`);
      console.log('Items:');
      order.items.forEach(item => {
        console.log(`- ${item.title} x${item.qty} ($${item.price.toFixed(2)})`);
      });
      console.log('----------------------------------------------');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.title} by ${item.author}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.qty}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toFixed(2)}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #0F4C81; border-bottom: 2px solid #0F4C81; padding-bottom: 10px;">Order Confirmed!</h2>
        <p>Dear ${order.firstName} ${order.lastName},</p>
        <p>Thank you for shopping at Book Hub. Your order has been successfully placed and processed.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <strong>Order ID:</strong> #${order.id}<br/>
          <strong>Date:</strong> ${order.date}<br/>
          <strong>Payment Status:</strong> ${order.paymentStatus} (via ${order.paymentGateway || order.paymentMethod})<br/>
          <strong>Order Status:</strong> Processing
        </div>

        <h3>Purchased Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Book Title</th>
              <th style="padding: 8px; text-align: center; border-bottom: 1px solid #ddd; width: 60px;">Qty</th>
              <th style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd; width: 80px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="margin-top: 20px; text-align: right;">
          <p><strong>Subtotal:</strong> $${order.subtotal.toFixed(2)}</p>
          ${order.discount > 0 ? `<p><strong>Discount (10%):</strong> -$${order.discount.toFixed(2)}</p>` : ''}
          <p><strong>Shipping:</strong> $${order.shipping.toFixed(2)}</p>
          <p style="font-size: 18px; color: #0F4C81;"><strong>Total:</strong> $${order.total.toFixed(2)}</p>
        </div>

        <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          <h3>Shipping Address</h3>
          <p>${order.shippingAddress}</p>
        </div>

        <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #888;">
          <p>Need help? Contact support at support@bookhub.com</p>
          <p>&copy; ${new Date().getFullYear()} Book Hub. All rights reserved.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: emailFrom,
      to: order.email,
      subject: `Order Confirmation - Book Hub #${order.id}`,
      html: htmlContent
    });
    console.log(`Confirmation email sent successfully to ${order.email} for order ${order.id}`);
  } catch (err) {
    console.error(`Failed to send order confirmation email for order ${order.id}:`, err.message);
  }
};

// Calculation helper for backend pricing verification
const validateAndCalculateOrder = async (userId, checkoutData) => {
  const { shippingMethod, couponCode } = checkoutData;
  
  // Retrieve user's cart
  const cartItems = await DB.getCart(userId);
  if (!cartItems || cartItems.length === 0) {
    throw new Error('Your cart is empty.');
  }

  // Validate products exist and check stock
  let subtotal = 0;
  const validatedItems = [];
  
  for (const item of cartItems) {
    const book = await DB.getBookById(item.id);
    if (!book) {
      throw new Error(`Product "${item.title}" no longer exists in catalog.`);
    }
    if (book.stock < item.quantity) {
      throw new Error(`Insufficient stock for "${book.title}". Available: ${book.stock}, requested: ${item.quantity}.`);
    }
    subtotal += book.price * item.quantity;
    validatedItems.push({
      id: book.id,
      title: book.title,
      author: book.author,
      price: book.price,
      quantity: item.quantity
    });
  }

  // Shipping cost
  const shipping = shippingMethod === 'express' ? 199 : 0;
  
  // Discount
  let discount = 0;
  if (couponCode && couponCode.toLowerCase() === 'bookhub10') {
    discount = subtotal * 0.1;
  }
  
  // Tax
  const tax = 0;
  
  // Final payable amount
  const total = subtotal + shipping - discount + tax;
  
  if (total <= 0) {
    throw new Error('Invalid order total.');
  }

  return {
    subtotal,
    shipping,
    discount,
    tax,
    total,
    items: validatedItems
  };
};

// 1. Create Razorpay Order Endpoint
app.post('/api/checkout/create-razorpay-order', authenticateToken, async (req, res) => {
  try {
    const calculation = await validateAndCalculateOrder(req.user.id, req.body);
    
    // Amount must be in cents/paise (integer)
    const amountInPaise = Math.round(calculation.total * 100);
    const options = {
      amount: amountInPaise,
      currency: 'INR', // INR is safest for test accounts
      receipt: 'rcpt_' + Math.floor(100000 + Math.random() * 900000)
    };

    let rzpOrder;
    const isPlaceholder = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'rzp_test_your_key_id';
    
    if (isPlaceholder) {
      console.log('Razorpay Key is placeholder or missing. Simulating Razorpay Order creation on backend.');
      rzpOrder = {
        id: 'order_mock_' + Math.floor(100000 + Math.random() * 900000),
        amount: amountInPaise,
        currency: 'INR'
      };
    } else {
      rzpOrder = await razorpay.orders.create(options);
    }
    
    res.json({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_id',
      order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      subtotal: calculation.subtotal,
      shipping: calculation.shipping,
      discount: calculation.discount,
      tax: calculation.tax,
      total: calculation.total
    });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    res.status(500).json({ message: err.message || 'Failed to initiate checkout.', error: err.message });
  }
});

// 2. Verify Razorpay Payment Endpoint
app.post('/api/checkout/verify-payment', authenticateToken, async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      checkoutData 
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !checkoutData) {
      return res.status(400).json({ message: 'Missing payment or checkout verification parameters.' });
    }

    // Verify signature
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_secret_key';
    const hmac = crypto.createHmac('sha256', key_secret);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    const isSignatureValid = (generated_signature === razorpay_signature);
    const isPlaceholderKey = (process.env.RAZORPAY_KEY_ID === 'rzp_test_your_key_id' || !process.env.RAZORPAY_KEY_ID);
    
    if (!isSignatureValid && !isPlaceholderKey) {
      console.error(`Signature verification failed: Generated: ${generated_signature}, Received: ${razorpay_signature}`);
      return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
    }

    // Check for duplicate order (Idempotency check)
    let existingOrder = null;
    if (isSQLite) {
      existingOrder = await DB.sqliteGet("SELECT * FROM orders WHERE razorpayOrderId = ?", [razorpay_order_id]);
    } else {
      existingOrder = DB.jsonData.orders.find(o => o.razorpayOrderId === razorpay_order_id);
    }
    
    if (existingOrder) {
      console.log(`Duplicate payment request for Razorpay Order: ${razorpay_order_id}. Returning existing order.`);
      const items = isSQLite 
        ? await DB.sqliteAll(`SELECT oi.qty, oi.price, b.title, b.author FROM order_items oi JOIN books b ON oi.bookId = b.id WHERE oi.orderId = ?`, [existingOrder.id])
        : DB.jsonData.order_items.filter(oi => oi.orderId === existingOrder.id).map(oi => {
            const book = DB.jsonData.books.find(b => b.id === oi.bookId);
            return {
              qty: oi.qty,
              price: oi.price,
              title: book ? book.title : 'Unknown Book',
              author: book ? book.author : 'Unknown Author'
            };
          });
      existingOrder.items = items;
      return res.json(existingOrder);
    }

    // Authoritative backend price check & stock check
    const calculation = await validateAndCalculateOrder(req.user.id, checkoutData);

    const orderData = {
      firstName: checkoutData.firstName,
      lastName: checkoutData.lastName,
      address: checkoutData.address,
      city: checkoutData.city,
      state: checkoutData.state,
      zipCode: checkoutData.zipCode,
      country: checkoutData.country,
      shippingMethod: checkoutData.shippingMethod,
      paymentMethod: checkoutData.paymentMethod,
      paymentStatus: 'Paid',
      paymentGateway: 'Razorpay',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      subtotal: calculation.subtotal,
      shipping: calculation.shipping,
      discount: calculation.discount,
      total: calculation.total,
      email: checkoutData.email || req.user.email,
      phone: checkoutData.phone,
      items: calculation.items
    };

    const confirmedOrder = await DB.createOrder(req.user.id, orderData);
    
    // Set mapped items for the response
    confirmedOrder.items = calculation.items.map(item => ({
      qty: item.quantity,
      price: item.price,
      title: item.title,
      author: item.author
    }));

    // Trigger email confirmation asynchronously
    sendConfirmationEmail(confirmedOrder).catch(err => {
      console.error('Asynchronous order confirmation email failed:', err.message);
    });

    res.status(201).json(confirmedOrder);
  } catch (err) {
    console.error('Error during payment verification:', err);
    res.status(500).json({ message: err.message || 'Payment verification failed.', error: err.message });
  }
});

// 3. Regular Orders Endpoint (for Cash on Delivery / standard flow)
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const checkoutData = req.body;
    
    // Authoritative backend validation
    const calculation = await validateAndCalculateOrder(req.user.id, checkoutData);

    const orderData = {
      ...checkoutData,
      subtotal: calculation.subtotal,
      shipping: calculation.shipping,
      discount: calculation.discount,
      total: calculation.total,
      paymentStatus: checkoutData.paymentMethod === 'cod' ? 'Pending' : 'Paid',
      email: checkoutData.email || req.user.email,
      items: calculation.items
    };

    const order = await DB.createOrder(req.user.id, orderData);
    
    // Set mapped items for response / email
    order.items = calculation.items.map(item => ({
      qty: item.quantity,
      price: item.price,
      title: item.title,
      author: item.author
    }));

    // Trigger email confirmation asynchronously
    sendConfirmationEmail(order).catch(err => {
      console.error('Asynchronous order confirmation email failed:', err.message);
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error placing order.', error: err.message });
  }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await DB.getUserById(req.user.id);
    const isAdmin = user && user.isAdmin === 1;
    const orders = await DB.getOrders(req.user.id, isAdmin);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error loading orders.' });
  }
});

app.get('/api/orders/:id', authenticateToken, async (req, res) => {
  try {
    const user = await DB.getUserById(req.user.id);
    const isAdmin = user && user.isAdmin === 1;
    const order = await DB.getOrderById(req.params.id, req.user.id, isAdmin);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error loading order.' });
  }
});

app.put('/api/orders/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await DB.updateOrderStatus(req.params.id, req.body.status);
    res.json({ message: 'Order status updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error updating order status.' });
  }
});

app.get('/api/track/:id', async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ message: 'Email address is required to track order.' });
    const tracking = await DB.trackOrder(req.params.id, email);
    if (!tracking) return res.status(404).json({ message: 'No order found with the provided details. Please check and try again.' });
    res.json(tracking);
  } catch (err) {
    res.status(500).json({ message: 'Server error tracking order.' });
  }
});

// Admin Customer Management Endpoints
app.get('/api/customers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const customers = await DB.getAllUsers();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: 'Server error loading customers.' });
  }
});

app.put('/api/customers/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await DB.updateUserStatus(req.params.id, req.body.status);
    res.json({ message: 'Customer status updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error updating customer status.' });
  }
});

// Catch-all API Route
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend Server listening at http://localhost:${PORT}`);
});
