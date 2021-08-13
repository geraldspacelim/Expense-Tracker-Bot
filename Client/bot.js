require('dotenv').config()
const Telegraf = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)
const Stage = require("telegraf/stage");
const session = require("telegraf/session");
const cron = require('node-cron')
const introScene = require("./scenes/introScene").introScene
const expenseScene = require("./scenes/expenseScene").expenseScene
const methods = require("./methods.js"); 
const LocalSession = require("telegraf-session-local");
const axios = require('axios');
const Moment = require('moment-timezone');
const Excel = require('exceljs');

const property = "data";
const localSession = new LocalSession({
  storage: LocalSession.storageMemory
});

bot.use(localSession.middleware(property));

cron.schedule('0 0 1 * *', async () => {
    const workbook = new Excel.Workbook();
    const summary = workbook.addWorksheet('Summary');
    const breakdown = workbook.addWorksheet('Breakdown');
    const currentMonth = Moment().tz('Asia/Singapore').month() + 1
    const telegramId = methods.telegramId
    axios.get(`http://localhost:8080/api/getCurrentMonthExpense/${telegramId}`).then(res => {
        if (res.data != []) {
            summary.columns = [
                { header: 'Category', key: 'category' },
                { header: 'Total Expense', key: 'total_expense' }
            ];
            for (const category of res.data){
                summary.addRow(
                    { category: category.Category, total_expense:  `$${parseFloat(category.Total).toFixed(2)}`},
                ); 
            }
        }  
        axios.get(`http://localhost:8080/api/getAllCurrentMonthExpense/${telegramId}`).then(res => {
            breakdown.columns = [
                { header: 'Category', key: 'category' },
                { header: 'Created On', key: 'created_on' },
                { header: 'Expense', key: 'expense' },
                { header: 'Description', key: 'description' }
            ];
            for (const item of res.data){
                breakdown.addRow(
                    { category: item.Category, created_on: item.CreatedOn, expense:  `$${parseFloat(item.Expense).toFixed(2)}`, description: item.Description},
                ); 
            }
            workbook
            .xlsx
            .writeFile('Expense.xlsx')
                .then(() => {
                    bot.telegram.sendDocument(telegramId, {source: 'Expense.xlsx'}, {caption: `This is your expense report for the month of ${methods.calendar[currentMonth]}.`})
            })
            .catch((err) => {
              console.log("err", err);
            });
        }).catch(e => {
            console.log(e)
        })
    }).catch (e => {
        console.log(e)
    })
},
    {
        scheduled: true,
        timezone: "Asia/Singapore"
    }
);
  

const stage = new Stage([introScene, expenseScene], {default: 'introScene '})
bot.use(session())
bot.use(stage.middleware())
bot.start(ctx => ctx.scene.enter("introScene"))
bot.command('expense', ctx => ctx.scene.enter("expenseScene", {edit: false}))
bot.on("callback_query", ctx => ctx.scene.enter("expenseScene", {edit: true, callback_data: ctx}))

bot.command('report', async ctx  => {
    await methods.getMontlyExpenseReport(methods.telegramId, ctx["data"].salaryBreakdown["expense"]).then(res => {
        var caption = `This is your monthly expenses for ${res.month}.`
        ctx.replyWithPhoto(res.url, {
            caption: caption
        })
    }).catch(err => {
        console.log(err)
    })
})

bot.command('test', async ctx => {
    const workbook = new Excel.Workbook();
    const summary = workbook.addWorksheet('Summary');
    const breakdown = workbook.addWorksheet('Breakdown');
    const currentMonth = Moment().tz('Asia/Singapore').month() + 1
    const telegramId = methods.telegramId
    axios.get(`http://localhost:8080/api/getCurrentMonthExpense/${telegramId}`).then(res => {
        if (res.data != []) {
            summary.columns = [
                { header: 'Category', key: 'category' },
                { header: 'Total Expense', key: 'total_expense' }
            ];
            for (const category of res.data){
                summary.addRow(
                    { category: category.Category, total_expense:  `$${parseFloat(category.Total).toFixed(2)}`},
                ); 
            }
        }  
        axios.get(`http://localhost:8080/api/getAllCurrentMonthExpense/${telegramId}`).then(res => {
            breakdown.columns = [
                { header: 'Category', key: 'category' },
                { header: 'Created On', key: 'created_on' },
                { header: 'Expense', key: 'expense' },
                { header: 'Description', key: 'description' }
            ];
            for (const item of res.data){
                breakdown.addRow(
                    { category: item.Category, created_on: item.CreatedOn, expense:  `$${parseFloat(item.Expense).toFixed(2)}`, description: item.Description},
                ); 
            }
            workbook
            .xlsx
            .writeFile('Expense.xlsx')
                .then(() => {
                    bot.telegram.sendDocument(telegramId, {source: 'Expense.xlsx'}, {caption: `This is your expense report for the month of ${methods.calendar[currentMonth]}.`})
            })
            .catch((err) => {
              console.log("err", err);
            });
        }).catch(e => {
            console.log(e)
        })
    }).catch (e => {
        console.log(e)
    })
})


bot.launch()
