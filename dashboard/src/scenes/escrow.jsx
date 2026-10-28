import React from 'react';

const EscrowService = () => {
  const containerStyle = {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#f0f0f0',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  };

  const titleStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '10px',
  };

  const descriptionStyle = {
    fontSize: '16px',
    lineHeight: '1.5',
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Offer Escrow Service</h1>
      <p style={descriptionStyle}>
        Ensure the safety of your transactions with our reliable escrow service.
        We'll securely hold funds until both parties are satisfied with the
        outcome.
      </p>
      <button
        style={{
          padding: '10px 20px',
          fontSize: '18px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Get Started
      </button>
    </div>
  );
};

export default EscrowService;
