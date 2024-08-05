import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ForgotPassword.css'; 

const API_URL = process.env.REACT_APP_API_URL;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); 

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
        await axios.post(`${API_URL}/forgot-password`, { email });
        setMessage('Password reset instructions have been sent to your email.');
        setError(''); // Clear any previous errors
    } catch (error) {
        console.error('Error:', error.response?.data?.error || error.message);
        setError(error.response?.data?.error || 'Error sending reset instructions');
        setMessage(''); // Clear any previous success messages
    }
  };

  const handleBack = () => {
    navigate(-1); // Navigate back to the previous page
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <h2>Forgot Password</h2>
        <form onSubmit={handleForgotPassword} className="forgot-password-form">
          <label className="forgot-password-label">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="forgot-password-input"
              required
            />
          </label>
          <button type="submit" className="forgot-password-button">Send Reset Instructions</button>
          {message && <p className="forgot-password-message">{message}</p>}
          {error && <p className="forgot-password-error">{error}</p>}
          <button type="button" className="back-button" onClick={handleBack}>Back</button> {/* Back button */}
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
