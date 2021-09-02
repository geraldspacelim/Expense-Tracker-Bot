require('dotenv').config()
const Telegraf = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)
const Stage = require("telegraf/stage");
const session = require("telegraf/session");
const introScene = require("./scenes/introScene").introScene
const expenseScene = require("./scenes/expenseScene").expenseScene
const retrieveDBScene = require("./scenes/retrieveDBScene").retrieveDBScene
const amendScene = require("./scenes/amendScene").amendScene
const methods = require("./methods.js");

//amend budget

const stage = new Stage([introScene, expenseScene, retrieveDBScene, amendScene], {default: 'introScene '})
bot.use(session())
bot.use(stage.middleware())
bot.start(ctx => ctx.scene.enter("introScene"))
bot.command('amendparticulars', ctx => ctx.scene.enter('amendScene'))
bot.command('amendbudget', ctx => ctx.scene.enter("introScene", {amendBudget: true}))
bot.command('expense', ctx => ctx.scene.enter("expenseScene", {edit: false}))
bot.command('download', ctx => ctx.scene.enter("retrieveDBScene"))
bot.on("callback_query", ctx => ctx.scene.enter("expenseScene", {edit: true, callback_data: ctx}))
bot.command('previousreport', ctx => {
    var query = ctx.update.message.text.split(" ")[1]
    const qRegex = new RegExp(/^\w\w\w-\d\d\d\d/);
    if (!qRegex.test(query)) {
        ctx.reply("To retrieve past reports, please enter in the following format (MMM-YYYY)")
        return
    }
    const query_split = query.split("-")
    const month = methods.shortCalendar[query_split[0].toLowerCase()]
    const year = query_split[1]
    ctx.replyWithDocument({source: `../Records/${ctx.from.id}-${month}-${year}.xlsx`}).then(res => {
        console.log(res)
    }).catch(err => { 
        ctx.reply("There is no such document in your records")
    })
})
bot.command('report', async ctx  => {
    await methods.getMontlyExpenseReport(ctx.from.id).then(res => {
        var expenseMessage = ""
        res.expenses.forEach(expense => {
            expenseMessage += `${expense.Category}: $${parseFloat(expense.Total).toFixed(2)}\n`
        })
        var caption = `This is your monthly expenses for ${res.month}.\n\nBreakdown of expenses is as follow:\n${expenseMessage}`
        ctx.replyWithPhoto(res.url, {
            caption: caption
        })
    }).catch(err => {
        console.log(err)
    })
})

bot.launch()
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))