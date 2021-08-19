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
    const dob = req.body.dob
    const occupation = req.body.occupation
    const salary = req.body.salary
    const savings = req.body.savings 
    const expense = req.body.expense
    const retirement = req.body.retirement
    const insurance = req.body.insurance
    const username = req.body.username  
    sql.query(`insert into Subscribers values (${id}, '${name}', '${dob}', '${occupation}', ${salary}, ${savings}, ${expense}, ${retirement}, ${insurance}, '${username}', false, false) on duplicate key update Username = '${name}', Dob = '${dob}', Occupation = '${occupation}', Salary = ${salary}, TelegramId = '${username}'`, 
    (error, result) => {
        if(error) throw error;
        res.send('new user record added successfully!')
    })
})

app.get("/api/getSubscriber/:id", (req, res) => {
    const id = req.params.id
    sql.query(`select * from Subscribers where ID = ${id}`, 
    (error, result) => {
        if(error) throw error;
        res.send(result )
    }
    )
})

app.post("/api/addNewExpense", (req, res) => {
    const uuid = nanoid()
    const id = req.body.id
    const category = req.body.category
    const createdOn = Moment().tz('Asia/Singapore').format('YYYY-MM-DD')
    const expense = req.body.expense
    const description = req.body.description
    sql.query(`insert into Expenses values ('${uuid}', ${id}, '${category}', '${createdOn}', ${expense}, '${description}')`, 
    (error, result) => {
        if(error) throw error;
        res.status(200).send({uuid: uuid})
    })
})

app.post("/api/updateExpense", (req, res) => {
    const category = req.body.category
    const expense = req.body.expense 
    const description = req.body.description 
    const uuid = req.body.uuid
    sql.query(`update Expenses set Category = "${category}", Expense = ${expense}, Description = "${description}" where UUID = "${uuid}"`,
    (error, result) => {  
        if(error) throw error;
        res.status(200).send()
    })
})

app.get("/api/getCurrentMonthExpense/:id", (req, res) => {
    const id = req.params.id
    const currentTime = Moment().tz('Asia/Singapore')
    const month = String(currentTime.month() + 1).padStart(2, '0')
    const year = currentTime.year()
    sql.query(`SELECT Category, SUM(Expense) AS 'Total' from Expenses where ID = ${id} AND CreatedON like '${year}%-${month}%' GROUP BY Category`, 
    (error, result) => {
        if(error) throw error;
        res.send(result)
    })
})

app.get("/api/getTotalExpense/:id", (req, res) => {
    const id = req.params.id
    sql.query(`select sum(Expense) as Total from Expenses where ID = ${id}`, 
    (error, result) => {
        if(error) throw error;
        res.send(result)
    })
})

app.get("/api/getAllCurrentMonthExpense/:id", (req,res) => {
    const id = req.params.id
    const currentTime = Moment().tz('Asia/Singapore')
    const month = String(currentTime.month() + 1).padStart(2, '0')
    const year = currentTime.year()
    sql.query(`select Category, CreatedOn, Expense, Description from Expenses where ID = ${id} AND CreatedOn like '${year}%-${month}%' order by CreatedOn`,
    (error, result) => {
        if(error) throw error; 
        res.send(result)
    }
    )
})

app.post("/api/updateSubscriber/:id", (req,res) => {
    const id = req.params.id
    const savings = req.body.savings 
    const expense = req.body.expense
    const retirement = req.body.retirement
    const insurance = req.body.insurance 
    sql.query(`update Subscribers set Savings = ${savings}, Expense = ${expense}, Retirement = ${retirement}, Insurance = ${insurance} where ID = ${id}`,
    (error, result) => {
        if(error) throw error;
        res.status(200).send()
    }
    )
})

app.get("/api/authenticate/:id", (req, res) => {
    const id = req.params.id
    sql.query(`Select * from Credentials where ID = ${id}`, 
    (error, result) => {
        if(error) throw error;
        res.send(result)
    })
})

app.get("/api/allSubscribers", (req, res) => {
    sql.query(`select * from Subscribers`, 
    (error, result) => {
        if(error) throw error;
        res.send(result)
    })
})


app.get("/api/allExpenses", (req, res) => {
    sql.query(`select * from Expenses order by ID`, 
    (error, result) => {
        if(error) throw error;
        res.send(result)
    })
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

