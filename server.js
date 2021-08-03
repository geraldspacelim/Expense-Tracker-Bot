require('dotenv').config()
const express = require("express");
const cors = require("cors");
const app = express()
const port = process.env.PORT || 8080;
const { nanoid } = require('nanoid')
const sql = require("./connection")
const Moment = require('moment-timezone')


app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.post("/api/addNewUser", (req, res) => {
    const id = req.body.id
    const name = req.body.name
    const age = req.body.age
    const salary = req.body.salary
    sql.query(`insert into Subscribers values (${id}, '${name}', ${age}, ${salary}) on duplicate key update Username = '${name}', Age = ${age}, Salary = ${salary}`, 
    (error, result) => {
        if(error) throw error;
        res.send('new user record added successfully!')
    })
})

app.post("/api/addNewExpense", (req, res) => {
    const uuid = nanoid()
    const id = req.body.id
    const category = req.body.category
    const createdOn = Moment().tz('Asia/Singapore').format('YYYY-MM-DD')
    const expense = req.body.expense
    sql.query(`insert into Expenses values ('${uuid}', ${id}, '${category}', '${createdOn}', ${expense})`, 
    (error, result) => {
        if(error) throw error;
        res.send('new expense record added successfully!')
    })
})

app.get("/api/getCurrentMonthExpense/:id", (req, res) => {
    const id = req.params.id
    const currentTime = Moment().tz('Asia/Singapore')
    const month = String(currentTime.month() + 1).padStart(2, '0')
    const year = currentTime.year()
    sql.query(`SELECT SUM(Expense) AS 'Total', Category FROM Expenses where ID = ${id} AND CreatedON like '${year}%-${month}%' GROUP BY Category`, 
    (error, result) => {
        if(error) throw error;
        res.send(result)
    })
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

