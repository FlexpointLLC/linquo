import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CustomerChat from './components/CustomerChat';
import AgentDashboard from './components/AgentDashboard';
import AgentLogin from './components/AgentLogin';
import Home from './components/Home';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chat" element={<CustomerChat />} />
            <Route path="/agent/login" element={<AgentLogin />} />
            <Route path="/agent/dashboard" element={<AgentDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
