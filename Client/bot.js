require('dotenv').config()
const Telegraf = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)
const Stage = require("telegraf/stage");
const session = require("telegraf/session");
const introScene = require("./scenes/introScene").introScene
const expenseScene = require("./scenes/expenseScene").expenseScene
const retrieveDBScene = require("./scenes/retrieveDBScene").retrieveDBScene
const methods = require("./methods.js"); 

const stage = new Stage([introScene, expenseScene, retrieveDBScene], {default: 'introScene '})
bot.use(session())
bot.use(stage.middleware())
bot.start(ctx => ctx.scene.enter("introScene"))
bot.command('expense', ctx => ctx.scene.enter("expenseScene", {edit: false}))
bot.command('download', ctx => ctx.scene.enter("retrieveDBScene"))
bot.on("callback_query", ctx => ctx.scene.enter("expenseScene", {edit: true, callback_data: ctx}))
bot.command('pastreports', ctx => {
    var query = ctx.update.message.text.split(" ")[1]
    const qRegex = new RegExp(/^\w\w\w-\d\d\d\d/);
    if (!qRegex.test(query)) {
        ctx.reply("Format incorrect. Please try again like this e.g. Aug-2021")
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
        for (const expense in res.expenses) {
            expenseMessage += `${expense}: $${res.expenses[expense].toFixed(2)}`
        }
        var caption = `This is your monthly expenses for ${res.month}.B\n\nreakdown of expenses is as follow:\n${expenseMessage}`
        ctx.replyWithPhoto(res.url, {
            caption: caption
        })
    }).catch(err => {
        console.log(err)
    })
})

bot.launch()
