import React from 'react';
import styles from './Modal.module.css';

const AddToListModal = ({ lists, onClose, onAddToList }) => {
  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <h2>Add to List</h2>
        <ul>
          {lists.map((list) => (
            <li key={list} onClick={() => onAddToList(list)}>
              {list}
            </li>
          ))}
        </ul>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default AddToListModal;
