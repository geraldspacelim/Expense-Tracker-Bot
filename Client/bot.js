require('dotenv').config()
const Telegraf = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)
const Stage = require("telegraf/stage");
const session = require("telegraf/session");
const introScene = require("./scenes/introScene").introScene
const expenseScene = require("./scenes/expenseScene").expenseScene
const retrieveDBScene = require("./scenes/retrieveDBScene").retrieveDBScene
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


// ring once 
// every month to reset 



const stage = new Stage([introScene, expenseScene, retrieveDBScene], {default: 'introScene '})
bot.use(session())
bot.use(stage.middleware())
bot.start(ctx => ctx.scene.enter("introScene"))
bot.command('expense', ctx => ctx.scene.enter("expenseScene", {edit: false}))
bot.command('download', ctx => ctx.scene.enter("retrieveDBScene"))
bot.on("callback_query", ctx => ctx.scene.enter("expenseScene", {edit: true, callback_data: ctx}))
bot.command('report', async ctx  => {
    await methods.getMontlyExpenseReport(ctx.from.id).then(res => {
        var caption = `This is your monthly expenses for ${res.month}.`
        ctx.replyWithPhoto(res.url, {
            caption: caption
        })
    }).catch(err => {
        console.log(err)
    })
})


bot.command('test', ctx => {
    const currentMonth = Moment().tz('Asia/Singapore').month() + 1
    const workbook = new Excel.Workbook();
    const summary = workbook.addWorksheet('Summary', {views: [{showGridLines: false}]});
    const userData = JSON.parse(data);
    const telegramId = userData.telegramId
    const username = userData.username
    const aaheadstart = workbook.addImage({
        filename: './assets/excel.jpg',
        extension: 'jpeg',
        useStyles: true
        });
    summary.addImage(aaheadstart, 'A1:C14')
    const breakdown = workbook.addWorksheet('Breakdown');
    
    summary.getRow(19).values = ['Category', 'Total Expense']
    summary.getCell('A16').value = `Month Expense Report for ${username}`
    summary.getCell('A16').font = {
        size: 12,
        bold: true
    }
    summary.getCell('A17').value = `Details of your Expense account for ${methods.calendar[currentMonth]}`
    summary.getCell('A17').font = {
        size: 12,
        bold: true
    }
    axios.get(`http://localhost:8080/api/getCurrentMonthExpense/${telegramId}`).then(res => {
        if (res.data != []) {
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

            for (const category of res.data){
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

        axios.get(`http://localhost:8080/api/getAllCurrentMonthExpense/${telegramId}`).then(res => {
            breakdown.columns = [
                { header: 'Category', key: 'category' },
                { header: 'Created On', key: 'created_on' },
                { header: 'Expense', key: 'expense' },
                { header: 'Description', key: 'description' }
            ];
            for (const item of res.data){
                breakdown.addRow(
                    { category: item.Category, created_on: item.CreatedOn.split('T')[0], expense:  `$${parseFloat(item.Expense).toFixed(2)}`, description: item.Description},
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
