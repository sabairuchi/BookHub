import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://bookhub-iat3.onrender.com/api' : 'http://localhost:5000/api'), // Backend server URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token to requests if user is logged in
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const { token } = JSON.parse(userInfo);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },
  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    return data;
  },
  getProfile: async () => {
    const { data } = await api.get('/auth/profile');
    return data;
  },
};

export const bookAPI = {
  getAllBooks: async (keyword = '') => {
    const { data } = await api.get(`/books?keyword=${keyword}`);
    return data;
  },
  getBookById: async (id) => {
    const { data } = await api.get(`/books/${id}`);
    return data;
  },
  createBook: async (bookData) => {
    const { data } = await api.post('/books', bookData);
    return data;
  },
  updateBook: async (id, bookData) => {
    const { data } = await api.put(`/books/${id}`, bookData);
    return data;
  },
  deleteBook: async (id) => {
    const { data } = await api.delete(`/books/${id}`);
    return data;
  },
};

export const orderAPI = {
  createOrder: async (orderData) => {
    const { data } = await api.post('/orders', orderData);
    return data;
  },
  createRazorpayOrder: async (checkoutData) => {
    const { data } = await api.post('/checkout/create-razorpay-order', checkoutData);
    return data;
  },
  verifyPayment: async (paymentDetails) => {
    const { data } = await api.post('/checkout/verify-payment', paymentDetails);
    return data;
  },
  getOrderById: async (id) => {
    const { data } = await api.get(`/orders/${id}`);
    return data;
  },
  getAllOrders: async () => {
    const { data } = await api.get('/orders');
    return data;
  },
  updateOrderStatus: async (id, status) => {
    const { data } = await api.put(`/orders/${id}/status`, { status });
    return data;
  },
  trackOrder: async (orderId, email) => {
    const { data } = await api.get(`/track/${orderId}?email=${encodeURIComponent(email)}`);
    return data;
  },
};

export const categoryAPI = {
  getAllCategories: async () => {
    const { data } = await api.get('/categories');
    return data;
  },
  createCategory: async (catData) => {
    const { data } = await api.post('/categories', catData);
    return data;
  },
  updateCategory: async (id, catData) => {
    const { data } = await api.put(`/categories/${id}`, catData);
    return data;
  },
  deleteCategory: async (id) => {
    const { data } = await api.delete(`/categories/${id}`);
    return data;
  },
};

export const cartAPI = {
  getCart: async () => {
    const { data } = await api.get('/cart');
    return data;
  },
  addToCart: async (bookId, quantity) => {
    const { data } = await api.post('/cart', { bookId, quantity });
    return data;
  },
  updateCartItem: async (bookId, quantity) => {
    const { data } = await api.put(`/cart/${bookId}`, { quantity });
    return data;
  },
  removeFromCart: async (bookId) => {
    const { data } = await api.delete(`/cart/${bookId}`);
    return data;
  },
  clearCart: async () => {
    const { data } = await api.delete('/cart');
    return data;
  },
  mergeCart: async (items) => {
    const { data } = await api.post('/cart/merge', { items });
    return data;
  },
};

export const wishlistAPI = {
  getWishlist: async () => {
    const { data } = await api.get('/wishlist');
    return data;
  },
  toggleWishlist: async (bookId) => {
    const { data } = await api.post(`/wishlist/${bookId}`);
    return data;
  },
  removeFromWishlist: async (bookId) => {
    const { data } = await api.delete(`/wishlist/${bookId}`);
    return data;
  },
};

export const customerAPI = {
  getAllCustomers: async () => {
    const { data } = await api.get('/customers');
    return data;
  },
  updateCustomerStatus: async (id, status) => {
    const { data } = await api.put(`/customers/${id}/status`, { status });
    return data;
  },
};

export default api;

