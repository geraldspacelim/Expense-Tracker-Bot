require('dotenv').config()
const Telegraf = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)
const Stage = require("telegraf/stage");
const session = require("telegraf/session");
const cron = require('node-cron')
const introScene = require("./scenes/introScene").introScene
const expenseScene = require("./scenes/expenseScene").expenseScene
const methods = require("./methods.js") 

cron.schedule('0 0 1 * *', async () => {
    const userTeleId = methods.userTeleId
    await methods.getMontlyExpenseReport(userTeleId).then(res => {
        bot.telegram.sendMessage(userTeleId, res)
    }).catch(err => {
        console.log(err)
    })
});
  

const stage = new Stage([introScene, expenseScene], {default: 'introScene '})
bot.use(session())
bot.use(stage.middleware())
bot.start(ctx => ctx.scene.enter("introScene"))
bot.command('expense', ctx => ctx.scene.enter("expenseScene"))
bot.command('report', async ctx  => {
    await methods.getMontlyExpenseReport(ctx.from.id).then(res => {
        ctx.reply(res)
    }).catch(err => {
        console.log(err)
    })
})
bot.launch()
