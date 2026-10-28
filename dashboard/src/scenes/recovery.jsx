import React from 'react';

const Recovery = () => {
  const containerStyles = {
    backgroundColor: '#f0f0f0',
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  };

  const titleStyles = {
    fontSize: '24px',
    color: '#333',
  };

  const descriptionStyles = {
    fontSize: '16px',
    color: '#666',
  };

  return (
    <div style={containerStyles}>
      <h1 style={titleStyles}>Defi Investment Recovery</h1>
      <p style={descriptionStyles}>
        We specialize in recovering lost investments in the DeFi space.
      </p>
    </div>
  );
};

export default Recovery;
