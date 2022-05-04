const express = require('express');
const router = express.Router();

const pool = require('../database');

router.get('/user/:token', async (req, res)=>{
    const {token}= req.params;
    console.log(req.params);
    const users= await pool.query('SELECT id ,fullname as name, authToken as token  FROM `users` WHERE `authToken`=?', [token]);
    if(users.length <= 0){
        res.status(404).json({status: 'Token Not Valid'});
    }
    const user=users[0];
    res.status(200).json(user);
});

router.put('/guardar-diagrama/:token', async (req, res)=>{
    const {token}= req.params;
    const {content}= req.body;
    const projects= await pool.query('SELECT * FROM projects WHERE accessToken= ?', [token]);
    if(projects.length <= 0){
        res.status(404).json({status: 'Token Not Valid'});
    }
    const projectId=projects[0].id;
    const x=await pool.query('SELECT CURRENT_TIMESTAMP FROM projects limit 1');
    const updatedTime=x[0].CURRENT_TIMESTAMP;
    const project={graphCode: content, updated_at: updatedTime};
    console.log(project);
    await pool.query('UPDATE projects SET ?   WHERE id= ?', [project, projectId], (err, rows, filds) => {
        if(!err){
            res.status(200).json({status: 'Project Updated Successfully'});
        }else{
            res.status(404).json({status: 'ERROR! Could not Update Project '+err });
        }
    });
    res.status(200).json({status: 'Project Updated Successfully'});
});


router.get('/cargar-diagrama/:token', async (req, res)=>{
    const {token}= req.params;
    console.log(token + 'llamaron');
    const projects= await pool.query('SELECT id, title as nombre, owner_id as user_id, graphCode as content, accessToken as codigo, created_at, updated_at FROM projects WHERE accessToken= ?', [token]);
    console.log(projects);
    if(projects.length <= 0){
        res.status(404).json({status: 'Token Not Valid'});
    }
    const projectId=projects[0];
    res.status(200).json(projectId);
});



module.exports= router;