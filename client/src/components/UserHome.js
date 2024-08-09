import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Timer from './Timer';
import BreakSessionTimer from './BreakSessionTimer';
import './UserHome.css';

const API_URL = process.env.REACT_APP_API_URL;

const UserHome = () => {
    const [taskDescription, setTaskDescription] = useState('');
    const [tasks, setTasks] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await axios.get(`${API_URL}/tasks`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setTasks(response.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    const handleAddTask = async () => {
        if (!taskDescription.trim()) return;

        try {
            await axios.post(`${API_URL}/tasks`, {
                description: taskDescription,
                status: 'to do'
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            setTaskDescription('');
            fetchTasks();
        } catch (error) {
            console.error('Error adding task:', error);
        }
    };

    const handleUpdateTaskStatus = async (taskId, status) => {
        if (!taskId) {
            console.error('Task ID is missing.');
            return;
        }

        try {
            await axios.patch(`${API_URL}/tasks/${taskId}`, { status }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            fetchTasks();
        } catch (error) {
            console.error('Error updating task status:', error);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!taskId) {
            console.error('Task ID is missing.');
            return;
        }

        try {
            await axios.delete(`${API_URL}/tasks/${taskId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            fetchTasks();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const handleDeleteAccount = async () => {
        const confirmation = window.confirm('Are you sure you want to delete your account?');
        
        if (!confirmation) return; 
    
        try {
            const token = localStorage.getItem('token');
            console.log('Token:', token);
    
            const response = await axios.delete(`${API_URL}/users/me`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
    
            console.log('Response:', response);
    
            localStorage.removeItem('token');
            window.location.href = '/login'; 
        } catch (error) {
            console.error('Error deleting account:', error.response || error.message || error);
        }
    };
    
    


    return (
        <div className="user-home">
            <button className="logout-button" onClick={handleLogout}>Logout</button>
            <div className="home-container">
                <h2>Pomodoro Task Manager</h2>
                <h3 className="break-session-heading">Set Break Session Duration</h3>
                <BreakSessionTimer defaultDuration={5} onStart={duration => console.log(`Break session started with duration ${duration} seconds`)} />

                <div className="add-task">
                    <h3>Add Task</h3>
                    <input
                        type="text"
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        placeholder="Enter task description"
                    />
                    <button className="add-button" onClick={handleAddTask}>Add Task</button>
                    {error && <p className="error">{error}</p>}
                </div>

                <div className="task-categories">
                    {['to do', 'working on', 'done'].map(status => (
                        <div key={status} className="task-category">
                            <h3>{status.charAt(0).toUpperCase() + status.slice(1)}</h3>
                            <ul className="task-list">
                                {tasks.filter(t => t.status === status).map(task => (
                                    <li key={task.id} className="task-item">
                                        <span className="task-description">{task.description}</span>
                                        <div className="task-actions">
                                            {status === 'to do' && (
                                                <>
                                                    <button className="action-button" onClick={() => handleUpdateTaskStatus(task.id, 'working on')}>Start</button>
                                                    <button className="action-button" onClick={() => handleDeleteTask(task.id)}>Delete</button>
                                                </>
                                            )}
                                            {status === 'working on' && (
                                                <>
                                                    <button className="action-button" onClick={() => handleUpdateTaskStatus(task.id, 'to do')}>Back to To Do</button>
                                                    <button className="action-button" onClick={() => handleUpdateTaskStatus(task.id, 'done')}>Complete</button>
                                                    <button className="action-button" onClick={() => handleDeleteTask(task.id)}>Delete</button>
                                                    <div className="timer-container">
                                                        <Timer duration={25 * 60} />
                                                    </div>
                                                </>
                                            )}
                                            {status === 'done' && (
                                                <>
                                                    <button className="action-button" onClick={() => handleUpdateTaskStatus(task.id, 'to do')}>Back to To Do</button>
                                                    <button className="action-button" onClick={() => handleUpdateTaskStatus(task.id, 'working on')}>Start</button>
                                                    <button className="action-button" onClick={() => handleDeleteTask(task.id)}>Delete</button>
                                                </>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
            <footer className="footer">
                <p>Developed by Hamzeh Hussein</p>
                <button className="delete-account-button" onClick={handleDeleteAccount}>Delete Account</button>
            </footer>
        </div>
    );
};

export default UserHome;
