const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const mysql = require('mysql2');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config(); 

const app = express();

// Check if environment variables are set
const dbUrl = process.env.JAWSDB_URL;
if (!dbUrl) {
    throw new Error('JAWSDB_URL environment variable is not set.');
}

// Create a MySQL connection pool using the URL directly
const pool = mysql.createPool(dbUrl);

// Use the pool for session storage
const sessionStore = new MySQLStore({}, pool);

// Middleware
app.use(express.json());
app.use(cors());
app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'your_session_secret',
    resave: false,
    saveUninitialized: false
}));

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (token == null) return res.sendStatus(401); 

    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
        if (err) return res.sendStatus(403); 

        req.user = user; 
        next();
    });
};

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    }
});

// Register route
app.post('/register', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // Hash password and save user
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).json({ error: 'Internal server error' });
        }

        pool.query("INSERT INTO users (email, password) VALUES (?, ?)", [email, hashedPassword], (err, results) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).json({ error: 'Error registering user' });
            }
            res.status(201).json({ id: results.insertId, email });
        });
    });
});

// Login route
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    pool.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const user = results[0];
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Password comparison error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
            res.status(200).json({ token });
        });
    });
});

app.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    pool.query('SELECT id FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Email not found' });
        }

        const userId = results[0].id;
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // Token expires in 1 hour

        pool.query('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)', [userId, resetToken, expiresAt], (err) => {
            if (err) {
                console.error('Database insert error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

            transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Password Reset Request',
                text: `You requested a password reset. Click the following link to reset your password: ${resetUrl}`,
                html: `<p>You requested a password reset. Click the following link to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`
            }, (error) => {
                if (error) {
                    console.error('Error sending email:', error);
                    return res.status(500).json({ error: 'Error sending email' });
                }
                res.status(200).json({ message: 'Password reset instructions sent to your email.' });
            });
        });
    });
});


app.post('/reset-password', (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ error: 'Token and new password are required' });
    }

    pool.query('SELECT * FROM password_resets WHERE token = ? AND expires_at > ?', [token, new Date()], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const resetRecord = results[0];
        if (!resetRecord) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        const userId = resetRecord.user_id;

        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId], (err) => {
                if (err) {
                    console.error('Database update error:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                pool.query('DELETE FROM password_resets WHERE token = ?', [token], (err) => {
                    if (err) {
                        console.error('Database delete error:', err);
                        return res.status(500).json({ error: 'Internal server error' });
                    }
                    res.status(200).json({ message: 'Password reset successful' });
                });
            });
        });
    });
});

// Endpoint to delete user account
app.delete('/users/me', authenticateToken, (req, res) => {
    const userId = req.user.id;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Database connection error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        connection.beginTransaction((err) => {
            if (err) {
                console.error('Transaction error:', err);
                connection.release();
                return res.status(500).json({ error: 'Internal server error' });
            }

            // Delete associated tasks
            connection.query('DELETE FROM tasks WHERE user_id = ?', [userId], (err) => {
                if (err) {
                    console.error('Error deleting user tasks:', err);
                    return connection.rollback(() => {
                        connection.release();
                        res.status(500).json({ error: 'Internal server error' });
                    });
                }

                // Delete password reset tokens
                connection.query('DELETE FROM password_resets WHERE user_id = ?', [userId], (err) => {
                    if (err) {
                        console.error('Error deleting password reset tokens:', err);
                        return connection.rollback(() => {
                            connection.release();
                            res.status(500).json({ error: 'Internal server error' });
                        });
                    }

                    // Delete user
                    connection.query('DELETE FROM users WHERE id = ?', [userId], (err, results) => {
                        if (err) {
                            console.error('Error deleting user:', err);
                            return connection.rollback(() => {
                                connection.release();
                                res.status(500).json({ error: 'Internal server error' });
                            });
                        }

                        if (results.affectedRows === 0) {
                            return connection.rollback(() => {
                                connection.release();
                                res.status(404).json({ error: 'User not found' });
                            });
                        }

                        connection.commit((err) => {
                            if (err) {
                                console.error('Commit error:', err);
                                return connection.rollback(() => {
                                    connection.release();
                                    res.status(500).json({ error: 'Internal server error' });
                                });
                            }

                            connection.release();
                            res.status(200).json({ message: 'Account successfully deleted' });
                        });
                    });
                });
            });
        });
    });
});


// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.status(200).send('Logged out');
    });
});

// Update Task route
app.patch('/tasks/:id', authenticateToken, (req, res) => {
    const taskId = req.params.id;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }

    if (!taskId) {
        console.error('Task ID is missing.');
        return res.status(400).json({ error: 'Task ID is missing' });
    }

    pool.query('UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?', [status, taskId, req.user.id], (err, results) => {
        if (err) {
            console.error('Error updating task:', err);
            return res.status(500).send('Error updating task');
        }
        if (results.affectedRows === 0) return res.status(404).send('Task not found');
        res.status(200).send('Task updated');
    });
});

// Delete Task route
app.delete('/tasks/:id', authenticateToken, (req, res) => {
    const taskId = req.params.id;

    if (!taskId) {
        console.error('Task ID is missing.');
        return res.status(400).json({ error: 'Task ID is missing' });
    }

    pool.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, req.user.id], (err, results) => {
        if (err) {
            console.error('Error deleting task:', err);
            return res.status(500).send('Error deleting task');
        }
                if (results.affectedRows === 0) return res.status(404).send('Task not found');
        res.status(200).send('Task deleted');
    });
});

// Get User's Tasks route
app.get('/tasks', authenticateToken, (req, res) => {
    pool.query('SELECT * FROM tasks WHERE user_id = ?', [req.user.id], (err, results) => {
        if (err) {
            console.error('Error fetching tasks:', err);
            return res.status(500).send('Error fetching tasks');
        }
        res.status(200).json(results);
    });
});
app.post('/tasks', authenticateToken, (req, res) => {
    console.log('Request body:', req.body);
    console.log('User:', req.user);

    const { description, status } = req.body;
    const userId = req.user?.id;

    if (!description || !status || !userId) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const query = 'INSERT INTO tasks (user_id, description, status) VALUES (?, ?, ?)';
    pool.query(query, [userId, description, status], (error, results) => {
        if (error) {
            return res.status(500).json({ message: 'Server error', error });
        }
        res.status(201).json({ id: results.insertId, description, status });
    });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// Handles any requests that don't match the ones above
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

