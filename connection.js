const mysql = require("mysql")

var connection = mysql.createPool({
    host: process.env.DB_HOST, 
    user: process.env.DB_ADMIN, 
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})

connection.getConnection((err, connection) => {
    if(err) throw err; 
    console.log(`Connected as ID ${connection.threadId}`)
})


module.exports = connection;