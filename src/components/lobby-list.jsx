import React from 'react';

export default ({ friends }) => (
  <ul>
    {
      friends.map((number) => (
        <li
          onClick={
            () => {
              document.getElementById('remotepeer').value = number
            }
          }
          key={number}>
          {number}
        </li>
      ))
    }
  </ul>
);
