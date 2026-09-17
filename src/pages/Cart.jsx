import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import SEO from '../components/SEO';
import SafeImage from '../components/SafeImage';
import './Cart.css';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useShop();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (cart.length > 0) {
      navigate('/checkout');
    } else {
      alert("Your cart is empty. Please add items before proceeding to checkout.");
    }
  };

  if (cart.length === 0) {
    return (
      <div className="cart-page container empty-cart">
        <SEO title="Your Cart" description="View items in your Book Hub shopping cart." />
        <div className="empty-cart-content">
          <ShoppingBag size={64} color="#A0AEC0" />
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any books to your cart yet.</p>
          <Link to="/shop" className="btn btn-primary">Explore Books</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page container">
      <SEO title="Your Cart" description="View items in your Book Hub shopping cart." />
      <h1>Shopping Cart</h1>
      <div className="cart-content">
        <div className="cart-items">
          {cart.map(item => (
            <div key={item.id} className="cart-item">
              <SafeImage src={item.image} alt={item.title} className="cart-item-image" />
              <div className="cart-item-details">
                <h3>{item.title}</h3>
                <p className="cart-item-author">{item.author}</p>
                <div className="cart-item-actions">
                  <div className="quantity-controls">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                    <Trash2 size={18} /> Remove
                  </button>
                </div>
              </div>
              <div className="cart-item-price">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
          <div className="cart-actions-bottom">
            <button className="btn btn-outline" onClick={clearCart}>Clear Cart</button>
          </div>
        </div>
        
        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <button className="btn btn-primary checkout-btn" onClick={handleCheckout}>
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
