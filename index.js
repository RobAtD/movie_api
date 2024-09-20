const express = require('express'),
    morgan = require('morgan'),
    mongoose = require('mongoose'),
    Models = require('./models');

const { check, validationResult } = require('express-validator');

const Movies = Models.Movie,
    Users = Models.User;

const app = express();

//mongoose.connect('mongodb://localhost:27017/movieAppDB');
mongoose.connect(process.env.CONNECTION_URI);



app.use(morgan('common'));
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const cors = require('cors');
app.use(cors());

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

app.get('/', (req, res) => {
    res.send('Welcome to my app!');
});

//Get all movies
app.get(
    '/movies',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        await Movies.find()
            .then((movies) => {
                res.json(movies);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error:  ' + err);
            });
    }
);

//Get a movie by title
app.get(
    '/movies/:Title',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        await Movies.findOne({ Title: req.params.Title })
            .then((movie) => {
                if (movie) {
                    res.json(movie);
                } else {
                    res.status(404).send(
                        'Movie with the title ' +
                            req.params.Title +
                            ' was not found.'
                    );
                }
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    }
);

//Post a movie
app.post(
    '/movies/add',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        // Condition check added here
        if (req.user.Username !== 'RobAt') {
            res.status(400).send('Permission denied');
        }
        // Condition ends
        await Movies.findOne({ Title: req.body.Title })
            .then((movie) => {
                if (movie) {
                    res.status(400).send(req.body.Title + ' already exists.');
                } else {
                    Movies.create({
                        Title: req.body.Title,
                        Description: req.body.Description,
                    })
                        .then((movie) => {
                            res.status(201).json(movie);
                        })
                        .catch((err) => {
                            console.error(err);
                            res.status(500).send('Error: ' + err);
                        });
                }
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    }
);

// Put a data about a movie
app.put(
    '/movies/:Title',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        if (req.user.Username !== 'RobAt') {
            res.status(400).send('Permission denied');
        }
        await Movies.findOneAndUpdate(
            { Title: req.params.Title },
            {
                $set: {
                    Title: req.body.Title,
                    Description: req.body.Description,
                    Director: {
                        Name: req.body.Director.Name,
                        Bio: req.body.Director.Bio,
                        Birthdate: req.body.Director.Birthdate,
                        Deathdate: req.body.Director.Deathdate,
                        Movies: req.body.Director.Movies,
                    },
                    Genre: {
                        Name: req.body.Genre.Name,
                        Description: req.body.Genre.Description,
                    },
                    Actors: req.body.Actors,
                    ReleaseYear: req.body.ReleaseYear,
                    ImageURL: req.body.ImageURL,
                    Featured: req.body.Featured,
                },
            },
            { new: true }
        )
            .then((updatedMovie) => {
                res.json(updatedMovie);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    }
);

//Get a genre by name
app.get(
    '/genres/:Name',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        await Movies.findOne({ 'Genre.Name': req.params.Name })
            .then((genre) => {
                if (genre) {
                    res.json(genre.Genre);
                } else {
                    res.status(404).send(
                        'Genre with the name ' +
                            req.params.Name +
                            ' was not found.'
                    );
                }
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    }
);

//Get a director by name
app.get(
    '/directors/:Name',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        await Movies.findOne({ 'Director.Name': req.params.Name })
            .then((director) => {
                if (director) {
                    res.json(director.Director);
                } else {
                    res.status(404).send(
                        'Director with the name ' +
                            req.params.Name +
                            ' was not found.'
                    );
                }
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    }
);

//Create a new user
app.post(
    '/users/register',
    [
        check('Username', 'Username is required').isLength({ min: 5 }),
        check(
            'Username',
            'Username contains non alphanumeric characters - not allowed!'
        ).isAlphanumeric(),
        check('Password', 'Password is required').not().isEmpty(),
        check('Email', 'Email does not appear to be valid').isEmail(),
    ],
    async (req, res) => {
        // Check the validation object for errors
        let errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        let hashedPassword = Users.hashPassword(req.body.Password);
        await Users.findOne({ Username: req.body.Username })
            .then((user) => {
                if (user) {
                    return res
                        .status(400)
                        .send(req.body.Username + ' already exists.');
                } else {
                    Users.create({
                        Username: req.body.Username,
                        Password: hashedPassword,
                        Email: req.body.Email,
                        Birthday: req.body.Birthday,
                    })
                        .then((user) => {
                            res.status(201).json(user);
                        })
                        .catch((error) => {
                            console.error(error);
                            res.status(500).send('Error: ' + error);
                        });
                }
            })
            .catch((error) => {
                console.error(error);
                res.status(500).send('Error: ' + error);
            });
    }
);

//Get all users
app.get(
    '/users',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        // Conditionto check added here
        if (req.user.Username !== 'RobAt') {
            return res.status(400).send('Permission denied');
        }
        // Condition ends
        await Users.find()
            .then((users) => {
                res.json(users);
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    }
);

//Get user by Username
app.get(
    '/users/:Username',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        // Conditionto check added here
        if (
            req.user.Username === req.params.Username ||
            req.user.Username === 'RobAt'
        ) {
            await Users.findOne({ Username: req.params.Username })
                .then((user) => {
                    if (user) {
                        res.json(user);
                    } else {
                        res.status(404).send(
                            'User with the username ' +
                                req.params.Username +
                                ' was not found.'
                        );
                    }
                })
                .catch((err) => {
                    console.error(err);
                    res.status(500).send('Error: ' + err);
                });
        } else {
            return res.status(400).send('Permission denied');
        }
    }
);

//Update user data by Username
app.put(
    '/users/:Username',
    [
        check('Username', 'Username is required')
            .isLength({ min: 5 })
            .optional({ nullable: true }),
        check(
            'Username',
            'Username contains non alphanumeric characters - not allowed!'
        ).isAlphanumeric(),
        check('Email', 'Email does not appear to be valid')
            .isEmail()
            .optional({ nullable: true }),
    ],
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        // Condition to check added here
        let errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        if (
            req.user.Username === req.params.Username ||
            req.user.Username === 'RobAt'
        ) {
            await Users.findOneAndUpdate(
                { Username: req.params.Username },
                {
                    $set: {
                        Username: req.body.Username,
                        Password: req.body.Password,
                        Email: req.body.Email,
                        Birthday: req.body.Birthday,
                    },
                },
                { new: true }
            )
                .then((updatedUser) => {
                    res.json(updatedUser);
                })
                .catch((err) => {
                    console.error(err);
                    res.status(500).send('Error: ' + err);
                });
        } else {
            return res.status(400).send('Permission denied');
        }
    }
);

app.post(
    '/users/:Username/favorites',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        // Conditionto check added here
        if (
            req.user.Username === req.params.Username ||
            req.user.Username === 'RobAt'
        ) {
            await Users.findOneAndUpdate(
                { Username: req.params.Username },
                {
                    $push: { FavoriteMovies: req.body.FavoriteMovies },
                },
                { new: true }
            )
                .then((updatedUser) => {
                    res.json(updatedUser);
                })
                .catch((err) => {
                    console.error(err);
                    res.status(500).send('Error: ' + err);
                });
        } else {
            return res.status(400).send('Permission denied');
        }
    }
);

//Delete a movie from favorites list by movieID
app.delete(
    '/users/:Username/favorites/:movieID',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        // Conditionto check added here
        if (
            req.user.Username === req.params.Username ||
            req.user.Username === 'RobAt'
        ) {
            await Users.findOneAndUpdate(
                {
                    Username: req.params.Username,
                    FavoriteMovies: req.params.movieID,
                },
                {
                    $pull: { FavoriteMovies: req.params.movieID },
                },
                { new: true }
            )
                .then((updatedUser) => {
                    res.json(updatedUser);
                })
                .catch((err) => {
                    console.error(err);
                    res.status(500).send('Error: ' + err);
                });
        } else {
            return res.status(400).send('Permission denied');
        }
    }
);

//Delete user by Username
app.delete(
    '/users/:Username',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        // Conditionto check added here
        if (
            req.user.Username === req.params.Username ||
            req.user.Username === 'RobAt'
        ) {
            await Users.findOneAndDelete({ Username: req.params.Username })
                .then((user) => {
                    if (!user) {
                        res.status(400).send(
                            req.params.Username + ' was not found.'
                        );
                    } else {
                        res.status(200).send(
                            req.params.Username + ' was deleted.'
                        );
                    }
                })
                .catch((err) => {
                    console.error(err);
                    res.status(500).send('Error: ' + err);
                });
        } else {
            return res.status(400).send('Permission denied');
        }
        //Condition ends here
    }
);

// Delte a movie by movieID
app.delete(
    '/movies/:movieID',
    passport.authenticate('jwt', { session: false }),
    async (req, res) => {
        // Conditionto check added here
        if (req.user.Username !== 'RobAt') {
            return res.status(400).send('Permission denied');
        } //Condition ends here
        await Movies.findOneAndDelete({
            _id: req.params.movieID,
        })
            .then((movie) => {
                if (!movie) {
                    res.status(400).send(
                        'Movie with the ID ' +
                            req.params.movieID +
                            ' was not found.'
                    );
                } else {
                    res.status(200).send(
                        'Movie with the ID ' +
                            req.params.movieID +
                            ' was deleted.'
                    );
                }
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            });
    }
);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('My app is running on port ' + port);
});
