const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const jwt = require('jsonwebtoken');

const pool = require('../database');
const helpers = require('../lib/helpers');


//login
passport.use("local.login", new LocalStrategy({
    usernameField: "username",
    passwordField: "password",
    passReqToCallback: true,
}, async(req, username, password, done) => {
    const rows = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length > 0) {
        const user = rows[0];
        const validPassword = await helpers.matchPassword(password, user.password);
        if (validPassword) {
            done(null, user, req.flash('success', 'Welcome ' + user.username));
        } else {
            done(null, false, req.flash('message', 'Contraseña Equivocada'));
        }
    } else {
        return done(null, false, req.flash('message', 'No existe ese usuario'));
    }
}));





// register
passport.use("local.register", new LocalStrategy({
    usernameField: "username",
    passwordField: "password",
    passReqToCallback: true,
}, async(req, username, password, done) => {
    const { fullname } = req.body;
    const newUser = {
        username,
        password,
        fullname
    };
    newUser.password = await helpers.encryptPassword(password);
    const token = jwt.sign({ newUser }, 'My_Secret_Key_1973_M0ntan0');
    // const token=await helpers.encryptPassword(newUser.username+'My_Secret_Key_1973_M0ntan0');
    newUser.authToken = token;
    const result = await pool.query('INSERT INTO users SET ?', [newUser]);
    newUser.id = result.insertId;
    return done(null, newUser);
}));

passport.serializeUser((usr, done) => {
    done(null, usr.id);
});

passport.deserializeUser(async(id, done) => {
    const rows = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    done(null, rows[0]);
});