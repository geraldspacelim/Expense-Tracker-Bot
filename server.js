require('dotenv').config()
const express = require("express");
const cors = require("cors");
const app = express()
const port = process.env.PORT || 8080;
const { nanoid } = require('nanoid')
const sql = require("./connection")
const Moment = require('moment-timezone')
const methods = require("./methods.js");
const cron = require('node-cron')
const Excel = require('exceljs');
const Telegraf = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

cron.schedule('0 12 * * *', async () => {
    sql.query(`select * from Subscribers`, 
    (error, result) => {
        if(error) throw error;
        if (result != []) {
            result.forEach(async user => {
                const firstNoti = user.FirstNoti == 0 ? false : true
                const secondNoti = user.SecondNoti == 0 ? false : true
                if (!(firstNoti && secondNoti) || !secondNoti) {
                    await checkExpenseLimit(user).then((_) => {
                        return
                    }).catch(err => console.log(err))
                }
            })
        }
    })
}, {
    scheduled: true,
    timezone: "Asia/Singapore"
})



cron.schedule('0 0 1 * *', () => {
    sql.query(`select * from Subscribers`, 
    (error, result) => {
        if(error) throw error;
        if (result != []) {
            result.forEach(async user => {
                await sendProgressReport(user).then((_) => {
                    sql.query(`delete from Expenses where ID = ${user.ID}`, 
                    (error, result) => {
                        if(error) throw error;
                        return
                    })
                }).catch(err => console.log(err))
            })
        }
    })
},
    {
        scheduled: true,
        timezone: "Asia/Singapore"
    }
);

app.get("/api/test", (req, res) => {
    sql.query(`select * from Subscribers where ID = 260677589`, 
    (error, result) => {
        if(error) throw error;
        result.forEach(async user => {
            await sendProgressReport(result[0]).then((_) => {
                sql.query(`delete from Expenses where ID = ${user.ID}`, 
                (error, result) => {
                    if(error) throw error;
                    return
                })
            }).catch(err => console.log(err))
        })
    }) 
})

async function checkExpenseLimit(user) {
    sql.query(`select sum(Expense) as Total from Expenses where ID = ${user.ID}`, 
    (error, result) => {
        if(error) throw error;
        if (result[0].Total/user.Expense >= 1) {
            sql.query(`update Subscribers set SecondNoti = true where ID = ${user.ID}`, 
            (error, result) => {
                if(error) throw error;
                bot.telegram.sendMessage(user.ID, "🚨You have spent 100% of your budget this month! Please practice mindfulness in your expenses!")
                return
            }) 
        } else if (result[0].Total/user.Expense >= 0.8 && user.FirstNoti != 1) {
            sql.query(`update Subscribers set firstNoti = true where ID = ${user.ID}`, 
            (error, result) => {
                if(error) throw error;
                bot.telegram.sendMessage(user.ID, "🚨You have spent 80% of your budget this month! Please practice mindfulness in your expenses!")
                return
            }) 
        }
    })
}

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

async function sendProgressReport(user) {
    const currentMonth = Moment().tz('Asia/Singapore').month() + 1
    const workbook = new Excel.Workbook();
    const summary = workbook.addWorksheet('Summary', {views: [{showGridLines: false}]});
    const currentTime = Moment().tz('Asia/Singapore')
    const month = currentMonth.toString().padStart(2, '0')
    const year = currentTime.year()
    const aaheadstart = workbook.addImage({
        filename: './assets/excel.jpg',
        extension: 'jpeg',
        useStyles: true
        });
    summary.addImage(aaheadstart, 'A1:C14')
    const breakdown = workbook.addWorksheet('Breakdown');
    
    summary.getRow(19).values = ['Category', 'Total Expense']
    summary.getCell('A16').value = `Month Expense Report for ${user.Username}`
    summary.getCell('A16').font = {
        size: 12,
        bold: true
    }
    summary.getCell('A17').value = `Details of your Expense account for ${methods.calendar[currentMonth]}`
    summary.getCell('A17').font = {
        size: 12,
        bold: true
    }
    sql.query(`SELECT Category, SUM(Expense) AS 'Total' from Expenses where ID = ${user.ID} AND CreatedON like '${year}%-${month}%' GROUP BY Category`, 
    (error, result) => {
        if(error) throw error;
        if (result != []) {
            summary.columns = [
                {key: 'category', width: 20},
                {key: 'total_expense', width: 10}
            ];
            summary.getCell('A19').font = {
                bold: true
            }
            summary.getCell('B19').font = {
                bold: true
            }
            var totalExpenses = 0

            for (const category of result){
                totalExpenses += category.Total
                summary.addRow(
                    { category: category.Category, total_expense:  `$${category.Total.toFixed(2)}`},
                ); 
            }
        }
        var summary_row = summary.addRow(
            { total_expense:  `$${totalExpenses.toFixed(2)}`},
        ); 
        summary.getCell(summary_row._cells[1]._address).border = {
            top: {style:'thin'},
            bottom: {style:'double'}
        }
        sql.query(`select Category, CreatedOn, Expense, Description from Expenses where ID = ${user.ID} AND CreatedOn like '${year}%-${month}%' order by CreatedOn`,
        (error, result) => {
            if(error) throw error; 
            if (result != []) {
                // var summaryExpense = ""
                breakdown.columns = [
                    { header: 'Category', key: 'category' },
                    { header: 'Created On', key: 'created_on' },
                    { header: 'Expense', key: 'expense' },
                    { header: 'Description', key: 'description' }
                ];
                for (const item of result){
                    // summaryExpense += `${item.Category}: $${parseFloat(item.Expense).toFixed(2)}\n`
                    breakdown.addRow(
                        { category: item.Category, created_on: item.CreatedOn, expense:  `$${parseFloat(item.Expense).toFixed(2)}`, description: item.Description},
                    ); 
                }
                workbook
                .xlsx
                .writeFile(`./Records/${user.ID}-${methods.calendar[currentMonth]}-${year}.xlsx`)
                    .then(() =>  {
                        // var summary = ""
                        bot.telegram.sendDocument(user.ID, {source: `./Records/${user.ID}-${methods.calendar[currentMonth]}-${year}.xlsx`}, {caption: `Attached is your expense report for the month of ${methods.calendar[currentMonth]}.`}).then(async (_) => {
                            sql.query(`update Subscribers set FirstNoti = false, SecondNoti = false where ID = ${user.ID}`,
                            (error, result) => {
                                if(error) throw error;
                                return 
                            })
                        })
                    })
                .catch((err) => {
                    console.log("err", err);
                });
            }
        })
    })
}

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})

