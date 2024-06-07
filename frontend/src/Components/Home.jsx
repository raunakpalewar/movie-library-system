import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TailSpin } from 'react-loader-spinner';
import styles from './Home.module.css';
import Sidebar from './Sidebar';
import AddToListModal from './AddToListModal';
import ViewListModal from './ViewListModal';

const Home = () => {
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('');
  const [type, setType] = useState('');
  const [genre, setGenre] = useState('');
  const [advancedSearch, setAdvancedSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [directResult, setDirectResult] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');
  const [lists, setLists] = useState([]);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [showViewListModal, setShowViewListModal] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [selectedListMovies, setSelectedListMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
      const response = await axios.get('https://movie-library-system.onrender.com/lists', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLists(response.data);
    } catch (error) {
      console.error('Error fetching lists:', error);
    }
  };
  const verifyToken = async (token) => {
    try {
      const response = await axios.get('https://movie-library-system.onrender.com/verifyToken', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.data.valid) {
        localStorage.removeItem('token');
        window.location.href = '/'; // Redirect to the login page
    }
    } catch (error) {
      console.error('Error verifying token:', error);
      localStorage.removeItem('token');
      window.location.href = '/'; // Redirect to the login page
    }
  };

  const createNewList = (name) => {
    // Your implementation for creating a new list goes here
    console.log(`Creating new list: ${name}`);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const params = { s: query };
      if (year) params.y = year;
      if (type) params.type = type;
      if (genre) params.genre = genre;
      const response = await axios.get('https://movie-library-system.onrender.com/search', { params });
      setDirectResult(response.data.directResult || null);
      setSearchResults(response.data.searchResults || []);
      setError('');
    } catch (error) {
      setError('Movie not found');
      setDirectResult(null);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewList = async (listName) => {
    try {
      const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
      const response = await axios.get(`https://movie-library-system.onrender.com/lists/${listName}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSelectedList(listName);
      setSelectedListMovies(response.data.movies);
      setShowViewListModal(true);
    } catch (error) {
      console.error('Error fetching list movies:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear the token
    window.location.href = '/'; // Redirect to the login page
  };

  return (
    <div className={styles.container}>
      <Sidebar lists={lists} createNewList={createNewList} onViewList={handleViewList} />
      <div className={styles.mainContent}>
        <div className={styles.logoutButtonContainer}>
          <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
        </div>
        <div className={styles.searchContainer}>
          <h1>Movie Search</h1>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for movies..."
              className={styles.searchInput}
              required
            />
            <button type="submit" className={styles.searchButton}>Search</button>
          </form>
          <button
            onClick={() => setAdvancedSearch(!advancedSearch)}
            className={styles.advancedButton}
          >
            {advancedSearch ? 'Hide Advanced Search' : 'Show Advanced Search'}
          </button>
          {advancedSearch && (
            <div className={styles.advancedSearch}>
              <div className={styles.inputGroup}>
                <label>Year:</label>
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g., 2020"
                  className={styles.input}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Type:</label>
                <input
                  type="text"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="e.g., movie, series"
                  className={styles.input}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Genre:</label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="e.g., Action, Comedy"
                  className={styles.input}
                />
              </div>
            </div>
          )}
          {error && <p className={styles.error}>{error}</p>}
        </div>
        {loading ? (
          <div className={styles.loaderContainer}>
            <TailSpin
              type="Oval"
              color="#007bff"
              height={50}
              width={50}
            />
          </div>
        ) : (
          <>
            {directResult && (
              <div className={styles.directResultContainer}>
                <h2>{directResult.Title} ({directResult.Year})</h2>
                <div className={styles.directResult}>
                  <img src={directResult.Poster} alt={directResult.Title} className={styles.directPoster} />
                  <div className={styles.directInfo}>
                    <p><strong>Rating:</strong> {directResult.imdbRating} / 10</p>
                    <p><strong>Genre:</strong> {directResult.Genre}</p>
                    <p><strong>Plot:</strong> {directResult.Plot}</p>
                    <p><strong>Director:</strong> {directResult.Director}</p>
                    <p><strong>Actors:</strong> {directResult.Actors}</p>
                    <p><strong>Awards:</strong> {directResult.Awards}</p>
                    <button
                      className={styles.addButton}
                      onClick={() => {
                        setSelectedMovie(movie.imdbID);
                        setShowAddToListModal(true);
                      }}
                    >
                      Add to List
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className={styles.moviesContainer}>
              {searchResults.map((movie) => (
                <div key={movie.imdbID} className={styles.movieTile}>
                  <img src={movie.Poster} alt={movie.Title} className={styles.moviePoster} />
                  <div className={styles.movieInfo}>
                    <h2>{movie.Title}</h2>
                    <p><strong>Year:</strong> {movie.Year}</p>
                    <p><strong>Type:</strong> {movie.Type}</p>
                    <p><strong>IMDb ID:</strong> {movie.imdbID}</p>
                    <button
                      className={styles.addButton}
                      onClick={() => {
                        setSelectedMovie(movie.imdbID);
                        setShowAddToListModal(true);
                      }}
                    >
                      Add to List
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {showAddToListModal && (
        <AddToListModal
          imdbID={selectedMovie}
          onClose={() => setShowAddToListModal(false)}
        //   onAddToList={handleAddToList}
        />
      )}
      {showViewListModal && (
        <ViewListModal
          list={selectedList}
          movies={selectedListMovies}
          onClose={() => setShowViewListModal(false)}
        />
      )}
    </div>
  );
};

export default Home;
