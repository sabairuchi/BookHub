import React, { useState, useEffect } from 'react';
import { Search, Mail, Ban, CheckCircle } from 'lucide-react';
import { customerAPI } from '../../services/api';
import SEO from '../../components/SEO';
import './CustomerManagement.css';

const CustomerManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerAPI.getAllCustomers();
      setCustomers(data);
    } catch (err) {
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Disabled' : 'Active';
    const actionWord = newStatus === 'Disabled' ? 'suspend/disable' : 'activate';
    
    if (window.confirm(`Are you sure you want to ${actionWord} this customer account?`)) {
      try {
        await customerAPI.updateCustomerStatus(id, newStatus);
        // Refresh list
        const updatedCustomers = await customerAPI.getAllCustomers();
        setCustomers(updatedCustomers);
      } catch (err) {
        console.error("Error updating customer status:", err);
        alert('Failed to update customer account status.');
      }
    }
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading-spinner" style={{ textAlign: 'center', padding: '100px 0' }}>Loading customers list...</div>;
  }

  return (
    <div className="customer-management-page">
      <SEO title="Manage Customers | Admin" />
      
      <div className="admin-page-header">
        <h1>Customer Management</h1>
      </div>

      <div className="admin-card">
        <div className="table-controls">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
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
                <th>Customer</th>
                <th>Contact</th>
                <th>Joined Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className={customer.status === 'Disabled' ? 'disabled-row' : ''}>
                  <td>
                    <div className="customer-meta">
                      <div className="customer-avatar">{customer.name.charAt(0)}</div>
                      <strong>{customer.name}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="contact-info">
                      <Mail size={14} />
                      <span>{customer.email}</span>
                    </div>
                  </td>
                  <td>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</td>
                  <td>
                    <span className={`badge ${customer.status === 'Active' ? 'badge-delivered' : 'badge-cancelled'}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className={`action-btn status-btn ${customer.status === 'Active' ? 'suspend' : 'activate'}`}
                      onClick={() => toggleStatus(customer.id, customer.status)}
                      title={customer.status === 'Active' ? 'Disable Account' : 'Activate Account'}
                    >
                      {customer.status === 'Active' ? <Ban size={16} /> : <CheckCircle size={16} />}
                      {customer.status === 'Active' ? 'Disable' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCustomers.length === 0 && (
          <div className="no-results">
            <p>No customers found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerManagement;
