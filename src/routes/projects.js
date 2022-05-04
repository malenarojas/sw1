const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const pool = require('../database');
const {isLoggedIn} = require('../lib/auth');
const helpers = require('../lib/helpers');

router.get('/', isLoggedIn, async (req, res)=>{
    const projects=await pool.query('select proyectos.*, usr_prj.usr_id from (SELECT projects.id as proy_id, projects.title,projects.joinLink, projects.accessToken, projects.created_at, projects.updated_at, users.id as user_id, projects.owner_id, users.fullname as propietario, count(usr_prj.usr_id) as participantes FROM `projects` INNER JOIN users ON projects.owner_id = users.id inner JOIN usr_prj ON projects.id = usr_prj.prj_id Group BY projects.id, projects.title,projects.created_at, projects.updated_at, users.id, users.fullname) as proyectos inner JOIN usr_prj on proyectos.proy_id = usr_prj.prj_id WHERE usr_prj.usr_id = ?', [req.user.id]);
    
    res.render('projects/list', {projects});
});

router.get('/add', isLoggedIn,  (req, res)=>{
    res.render('projects/add');
});
router.post('/add', isLoggedIn, async (req, res)=> {
    const {title}= req.body;
    const newPrj = {
        title,
        joinLink: 'http://localhost:3000/projects/access/',
        owner_id: req.user.id
    };
    const token=jwt.sign({newPrj}, 'My_Secret_Key_1973_M0ntan0');
    // const token=await helpers.encryptPassword(newPrj.title+newPrj.owner_id+'My_Secret_Key_1973_M0ntan0');
	newPrj.accessToken= token;
    newPrj.joinLink+=newPrj.accessToken;
    
    const result= await pool.query('INSERT INTO projects set ?', [newPrj]);

    newPrj.id= result.insertId;
    const newUsrPrj={
        usr_id: req.user.id,
        prj_id: newPrj.id
    }
    await pool.query('INSERT INTO usr_prj set ?', [newUsrPrj]);
    req.flash('success', 'Project saved successfully');
    res.redirect('/projects');
});

router.get('/show/:id', isLoggedIn,  async (req, res)=>{
    const {id} = req.params;
    const projects=await pool.query('select DISTINCT proyectos.* from (SELECT projects.id as proy_id, projects.title,projects.joinLink, projects.accessToken, projects.owner_id, projects.created_at, projects.updated_at, users.id as user_id, users.fullname as propietario, count(usr_prj.usr_id) as participantes FROM `projects` INNER JOIN users ON projects.owner_id = users.id inner JOIN usr_prj ON projects.id = usr_prj.prj_id Group BY projects.id, projects.title,projects.created_at, projects.updated_at, users.id, users.fullname) as proyectos inner JOIN usr_prj on proyectos.proy_id = usr_prj.prj_id WHERE proy_id=?', [id]);
    const members=await pool.query('SELECT users.id, users.username, users.fullname FROM users, usr_prj WHERE usr_prj.usr_id=users.id AND usr_prj.prj_id= ?', [id]);
    const isOwned=projects[0].owner_id==req.user.id;
    res.render('projects/show', {project: projects[0] , members, isOwned});
});

router.get('/edit/:id', isLoggedIn,  async (req, res)=>{
    const {id} = req.params;
    const projects=await pool.query('SELECT * FROM projects WHERE ID= ?', [id]);
    const members=await pool.query('SELECT usr_prj.id ,users.username as member FROM `usr_prj` INNER JOIN users ON usr_prj.usr_id = users.id WHERE usr_prj.prj_id= ?', [id]);
    const isOwned=projects[0].owner_id==req.user.id;
    if (isOwned){
        res.render('projects/edit', {project: projects[0], members, isOwned});
    }else{
        res.redirect('/projects');
    }
    
});
router.post('/edit/:id', isLoggedIn,  async (req, res)=>{
    const {id} = req.params;
    const {title} = req.body;
    await pool.query('UPDATE projects set title = ? WHERE id = ?', [title, id]);
    req.flash('success', 'Title updated successfully');
    res.redirect('/projects');
});

router.get('/delete/:id', isLoggedIn, async (req, res)=>{
    const {id} = req.params;
    await pool.query('DELETE FROM usr_prj WHERE prj_id = ?', [id]);
    await pool.query('DELETE FROM projects WHERE id = ?', [id]);
    req.flash('success', 'Project deleted successfully');
    res.redirect('/projects');
});

router.post('/addmember/:id', isLoggedIn,  async (req, res)=>{
    const {id} = req.params;
    const {username} = req.body;
    const users=await pool.query('SELECT * FROM users WHERE username= ?', [username]);
    if(users.length <=0){
        req.flash('message', 'User does not exists, try with a valid user');
        res.redirect(req.get('referer'));
    }
    const userId=users[0].id;

    
    const exists= await pool.query('SELECT * FROM usr_prj WHERE usr_id = ? AND prj_id= ?', [userId, id]);
    if(exists.length <= 0){
        const newUsrPrj={
            usr_id: userId,
            prj_id: id
        }
        await pool.query('INSERT INTO usr_prj set ?', [newUsrPrj]);
        req.flash('success', username+' Added successfully');
    }else{
        req.flash('success', username+' is already a member');
    }
    res.redirect(req.get('referer'));
});

router.post('/deletemember/:id', isLoggedIn,  async (req, res)=>{
    const {id} = req.params;
    await pool.query('DELETE FROM usr_prj WHERE id= ?',[id]);
    req.flash('success', 'Member Removed');
    res.redirect(req.get('referer'));
});



router.get('/open/:id', isLoggedIn, async (req, res)=>{
    const {id} = req.params;
    const userToken= req.user.authToken;
    const accessToken= id;
    const strUT='?room='+accessToken;
    const strAT='&username='+userToken;
    const domain='http://localhost:8080/model-c4'
    const url=domain+strUT+strAT;
    res.redirect(url);
});


router.get('/access/:token', isLoggedIn, async (req, res)=>{
    const {token} = req.params;
    const prjIds= await pool.query('SELECT id FROM projects WHERE accessToken= ?', [token]);
    if(prjIds.length <= 0){
        req.flash('message', 'Token Invalid Project does not exits');
        res.redirect('/');
    }
    const prjId=prjIds[0].id;
    const usrId= req.user.id;
    const exists= await pool.query('SELECT * FROM usr_prj WHERE usr_id = ? AND prj_id= ?', [usrId, prjId]);
    if(exists.length <= 0){
        const newUsrPrj={
            usr_id: req.user.id,
            prj_id: prjId
        }
        await pool.query('INSERT INTO usr_prj set ?', [newUsrPrj]);
        req.flash('success', 'Project added successfully');
    }
    const userToken= req.user.authToken;
    const accessToken= token;
    const strUT='?room='+accessToken;
    const strAT='&username='+userToken;
    const domain='http://localhost:8080/model-c4'
    const url=domain+strUT+strAT;
    res.redirect(url);
});


router.get('/join', isLoggedIn, async (req, res)=>{
    console.log(req.params);
    res.render('projects/join');
});

router.post('/join', isLoggedIn, async (req, res)=>{
    console.log(req.params);
    const {token} = req.body;
    const prjIds= await pool.query('SELECT id FROM projects WHERE accessToken= ?', [token]);
    if(prjIds.length <= 0){
        req.flash('message', 'Token Invalid Project does not exits');
        res.redirect(req.get('referer'));
    }
    const prjId=prjIds[0].id;
    const usrId= req.user.id;
    const exists= await pool.query('SELECT * FROM usr_prj WHERE usr_id = ? AND prj_id= ?', [usrId, prjId]);
    if(exists.length <= 0){
        const newUsrPrj={
            usr_id: req.user.id,
            prj_id: prjId
        }
        await pool.query('INSERT INTO usr_prj set ?', [newUsrPrj]);
        req.flash('success', 'Project added successfully');
    }
    const userToken= req.user.authToken;
    const accessToken= token;
    const strUT='?room='+userToken;
    const strAT='&username='+accessToken;
    const domain='http://localhost:8080/model-c4'
    const url=domain+strUT+strAT;
    res.redirect(url);
});



module.exports= router;
