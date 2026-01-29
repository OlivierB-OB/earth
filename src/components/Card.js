import React from 'react';

const Card = ({ children }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '350px',
        height: '300px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
};

export default Card;
