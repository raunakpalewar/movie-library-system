import React, { useState } from 'react';
import styles from './Sidebar.module.css';

const Sidebar = ({ lists, createNewList }) => {
  const [newListName, setNewListName] = useState('');

  const handleCreateList = () => {
    if (newListName.trim()) {
      createNewList(newListName.trim());
      setNewListName('');
    }
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
          lists.map((list, index) => (
            <li key={index} className={styles.listItem}>{list}</li>
          ))
        ) : (
          <p className={styles.noLists}>No lists available</p>
        )}
      </ul>
    </div>
  );
};

export default Sidebar;
