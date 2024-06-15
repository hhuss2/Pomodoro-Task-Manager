import React, { useState } from 'react';
import './Home.css';
import Timer from './Timer';
import BreakSessionTimer from './BreakSessionTimer';

const Home = () => {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);

  const handleAddTask = () => {
    if (task.trim() === '') return;

    setTasks([...tasks, { description: task, status: 'to do', _id: Date.now() }]);
    setTask('');
  };

  const handleUpdateTaskStatus = (taskId, status) => {
    const updatedTasks = tasks.map(task =>
      task._id === taskId ? { ...task, status: status } : task
    );
    setTasks(updatedTasks);
  };

  const handleDeleteTask = (taskId) => {
    const updatedTasks = tasks.filter(task => task._id !== taskId);
    setTasks(updatedTasks);
  };

  const handleBreakSessionStart = (duration) => {
    console.log(`Break session started with duration ${duration} seconds`);
  };

  return (
    <div className="home-container">
      <h2>Pomodoro Task Manager</h2>
      <h3 className="break-session-heading">Set Break Session Duration</h3>

      <BreakSessionTimer defaultDuration={5} onStart={handleBreakSessionStart} />

      <div className="add-task">
        <h3>Add Task</h3>
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Enter task description"
        />
        <button className="add-button" onClick={handleAddTask}>Add Task</button>
      </div>

      <div className="task-categories">
        {/* Display tasks */}
        <div className="task-category">
          <h3>To Do</h3>
          <ul className="task-list">
            {tasks.filter(task => task.status === 'to do').map(task => (
              <li key={task._id} className="task-item">
                <span className="task-description">{task.description}</span>
                <div className="task-actions">
                  <button className="action-button" onClick={() => handleUpdateTaskStatus(task._id, 'working on')}>Start</button>
                  <button className="action-button" onClick={() => handleDeleteTask(task._id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="task-category">
          <h3>Working On</h3>
          <ul className="task-list">
            {tasks.filter(task => task.status === 'working on').map(task => (
              <li key={task._id} className="task-item">
                <span className="task-description">{task.description}</span>
                <div className="task-actions">
                  <button className="action-button" onClick={() => handleUpdateTaskStatus(task._id, 'to do')}>Back to To Do</button>
                  <button className="action-button" onClick={() => handleUpdateTaskStatus(task._id, 'done')}>Complete</button>
                  <button className="action-button" onClick={() => handleDeleteTask(task._id)}>Delete</button>
                </div>
                <Timer duration={25 * 60} />
              </li>
            ))}
          </ul>
        </div>

        <div className="task-category">
          <h3>Done</h3>
          <ul className="task-list">
            {tasks.filter(task => task.status === 'done').map(task => (
              <li key={task._id} className="task-item">
                <span className="task-description">{task.description}</span>
                <div className="task-actions">
                  <button className="action-button" onClick={() => handleUpdateTaskStatus(task._id, 'to do')}>Back to To Do</button>
                  <button className="action-button" onClick={() => handleUpdateTaskStatus(task._id, 'working on')}>Start Again</button>
                  <button className="action-button" onClick={() => handleDeleteTask(task._id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Home;
