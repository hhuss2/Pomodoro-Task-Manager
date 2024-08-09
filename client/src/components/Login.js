import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css'; 

const API_URL = process.env.REACT_APP_API_URL;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      localStorage.setItem('token', response.data.token);

      navigate('/user-home');
    } catch (error) {
      setError('Error logging in: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Login</h2>
        <form onSubmit={handleLogin} className="login-form">
          <label className="login-label">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              required
            />
          </label>
          <label className="login-label">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              required
            />
          </label>
          <button type="submit" className="login-button">Sign In</button>
          {error && <div className="error-message">{error}</div>}
        </form>
        <div className="login-footer">
          <p>
            Don't have an account? <a href="/register" className="register-link">Register here</a>
          </p>
          <p>
            <a href="/" className="home-link">Go to Home</a>
          </p>
          <p>
            <a href="/forgot-password" className="forgot-password-link">Forgot Password?</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
