const WizardScene = require("telegraf/scenes/wizard");
const Composer = require("telegraf/composer");
const axios = require('axios');
const methods = require("../methods.js")

const step1 = ctx => {
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
}

const step2 = new Composer()

step2.on("text", ctx => {
    if (!methods.category.includes(ctx.update.message.text )) {
        const currentStepIndex = ctx.wizard.cursor;
        ctx.reply(
          "Please select from the categories"
        );
        return ctx.wizard.selectStep(currentStepIndex);
    }
    const category = ctx.update.message.text
    ctx.wizard.state.data.category =  category
    ctx.reply("Enter a value: ")
    return ctx.wizard.next();
})

const step3 = new Composer()

step3.on("text", ctx => {
    if (isNaN(ctx.message.text)) {
        const currentStepIndex = ctx.wizard.cursor;
        ctx.reply(
          "Please enter a valid number"
        );
        return ctx.wizard.selectStep(currentStepIndex);
    }
    const expense = parseFloat(ctx.message.text).toFixed(2)
    ctx.wizard.state.data.expense =  expense
    axios.post('http://localhost:8080/api/addNewExpense', ctx.wizard.state.data).then(function (res){
        console.log(res.data)
    }).catch(function (error) {
        console.log(error)
    })
    ctx.reply("Your expense has been recorded")
    return ctx.wizard.next();
})

const expenseScene = new WizardScene(
    "expenseScene", ctx => step1(ctx), 
                         step2,
                         step3,
                        
);

module.exports = {expenseScene}