import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, Package, Calendar } from 'lucide-react';
import SEO from '../components/SEO';
import './OrderSuccess.css';

const OrderSuccess = () => {
  const location = useLocation();
  const order = location.state?.order;
  const orderId = order ? order.id.replace('ORD-', '') : Math.random().toString(36).substr(2, 9).toUpperCase();
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 4);
  
  const formattedDate = deliveryDate.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="order-success-page container">
      <SEO title="Order Successful" description="Thank you for your purchase!" />
      
      <div className="success-content">
        <div className="success-icon-wrapper">
          <CheckCircle size={80} className="success-icon" />
        </div>
        
        <h1 className="success-title">Thank You for Your Order!</h1>
        <p className="success-message">
          Your order has been placed successfully. We'll send you an email confirmation with your order details and tracking information shortly.
        </p>

        <div className="order-details-card">
          <div className="detail-item">
            <span className="detail-label">Order ID</span>
            <span className="detail-value">#{orderId}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label"><Calendar size={18} /> Estimated Delivery</span>
            <span className="detail-value">{formattedDate}</span>
          </div>
        </div>

        <div className="success-actions">
          <Link to="/shop" className="btn btn-primary">
            <Package size={18} style={{marginRight: '8px'}} />
            Continue Shopping
          </Link>
          <Link to="/order-history" className="btn btn-outline">
            View Orders
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
