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
const converter = require('json-2-csv');
const fs = require('fs');
const Moment = require('moment-timezone')


const property = "data";
const localSession = new LocalSession({
  storage: LocalSession.storageMemory
});

bot.use(localSession.middleware(property));

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
    await methods.getMontlyExpenseReport(ctx["data"].telegramId, ctx["data"].salaryBreakdown.expense).then(res => {
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

bot.command('test', async ctx => {
    let caption = ""
    let expenses = ""
    axios.get(`http://localhost:8080/api/getCurrentMonthExpense/${ctx.from.id}`).then(res => {
        if (res.data != []) {
            var total = 0
            for (const category of res.data){
              const expenseValue = parseFloat(category.Total)
              expenses += `${category.Category}: $${expenseValue.toFixed(2)}\n`
            //   data.push(expenseValue)
              total += expenseValue
            }
        }  
        const currentTime = Moment().tz('Asia/Singapore')
        const monthNum = currentTime.month() + 1
        const month = methods.calendar[monthNum]
        caption += `Your total expense for ${month} is $${total.toFixed(2)}. Below is a summary of your expenses:\n${expenses}\n\nAttached is the in-depth breakdown of your expesnses.`
        // console.log(caption)
    }).catch (e => {
        console.log(e)
    })

    axios.get(`http://localhost:8080/api/getAllCurrentMonthExpense/${ctx.from.id}`).then(res => {
        converter.json2csv(res.data, (err, csv) => {
            if (err) {
                throw err;
            }
            fs.writeFileSync('report.csv', csv);
            ctx.replyWithDocument({source: 'report.csv'},{ caption: caption})
        });
    }).catch(e => {
        console.log(e)
    })
    // ctx.reply(caption)

})  

bot.launch()
