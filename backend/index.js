
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

// Swagger setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Movie Library API',
      version: '1.0.0',
      description: 'API documentation for the Movie Library System',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./index.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

const listSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  name: { type: String, required: true },
  movies: { type: [String], default: [] },
  public: { type: Boolean, default: false },
});

const List = mongoose.model('List', listSchema);

const movieSchema = new mongoose.Schema({
  imdbID: { type: String, required: true },
  title: { type: String, required: true },
  year: { type: String },
  genre: { type: String },
  director: { type: String },
  plot: { type: String },
  poster: { type: String },
  // Add other properties as needed
});

const Movie = mongoose.model('Movie', movieSchema);

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: The user's username.
 *         password:
 *           type: string
 *           description: The user's password.
 *       example:
 *         username: 'johndoe'
 *         password: 'password123'
 */

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Create a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Missing username or password
 *       500:
 *         description: Internal server error
 */
app.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).send('Username and password are required');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).send('User created');
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).send('Internal server error');
  }
});

/**
 * @swagger
 * /signin:
 *   post:
 *     summary: Authenticate a user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *       400:
 *         description: Missing username or password
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
app.post('/signin', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).send('Username and password are required');
    }

    const user = await User.findOne({ username });
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    } else {
      res.status(401).send('Invalid credentials');
    }
  } catch (error) {
    console.error('Error during signin:', error);
    res.status(500).send('Internal server error');
  }
});

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     List:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the list.
 *         movies:
 *           type: array
 *           items:
 *             type: string
 *           description: The list of movie IMDb IDs.
 *         public:
 *           type: boolean
 *           description: Whether the list is public or private.
 *       example:
 *         name: 'My Favorite Movies'
 *         movies: ['tt0111161', 'tt0068646']
 *         public: true
 */

/**
 * @swagger
 * /lists:
 *   post:
 *     summary: Create a new movie list
 *     tags: [List]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/List'
 *     responses:
 *       201:
 *         description: List created successfully
 *       401:
 *         description: Authorization token is required
 *       500:
 *         description: Internal server error
 */
app.post('/lists', async (req, res) => {
  try {
    const { authorization } = req.headers;
    const { name, movies, public } = req.body;

    if (!authorization) {
      return res.status(401).send('Authorization token is required');
    }

    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const newList = new List({ userId: decoded.id, name, movies, public });
    await newList.save();
    res.status(201).send('List created');
  } catch (error) {
    console.error('Error creating list:', error);
    res.status(500).send('Internal server error');
  }
});

/**
 * @swagger
 * /lists:
 *   get:
 *     summary: Get all lists for the authenticated user
 *     tags: [List]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lists retrieved successfully
 *       401:
 *         description: Authorization token is required
 *       500:
 *         description: Internal server error
 */
app.get('/lists', async (req, res) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      return res.status(401).send('Authorization token is required');
    }

    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const lists = await List.find({ userId: decoded.id });
    res.json(lists);
  } catch (error) {
    console.error('Error fetching lists:', error);
    res.status(500).send('Internal server error');
  }
});

/**
 * @swagger
 * /lists/{name}/movies:
 *   post:
 *     summary: Add movies to a list
 *     tags: [List]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: The list name
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               movies:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Movies added to the list successfully
 *       401:
 *         description: Authorization token is required
 *       404:
 *         description: List not found
 *       500:
 *         description: Internal server error
 */
app.post('/lists/:name/movies', async (req, res) => {
  try {
    const { authorization } = req.headers;
    const { name } = req.params;
    const { movies } = req.body;

    if (!authorization) {
      return res.status(401).send('Authorization token is required');
    }

    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const list = await List.findOne({ name, userId: decoded.id });

    if (!list) {
      return res.status(404).send('List not found');
    }

    const apiKey = process.env.OMDB_API_KEY;
    const validMovies = [];
    const invalidMovies = [];

    for (const imdbID of movies) {
      // Check if movie details already exist in the database
      let movie = await Movie.findOne({ imdbID });

      if (!movie) {
        // Fetch movie details from OMDB API
        const omdbResponse = await axios.get(`https://www.omdbapi.com/?apikey=${apiKey}&i=${imdbID}`);

        if (omdbResponse.data.Response === 'False') {
          invalidMovies.push(imdbID);
          console.warn(`Invalid movie ID: ${imdbID}`);
          continue;
        }

        // Save movie details in the database
        movie = new Movie({
          imdbID: omdbResponse.data.imdbID,
          title: omdbResponse.data.Title,
          // Add other properties as needed
        });

        await movie.save();
      }

      validMovies.push(imdbID);
    }

    if (invalidMovies.length) {
      console.warn(`Invalid movie IDs found: ${invalidMovies.join(', ')}`);
    }

    // Add valid movie IDs to the list
    list.movies = [...new Set([...list.movies, ...validMovies])];
    await list.save();

    res.status(200).send('Movies added to the list successfully');
  } catch (error) {
    console.error('Error adding movies to list:', error);
    res.status(500).send('Internal server error');
  }
});


/**
 * @swagger
 * /lists/{name}:
 *   delete:
 *     summary: Delete a list by name
 *     tags: [List]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: The list name
 *     responses:
 *       200:
 *         description: List deleted successfully
 *       401:
 *         description: Authorization token is required
 *       404:
 *         description: List not found
 *       500:
 *         description: Internal server error
 */
app.delete('/lists/:name', async (req, res) => {
  try {
    const { authorization } = req.headers;
    const { name } = req.params;

    if (!authorization) {
      return res.status(401).send('Authorization token is required');
    }

    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const list = await List.findOneAndDelete({ name, userId: decoded.id });

    if (!list) {
      return res.status(404).send('List not found');
    }

    res.status(200).send('List deleted');
  } catch (error) {
    console.error('Error deleting list:', error);
    res.status(500).send('Internal server error');
  }
});

/**
 * @swagger
 * /lists/{name}/movies:
 *   get:
 *     summary: Get all movies in a particular list by name
 *     tags: [List]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: The list name
 *     responses:
 *       200:
 *         description: Movies retrieved successfully
 *       401:
 *         description: Authorization token is required
 *       404:
 *         description: List not found
 *       500:
 *         description: Internal server error
 */
app.get('/lists/:name/movies', async (req, res) => {
  try {
    const { authorization } = req.headers;
    const { name } = req.params;

    if (!authorization) {
      return res.status(401).send('Authorization token is required');
    }

    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const list = await List.findOne({ name, userId: decoded.id });

    if (!list) {
      return res.status(404).send('List not found');
    }

    // Log the list content for debugging
    console.log(`Found list: ${JSON.stringify(list)}`);
    console.log(`Found list: ${JSON.stringify(list.movies)}`);

    if (!list.movies.length) {
      return res.status(200).json([]);
    }

    // Validate and filter movie IDs
    const validMovieIDs = list.movies.filter(id => /^tt\d+$/.test(id));

    // Log invalid movie IDs
    const invalidMovieIDs = list.movies.filter(id => !/^tt\d+$/.test(id));
    if (invalidMovieIDs.length) {
      console.warn(`Invalid movie IDs found: ${invalidMovieIDs.join(', ')}`);
    }

    if (!validMovieIDs.length) {
      // If no valid movie IDs, return an empty array
      return res.status(200).json([]);
    }

    // Fetch movies based on the valid list's movie IDs
    const movies = await Movie.find({ imdbID: { $in: validMovieIDs } });

    // Log the fetched movies for debugging
    console.log(`Fetched movies: ${JSON.stringify(movies)}`);

    res.json(movies);
  } catch (error) {
    console.error('Error fetching list movies:', error);
    res.status(500).send('Internal server error');
  }
});



/**
 * @swagger
 * /lists/{name}/movies:
 *   delete:
 *     summary: Remove a movie from a list by name
 *     tags: [List]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: The list name
 *       - in: query
 *         name: imdbID
 *         schema:
 *           type: string
 *         required: true
 *         description: The IMDb ID of the movie to be removed
 *     responses:
 *       200:
 *         description: Movie removed from the list successfully
 *       401:
 *         description: Authorization token is required
 *       404:
 *         description: List or movie not found
 *       500:
 *         description: Internal server error
 */
app.delete('/lists/:name/movies', async (req, res) => {
  try {
    const { authorization } = req.headers;
    const { name } = req.params;
    const { imdbID } = req.query;

    if (!authorization) {
      return res.status(401).send('Authorization token is required');
    }

    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const list = await List.findOne({ name, userId: decoded.id });

    if (!list) {
      return res.status(404).send('List not found');
    }

    if (!list.movies.includes(imdbID)) {
      return res.status(404).send('Movie not found in the list');
    }

    list.movies = list.movies.filter(movie => movie !== imdbID);
    await list.save();
    res.status(200).send('Movie removed from the list');
  } catch (error) {
    console.error('Error removing movie from list:', error);
    res.status(500).send('Internal server error');
  }
});





/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search for movies
 *     tags: [Movie]
 *     parameters:
 *       - in: query
 *         name: s
 *         schema:
 *           type: string
 *         required: true
 *         description: Movie title to search for
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         required: false
 *         description: Type of result to return (movie, series, episode)
 *       - in: query
 *         name: y
 *         schema:
 *           type: string
 *         required: false
 *         description: Year of release
 *       - in: query
 *         name: plot
 *         schema:
 *           type: string
 *         required: false
 *         description: Return short or full plot (short, full)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: Page number to return
 *     responses:
 *       200:
 *         description: Movies retrieved successfully
 *       400:
 *         description: Missing search query
 *       500:
 *         description: Internal server error
 */

app.get('/search', async (req, res) => {
  try {
    const { s, type, y, plot, page } = req.query;

    if (!s) {
      return res.status(400).send('Search query (s) is required');
    }

    const apiKey = process.env.OMDB_API_KEY;

    // First API call to search movies by title
    const searchUrl = `https://www.omdbapi.com/?apikey=${apiKey}&s=${s}&type=${type || ''}&y=${y || ''}&plot=${plot || ''}&page=${page || 1}`;
    const searchResponse = await axios.get(searchUrl);

    if (searchResponse.data.Response === "False") {
      return res.status(404).send(searchResponse.data.Error);
    }

    // Second API call to fetch direct movie details by title
    const directUrl = `https://www.omdbapi.com/?apikey=${apiKey}&t=${s}`;
    const directResponse = await axios.get(directUrl);

    // Combine the responses
    const combinedResponse = {
      searchResults: searchResponse.data.Search || [],
      directResult: directResponse.data.Response === "True" ? directResponse.data : null,
    };

    res.json(combinedResponse);
  } catch (error) {
    console.error('Error fetching data from OMDB API:', error);
    res.status(500).send('Internal server error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
