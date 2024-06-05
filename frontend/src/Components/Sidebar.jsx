import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Sidebar.module.css';
import Modal from './ViewListModal';

const Sidebar = () => {
  const [lists, setLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [selectedList, setSelectedList] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [movies, setMovies] = useState([]);

  // Fetch lists from the backend
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const token = localStorage.getItem('token'); // Get the token from local storage
        const response = await axios.get('http://localhost:5000/lists', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLists(response.data);
      } catch (error) {
        console.error('Error fetching lists:', error);
      }
    };

    fetchLists();
  }, []);

  // Create a new list
  const handleCreateList = async () => {
    if (newListName.trim()) {
      try {
        const token = localStorage.getItem('token'); // Get the token from local storage
        await axios.post(
          'http://localhost:5000/lists',
          { name: newListName.trim(), movies: [], public: true },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setNewListName('');
        // Fetch the updated list of lists
        const response = await axios.get('http://localhost:5000/lists', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLists(response.data);
      } catch (error) {
        console.error('Error creating list:', error);
      }
    }
  };

  // Fetch movies for the selected list
  const handleListClick = async (listName) => {
    try {
      const token = localStorage.getItem('token'); // Get the token from local storage
      const response = await axios.get(`http://localhost:5000/lists/${listName}/movies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedList(listName);
      setMovies(response.data);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching list movies:', error);
    }
  };

  // Close the modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedList(null);
    setMovies([]);
  };

  return (
    <div className={styles.sidebar}>
      <h2>My Lists</h2>
      <div className={styles.createList}>
        <input
          type="text"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="New list name"
          className={styles.input}
        />
        <button onClick={handleCreateList} className={styles.button}>Create List</button>
      </div>
      <ul className={styles.list}>
        {lists.length > 0 ? (
          lists.map((list) => (
            <li key={list._id} className={styles.listItem} onClick={() => handleListClick(list.name)}>
              {list.name}
            </li>
          ))
        ) : (
          <p className={styles.noLists}>No lists available</p>
        )}
      </ul>
      <Modal show={showModal} onClose={closeModal} listName={selectedList} movies={movies} />
    </div>
  );
};

export default Sidebar;
