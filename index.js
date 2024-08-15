const express = require('express'),
    morgan = require('morgan');

const app = express();

// Top 10 movies
const movies = [
    {
        title: 'Star Wars: Episode 1',
        director: 'George Lucas'
    },
    {
        title: 'Star Wars: Episode 3',
        director: 'George Lucas'
    },
    {
        title: 'Avatar',
        director: 'James Cameron'
    },
    {
        title: 'Spider-Man 2',
        director: 'Sam Raimi'
    },
    {
        title: 'Spider-Man 3',
        director: 'Sam Raimi'
    },
    {
        title: 'The Amazing Spider-Man 2',
        director: 'Marc Webb'
    },
    {
        title: 'Marvel\'s The Avengers',
        director: 'George Lucas'
    },
    {
        title: 'Avengers: Infinity War',
        director: 'George Lucas'
    },
    {
        title: 'Dragonheart',
        director: 'Rob Cohen'
    },
    {
        title: 'Jumper',
        director: 'Doug Liman'
    },
];

app.use(morgan('common'));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('Welcome to my app!');
});

app.get('/movies', (req, res) => {
    res.json(movies);
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
  });

app.listen(8080, () => {
    console.log('My app is running on port 8080.');
});
