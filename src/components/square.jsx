import React from 'react';

export default ({ value, onClick }) => (
  <button className="square" onClick={onClick} >
    {value}
  </button>
);
