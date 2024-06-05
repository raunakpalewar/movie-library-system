import React from 'react';
import styles from './Modal.module.css';

const Modal = ({ show, onClose, listName, movies }) => {
  if (!show) {
    return null;
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>{listName}</h2>
        <button onClick={onClose} className={styles.closeButton}>Close</button>
        <ul className={styles.movieList}>
          {movies.length > 0 ? (
            movies.map((movie) => (
              <li key={movie.imdbID} className={styles.movieItem}>
                {movie.title}
              </li>
            ))
          ) : (
            <p className={styles.noMovies}>No movies in this list</p>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Modal;
