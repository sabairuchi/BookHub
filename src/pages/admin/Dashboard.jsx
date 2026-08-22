import React, { useState, useEffect } from 'react';
import { Book, Users, ShoppingBag, DollarSign } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { orderAPI, customerAPI } from '../../services/api';
import SEO from '../../components/SEO';
import './Dashboard.css';

const Dashboard = () => {
  const { books, loading: booksLoading } = useShop();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoadingData(true);
        const [ordersData, customersData] = await Promise.all([
          orderAPI.getAllOrders(),
          customerAPI.getAllCustomers()
        ]);
        setOrders(ordersData);
        setCustomers(customersData);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (booksLoading || loadingData) {
    return <div className="loading-spinner" style={{ textAlign: 'center', padding: '100px 0' }}>Loading Dashboard Stats...</div>;
  }

  // Calculate statistics from DB
  const totalBooks = books.length;
  const totalOrders = orders.length;
  const totalCustomers = customers.length;
  const totalRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const stats = [
    { title: 'Total Books', value: totalBooks.toLocaleString(), icon: <Book size={24} />, color: '#3b82f6' },
    { title: 'Total Orders', value: totalOrders.toLocaleString(), icon: <ShoppingBag size={24} />, color: '#10b981' },
    { title: 'Total Customers', value: totalCustomers.toLocaleString(), icon: <Users size={24} />, color: '#f59e0b' },
    { title: 'Total Revenue', value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: <DollarSign size={24} />, color: '#8b5cf6' },
  ];

  // Recent Orders (last 5)
  const recentOrders = orders.slice(0, 5);

  // Low Stock Alerts (stock <= 3)
  const lowStockBooks = books.filter(b => b.stock <= 3).slice(0, 5);

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

  return (
    <div className="dashboard-page">
      <SEO title="Admin Dashboard | Book Hub" />
      
      <div className="admin-page-header">
        <h1>Dashboard Overview</h1>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div className="stat-card admin-card" key={index}>
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-content-grid">
        <div className="admin-card recent-orders">
          <h3>Recent Orders</h3>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.customer}</td>
                    <td>{order.date}</td>
                    <td>${order.total.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center" style={{ padding: '20px' }}>No orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-card low-stock">
          <h3>Low Stock Alerts</h3>
          <ul className="alert-list">
            {lowStockBooks.map((book) => (
              <li key={book.id}>
                <div className="alert-info">
                  <strong>{book.title}</strong>
                  <span>{book.author}</span>
                </div>
                <span className={`alert-badge ${book.stock === 0 ? 'danger' : 'warning'}`}>
                  {book.stock === 0 ? 'Out of Stock' : `${book.stock} Left`}
                </span>
              </li>
            ))}
            {lowStockBooks.length === 0 && (
              <li className="text-center" style={{ padding: '20px', color: '#666' }}>All books are well stocked.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
