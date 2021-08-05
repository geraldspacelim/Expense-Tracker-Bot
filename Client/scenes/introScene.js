const WizardScene = require("telegraf/scenes/wizard");
const Composer = require("telegraf/composer");
const axios = require('axios');
const methods = require("../methods.js")

const step1 = ctx => {
    ctx.wizard.state.data = {};
    const telegramId = ctx.from.id
    ctx.wizard.state.data.id = telegramId
    methods.userTeleId = telegramId
    ctx.replyWithPhoto({
        source: "./assets/image.png"
    },
    {
        caption: "Welcome to expense tracker bot! I'll need some information from you. What is your name?",
    })
    return ctx.wizard.next();
}

const step2 = new Composer();

step2.on("text", ctx => {
    ctx.wizard.state.data.name = ctx.message.text
    ctx.reply("What is your age?")
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
    ctx.wizard.state.data.age = parseInt(ctx.message.text)
    ctx.reply("Last question! What is your salary?")
    return ctx.wizard.next();
})

const step4 = new Composer()

step4.on("text", ctx => {
    if (isNaN(ctx.message.text)) {
        const currentStepIndex = ctx.wizard.cursor;
        ctx.reply(
          "Please enter a valid number"
        );
        return ctx.wizard.selectStep(currentStepIndex);
    }
    const salary = parseFloat(ctx.message.text).toFixed(2)
    ctx.wizard.state.data.salary =  salary
    axios.post('http://localhost:8080/api/addNewUser', ctx.wizard.state.data).then(function (res){
        console.log(res.data)
        const savings = 0.4*salary
        const expense = 0.3*salary
        const retire = 0.2*salary
        const insurance = 0.1*salary 
        ctx.reply("Cash Savings & Loans: $" + savings + "\nExpenses: $" + expense + "\nRetirement Planning: $" + retire + "\nInsurance: $" + insurance + "\n\nTo start tracking your expenses, press /expense")
        return ctx.scene.leave()
    }).catch(function (error) {
        console.log(error)
    }) 
})

const introScene = new WizardScene(
    "introScene", ctx => step1(ctx), 
                         step2,
                         step3,
                         step4
);

module.exports = {introScene}

