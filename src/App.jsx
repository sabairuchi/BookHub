import React from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import NotFoundPage from './components/NotFoundPage';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <NotFoundPage />
    </ErrorBoundary>
  );
}

export default App;
