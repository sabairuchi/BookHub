import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import { Heart, ShoppingCart, Star, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';
import BookCard from '../components/BookCard';
import './BookDetail.css';

const BookDetail = () => {
  const { id } = useParams();
  const { books, loading, addToCart, toggleWishlist, isInWishlist } = useShop();
  
  if (loading) {
    return <div className="loading-spinner" style={{ textAlign: 'center', padding: '100px 0' }}>Loading...</div>;
  }

  const book = books.find(b => b.id === parseInt(id));
  
  if (!book) {
    return (
      <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <h2>Book not found</h2>
        <Link to="/shop" className="btn btn-primary" style={{ marginTop: '20px' }}>Back to Shop</Link>
      </div>
    );
  }

  const inWishlist = isInWishlist(book.id);
  const relatedBooks = books.filter(b => b.category === book.category && b.id !== book.id).slice(0, 4);

  return (
    <div className="book-detail-page container">
      <SEO title={book.title} description={book.description} />
      
      <Link to="/shop" className="back-link">
        <ArrowLeft size={16} /> Back to Shop
      </Link>

      <div className="book-detail-content">
        <div className="book-detail-image-wrapper">
          <img src={book.image} alt={book.title} className="book-detail-image" />
          {book.isPublishedByUs && (
            <div className="published-badge-large">Published by Book Hub</div>
          )}
        </div>
        
        <div className="book-detail-info">
          <span className="book-category-label">{book.category}</span>
          <h1 className="book-title-large">{book.title}</h1>
          <p className="book-author-large">by <strong>{book.author}</strong></p>
          
          <div className="book-meta-large">
            <div className="book-rating-large">
              <Star size={18} fill="#F4A261" color="#F4A261" />
              <span>{book.rating}</span>
            </div>
          </div>
          
          <div className="book-price-large">${book.price.toFixed(2)}</div>
          
          <p className="book-description-large">{book.description}</p>
          
          <div className="book-actions-large">
            <button className="btn btn-primary add-to-cart-btn-large" onClick={() => addToCart(book)}>
              <ShoppingCart size={20} /> Add to Cart
            </button>
            <button 
              className={`btn btn-outline wishlist-btn-large ${inWishlist ? 'active' : ''}`}
              onClick={() => toggleWishlist(book)}
            >
              <Heart size={20} fill={inWishlist ? "currentColor" : "none"} /> 
              {inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </button>
          </div>
        </div>
      </div>

      {relatedBooks.length > 0 && (
        <div className="related-books-section">
          <h2>Related Books</h2>
          <div className="books-grid">
            {relatedBooks.map(b => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookDetail;
