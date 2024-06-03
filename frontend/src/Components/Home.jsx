import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Home.module.css';

const Home = ({ token }) => {
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/signin');
    } else {
      setMessage('Welcome to the Home Page!');
    }
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/signin');
  };

  return (
    <div className={styles.container}>
      <div className={styles.homeContent}>
        <h1>{message}</h1>
        <button onClick={handleLogout} className={styles.button}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Home;
