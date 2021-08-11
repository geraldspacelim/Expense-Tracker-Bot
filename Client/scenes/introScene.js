const WizardScene = require("telegraf/scenes/wizard");
const Composer = require("telegraf/composer");
const axios = require('axios');
const methods = require("../methods.js")

const step1 = ctx => {
    ctx.wizard.state.data = {};
    const telegramId = ctx.from.id
    ctx.wizard.state.data.id = telegramId
    methods.userTeleId = telegramId
    ctx.reply ("Hello! Congrats for taking the first step to get AAHEADSTART in Adulting!🎉 I’m your friendly expense tracking bot. Before we get started, I’d like to get to know you a little better. What is your name?\n\n<i>By using this service, you agree to the terms and conditions governing your use of @AAheadstart_bot online service.</i>", {
        parse_mode: "HTML"
    })
    return ctx.wizard.next();
}

const step2 = new Composer();

step2.on("text", ctx => {
    ctx.wizard.state.data.name = ctx.message.text
    ctx.reply("What is your date of birth? (DD-MMM-YYYY)")
    return ctx.wizard.next();
})

const step3 = new Composer() 

step3.on("text", ctx => {
    var dtRegex = new RegExp(/^\d\d?-\w\w\-\d\d\d\d/);
    if (!dtRegex.test(ctx.message.text)) {
        const currentStepIndex = ctx.wizard.cursor;
        ctx.reply(
          "Please enter your date of birth in this format DD-MM-YYYY."
        );
        return ctx.wizard.selectStep(currentStepIndex);
    }
    ctx.wizard.state.data.dob = ctx.message.text
    ctx.reply("Which category do you fall under? Polytechnic, University, Fresh Graduate, Employed, Unemployed", {
        reply_markup: {
            keyboard: [
                [
                    {text: "Polytechnic", callback_data: "Polytechnic"}
                ],
                [
                    {text: "University", callback_data: "University"}
                ],
                [
                    {text: "Fresh Graduate", callback_data: "Fresh Graduate"}
                ],
                [
                    {text: "Employed", callback_data: "Employed"}
                ],
                [
                    {text: "Unemployed", callback_data: "Unemployed"}
                ]
            ]
        }
    })
    return ctx.wizard.next();
})

const step4 = new Composer()

step4.on("text", ctx => {
    const occupation = ctx.update.message.text
    if (!methods.occupation.includes(occupation)) {
        const currentStepIndex = ctx.wizard.cursor;
        ctx.reply(
          "Please select from the categories:"
        );
        return ctx.wizard.selectStep(currentStepIndex);
    }
    ctx.wizard.state.data.occupation = ctx.message.text
    ctx.reply("Last question! What is your monthly income or allowance?")
})


const step5 = new Composer()

step5.on("text", ctx => {
    if (isNaN(ctx.message.text)) {
        const currentStepIndex = ctx.wizard.cursor;
        ctx.reply(
          "Please enter a valid number:"
        );
        return ctx.wizard.selectStep(currentStepIndex);
    }
    const salary = parseFloat(ctx.message.text).toFixed(2)
    methods.monthlyExpense = salary
    ctx.wizard.state.data.salary =  salary
    axios.post('http://localhost:8080/api/addNewUser', ctx.wizard.state.data).then(function (res){
        console.log(res.data)
        const savings = 0.4*salary
        const expense = 0.3*salary
        const retire = 0.2*salary
        const insurance = 0.1*salary 
        ctx.replyWithPhoto({
            source: "./assets/image.jpg"
        },
        {
        caption: "Recommended allocation for: 40% Cash Savings & Loans: $" + savings + "\n30% Expenses: $" + expense + "\n20% Retirement Planning: $" + retire + "\n10% Insurance: $" + insurance + "\n\nYour goal is to keep your monthly expenses below $" + expense + ". I will be there with you every step of the way! Good luck! 👍🏻",
        }
        )
        return ctx.scene.leave()
    }).catch(function (error) {
        console.log(error)
    }) 
})

const introScene = new WizardScene(
    "introScene", ctx => step1(ctx), 
                         step2,
                         step3,
                         step4,
                         step5,
);

module.exports = {introScene}
