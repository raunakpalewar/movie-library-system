// CreateListModal.jsx
import React, { useState } from 'react';
import styles from './CreateListModal.module.css';

const CreateListModal = ({ show, onClose, onCreate }) => {
  const [listName, setListName] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleSubmit = () => {
    onCreate(listName, isPublic);
    setListName('');
    setIsPublic(false);
  };

  if (!show) {
    return null;
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>Create New List</h2>
        <input
          type="text"
          value={listName}
          onChange={(e) => setListName(e.target.value)}
          placeholder="List name"
          className={styles.input}
        />
        <div className={styles.checkboxContainer}>
          <label>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Public
          </label>
        </div>
        <div className={styles.buttonContainer}>
          <button onClick={handleSubmit} className={styles.button}>Create</button>
          <button onClick={onClose} className={styles.button}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default CreateListModal;
