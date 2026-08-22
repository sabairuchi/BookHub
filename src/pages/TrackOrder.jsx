import React, { useState } from 'react';
import { Package, Truck, CheckCircle, Search } from 'lucide-react';
import { orderAPI } from '../services/api';
import SEO from '../components/SEO';
import './TrackOrder.css';

const TrackOrder = () => {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [orderFound, setOrderFound] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderId.trim() || !email.trim()) {
      setError('Please enter both Order ID and Email Address.');
      return;
    }
    
    setError('');
    setIsTracking(true);
    setOrderFound(false);
    setTrackedOrder(null);
    
    try {
      const order = await orderAPI.trackOrder(orderId.trim(), email.trim());
      setTrackedOrder(order);
      setOrderFound(true);
    } catch (err) {
      console.error("Tracking error:", err);
      setOrderFound(false);
      setError(err.response?.data?.message || 'No order found with the provided details. Please check and try again.');
    } finally {
      setIsTracking(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Pending': return 'pending';
      case 'Processing': return 'processing';
      case 'Shipped': return 'shipped';
      case 'Delivered': return 'delivered';
      case 'Cancelled': return 'cancelled';
      default: return 'pending';
    }
  };

  return (
    <div className="track-order-page container">
      <SEO title="Track Order" description="Track the status and shipping progress of your Book Hub order." />
      
      <div className="track-header">
        <h1>Track Your Order</h1>
        <p>Enter your Order ID and Email Address to see real-time shipping updates.</p>
      </div>

      <div className="track-form-container">
        <form onSubmit={handleTrack} className="track-form">
          <div className="form-group">
            <label htmlFor="orderId">Order ID</label>
            <input 
              type="text" 
              id="orderId" 
              placeholder="e.g. ORD-123456" 
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              placeholder="e.g. name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary track-btn" disabled={isTracking}>
            {isTracking ? 'Tracking...' : (
              <>Track Order <Search size={18} /></>
            )}
          </button>
        </form>
        {error && <p className="error-msg text-center mt-3" style={{ color: '#E76F51' }}>{error}</p>}
      </div>

      {orderFound && trackedOrder && (
        <div className="tracking-results">
            <div className="order-summary-header">
              <h3>Order #{trackedOrder.id.toUpperCase()}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <span className={`status-badge ${getStatusClass(trackedOrder.status)}`}>
                  {trackedOrder.status === 'Pending' ? 'Received' : trackedOrder.status}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  Payment: <strong style={{ color: trackedOrder.paymentStatus === 'Paid' ? '#2A9D8F' : '#E76F51' }}>{trackedOrder.paymentStatus || 'Pending'}</strong>
                </span>
              </div>
            </div>
          
          <div className="estimated-delivery">
            <p>Estimated Delivery</p>
            <h4>
              {trackedOrder.status === 'Delivered' 
                ? 'Delivered' 
                : new Date(new Date(trackedOrder.date).getTime() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
              }
            </h4>
          </div>

          <div className="timeline-container">
            <div className={`timeline-step ${['Pending', 'Processing', 'Shipped', 'Delivered'].includes(trackedOrder.status) ? 'completed' : 'pending'}`}>
              <div className="step-icon"><CheckCircle size={20} /></div>
              <div className="step-content">
                <h4>Order Placed</h4>
                <p>{trackedOrder.date}</p>
              </div>
            </div>
            <div className={`timeline-step ${['Processing', 'Shipped', 'Delivered'].includes(trackedOrder.status) ? 'completed' : trackedOrder.status === 'Pending' ? 'active' : 'pending'}`}>
              <div className="step-icon"><Package size={20} /></div>
              <div className="step-content">
                <h4>Order Processed</h4>
                <p>{['Processing', 'Shipped', 'Delivered'].includes(trackedOrder.status) ? 'Completed' : 'In Queue'}</p>
              </div>
            </div>
            <div className={`timeline-step ${['Shipped', 'Delivered'].includes(trackedOrder.status) ? 'completed' : trackedOrder.status === 'Processing' ? 'active' : 'pending'}`}>
              <div className="step-icon"><Truck size={20} /></div>
              <div className="step-content">
                <h4>Shipped</h4>
                <p>{['Shipped', 'Delivered'].includes(trackedOrder.status) ? 'In Transit' : 'Pending'}</p>
              </div>
            </div>
            <div className={`timeline-step ${trackedOrder.status === 'Delivered' ? 'completed' : trackedOrder.status === 'Shipped' ? 'active' : 'pending'}`}>
              <div className="step-icon"><CheckCircle size={20} /></div>
              <div className="step-content">
                <h4>Out for Delivery</h4>
                <p>{trackedOrder.status === 'Delivered' ? 'Completed' : 'Pending'}</p>
              </div>
            </div>
            <div className={`timeline-step ${trackedOrder.status === 'Delivered' ? 'completed' : 'pending'}`}>
              <div className="step-icon"><CheckCircle size={20} /></div>
              <div className="step-content">
                <h4>Delivered</h4>
                <p>{trackedOrder.status === 'Delivered' ? 'Completed' : 'Pending'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackOrder;
