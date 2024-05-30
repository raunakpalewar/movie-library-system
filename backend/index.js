require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

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

const listSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  name: String,
  movies: [String],
  public: Boolean,
});

const List = mongoose.model('List', listSchema);

app.post('/lists', async (req, res) => {
  try {
    const { token } = req.headers;
    const { name, movies, public } = req.body;
    if (!token) {
      return res.status(401).send('Authorization token is required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const newList = new List({ userId: decoded.id, name, movies, public });
    await newList.save();
    res.status(201).send('List created');
  } catch (error) {
    console.error('Error creating list:', error);
    res.status(500).send('Internal server error');
  }
});

app.get('/lists', async (req, res) => {
  try {
    const { token } = req.headers;
    if (!token) {
      return res.status(401).send('Authorization token is required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const lists = await List.find({ userId: decoded.id });
    res.json(lists);
  } catch (error) {
    console.error('Error fetching lists:', error);
    res.status(500).send('Internal server error');
  }
});

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
