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
 * /lists/{id}:
 *   put:
 *     summary: Update a list by adding movies
 *     tags: [List]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The list ID
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
 *         description: List updated successfully
 *       401:
 *         description: Authorization token is required
 *       404:
 *         description: List not found
 *       500:
 *         description: Internal server error
 */
app.put('/lists/:id', async (req, res) => {
  try {
    const { authorization } = req.headers;
    const { id } = req.params;
    const { movies } = req.body;

    if (!authorization) {
      return res.status(401).send('Authorization token is required');
    }

    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const list = await List.findOne({ _id: id, userId: decoded.id });

    if (!list) {
      return res.status(404).send('List not found');
    }

    list.movies.push(...movies);
    await list.save();
    res.status(200).send('List updated');
  } catch (error) {
    console.error('Error updating list:', error);
    res.status(500).send('Internal server error');
  }
});

/**
 * @swagger
 * /lists/{id}:
 *   delete:
 *     summary: Delete a list by ID
 *     tags: [List]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The list ID
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
app.delete('/lists/:id', async (req, res) => {
  try {
    const { authorization } = req.headers;
    const { id } = req.params;

    if (!authorization) {
      return res.status(401).send('Authorization token is required');
    }

    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const list = await List.findOneAndDelete({ _id: id, userId: decoded.id });

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
    const omdbUrl = `https://www.omdbapi.com/?apikey=${apiKey}&s=${s}&type=${type || ''}&y=${y || ''}&plot=${plot || ''}&page=${page || 1}`;

    const response = await axios.get(omdbUrl);
    if (response.data.Response === "False") {
      return res.status(404).send(response.data.Error);
    }

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching data from OMDB API:', error);
    res.status(500).send('Internal server error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
