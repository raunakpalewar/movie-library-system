import React, { useState, useEffect } from 'react';
import styles from './Modal.module.css';
import axios from 'axios';

const Modal = ({ show, onClose, listName, movies: initialMovies, onDeleteMovie, onDeleteList, reloadSidebar }) => {
  const [movies, setMovies] = useState(initialMovies);

  useEffect(() => {
    setMovies(initialMovies);
  }, [initialMovies]);

  if (!show) {
    return null;
  }

  const handleDeleteMovie = async (imdbID, title) => {
    try {
      const token = localStorage.getItem('token'); // Get the token from local storage
      await axios.delete(`https://movie-library-system.onrender.com/lists/${listName}/movies`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { imdbID, title }
      });
      // Remove the movie from the frontend state
      setMovies(prevMovies => prevMovies.filter(movie => movie.imdbID !== imdbID));
      onDeleteMovie(imdbID); // Call the onDeleteMovie function passed from the parent component
      reloadSidebar(); // Reload the sidebar after deleting a movie
    } catch (error) {
      console.error('Error deleting movie:', error);
    }
  };

  const handleDeleteList = async () => {
    try {
      const token = localStorage.getItem('token'); // Get the token from local storage
      await axios.delete(`https://movie-library-system.onrender.com/lists/${listName}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onDeleteList(); // Call the onDeleteList function passed from the parent component
      reloadSidebar(); // Reload the sidebar after deleting the list
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>{listName}</h2>
          <button onClick={handleDeleteList} className={styles.deleteListButton}>Delete List</button>
          <button onClick={onClose} className={styles.closeButton}>Close</button>
        </div>
        <ul className={styles.movieList}>
          {movies.length > 0 ? (
            movies.map((movie, index) => (
              <li key={movie.imdbID} className={styles.movieItem}>
                <div>
                  {index + 1}.
                  <img src={movie.poster} alt={movie.title} className={styles.poster} />
                </div>
                <div className={styles.div2}>
                  <p>{movie.title}</p>
                  <button onClick={() => handleDeleteMovie(movie.imdbID, movie.title)} className={styles.deleteButton}>Delete</button>
                </div>
                <hr/>
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
