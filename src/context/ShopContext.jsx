import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, bookAPI, categoryAPI, cartAPI, wishlistAPI } from '../services/api';

const ShopContext = createContext();

export const useShop = () => {
  return useContext(ShopContext);
};

export const ShopProvider = ({ children }) => {
  // Books and categories live data state
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('bookhub_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [wishlist, setWishlist] = useState(() => {
    const savedWishlist = localStorage.getItem('bookhub_wishlist');
    return savedWishlist ? JSON.parse(savedWishlist) : [];
  });
  
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('bookhub_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('bookhub_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('bookhub_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('bookhub_user', JSON.stringify(user));
  }, [user]);

  // Load books and categories on mount
  const refreshBooks = async () => {
    try {
      const fetchedBooks = await bookAPI.getAllBooks();
      setBooks(fetchedBooks);
    } catch (err) {
      console.error("Error fetching books:", err);
    }
  };

  const refreshCategories = async () => {
    try {
      const fetchedCats = await categoryAPI.getAllCategories();
      setCategories(fetchedCats);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        await Promise.all([refreshBooks(), refreshCategories()]);
      } catch (err) {
        console.error("Error loading initial data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Restore user session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const userInfoStr = localStorage.getItem('userInfo');
      if (userInfoStr) {
        try {
          const { token, username, isAdmin } = JSON.parse(userInfoStr);
          if (token) {
            // Verify profile from server
            const profile = await authAPI.getProfile();
            setUser({ username: profile.name, email: profile.email, isAdmin: profile.isAdmin });
            
            // Sync cart and wishlist from DB
            const dbCart = await cartAPI.getCart();
            setCart(dbCart);
            const dbWishlist = await wishlistAPI.getWishlist();
            setWishlist(dbWishlist);
          }
        } catch (err) {
          console.error("Session restoration failed, clearing session:", err.message);
          logout();
        }
      }
    };
    restoreSession();
  }, []);

  // Cart operations
  const addToCart = async (book) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === book.id);
      if (existingItem) {
        return prevCart.map(item => 
          item.id === book.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...book, quantity: 1 }];
    });

    if (user) {
      try {
        await cartAPI.addToCart(book.id, 1);
      } catch (err) {
        console.error("Failed to sync add to cart:", err);
      }
    }
  };

  const removeFromCart = async (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));

    if (user) {
      try {
        await cartAPI.removeFromCart(id);
      } catch (err) {
        console.error("Failed to sync remove from cart:", err);
      }
    }
  };

  const updateQuantity = async (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prevCart => prevCart.map(item => 
      item.id === id ? { ...item, quantity } : item
    ));

    if (user) {
      try {
        await cartAPI.updateCartItem(id, quantity);
      } catch (err) {
        console.error("Failed to sync update quantity:", err);
      }
    }
  };

  const clearCart = async () => {
    setCart([]);
    if (user) {
      try {
        await cartAPI.clearCart();
      } catch (err) {
        console.error("Failed to sync clear cart:", err);
      }
    }
  };

  // Wishlist operations
  const toggleWishlist = async (book) => {
    setWishlist(prevWishlist => {
      const exists = prevWishlist.find(item => item.id === book.id);
      if (exists) {
        return prevWishlist.filter(item => item.id !== book.id);
      }
      return [...prevWishlist, book];
    });

    if (user) {
      try {
        await wishlistAPI.toggleWishlist(book.id);
      } catch (err) {
        console.error("Failed to sync toggle wishlist:", err);
      }
    }
  };

  const isInWishlist = (id) => {
    return wishlist.some(item => item.id === id);
  };

  // Auth operations
  const login = async (loginData) => {
    // Save to localStorage so interceptors and initial states pick it up
    localStorage.setItem('userInfo', JSON.stringify({ 
      token: loginData.token, 
      username: loginData.username, 
      isAdmin: loginData.isAdmin 
    }));
    
    const userProfile = { 
      username: loginData.username, 
      name: loginData.name || loginData.username, 
      isAdmin: loginData.isAdmin 
    };
    setUser(userProfile);
    localStorage.setItem('bookhub_user', JSON.stringify(userProfile));

    try {
      // Merge guest cart with DB cart if guest cart has items
      let finalCart = [];
      if (cart.length > 0) {
        finalCart = await cartAPI.mergeCart(cart);
      } else {
        finalCart = await cartAPI.getCart();
      }
      setCart(finalCart);

      // Load DB wishlist
      const dbWishlist = await wishlistAPI.getWishlist();
      setWishlist(dbWishlist);
    } catch (err) {
      console.error("Failed to sync data after login:", err);
    }

    setIsLoginModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    setCart([]);
    setWishlist([]);
    localStorage.removeItem('userInfo');
    localStorage.removeItem('bookhub_user');
    localStorage.removeItem('bookhub_cart');
    localStorage.removeItem('bookhub_wishlist');
  };
  
  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  // Derived state
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  const value = {
    books,
    categories,
    loading,
    refreshBooks,
    refreshCategories,
    cart,
    wishlist,
    user,
    cartTotal,
    cartCount,
    isLoginModalOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleWishlist,
    isInWishlist,
    login,
    logout,
    openLoginModal,
    closeLoginModal,
    setUser // kept for backward compatibility (e.g. if any layouts modify user directly)
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
};
