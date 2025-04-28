const jwtSecret = "your_jwt_secret"; // This has to be the same key used in JWTStrategy

const jwt = require("jsonwebtoken"),
  passport = require("passport");

require("./passport.js"); // local passport file

let generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.Username, // This is the username being encoded in the JWT
    expiresIn: "7d", // This specifies that the token will expire in 7 days
    algorithm: "HS256", // This is the elgorithm used to "sign" or encide the values of the JWT
  });
};

/**
 * @description Login a user
 * @name POST /login
 * @example
 * Authentication:
 * none
 * @example
 * Request data format
 * {
 *  "Username": "john_doe",
 *  "Password": "Hello123"
 * }
 * @example
 * Response data format
 * {
 *   user: {
 *     "_id": 123,
 *     "Username": "john_doe",
 *     "Password": "hash12uis&%22bw"(hashed password),
 *     "Email": "john_doe@mail.com",
 *     "FavoriteMovies": ["122fi4nf4io49444f44", "3290ecnd374gkg02nd"]
 *   },
 *   token: "jhoif329vdnenvoweh893f238u9fnf43fuiofgh4iogjfpow3emop3fnvoivmcwociowe"
 * }
 */
module.exports = (router) => {
  router.post("/login", (req, res) => {
    passport.authenticate("local", { session: false }, (error, user, info) => {
      if (error || !user) {
        return res.status(400).json({
          message: "Something is not right",
          user: user,
        });
      }
      req.login(user, { session: false }, (error) => {
        if (error) {
          res.send(error);
        }
        let token = generateJWTToken(user.toJSON());
        return res.json({ user, token });
      });
    })(req, res);
  });
};
