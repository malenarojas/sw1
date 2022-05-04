const express = require('express');
const router = express.Router();
const passport = require('passport');
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');
const pool = require('../database');
const helpers = require('../lib/helpers');



router.get('/login', isNotLoggedIn, (req, res) => {
    res.render('auth/login');
});
router.post('/login', isNotLoggedIn, (req, res, next) => {
    passport.authenticate('local.login', {
        successRedirect: '/home',
        failureRedirect: '/login',
        failureFlash: true,
    })(req, res, next);
});


router.get('/register', isNotLoggedIn, (req, res) => {
    res.render('auth/register');
});
router.post('/register', isNotLoggedIn, passport.authenticate('local.register', {
    successRedirect: '/home',
    failureRedirect: '/register',
    failureFlash: true,
}));


router.get('/home', isLoggedIn, (req, res) => {
    res.render('home');
});

router.get('/logout', isLoggedIn, (req, res) => {
    req.logOut();
    res.redirect('/login');
});

router.get('/delete', isLoggedIn, (req, res) => {

    res.render('auth/delete');
});

router.post('/delete', isLoggedIn, async(req, res) => {
    const { password } = req.body;
    const userId = req.user.id;
    const validPassword = await helpers.matchPassword(password, req.user.password);
    console.log(validPassword);
    if (!validPassword) {
        req.flash('message', 'ERROR!');
        res.redirect(req.get('referer'));
    } else {
        req.logOut();
        await pool.query('DELETE FROM users WHERE id=?', [userId]);
        console.log(userId);
        req.flash('success', 'Usuario Eliminado');
        res.redirect('/login');
    }

});

module.exports = router;