import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pg from 'pg';
const { Pool } = pg;
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
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://book-hub-chi-eight.vercel.app'],
  credentials: true
}));
app.use(express.json());

// Database Setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Abstract DB Helper
const DB = {
  // Initialize Database
  async init() {
    try {
      await pool.query('SELECT NOW()');
      console.log('Connected to PostgreSQL database.');
      await this.initPostgresTables();
      await this.seedData();
    } catch (e) {
      console.error('Failed to connect to PostgreSQL:', e.message);
      // Wait before crashing, or just log.
    }
  },

  async initPostgresTables() {
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      isAdmin INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'Active',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS books (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      category VARCHAR(255) NOT NULL,
      price NUMERIC NOT NULL,
      description TEXT,
      rating NUMERIC DEFAULT 5.0,
      image TEXT,
      isBestSeller INTEGER DEFAULT 0,
      isNewArrival INTEGER DEFAULT 0,
      isPublishedByUs INTEGER DEFAULT 0,
      stock INTEGER DEFAULT 10
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      count INTEGER DEFAULT 0,
      image TEXT
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS cart_items (
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      bookId INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY(userId, bookId)
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS wishlist_items (
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      bookId INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      PRIMARY KEY(userId, bookId)
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(50) PRIMARY KEY,
      userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date VARCHAR(50) NOT NULL,
      total NUMERIC NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      shippingAddress TEXT NOT NULL,
      paymentMethod VARCHAR(50) NOT NULL,
      paymentStatus VARCHAR(50) NOT NULL DEFAULT 'Pending',
      paymentGateway VARCHAR(50),
      razorpayOrderId VARCHAR(100),
      razorpayPaymentId VARCHAR(100),
      subtotal NUMERIC,
      tax NUMERIC,
      shipping NUMERIC,
      discount NUMERIC,
      email VARCHAR(255),
      phone VARCHAR(50),
      firstName VARCHAR(100),
      lastName VARCHAR(100),
      city VARCHAR(100),
      state VARCHAR(100),
      zipCode VARCHAR(50),
      country VARCHAR(100),
      shippingMethod VARCHAR(50),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      orderId VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      bookId INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      qty INTEGER NOT NULL,
      price NUMERIC NOT NULL
    )`);
  },

  async seedData() {
    // Seed Admin
    const adminCheck = await pool.query("SELECT * FROM users WHERE email = $1", ['admin@bookhub.com']);
    if (adminCheck.rows.length === 0) {
      const hashedPw = await bcrypt.hash('admin123', 10);
      await pool.query("INSERT INTO users (name, email, password, isAdmin) VALUES ($1, $2, $3, $4)", ['Admin User', 'admin@bookhub.com', hashedPw, 1]);
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
      const custCheck = await pool.query("SELECT * FROM users WHERE email = $1", [cust.email]);
      if (custCheck.rows.length === 0) {
        const hashedPw = await bcrypt.hash(cust.password, 10);
        await pool.query("INSERT INTO users (name, email, password, isAdmin, status) VALUES ($1, $2, $3, $4, $5)", [cust.name, cust.email, hashedPw, 0, cust.status || 'Active']);
      }
    }

    // Seed Categories
    const catCount = await pool.query("SELECT COUNT(*) as count FROM categories");
    if (parseInt(catCount.rows[0].count) === 0) {
      for (const cat of mockCategories) {
        await pool.query("INSERT INTO categories (name, count, image) VALUES ($1, $2, $3)", [cat.name, cat.count, cat.image]);
      }
    }

    // Seed Books
    const bookCount = await pool.query("SELECT COUNT(*) as count FROM books");
    if (parseInt(bookCount.rows[0].count) === 0) {
      for (const book of mockBooks) {
        await pool.query(`INSERT INTO books (title, author, category, price, description, rating, image, isBestSeller, isNewArrival, isPublishedByUs, stock) 
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, 
                   [book.title, book.author, book.category, book.price, book.description, book.rating, book.image, book.isBestSeller ? 1 : 0, book.isNewArrival ? 1 : 0, book.isPublishedByUs ? 1 : 0, 10]);
      }
    }
  },

  // USER OPERATIONS
  async getUserByEmail(email) {
    const res = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    return res.rows[0];
  },

  async getUserById(id) {
    const res = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return res.rows[0];
  },

  async createUser(name, email, password) {
    const hashedPw = await bcrypt.hash(password, 10);
    const result = await pool.query("INSERT INTO users (name, email, password, isAdmin, status) VALUES ($1, $2, $3, 0, 'Active') RETURNING id", [name, email, hashedPw]);
    return { id: result.rows[0].id, name, email, isAdmin: 0, status: 'Active' };
  },

  async getAllUsers() {
    const res = await pool.query("SELECT id, name, email, isAdmin, status, createdAt FROM users WHERE isAdmin = 0");
    return res.rows;
  },

  async updateUserStatus(id, status) {
    await pool.query("UPDATE users SET status = $1 WHERE id = $2", [status, id]);
  },

  // BOOK OPERATIONS
  async getBooks(keyword = '') {
    if (keyword) {
      const res = await pool.query("SELECT * FROM books WHERE title ILIKE $1 OR author ILIKE $1", [`%${keyword}%`]);
      return res.rows.map(b => ({...b, price: Number(b.price), rating: Number(b.rating)}));
    }
    const res = await pool.query("SELECT * FROM books");
    return res.rows.map(b => ({...b, price: Number(b.price), rating: Number(b.rating)}));
  },

  async getBookById(id) {
    const res = await pool.query("SELECT * FROM books WHERE id = $1", [id]);
    if (res.rows[0]) {
      res.rows[0].price = Number(res.rows[0].price);
      res.rows[0].rating = Number(res.rows[0].rating);
    }
    return res.rows[0];
  },

  async createBook(bookData) {
    const { title, author, category, price, description, rating, image, isBestSeller, isNewArrival, isPublishedByUs, stock } = bookData;
    const result = await pool.query(`INSERT INTO books (title, author, category, price, description, rating, image, isBestSeller, isNewArrival, isPublishedByUs, stock)
                                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
                                         [title, author, category, Number(price), description, Number(rating || 5), image, isBestSeller ? 1 : 0, isNewArrival ? 1 : 0, isPublishedByUs ? 1 : 0, Number(stock || 10)]);
    return { id: result.rows[0].id, ...bookData };
  },

  async updateBook(id, bookData) {
    const { title, author, category, price, description, image, isBestSeller, isNewArrival, isPublishedByUs, stock } = bookData;
    await pool.query(`UPDATE books SET title = $1, author = $2, category = $3, price = $4, description = $5, image = $6, isBestSeller = $7, isNewArrival = $8, isPublishedByUs = $9, stock = $10
                          WHERE id = $11`,
                          [title, author, category, Number(price), description, image, isBestSeller ? 1 : 0, isNewArrival ? 1 : 0, isPublishedByUs ? 1 : 0, Number(stock), id]);
    return { id, ...bookData };
  },

  async deleteBook(id) {
    await pool.query("DELETE FROM books WHERE id = $1", [id]);
  },

  // CATEGORY OPERATIONS
  async getCategories() {
    const res = await pool.query("SELECT * FROM categories");
    return res.rows;
  },

  async createCategory(catData) {
    const { name, count, image } = catData;
    const result = await pool.query("INSERT INTO categories (name, count, image) VALUES ($1, $2, $3) RETURNING id", [name, Number(count || 0), image]);
    return { id: result.rows[0].id, ...catData };
  },

  async updateCategory(id, catData) {
    const { name, count, image } = catData;
    await pool.query("UPDATE categories SET name = $1, count = $2, image = $3 WHERE id = $4", [name, Number(count), image, id]);
    return { id, ...catData };
  },

  async deleteCategory(id) {
    await pool.query("DELETE FROM categories WHERE id = $1", [id]);
  },

  // CART OPERATIONS
  async getCart(userId) {
    const res = await pool.query(`SELECT c.bookId as id, c.quantity, b.title, b.author, b.category, b.price, b.image, b.stock
                                        FROM cart_items c JOIN books b ON c.bookId = b.id WHERE c.userId = $1`, [userId]);
    return res.rows.map(item => ({
      id: item.id,
      title: item.title,
      author: item.author,
      category: item.category,
      price: Number(item.price), // Postgres numerics return as strings
      image: item.image,
      stock: item.stock,
      quantity: item.quantity
    }));
  },

  async addToCart(userId, bookId, quantity) {
    await pool.query(`INSERT INTO cart_items (userId, bookId, quantity) VALUES ($1, $2, $3) 
                      ON CONFLICT (userId, bookId) DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`, [userId, bookId, quantity]);
  },

  async updateCartItem(userId, bookId, quantity) {
    if (quantity <= 0) {
      await pool.query("DELETE FROM cart_items WHERE userId = $1 AND bookId = $2", [userId, bookId]);
    } else {
      await pool.query("UPDATE cart_items SET quantity = $1 WHERE userId = $2 AND bookId = $3", [quantity, userId, bookId]);
    }
  },

  async removeFromCart(userId, bookId) {
    await pool.query("DELETE FROM cart_items WHERE userId = $1 AND bookId = $2", [userId, bookId]);
  },

  async clearCart(userId) {
    await pool.query("DELETE FROM cart_items WHERE userId = $1", [userId]);
  },

  async mergeCart(userId, cartItems) {
    for (const item of cartItems) {
      await this.addToCart(userId, item.id, item.quantity);
    }
  },

  // WISHLIST OPERATIONS
  async getWishlist(userId) {
    const res = await pool.query(`SELECT w.bookId as id, b.title, b.author, b.category, b.price, b.image, b.stock, b.rating
                                        FROM wishlist_items w JOIN books b ON w.bookId = b.id WHERE w.userId = $1`, [userId]);
    return res.rows.map(item => ({
      id: item.id,
      title: item.title,
      author: item.author,
      category: item.category,
      price: Number(item.price),
      image: item.image,
      stock: item.stock,
      rating: Number(item.rating)
    }));
  },

  async toggleWishlist(userId, bookId) {
    const exists = await pool.query("SELECT 1 FROM wishlist_items WHERE userId = $1 AND bookId = $2", [userId, bookId]);
    if (exists.rows.length > 0) {
      await pool.query("DELETE FROM wishlist_items WHERE userId = $1 AND bookId = $2", [userId, bookId]);
      return { action: 'removed' };
    } else {
      await pool.query("INSERT INTO wishlist_items (userId, bookId) VALUES ($1, $2)", [userId, bookId]);
      return { action: 'added' };
    }
  },

  async removeFromWishlist(userId, bookId) {
    await pool.query("DELETE FROM wishlist_items WHERE userId = $1 AND bookId = $2", [userId, bookId]);
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

    await pool.query(
      `INSERT INTO orders (
        id, userId, date, total, status, shippingAddress, paymentMethod,
        paymentStatus, paymentGateway, razorpayOrderId, razorpayPaymentId,
        subtotal, tax, shipping, discount, email, phone,
        firstName, lastName, city, state, zipCode, country, shippingMethod
      ) VALUES ($1, $2, $3, $4, 'Pending', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
      [
        orderId, userId, date, Number(total), shippingAddress, paymentMethod,
        paymentStatus, paymentGateway, razorpayOrderId, razorpayPaymentId,
        Number(subtotal), Number(tax), Number(shipping), Number(discount), email, phone,
        firstName, lastName, city, state, zipCode, country, shippingMethod
      ]
    );
    
    for (const item of items) {
      await pool.query("INSERT INTO order_items (orderId, bookId, qty, price) VALUES ($1, $2, $3, $4)", [orderId, item.id, item.quantity, item.price]);
      // Reduce book stock
      await pool.query("UPDATE books SET stock = GREATEST(0, stock - $1) WHERE id = $2", [item.quantity, item.id]);
    }
    await this.clearCart(userId);
    return { 
      id: orderId, status: 'Pending', date, total, shippingAddress, 
      paymentStatus, paymentGateway, razorpayOrderId, razorpayPaymentId,
      subtotal, tax, shipping, discount, email, phone,
      firstName, lastName, city, state, zipCode, country, shippingMethod
    };
  },

  async getOrders(userId, isAdmin = false) {
    let orders;
    if (isAdmin) {
      const res = await pool.query(`SELECT o.*, u.name as customer, u.email FROM orders o JOIN users u ON o.userId = u.id`);
      orders = res.rows;
      for (let o of orders) {
        const items = await pool.query(`SELECT oi.qty, oi.price, b.title, b.author FROM order_items oi JOIN books b ON oi.bookId = b.id WHERE oi.orderId = $1`, [o.id]);
        o.items = items.rows.length;
        o.orderItems = items.rows;
      }
    } else {
      const res = await pool.query("SELECT * FROM orders WHERE userId = $1 ORDER BY date DESC", [userId]);
      orders = res.rows;
      for (let o of orders) {
        const items = await pool.query(`SELECT oi.qty, oi.price, b.title, b.author FROM order_items oi JOIN books b ON oi.bookId = b.id WHERE oi.orderId = $1`, [o.id]);
        o.items = items.rows;
      }
    }
    return orders;
  },

  async getOrderById(id, userId, isAdmin = false) {
    let order;
    if (isAdmin) {
      const res = await pool.query(`SELECT o.*, u.name as customer, u.email FROM orders o JOIN users u ON o.userId = u.id WHERE o.id = $1`, [id]);
      order = res.rows[0];
    } else {
      const res = await pool.query("SELECT * FROM orders WHERE id = $1 AND userId = $2", [id, userId]);
      order = res.rows[0];
    }
    if (order) {
      const items = await pool.query(`SELECT oi.qty, oi.price, b.title, b.author FROM order_items oi JOIN books b ON oi.bookId = b.id WHERE oi.orderId = $1`, [id]);
      order.items = items.rows;
    }
    return order;
  },

  async updateOrderStatus(id, status) {
    await pool.query("UPDATE orders SET status = $1 WHERE id = $2", [status, id]);
  },

  async trackOrder(orderId, email) {
    const res = await pool.query(`SELECT o.*, u.email FROM orders o JOIN users u ON o.userId = u.id WHERE o.id = $1 AND u.email = $2`, [orderId, email]);
    const order = res.rows[0];
    if (order) {
      const items = await pool.query(`SELECT oi.qty, oi.price, b.title, b.author FROM order_items oi JOIN books b ON oi.bookId = b.id WHERE oi.orderId = $1`, [orderId]);
      order.items = items.rows;
    }
    return order;
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
