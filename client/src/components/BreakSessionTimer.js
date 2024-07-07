import React, { useState, useEffect } from 'react';
import './BreakSessionTimer.css';

const BreakSessionTimer = ({ defaultDuration, onStart }) => {
  const [timeLeft, setTimeLeft] = useState(defaultDuration * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let timer;

    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
    }

    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const handleStart = () => {
    setIsRunning(prevIsRunning => !prevIsRunning);
    if (!isRunning) {
      onStart(timeLeft);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(defaultDuration * 60);
  };

  const handleIncrease = () => {
    setTimeLeft(prevTime => prevTime + 60);
  };

  const handleDecrease = () => {
    if (timeLeft > 60) {
      setTimeLeft(prevTime => prevTime - 60);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="break-session-timer">
      <div className="time-display">{formatTime(timeLeft)}</div>
      <div className="timer-controls">
        {isRunning ? (
          <>
            <button onClick={handlePause}>Pause</button>
            <button onClick={handleReset}>Reset</button>
          </>
        ) : (
          <>
            <button onClick={handleStart}>
              {timeLeft === defaultDuration * 60 ? 'Start Break' : 'Continue'}
            </button>
            <button onClick={handleReset}>Reset</button>
          </>
        )}
        <button onClick={handleIncrease}>+</button>
        <button onClick={handleDecrease}>-</button>
      </div>
    </div>
  );
};

export default BreakSessionTimer;
