import React from 'react';

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
  },
  table: {
    borderCollapse: 'collapse',
    width: '100%',
    margin: '20px 0',
  },
  th: {
    backgroundColor: '#f2f2f2',
    border: '1px solid #dddddd',
    textAlign: 'left',
    padding: '8px',
  },
  td: {
    border: '1px solid #dddddd',
    textAlign: 'left',
    padding: '8px',
  },
};

const earningsData = [
  { date: '2023-01-01', amount: 1000 },
  { date: '2023-02-01', amount: 1500 },
  { date: '2023-03-01', amount: 1200 },
];

const MyEarningsNotes = () => {
  return (
    <div style={styles.container}>
      <h2>My Earnings Notes</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {earningsData.map((earningsItem, index) => (
            <tr key={index}>
              <td style={styles.td}>{earningsItem.date}</td>
              <td style={styles.td}>{earningsItem.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MyEarningsNotes;
