import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './Modal2.module.css';

const AddToListModal = ({ imdbID, onClose }) => {
  const [lists, setLists] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
      const response = await axios.get('http://localhost:5000/lists', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLists(response.data);
    } catch (error) {
      console.error('Error fetching lists:', error);
      setError('Failed to fetch lists');
    }
  };

  const handleAddToList = async (listName) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
      await axios.post(
        `http://localhost:5000/lists/${listName}/movies`,
        { movies: [imdbID] },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setLoading(false);
      onClose();
    } catch (error) {
      console.error('Error adding movie to list:', error);
      setError('Failed to add movie to list');
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <h2>Add to List</h2>
        {error && <p className={styles.error}>{error}</p>}
        {loading ? (
          <div>Loading...</div>
        ) : (
          <ul>
            {lists.map((list) => (
              <li key={list._id} onClick={() => handleAddToList(list.name)}>
                {list.name}
              </li>
            ))}
          </ul>
        )}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default AddToListModal;
