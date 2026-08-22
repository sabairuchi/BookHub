import React, { useState, useEffect } from 'react';
import { useShop } from '../context/ShopContext';
import { orderAPI } from '../services/api';
import { Package, ExternalLink } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import SEO from '../components/SEO';
import './OrderHistory.css';

const OrderHistory = () => {
  const { user } = useShop();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await orderAPI.getAllOrders();
        setOrders(data);
      } catch (err) {
        console.error("Error loading order history:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchOrders();
    }
  }, [user]);

  // If user is not logged in, redirect to home
  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return <div className="loading-spinner" style={{ textAlign: 'center', padding: '100px 0' }}>Loading your orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="order-history-page container text-center" style={{ padding: '100px 0' }}>
        <SEO title="Order History" />
        <h1>My Orders</h1>
        <p style={{ marginTop: '15px' }}>You haven't placed any orders yet.</p>
        <Link to="/shop" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="order-history-page container">
      <SEO title="Order History" description="View your past orders and their status at Book Hub." />
      
      <div className="history-header">
        <h1>My Orders</h1>
        <p>Welcome back, {user.username}! Here is your recent order history.</p>
      </div>

      <div className="orders-list">
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-card-header">
              <div className="order-meta">
                <span className="order-id">Order #{order.id}</span>
                <span className="order-date">Placed on {order.date}</span>
              </div>
              <div className="order-status-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <span className={`status-badge ${order.status.toLowerCase()}`}>{order.status}</span>
                <span className="payment-status" style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                  Payment: <strong style={{ color: order.paymentStatus === 'Paid' ? '#2A9D8F' : '#E76F51' }}>{order.paymentStatus || 'Pending'}</strong>
                </span>
              </div>
            </div>
            
            <div className="order-items">
              {order.items && order.items.map((item, index) => (
                <div key={index} className="order-item-row">
                  <div className="item-info">
                    <h4>{item.title}</h4>
                    <p>{item.author}</p>
                  </div>
                  <div className="item-qty">Qty: {item.qty}</div>
                  <div className="item-price">${(item.price * item.qty).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="order-card-footer">
              <div className="order-total">
                Total: <span>${order.total.toFixed(2)}</span>
              </div>
              <div className="order-actions">
                <Link to={`/track-order?orderId=${order.id}`} className="btn btn-outline btn-sm">Track Order</Link>
                <Link to="/shop" className="btn btn-primary btn-sm">Buy Again</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;
