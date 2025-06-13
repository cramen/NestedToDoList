import React, { useState } from 'react';
import './PenguinAnimation.css';

export const PenguinAnimation: React.FC = () => {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setClicked(true);
    // Reset clicked state after a short delay to allow re-triggering animation
    setTimeout(() => setClicked(false), 1000); // Adjust duration as needed
  };

  return (
    <div className={`penguin-container ${clicked ? 'clicked' : ''}`} onClick={handleClick}>
      <div className="penguin">
        <div className="penguin-body">
          <div className="penguin-head">
            <div className="penguin-face"></div>
            <div className="penguin-eye left"></div>
            <div className="penguin-eye right"></div>
            <div className="penguin-beak"></div>
          </div>
          <div className="penguin-belly"></div>
          <div className="penguin-wing left"></div>
          <div className="penguin-wing right"></div>
        </div>
        <div className="penguin-feet left"></div>
        <div className="penguin-feet right"></div>
      </div>
    </div>
  );
}; 