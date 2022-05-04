CREATE DATABASE sw;
use sw;

--users table

CREATE TABLE users(
    id INT(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(16) NOT NULL UNIQUE,
    authToken VARCHAR(500),
    password VARCHAR(60) NOT NULL,
    fullname VARCHAR(16) NOT NULL
);

CREATE TABLE projects(
    id INT(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(150) NOT NULL,
    joinLink VARCHAR(255) NOT NULL,
    graphCode TEXT DEFAULT '<mxGraphModel dx=\"1042\" dy=\"586\" grid=\"1\" gridSize=\"10\" guides=\"1\" tooltips=\"1\" connect=\"1\" arrows=\"1\" fold=\"1\" page=\"1\" pageScale=\"1\" pageWidth=\"826\" pageHeight=\"1169\" background=\"#ffffff\">\r\n <root>\r\n <mxCell id=\"0\"/>\r\n <mxCell id=\"1\" parent=\"0\"/>\r\n </root>\r\n</mxGraphModel>',
    accessToken VARCHAR(500) DEFAULT NULL,
    owner_id INT(11),
    created_at timestamp NOT NULL DEFAULT current_timestamp,
    updated_at timestamp NOT NULL DEFAULT current_timestamp,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE usr_prj(
    id INT(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    usr_id INT(11),
    prj_id INT(11),
    created_at timestamp NOT NULL DEFAULT current_timestamp,
    updated_at timestamp NOT NULL DEFAULT current_timestamp,
    FOREIGN KEY (usr_id) REFERENCES users(id),
    FOREIGN KEY (prj_id) REFERENCES projects(id)
);




