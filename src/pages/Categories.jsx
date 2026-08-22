import React from 'react';
import { useShop } from '../context/ShopContext';
import CategoryCard from '../components/CategoryCard';
import SEO from '../components/SEO';
import './Categories.css';

const Categories = () => {
  const { categories, loading } = useShop();

  if (loading) {
    return <div className="loading-spinner" style={{ textAlign: 'center', padding: '100px 0' }}>Loading...</div>;
  }
  return (
    <div className="categories-page container">
      <SEO 
        title="Book Categories" 
        description="Explore books by category. Find your favorite genres from fantasy and sci-fi to biographies." 
      />
      <div className="categories-header">
        <h1>All Categories</h1>
        <p>Explore our extensive collection of books across all genres.</p>
      </div>

      <div className="categories-grid-large">
        {categories.map(category => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
};

export default Categories;
