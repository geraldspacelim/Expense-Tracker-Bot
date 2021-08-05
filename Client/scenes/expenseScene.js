const WizardScene = require("telegraf/scenes/wizard");
const Composer = require("telegraf/composer");
const axios = require('axios');
const methods = require("../methods.js")

const step1 = ctx => {
    console.log(ctx.wizard.state.edit)
    ctx.wizard.state.data = {};
    ctx.wizard.state.data.id = ctx.from.id
    ctx.reply("What would you like to track?", {
        reply_markup: {
            keyboard: [
                [
                    {text: "Work Food", callback_data: 'work-food-category'},
                    {text: "Good Food", callback_data: 'good-food-category'}
                ], 
                [
                    {text: "Coffee", callback_data: 'coffee-category'},
                    {text: "Alcohol", callback_data: 'alcohol-category'},
                ],
                [
                    {text: "Necessities", callback_data: 'necessities-category'},
                    {text: "Shopping & Leisure", callback_data: 'shopping-category'},
                ],
                [
                    {text: "Ciggs", callback_data: 'ciggs-category'},
                    {text: "Private Transport", callback_data: 'transport-category'},
                ],
                [
                    {text: "Groceries", callback_data: 'groceries-category'},
                    {text: "Others", callback_data: "others"}
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
    const category = ctx.update.message.text
    if (!methods.category.includes(category)) {
        const currentStepIndex = ctx.wizard.cursor;
        console.log(currentStepIndex)
        ctx.reply(
          "Please select from the categories"
        );
        return ctx.wizard.selectStep(currentStepIndex);
    } else if (category === "Others") {
        ctx.reply("Please enter a category:")
        return ctx.wizard.selectStep(3)
    }
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
    ctx.reply("Please enter a description otherwise press /skip to record expense")
    return ctx.wizard.selectStep(4)
})

const step4 = new Composer()

step4.on("text", ctx => {
    if (!isNaN(ctx.message.text)) {
        const currentStepIndex = ctx.wizard.cursor;
        ctx.reply(
          "Please enter a valid category"
        );
        return ctx.wizard.selectStep(currentStepIndex);
    }
    ctx.wizard.state.data.category = methods.capitalize(ctx.update.message.text)
    ctx.reply("Enter a value: ")
    return ctx.wizard.selectStep(2)
}) 

const step5 = new Composer()

step5.on("text", ctx => {
    if (ctx.message.text === "/skip") {
        ctx.wizard.state.data.description = ""
    } else {
        ctx.wizard.state.data.description = ctx.message.text
    }

    if (ctx.wizard.state.data.edit) {
        axios.post('http://localhost:8080/api/updateExpense', ctx.wizard.state.data).then(function (res) {
            if(res.status== 200) {
                ctx.editMessageText
            }
        })
    }
    axios.post('http://localhost:8080/api/addNewExpense', ctx.wizard.state.data).then(function (res){
        if (res.status == 200) {
            ctx.reply("Your expense has been recorded", {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: 'Edit', callback_data:  `${ctx.message.message_id}.${res.data.uuid}`}
                        ]
                    ]
                }
            })
        }
        return ctx.scene.leave()
    }).catch(function (error) {
        console.log(error)
    }) 
})



const expenseScene = new WizardScene(
    "expenseScene", ctx => step1(ctx), 
                         step2,
                         step3,
                         step4,
                         step5, 
                        
);

module.exports = {expenseScene}