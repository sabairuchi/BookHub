import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './CategoryCard.css';

const CategoryCard = ({ category }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <Link to={`/shop?category=${encodeURIComponent(category.name.toLowerCase())}`} className="category-card">
      <div className="category-image-container">
        {!imageError && category.image && (
          <img 
            src={category.image} 
            alt={category.name} 
            className="category-image" 
            onError={() => setImageError(true)}
          />
        )}
        <div className="category-overlay"></div>
      </div>
      <div className="category-content">
        <h3 className="category-title">{category.name}</h3>
      </div>
    </Link>
  );
};

export default CategoryCard;
