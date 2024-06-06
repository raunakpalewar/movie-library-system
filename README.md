# movie-library-system


This project is a movie list application that allows users to search for movies, create custom lists, and add movies to those lists. It includes features like advanced search, user authentication, and movie details display.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## Installation

### Backend

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/movie-list-app.git
   cd movie-list-app/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables:
   ```env
   PORT=5000
   DATABASE_URL=your_database_url
   JWT_SECRET=your_jwt_secret
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables:
   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```

4. Start the frontend development server:
   ```bash
   npm start
   ```

## Usage

1. Open your browser and navigate to `http://localhost:3000`.
2. Register or log in to access the application.
3. Use the search bar to find movies and create custom lists.
4. Add movies to your lists and view them at any time.

## Features

- User authentication (login and registration)
- Movie search with advanced options (year, type, genre)
- Display movie details including rating, genre, plot, director, actors, and awards
- Create, view, and manage custom movie lists
- Add movies to lists

## Project Structure

```
movie-list-app/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── app.js
│   ├── config.js
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── Components/
│   │   ├── pages/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── Home.module.css
│   │   └── ...
├── README.md
└── package.json
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in a user

### Movies

- `GET /api/movies/search` - Search for movies
- `GET /api/movies/:id` - Get movie details by ID

### Lists

- `GET /api/lists` - Get all lists
- `POST /api/lists` - Create a new list
- `GET /api/lists/:name` - Get a specific list by name
- `POST /api/lists/:name/movies` - Add a movie to a specific list

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Make your changes and commit them (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a pull request

