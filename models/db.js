// Here we are going to handle the database connection 
require('dotenv').config();

const mysql = require('mysql2');

const connection = mysql.createConnection
({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

connection.connect (err => {
    if(err)
    {
        console.error("\N Error connecting to MySQL: ", err);
        return;
    }
    console.log('\n Connected to MySQL database');
});
module.exports = connection;
