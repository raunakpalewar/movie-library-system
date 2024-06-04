import React from 'react';
import styles from './Modal.module.css';

const ViewListModal = ({ list, movies, onClose }) => {
  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <h2>{list}</h2>
        <ul>
          {movies.map((movie) => (
            <li key={movie}>{movie}</li>
          ))}
        </ul>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default ViewListModal;
