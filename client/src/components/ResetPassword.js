import React, { useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './ResetPassword.css'; 

const API_URL = process.env.REACT_APP_API_URL;

const ResetPassword = () => {
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleResetPassword = async (e) => {
        e.preventDefault();

        // Validate password
        if (password.length < 6) {
            return setError('Password must be at least 6 characters long.');
        }
        if (!/\d/.test(password)) {
            return setError('Password must contain at least one number.');
        }
        if (!/[a-zA-Z]/.test(password)) {
            return setError('Password must contain at least one letter.');
        }
        if (password !== confirmPassword) {
            return setError('Passwords do not match.');
        }

        try {
            await axios.post(`${API_URL}/reset-password`, { token, password });
            setSuccess('Password reset successful');
            setError(''); // Clear previous errors
        } catch (error) {
            setSuccess(''); // Clear previous success messages
            setError(error.response?.data?.error || 'Error resetting password');
        }
    };

    return (
        <div className="reset-password-page">
            <div className="reset-password-container">
                <h2>Reset Password</h2>
                <form onSubmit={handleResetPassword} className="reset-password-form">
                    <label>
                        New Password:
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </label>
                    <label>
                        Confirm Password:
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </label>
                    <button type="submit">Reset Password</button>
                    {error && <p className="reset-password-error">{error}</p>}
                    {success && <p className="reset-password-success">{success}</p>}
                </form>
                <div className="password-requirements">
                    <p>Password requirements:</p>
                    <ul>
                        <li>At least 6 characters long</li>
                        <li>At least one number</li>
                        <li>At least one letter</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
