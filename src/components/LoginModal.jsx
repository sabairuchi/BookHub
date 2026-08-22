import React, { useState } from 'react';
import { useShop } from '../context/ShopContext';
import { authAPI } from '../services/api';
import { X } from 'lucide-react';
import './LoginModal.css';

const LoginModal = () => {
  const { isLoginModalOpen, closeLoginModal, login } = useShop();
  
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        // Register User
        if (!name.trim() || !email.trim() || !password.trim()) {
          setError('All fields are required.');
          setLoading(false);
          return;
        }
        const registerData = await authAPI.register(name.trim(), email.trim(), password.trim());
        // Auto-login after successful registration
        await login(registerData);
        resetForm();
      } else {
        // Login User
        if (!email.trim() || !password.trim()) {
          setError('Email and password are required.');
          setLoading(false);
          return;
        }
        const loginData = await authAPI.login(email.trim(), password.trim());
        await login(loginData);
        resetForm();
      }
    } catch (err) {
      console.error("Auth error:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Something went wrong. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError('');
    setIsSignup(false);
  };

  const handleClose = () => {
    resetForm();
    closeLoginModal();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={handleClose} aria-label="Close modal">
          <X size={24} />
        </button>
        <h2>{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
        <p>
          {isSignup 
            ? 'Join Book Hub to save your cart and wishlist across devices.' 
            : 'Log in to access your cart and wishlist across devices.'
          }
        </p>
        
        {error && <div className="error-message-box" style={{ color: '#E76F51', backgroundColor: '#FDF0ED', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem', border: '1px solid #F4A261' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          {isSignup && (
            <div className="form-group">
              <label htmlFor="signup-name">Full Name</label>
              <input 
                type="text" 
                id="signup-name" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                autoFocus
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <input 
              type="email" 
              id="login-email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@example.com"
              required
              autoFocus={!isSignup}
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input 
              type="password" 
              id="login-password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary login-submit-btn" disabled={loading}>
            {loading ? 'Processing...' : (isSignup ? 'Sign Up' : 'Log In')}
          </button>
        </form>
        <div className="modal-footer">
          {isSignup ? (
            <p>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setIsSignup(false); setError(''); }}>Log in</a></p>
          ) : (
            <p>Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); setIsSignup(true); setError(''); }}>Sign up</a></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
