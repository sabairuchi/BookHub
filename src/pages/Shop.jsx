import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import BookCard from '../components/BookCard';
import SEO from '../components/SEO';
import { 
  SlidersHorizontal, 
  RotateCcw, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  X,
  Search
} from 'lucide-react';
import './Shop.css';

const Shop = () => {
  const { books, categories, loading } = useShop();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCategory = searchParams.get('category') || '';
  const initialQuery = searchParams.get('query') || '';
  const initialFilter = searchParams.get('filter') || '';

  // Local filter states
  const [selectedCategory, setSelectedCategory] = useState(initialCategory ? initialCategory.toLowerCase() : '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [appliedMinPrice, setAppliedMinPrice] = useState('');
  const [appliedMaxPrice, setAppliedMaxPrice] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const itemsPerPage = 8;

  // Synchronize state when URL query parameters change
  useEffect(() => {
    const cat = searchParams.get('category') || '';
    setSelectedCategory(cat ? cat.toLowerCase() : '');
    setCurrentPage(1);
  }, [searchParams]);

  // Handle applying price filter
  const handleApplyPrice = (e) => {
    if (e) e.preventDefault();
    setAppliedMinPrice(minPrice);
    setAppliedMaxPrice(maxPrice);
    setCurrentPage(1);
  };

  // Quick price preset handler
  const handlePricePreset = (min, max) => {
    const minVal = min !== null ? String(min) : '';
    const maxVal = max !== null ? String(max) : '';
    setMinPrice(minVal);
    setMaxPrice(maxVal);
    setAppliedMinPrice(minVal);
    setAppliedMaxPrice(maxVal);
    setCurrentPage(1);
  };

  // Clear individual active filter
  const handleClearCategory = () => {
    setSelectedCategory('');
    if (searchParams.has('category')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('category');
      setSearchParams(nextParams);
    }
    setCurrentPage(1);
  };

  const handleClearPrice = () => {
    setMinPrice('');
    setMaxPrice('');
    setAppliedMinPrice('');
    setAppliedMaxPrice('');
    setCurrentPage(1);
  };

  const handleClearRating = () => {
    setMinRating(0);
    setCurrentPage(1);
  };

  const handleClearQuery = () => {
    if (searchParams.has('query')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('query');
      setSearchParams(nextParams);
    }
    setCurrentPage(1);
  };

  // Reset all filters
  const handleResetAll = () => {
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setAppliedMinPrice('');
    setAppliedMaxPrice('');
    setMinRating(0);
    setSortBy('default');
    setCurrentPage(1);
    setSearchParams({});
  };

  // Filter and sort books
  const filteredBooks = useMemo(() => {
    let result = [...books];

    // Search query filter
    if (initialQuery) {
      const q = initialQuery.toLowerCase().trim();
      result = result.filter(b => 
        (b.title && b.title.toLowerCase().includes(q)) || 
        (b.author && b.author.toLowerCase().includes(q)) ||
        (b.category && b.category.toLowerCase().includes(q))
      );
    }

    // Special preset filters from URL
    if (initialFilter === 'bestsellers') {
      result = result.filter(b => b.isBestSeller);
    } else if (initialFilter === 'new') {
      result = result.filter(b => b.isNewArrival);
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter(b => b.category && b.category.toLowerCase() === selectedCategory);
    }

    // Price range filters
    if (appliedMinPrice !== '') {
      result = result.filter(b => Number(b.price) >= Number(appliedMinPrice));
    }
    if (appliedMaxPrice !== '') {
      result = result.filter(b => Number(b.price) <= Number(appliedMaxPrice));
    }

    // Rating filter
    if (minRating > 0) {
      result = result.filter(b => Number(b.rating) >= minRating);
    }

    // Sorting
    if (sortBy === 'price-low') {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => Number(b.rating) - Number(a.rating));
    } else if (sortBy === 'title-asc') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [books, initialQuery, initialFilter, selectedCategory, appliedMinPrice, appliedMaxPrice, minRating, sortBy]);

  // Pagination logic
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const paginatedBooks = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredBooks.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredBooks, currentPage, itemsPerPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  // Check if any filters are currently active
  const hasActiveFilters = Boolean(
    selectedCategory || 
    appliedMinPrice !== '' || 
    appliedMaxPrice !== '' || 
    minRating > 0 || 
    initialQuery || 
    initialFilter
  );

  // Dynamic header title
  const getHeaderTitle = () => {
    if (initialQuery) return `Search Results for "${initialQuery}"`;
    if (initialFilter === 'bestsellers') return 'Bestselling Books';
    if (initialFilter === 'new') return 'New Arrivals';
    if (selectedCategory) {
      const match = categories.find(c => c.name.toLowerCase() === selectedCategory);
      return match ? `${match.name} Books` : `${selectedCategory.toUpperCase()} Books`;
    }
    return 'Explore All Books';
  };

  if (loading) {
    return (
      <div className="shop-loading-container">
        <div className="shop-spinner" />
        <p>Loading our book catalog...</p>
      </div>
    );
  }

  return (
    <div className="shop-page container">
      <SEO 
        title={getHeaderTitle()} 
        description="Browse our extensive collection of bestselling novels, technical guides, non-fiction, and educational books at Book Hub." 
      />

      {/* Header Banner */}
      <header className="shop-hero-header">
        <div className="shop-title-area">
          <h1 className="shop-title">{getHeaderTitle()}</h1>
          <p className="shop-subtitle">
            Discover thousands of handpicked titles across diverse genres with fast home delivery.
          </p>
        </div>

        {/* Toolbar & Controls Bar */}
        <div className="shop-controls-bar">
          <div className="shop-results-info">
            <span className="results-badge">
              {filteredBooks.length} {filteredBooks.length === 1 ? 'Book' : 'Books'}
            </span>
            <p className="results-count-text">
              {filteredBooks.length > 0 
                ? `Showing ${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, filteredBooks.length)} of ${filteredBooks.length}`
                : 'No matching books'}
            </p>
          </div>

          <div className="shop-actions-group">
            <button 
              type="button"
              className={`mobile-filter-btn ${showMobileFilters ? 'active' : ''}`}
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              aria-label="Toggle filters"
            >
              <SlidersHorizontal size={18} />
              <span>Filters {hasActiveFilters ? '(Active)' : ''}</span>
            </button>

            <div className="sort-dropdown-container">
              <label htmlFor="sort-select" className="sort-label">Sort by:</label>
              <select 
                id="sort-select" 
                className="sort-select"
                value={sortBy} 
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="default">Featured / Default</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="title-asc">Title: A to Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="active-filters-chips">
            <span className="chips-label">Active Filters:</span>

            {initialQuery && (
              <span className="filter-chip">
                <Search size={14} /> &ldquo;{initialQuery}&rdquo;
                <button type="button" onClick={handleClearQuery} aria-label="Remove search filter">
                  <X size={14} />
                </button>
              </span>
            )}

            {selectedCategory && (
              <span className="filter-chip">
                Category: {selectedCategory}
                <button type="button" onClick={handleClearCategory} aria-label="Remove category filter">
                  <X size={14} />
                </button>
              </span>
            )}

            {(appliedMinPrice !== '' || appliedMaxPrice !== '') && (
              <span className="filter-chip">
                Price: {appliedMinPrice ? `$${appliedMinPrice}` : '$0'} – {appliedMaxPrice ? `$${appliedMaxPrice}` : 'Any'}
                <button type="button" onClick={handleClearPrice} aria-label="Remove price filter">
                  <X size={14} />
                </button>
              </span>
            )}

            {minRating > 0 && (
              <span className="filter-chip">
                Rating: {minRating}★ & Up
                <button type="button" onClick={handleClearRating} aria-label="Remove rating filter">
                  <X size={14} />
                </button>
              </span>
            )}

            <button 
              type="button" 
              className="reset-all-chips-btn"
              onClick={handleResetAll}
            >
              <RotateCcw size={14} /> Clear All
            </button>
          </div>
        )}
      </header>

      {/* Main Content Layout */}
      <div className="shop-layout">
        {/* Sidebar Filters */}
        <aside className={`shop-sidebar-card ${showMobileFilters ? 'mobile-open' : ''}`}>
          <div className="sidebar-card-header">
            <div className="sidebar-header-title">
              <SlidersHorizontal size={18} className="sidebar-icon" />
              <h3>Filter Books</h3>
            </div>
            {hasActiveFilters && (
              <button 
                type="button" 
                className="sidebar-reset-link" 
                onClick={handleResetAll}
                title="Reset all filters"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="filter-section">
            <h4 className="filter-section-title">Category</h4>
            <div className="category-select-wrapper">
              <select 
                id="category-select"
                className="category-dropdown" 
                value={selectedCategory} 
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Categories ({books.length})</option>
                {categories.map(cat => {
                  const catCount = books.filter(b => b.category && b.category.toLowerCase() === cat.name.toLowerCase()).length;
                  return (
                    <option key={cat.id} value={cat.name.toLowerCase()}>
                      {cat.name} ({catCount})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Category Quick Badges */}
            <div className="category-badge-list">
              <button 
                type="button" 
                className={`category-pill ${selectedCategory === '' ? 'active' : ''}`}
                onClick={() => { setSelectedCategory(''); setCurrentPage(1); }}
              >
                All
              </button>
              {categories.slice(0, 6).map(cat => (
                <button
                  type="button"
                  key={cat.id}
                  className={`category-pill ${selectedCategory === cat.name.toLowerCase() ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory(selectedCategory === cat.name.toLowerCase() ? '' : cat.name.toLowerCase());
                    setCurrentPage(1);
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="filter-section">
            <h4 className="filter-section-title">Price Range</h4>
            <form onSubmit={handleApplyPrice} className="price-filter-form">
              <div className="price-inputs-row">
                <div className="price-input-group">
                  <span className="price-currency">$</span>
                  <input 
                    type="number" 
                    id="min-price-input" 
                    placeholder="Min" 
                    min="0"
                    step="0.01"
                    value={minPrice} 
                    onChange={e => setMinPrice(e.target.value)} 
                  />
                </div>
                <span className="price-separator">–</span>
                <div className="price-input-group">
                  <span className="price-currency">$</span>
                  <input 
                    type="number" 
                    id="max-price-input" 
                    placeholder="Max" 
                    min="0"
                    step="0.01"
                    value={maxPrice} 
                    onChange={e => setMaxPrice(e.target.value)} 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                id="apply-price-filter-btn" 
                className="btn btn-outline apply-price-btn"
              >
                Apply Price
              </button>
            </form>

            {/* Quick Price Shortcuts */}
            <div className="price-presets">
              <button 
                type="button" 
                className="preset-btn"
                onClick={() => handlePricePreset(0, 15)}
              >
                Under $15
              </button>
              <button 
                type="button" 
                className="preset-btn"
                onClick={() => handlePricePreset(15, 25)}
              >
                $15 – $25
              </button>
              <button 
                type="button" 
                className="preset-btn"
                onClick={() => handlePricePreset(25, null)}
              >
                $25 & Above
              </button>
            </div>
          </div>

          {/* Rating Filter */}
          <div className="filter-section">
            <h4 className="filter-section-title">Customer Rating</h4>
            <div className="rating-options-list">
              {[
                { label: '4 Stars & Up', value: 4 },
                { label: '3 Stars & Up', value: 3 },
                { label: 'Any Rating', value: 0 },
              ].map(option => (
                <label key={option.value} className="rating-option-label">
                  <input 
                    type="radio" 
                    name="rating-filter" 
                    checked={minRating === option.value} 
                    onChange={() => {
                      setMinRating(option.value);
                      setCurrentPage(1);
                    }} 
                  />
                  <span className="rating-custom-radio" />
                  <div className="rating-stars-preview">
                    {option.value > 0 ? (
                      <>
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={16} 
                            className={i < option.value ? 'star-filled' : 'star-empty'} 
                          />
                        ))}
                        <span className="rating-text-suffix">{option.label}</span>
                      </>
                    ) : (
                      <span className="rating-text-suffix">{option.label}</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Mobile Apply Button */}
          {showMobileFilters && (
            <button 
              type="button"
              className="btn btn-primary close-mobile-filters-btn"
              onClick={() => setShowMobileFilters(false)}
            >
              Show {filteredBooks.length} Results
            </button>
          )}
        </aside>

        {/* Main Books Grid Area */}
        <main className="shop-books-area">
          {filteredBooks.length === 0 ? (
            <div className="shop-empty-state">
              <div className="empty-icon-circle">
                <BookOpen size={48} className="empty-icon" />
              </div>
              <h2 className="empty-title">No books match your filters</h2>
              <p className="empty-desc">
                We couldn&apos;t find any books matching your exact search or filter options.
                Try broadening your criteria or resetting your selections.
              </p>
              <button 
                type="button"
                className="btn btn-primary empty-reset-btn"
                onClick={handleResetAll}
              >
                <RotateCcw size={16} /> Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="books-grid">
                {paginatedBooks.map(book => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>

              {/* Modern Pagination Bar */}
              {totalPages > 1 && (
                <div className="shop-pagination-container">
                  <div className="pagination">
                    <button 
                      type="button"
                      className="pagination-arrow-btn"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      aria-label="Previous Page"
                    >
                      <ChevronLeft size={18} />
                      <span className="pagination-arrow-text">Prev</span>
                    </button>

                    <div className="page-numbers-row">
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button 
                            type="button"
                            key={pageNum} 
                            className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button 
                      type="button"
                      className="pagination-arrow-btn"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      aria-label="Next Page"
                    >
                      <span className="pagination-arrow-text">Next</span>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  <div className="pagination-summary">
                    Page {currentPage} of {totalPages}
                  </div>
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
