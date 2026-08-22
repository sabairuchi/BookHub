import React from 'react';
import { useShop } from '../context/ShopContext';
import { Heart } from 'lucide-react';
import BookCard from '../components/BookCard';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const Wishlist = () => {
  const { wishlist } = useShop();

  if (wishlist.length === 0) {
    return (
      <div className="cart-empty container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <SEO title="My Wishlist" description="View your saved books on Book Hub." />
        <Heart size={64} className="empty-icon" style={{ color: 'var(--secondary-color)', marginBottom: '20px' }} />
        <h2>Your wishlist is empty</h2>
        <p>Save books you're interested in for later.</p>
        <Link to="/shop" className="btn btn-primary">Explore Books</Link>
      </div>
    );
  }

  return (
    <div className="wishlist-page container" style={{ padding: '40px 20px' }}>
      <SEO title="My Wishlist" description="View your saved books on Book Hub." />
      <h1 style={{ marginBottom: '30px', color: 'var(--primary-color)' }}>My Wishlist</h1>
      <div className="books-grid">
        {wishlist.map(book => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
