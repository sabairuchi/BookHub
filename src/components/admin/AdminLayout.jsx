import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Tags, 
  ShoppingCart, 
  Users, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import './AdminLayout.css';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout, loading } = useShop();
  const navigate = useNavigate();

  // Protect Admin Route: check both context and localStorage for immediate check
  useEffect(() => {
    if (!loading) {
      const userInfoStr = localStorage.getItem('userInfo');
      let isAdmin = false;
      if (userInfoStr) {
        try {
          const { isAdmin: adminFlag } = JSON.parse(userInfoStr);
          isAdmin = !!adminFlag;
        } catch (e) {
          isAdmin = false;
        }
      }
      if (!user || !isAdmin) {
        navigate('/', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  if (loading) {
    return <div className="loading-spinner" style={{ textAlign: 'center', padding: '100px 0' }}>Loading Admin Panel...</div>;
  }

  // Double check admin flag before render
  const userInfoStr = localStorage.getItem('userInfo');
  let isAdmin = false;
  if (userInfoStr) {
    try {
      const { isAdmin: adminFlag } = JSON.parse(userInfoStr);
      isAdmin = !!adminFlag;
    } catch (e) {
      isAdmin = false;
    }
  }

  if (!user || !isAdmin) {
    return null; // Will redirect in useEffect
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} />, exact: true },
    { name: 'Books', path: '/admin/books', icon: <BookOpen size={20} /> },
    { name: 'Categories', path: '/admin/categories', icon: <Tags size={20} /> },
    { name: 'Orders', path: '/admin/orders', icon: <ShoppingCart size={20} /> },
    { name: 'Customers', path: '/admin/customers', icon: <Users size={20} /> },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>Book Hub <span>Admin</span></h2>
          <button className="close-btn d-lg-none" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.name}>
                <NavLink 
                  to={item.path} 
                  end={item.exact}
                  className={({ isActive }) => isActive ? 'active' : ''}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <button className="menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu size={24} />
          </button>
          
          <div className="admin-profile">
            <div className="avatar">{user?.username?.charAt(0) || 'A'}</div>
            <div className="admin-info">
              <strong>{user?.username || 'Admin User'}</strong>
              <span>Administrator</span>
            </div>
          </div>
        </header>

        <div className="admin-content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
