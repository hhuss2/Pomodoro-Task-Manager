import React, { useState } from 'react';
import axios from 'axios';
import './Register.css'; 

const API_URL = process.env.REACT_APP_API_URL;

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const validatePassword = (password) => {
        const minLength = 6;
        const hasNumber = /\d/;
        const hasLetter = /[a-zA-Z]/;

        return (
            password.length >= minLength &&
            hasNumber.test(password) &&
            hasLetter.test(password)
        );
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (!validatePassword(password)) {
            setError('Password must be at least 6 characters long, contain at least one letter, and one number.');
            return;
        }

        try {
            await axios.post(`${API_URL}/register`, { email, password });
            setSuccess('Registration successful.');
            setError(''); // Clear any previous errors
        } catch (error) {
            setSuccess(''); // Clear any previous messages
            setError(error.response?.data?.error || 'Error registering user');
        }
    };

    return (
        <div className="register-page">
            <div className="register-container">
                <h2>Register</h2>
                <form onSubmit={handleRegister} className="register-form">
                    <label className="register-label">
                        Email:
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="register-input"
                            required
                        />
                    </label>
                    <label className="register-label">
                        Password:
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="register-input"
                            required
                        />
                    </label>
                    <label className="register-label">
                        Confirm Password:
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="register-input"
                            required
                        />
                    </label>
                    <button type="submit" className="register-button">Register</button>
                    {error && <p className="register-error">{error}</p>}
                    {success && <p className="register-success">{success}</p>}
                </form>
                <ul className="password-requirements">
                    <li>Password must be at least 6 characters long</li>
                    <li>Must contain at least one letter</li>
                    <li>Must contain at least one number</li>
                </ul>
                <div className="register-footer">
                    <p>Already have an account? <a href="/login" className="login-link">Login</a></p>
                    <p><a href="/" className="home-link">Go to Home</a></p>
                </div>
            </div>
        </div>
    );
};

export default Register;
