import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SignIn from './Components/SignIn';
import SignUp from './Components/SignUp';
import Home from './Components/Home';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  return (
    <Router>
      <div>
        <Routes>
          <Route path="/signup" element={<SignUp />} />
          <Route path="/" element={<SignIn setToken={setToken} />} />
          <Route path="/home" element={<Home token={token} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
