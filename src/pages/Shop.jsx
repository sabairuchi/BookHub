import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import BookCard from '../components/BookCard';
import SEO from '../components/SEO';
import './Shop.css';

const Shop = () => {
  const { books, categories, loading } = useShop();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialQuery = searchParams.get('query') || '';
  const initialFilter = searchParams.get('filter') || '';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory ? initialCategory.toLowerCase() : '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const allBooks = books;

  const filteredBooks = useMemo(() => {
    let result = allBooks;

    if (initialQuery) {
      const q = initialQuery.toLowerCase();
      result = result.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
    }
    
    if (initialFilter === 'bestsellers') {
      result = result.filter(b => b.isBestSeller);
    }

    if (selectedCategory !== '') {
      result = result.filter(b => b.category.toLowerCase() === selectedCategory);
    }

    if (minPrice !== '') {
      result = result.filter(b => b.price >= Number(minPrice));
    }
    
    if (maxPrice !== '') {
      result = result.filter(b => b.price <= Number(maxPrice));
    }

    if (minRating > 0) {
      result = result.filter(b => b.rating >= minRating);
    }

    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [allBooks, selectedCategory, minPrice, maxPrice, minRating, sortBy, initialQuery]);

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const paginatedBooks = filteredBooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return <div className="loading-spinner" style={{ textAlign: 'center', padding: '100px 0' }}>Loading...</div>;
  }

  return (
    <div className="shop-page container">
      <SEO 
        title="Shop Books" 
        description="Browse our extensive collection of fiction, non-fiction, business, and technology books." 
      />
      <div className="shop-header">
        <h1>{initialQuery ? `Search Results for "${initialQuery}"` : initialFilter === 'bestsellers' ? 'Best Sellers' : 'All Books'}</h1>
        <div className="shop-controls">
          <p>Showing {filteredBooks.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredBooks.length)} of {filteredBooks.length} results</p>
          <div className="sort-dropdown">
            <label htmlFor="sort-select">Sort by:</label>
            <select id="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="default">Default</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Best Ratings</option>
            </select>
          </div>
        </div>
      </div>

      <div className="shop-content">
        <aside className="shop-sidebar">
          <div className="filter-group">
            <h3>Category</h3>
            <select 
              id="category-select"
              className="category-dropdown" 
              value={selectedCategory} 
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name.toLowerCase()}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <h3>Price Range</h3>
            <div className="price-inputs">
              <input type="number" id="min-price-input" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
              <span>-</span>
              <input type="number" id="max-price-input" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
            </div>
            <button id="apply-price-filter-btn" className="btn btn-outline filter-btn" onClick={() => setCurrentPage(1)}>Apply</button>
          </div>

          <div className="filter-group">
            <h3>Rating</h3>
            <ul className="filter-list">
              <li>
                <label>
                  <input type="radio" name="rating" checked={minRating === 4} onChange={() => setMinRating(4)} /> 4 Stars & Up
                </label>
              </li>
              <li>
                <label>
                  <input type="radio" name="rating" checked={minRating === 3} onChange={() => setMinRating(3)} /> 3 Stars & Up
                </label>
              </li>
              <li>
                <label>
                  <input type="radio" name="rating" checked={minRating === 0} onChange={() => setMinRating(0)} /> Any Rating
                </label>
              </li>
            </ul>
          </div>
        </aside>

        <main className="shop-main">
          {filteredBooks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <h2>No books found.</h2>
              <p>Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <div className="books-grid">
                {paginatedBooks.map(book => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i} 
                      className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Shop;
