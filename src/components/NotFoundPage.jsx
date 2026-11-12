import React from 'react';

const NotFoundPage = () => {
  return (
    <div style={{
      margin: 0,
      padding: '24px',
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      color: '#000000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      boxSizing: 'border-box'
    }}>
      <div style={{
        fontSize: '80px',
        fontWeight: 700,
        lineHeight: 1,
        color: '#000000',
        marginBottom: '16px',
        letterSpacing: '-0.03em'
      }}>
        404
      </div>
      <h1 style={{
        fontSize: '26px',
        fontWeight: 700,
        color: '#000000',
        margin: '0 0 12px 0'
      }}>
        Not Found
      </h1>
      <p style={{
        fontSize: '16px',
        color: '#666666',
        margin: '0 0 28px 0',
        lineHeight: 1.5
      }}>
        The requested page could not be found.
      </p>
      <button 
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          backgroundColor: '#ffffff',
          color: '#000000',
          border: '1px solid #000000',
          borderRadius: '4px',
          padding: '8px 18px',
          fontSize: '14px',
          fontWeight: 600,
          fontFamily: 'inherit',
          cursor: 'pointer',
          textDecoration: 'none'
        }}
        onClick={() => window.location.reload()}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="15" 
          height="15" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
          <path d="M16 21h5v-5"/>
        </svg>
        Reload
      </button>
    </div>
  );
};

export default NotFoundPage;

