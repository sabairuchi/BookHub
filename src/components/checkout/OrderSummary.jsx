import React from 'react';
import { useNavigate } from 'react-router-dom';

const OrderSummary = ({ 
  cart, 
  cartTotal, 
  shippingCost, 
  discount, 
  couponCode, 
  setCouponCode, 
  handleApplyCoupon, 
  isSubmitting 
}) => {
  const navigate = useNavigate();
  const grandTotal = cartTotal + shippingCost - discount;

  return (
    <div className="checkout-summary-container">
      <h2>Order Summary</h2>
      
      <div className="summary-items">
        {cart.map(item => (
          <div key={item.id} className="summary-item">
            <img src={item.image} alt={item.title} className="summary-item-img" />
            <div className="summary-item-details">
              <h4>{item.title}</h4>
              <p>{item.author}</p>
              <p>Qty: {item.quantity}</p>
            </div>
            <div className="summary-item-price">
              ${(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <div className="coupon-section">
        <input 
          type="text" 
          placeholder="Coupon Code" 
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
        />
        <button 
          type="button" 
          className="btn btn-outline" 
          onClick={handleApplyCoupon}
        >
          Apply
        </button>
      </div>

      <div className="summary-totals">
        <div className="summary-row">
          <span>Subtotal</span>
          <span>${cartTotal.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Shipping</span>
          <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
        </div>
        {discount > 0 && (
          <div className="summary-row" style={{ color: '#2A9D8F' }}>
            <span>Discount</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}
        <div className="summary-row total">
          <span>Grand Total</span>
          <span>${grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="checkout-actions">
        <button 
          type="submit" 
          className={`btn btn-primary btn-block ${isSubmitting ? 'btn-disabled' : ''}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Place Order'}
        </button>
        <button 
          type="button" 
          className="btn btn-outline btn-block"
          onClick={() => navigate('/cart')}
        >
          Back to Cart
        </button>
      </div>
    </div>
  );
};

export default OrderSummary;
