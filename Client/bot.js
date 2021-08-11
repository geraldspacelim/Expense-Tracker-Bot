require('dotenv').config()
const Telegraf = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)
const Stage = require("telegraf/stage");
const session = require("telegraf/session");
const cron = require('node-cron')
const introScene = require("./scenes/introScene").introScene
const expenseScene = require("./scenes/expenseScene").expenseScene
const methods = require("./methods.js"); 

cron.schedule('0 0 1 * *', async () => {
    const userTeleId = methods.userTeleId
    await methods.getMontlyExpenseReport(userTeleId, methods.monthlyExpense).then(res => {
        var caption = `This is your monthly expenses for ${res.month}.`
        ctx.replyWithPhoto(res.url, {
            caption: caption
        })
    }).catch(err => {
        console.log(err)
    })
});
  

const stage = new Stage([introScene, expenseScene], {default: 'introScene '})
bot.use(session())
bot.use(stage.middleware())
bot.start(ctx => ctx.scene.enter("introScene"))
bot.command('expense', ctx => ctx.scene.enter("expenseScene", {edit: false}))
bot.on("callback_query", ctx => ctx.scene.enter("expenseScene", {edit: true, callback_data: ctx}))

bot.command('report', async ctx  => {
    await methods.getMontlyExpenseReport(ctx.from.id, methods.budgetAllocation.expense).then(res => {
        var caption = `This is your monthly expenses for ${res.month}.`
        if (res.isOverSpent) {
            caption += "\n\n🚨You have spent 80% of your budget this month! Please practice mindfulness in your expenses!"
        }
        ctx.replyWithPhoto(res.url, {
            caption: caption
        })
    }).catch(err => {
        console.log(err)
    })
})

bot.launch()
