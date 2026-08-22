import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingCart, User, Menu, X, LogOut } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import './Navbar.css';

const Navbar = () => {
  const { cartCount, wishlist, user, openLoginModal, logout } = useShop();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?query=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
      setIsMobileMenuOpen(false);
    }
  };

  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="navbar-header">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <img src="/images/logo.jpeg" alt="Book Hub Logo" className="logo-img" />
          <span className="logo-tagline">Connect &bull; Read &bull; Share</span>
        </Link>
        
        <nav className={`navbar-links ${isMobileMenuOpen ? 'active' : ''}`}>
          <Link to="/" onClick={toggleMenu}>Home</Link>
          <Link to="/shop" onClick={toggleMenu}>Shop</Link>
          <Link to="/categories" onClick={toggleMenu}>Categories</Link>
          <Link to="/about" onClick={toggleMenu}>About</Link>
          <Link to="/contact" onClick={toggleMenu}>Contact</Link>
        </nav>
        
        <div className="navbar-icons">
          {isSearchOpen ? (
            <form onSubmit={handleSearchSubmit} className="search-form">
              <input 
                type="text" 
                placeholder="Search books..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="search-input"
              />
              <button type="button" className="icon-btn" onClick={() => setIsSearchOpen(false)}>
                <X size={20} />
              </button>
            </form>
          ) : (
            <>
              <button className="icon-btn" aria-label="Search" onClick={() => setIsSearchOpen(true)}>
                <Search size={20} />
              </button>
              
              <Link to="/wishlist" className="icon-btn" aria-label="Wishlist">
                <Heart size={20} />
                {wishlist.length > 0 && <span className="badge">{wishlist.length}</span>}
              </Link>
              
              <Link to="/cart" className="icon-btn" aria-label="Cart">
                <ShoppingCart size={20} />
                {cartCount > 0 && <span className="badge">{cartCount}</span>}
              </Link>
              
              {user ? (
                <div className="user-menu">
                  <span className="user-name"><User size={16} /> {user.username}</span>
                  <button className="icon-btn logout-btn" onClick={logout} aria-label="Logout" title="Logout">
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <button className="icon-btn login-btn" onClick={openLoginModal}>Login</button>
              )}
            </>
          )}
          
          <button className="mobile-menu-btn" onClick={toggleMenu}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
