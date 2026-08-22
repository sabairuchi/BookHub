import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import './BookCard.css';

const BookCard = ({ book }) => {
  const { addToCart, toggleWishlist, isInWishlist } = useShop();
  const inWishlist = isInWishlist(book.id);

  return (
    <div className="book-card">
      <div className="book-cover-container">
        <Link to={`/book/${book.id}`}>
          <img src={book.image} alt={book.title} className="book-cover" />
        </Link>
        {book.isPublishedByUs && (
          <div className="published-badge">Published by Book Hub</div>
        )}
        <div className="book-actions">
          <button 
            className="action-btn wishlist-btn" 
            aria-label="Add to Wishlist"
            onClick={() => toggleWishlist(book)}
          >
            <Heart size={20} fill={inWishlist ? "#e74c3c" : "none"} color={inWishlist ? "#e74c3c" : "currentColor"} />
          </button>
        </div>
      </div>
      <div className="book-details">
        <span className="book-category">{book.category}</span>
        <Link to={`/book/${book.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 className="book-title">{book.title}</h3>
        </Link>
        <p className="book-author">{book.author}</p>
        <div className="book-meta">
          <div className="book-rating">
            <Star size={16} fill="#F4A261" color="#F4A261" />
            <span>{book.rating}</span>
          </div>
          <span className="book-price">${book.price.toFixed(2)}</span>
        </div>
        <button className="add-to-cart-btn" onClick={() => addToCart(book)}>
          <ShoppingCart size={18} />
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default BookCard;
