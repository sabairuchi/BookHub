import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          margin: 0,
          padding: '20px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          backgroundColor: '#ffffff',
          color: '#000000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          <div style={{ fontSize: '72px', fontWeight: 700, lineHeight: 1, marginBottom: '16px', color: '#000000' }}>
            500
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 12px 0', color: '#000000' }}>
            Application Error
          </h1>
          <p style={{ fontSize: '16px', margin: '0 0 24px 0', color: '#000000' }}>
            The requested page could not be displayed due to an error.
          </p>
          <button 
            style={{
              backgroundColor: 'transparent',
              color: '#000000',
              border: '1px solid #000000',
              padding: '8px 20px',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

