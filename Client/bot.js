require('dotenv').config()
const Telegraf = require('telegraf')

const bot = new Telegraf(process.env.BOT_TOKEN)
const Stage = require("telegraf/stage");
const session = require("telegraf/session");
const WizardScene = require("telegraf/scenes/wizard");
const axios = require('axios');
const cron = require('node-cron')
// const LocalSession = require('telegraf-session-local')

let userTeleId = undefined

const introScene = new WizardScene(
    "introScene", 
    ctx => {
        ctx.wizard.state.data = {};
        const telegramId = ctx.from.id
        ctx.wizard.state.data.id = telegramId
        userTeleId = telegramId
        ctx.replyWithPhoto({
            source: "./assets/image.png"
        },
        {
            caption: "Welcome to expense tracker bot! I'll need some information from you. What is your name?",
        })
        return ctx.wizard.next();
    },
    ctx => {
        ctx.wizard.state.data.name = ctx.message.text
        ctx.reply("What is your age?")
        return ctx.wizard.next();
    },
    ctx => {
        ctx.wizard.state.data.age = parseInt(ctx.message.text)
        ctx.reply("Last question! What is your salary?")
        return ctx.wizard.next();
    },
    ctx => {
        const salary = parseFloat(ctx.message.text).toFixed(2)
        ctx.wizard.state.data.salary =  salary
        axios.post('http://localhost:8080/api/addNewUser', ctx.wizard.state.data).then(function (res){
            console.log(res.data)
        }).catch(function (error) {
            console.log(error)
        })
        const savings = 0.4*salary
        const expense = 0.3*salary
        const retire = 0.2*salary
        const insurance = 0.1*salary 
        ctx.reply("Cash Savings & Loans: $" + savings + "\nExpenses: $" + expense + "\nRetirement Planning: $" + retire + "\nInsurance: $" + insurance + "\n\nTo start tracking your expenses, press /expense")
        return ctx.scene.leave()
    }
)

const expenseScene = new WizardScene(
    "expenseScene", 
    ctx => {
        ctx.wizard.state.data = {};
        ctx.wizard.state.data.id = ctx.from.id
        ctx.reply("What would you like to track?", {
            reply_markup: {
                keyboard: [
                    [
                        {text: "Work Food", callback_data: 'work-food-category'},
                    ], 
                    [
                        {text: "Good Food", callback_data: 'good-food-category'},
                    ],
                    [
                        {text: "Coffee", callback_data: 'coffee-category'},
                    ],
                    [
                        {text: "Alcohol", callback_data: 'alcohol-category'},
                    ],
                    [
                        {text: "Necessities", callback_data: 'necessities-category'},
                    ],
                    [
                        {text: "Shopping & Leisure", callback_data: 'shopping-category'},
                    ],
                    [
                        {text: "Ciggs", callback_data: 'ciggs-category'},
                    ],
                    [
                        {text: "Private Transport", callback_data: 'transport-category'},
                    ],
                    [
                        {text: "Groceries", callback_data: 'groceries-category'}
                    ]
                ],
                one_time_keyboard: true,
                resize_keyboard: true
            }
        })
        return ctx.wizard.next();
    },
    ctx => {
        const category = ctx.update.message.text
        ctx.wizard.state.data.category =  category
        ctx.reply("Enter a value: ")
        return ctx.wizard.next();
    }, ctx => {
        const expense = parseFloat(ctx.message.text).toFixed(2)
        ctx.wizard.state.data.expense =  expense
        axios.post('http://localhost:8080/api/addNewExpense', ctx.wizard.state.data).then(function (res){
            console.log(res.data)
        }).catch(function (error) {
            console.log(error)
        })
        ctx.reply("Your expense has been recorded")
        return ctx.wizard.next();
    }
)
async function getMontlyExpenseReport(telegramId) {

    try {
        const res = await axios.get(`http://localhost:8080/api/getCurrentMonthExpense/${telegramId}`);
        if (res.data != []) {
            var report = ""
            var total = 0
            for(let i = 0; i<res.data.length; i++){
                report += res.data[i]['Category'] + ": " + "$" + res.data[i]['Total'].toFixed(2) + "\n"
                total += parseFloat(res.data[i]['Total'])
            }
            return report + "\nTotal: $" + total.toFixed(2)
        }
      } catch (error) {
        console.error(error);
      }
}
bot.command('report', async ctx  => {
    await getMontlyExpenseReport(ctx.from.id).then(res => {
        ctx.reply(res)
    }).catch(err => {
        console.log(err)
    })
})

cron.schedule('0 0 1 * *', async () => {
    await getMontlyExpenseReport(userTeleId).then(res => {
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


bot.launch()
