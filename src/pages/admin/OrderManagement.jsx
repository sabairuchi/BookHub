import React, { useState, useEffect } from 'react';
import { Search, Eye, Filter, X } from 'lucide-react';
import { orderAPI } from '../../services/api';
import SEO from '../../components/SEO';
import './OrderManagement.css';

const OrderManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderAPI.getAllOrders();
      setOrders(data);
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleView = (order) => {
    setViewingOrder(order);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      await orderAPI.updateOrderStatus(viewingOrder.id, newStatus);
      // Refresh local list and modal details
      const updatedOrders = await orderAPI.getAllOrders();
      setOrders(updatedOrders);
      setViewingOrder({ ...viewingOrder, status: newStatus });
    } catch (err) {
      console.error("Error updating order status:", err);
      alert('Failed to update order status.');
    }
  };

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    order.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending': return 'badge-pending';
      case 'Processing': return 'badge-processing';
      case 'Shipped': return 'badge-shipped';
      case 'Delivered': return 'badge-delivered';
      case 'Cancelled': return 'badge-cancelled';
      default: return 'badge-pending';
    }
  };

  if (loading) {
    return <div className="loading-spinner" style={{ textAlign: 'center', padding: '100px 0' }}>Loading orders...</div>;
  }

  return (
    <div className="order-management-page">
      <SEO title="Manage Orders | Admin" />
      
      <div className="admin-page-header">
        <h1>Order Management</h1>
        <button className="btn btn-outline d-flex align-items-center gap-2">
          <Filter size={18} /> Filter Orders
        </button>
      </div>

      <div className="admin-card">
        <div className="table-controls">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by Order ID or Customer..." 
              value={searchTerm}
              onChange={handleSearch}
              className="admin-search-input"
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Customer Name</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td><strong>{order.id}</strong></td>
                  <td>{order.date}</td>
                  <td>{order.customer}</td>
                  <td>{order.items} items</td>
                  <td>${order.total.toFixed(2)}</td>
                  <td>
                    <span className={`admin-badge ${getStatusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <button className="action-btn view-btn" onClick={() => handleView(order)} title="View Details">
                      <Eye size={16} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredOrders.length === 0 && (
          <div className="no-results">
            <p>No orders found matching your search.</p>
          </div>
        )}
      </div>

      {/* View Order Modal */}
      {isModalOpen && viewingOrder && (
        <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Order Details: {viewingOrder.id}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="admin-modal-body" style={{ padding: '1.5rem' }}>
              <div className="order-details-grid">
                <div className="detail-group">
                  <strong>Customer Name:</strong>
                  <p>{viewingOrder.customer}</p>
                </div>
                <div className="detail-group">
                  <strong>Email Address:</strong>
                  <p>{viewingOrder.email}</p>
                </div>
                <div className="detail-group">
                  <strong>Order Date:</strong>
                  <p>{viewingOrder.date}</p>
                </div>
                <div className="detail-group">
                  <strong>Total Items:</strong>
                  <p>{viewingOrder.items} items</p>
                </div>
                <div className="detail-group">
                  <strong>Total Amount:</strong>
                  <p>${viewingOrder.total.toFixed(2)}</p>
                </div>
                <div className="detail-group">
                  <strong>Shipping Address:</strong>
                  <p>{viewingOrder.address || viewingOrder.shippingAddress}</p>
                </div>
                
                {viewingOrder.orderItems && (
                  <div className="detail-group full-width" style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                    <strong>Purchased Books:</strong>
                    <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.5rem' }}>
                      {viewingOrder.orderItems.map((item, idx) => (
                        <li key={idx} style={{ padding: '4px 0', borderBottom: '1px dashed #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{item.title} by {item.author} (x{item.qty})</span>
                          <strong>${(item.price * item.qty).toFixed(2)}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="detail-group full-width" style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                  <strong>Update Status:</strong>
                  <select 
                    value={viewingOrder.status} 
                    onChange={handleStatusChange}
                    className="admin-select"
                    style={{ display: 'block', width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ccc' }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
