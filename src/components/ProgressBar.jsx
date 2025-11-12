// src/components/ProgressBar.jsx

import React from 'react';

function ProgressBar({ percentual }) {
  const percentualClamped = Math.min(percentual, 100);

  return (
    <div className="progress-container">
      <div 
        className="progress-filler"
        // A largura da barra DEVE ser um estilo inline
        style={{ width: `${percentualClamped}%` }} 
      >
        <span className="progress-label">
          {`${percentualClamped.toFixed(0)}%`}
        </span>
      </div>
    </div>
  );
}

export default ProgressBar;