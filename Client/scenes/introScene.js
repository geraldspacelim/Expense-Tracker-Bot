const WizardScene = require("telegraf/scenes/wizard");
const Composer = require("telegraf/composer");
const axios = require('axios');
const methods = require("../methods.js");
const e = require("express");

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
    ctx.reply("What is your date of birth? (DD-MM-YYYY)")
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
                    {text: "Polytechnic"}
                ],
                [
                    {text: "University"}
                ],
                [
                    {text: "Fresh Graduate"}
                ],
                [
                    {text: "Employed"}
                ],
                [
                    {text: "Unemployed"}
                ]
            ]
        }
    })
    return ctx.wizard.next();
})

const step4 = new Composer()

step4.on('text', ctx => {
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
    return ctx.wizard.next();
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
    ctx.wizard.state.data.salary =  salary
    axios.post('http://localhost:8080/api/addNewUser', ctx.wizard.state.data).then(function (res){
        const savings = 0.4*salary
        const expense = 0.3*salary
        const retire = 0.2*salary
        const insurance = 0.1*salary 
        methods.salaryBreakdown = {
            savings: savings,
            expense: expense,
            retire: retire,
            insurance: insurance
        }
        ctx.replyWithPhoto({
            source: "./assets/image.jpg"
        },
            {
                caption: "Recommended allocation for: \n40% Cash Savings & Loans: $" + savings + "\n30% Expenses: $" + expense + "\n20% Retirement Planning: $" + retire + "\n10% Insurance: $" + insurance + "\n\nYour goal is to keep your monthly expenses below $" + expense + ". I will be there with you every step of the way! Good luck! 👍🏻 \n\nWould you like to amend the allocated budget for any of the categories above?",
                reply_markup: {
                    keyboard: [
                        [
                            {text: "Yes"}
                        ],
                        [
                            {text: "No"}
                        ],
                    ]
                }
            }
        )
        return ctx.wizard.next();
        // return ctx.scene.leave()
    }).catch(function (error) {
        console.log(error)
    }) 
})

const step6 = new Composer() 

step6.on("text", ctx => {
    const amendCategory = ctx.update.message.text
    if (!methods.answers.includes(amendCategory)) {
        const currentStepIndex = ctx.wizard.cursor;
        ctx.reply(
          "Please select Yes or No"
        );
        return ctx.wizard.selectStep(currentStepIndex);
    } 
    if (amendCategory === "Yes") {
        ctx.wizard.state.data.isAmend =  true
        ctx.reply("Which category, would you like to amend?", {
            reply_markup: {
                keyboard: [
                    [
                        {text: "Cash Savings & Loans"}
                    ],
                    [
                        {text: "Expenses"}
                    ],
                    [
                        {text: "Retirement Planning"}
                    ],
                    [
                        {text: "Insurance"}
                    ],
                ]
            }
        })
        return ctx.wizard.next();
    }
    else {
        const endConvo = `Your goal is to keep your monthly expenses below ${methods.salaryBreakdown.expense}. I will be there with you every step of the way! Good luck! 👍🏻`

        
        if (ctx.wizard.state.data.isAmend) {
            const updatedBudgetAllocation = `This is your updated customized allocation:\nCash Savings & Loans: ${methods.salaryBreakdown.savings} \n\nExpenses: ${methods.salaryBreakdown.expense}\n\nRetirement Planning: ${methods.salaryBreakdown.retire}\n\nInsurance: ${methods.salaryBreakdown.insurance}`
            endConvo = updatedBudgetAllocation + "\n\n" + endConvo
        }
        ctx.reply(`Your goal is to keep your monthly expenses below ${methods.salaryBreakdown.expense}. I will be there with you every step of the way! Good luck! 👍🏻`)
        return ctx.scene.leave()
    }
    
    
})

const step7 = new Composer() 

step7.on("text", ctx => {
    const budgetAllocation = ctx.update.message.text
    ctx.wizard.state.data.budgetAllocation = budgetAllocation
    if (!methods.budgetAllocation.includes(budgetAllocation)) {
        const currentStepIndex = ctx.wizard.cursor;
        ctx.reply(
          "Please select from the categories:"
        );
        return ctx.wizard.selectStep(currentStepIndex);
    }
    ctx.reply("What is your allocated budget for this category?")
    return ctx.wizard.next();
})

const step8 = new Composer()

step8.on("text", ctx => {
    const budget = ctx.update.message.text
    console.log(budget)
    if (isNaN(budget)) {
        const currentStepIndex = ctx.wizard.cursor;
        ctx.reply(
          "Please enter a valid number:"
        );
        return ctx.wizard.selectStep(currentStepIndex);
    }
    const budgetAllocation = ctx.wizard.state.data.budgetAllocation
    var budgetAllocationMap = ''
    switch (budgetAllocation) {
        case 'Cash Savings & Loans':
            budgetAllocationMap = 'savings'
            break;
        case 'Expenses':
            budgetAllocationMap = 'expense'
            break;
        case 'Retirement Planning':
            budgetAllocationMap = 'retire'
            break;
        case 'Insurance':
            budgetAllocationMap = 'insurance'
            break;
    }
    methods.salaryBreakdown[budgetAllocationMap] = parseFloat(budget)
    ctx.reply("Would you like to amend the budget for any other categories above?", {
        reply_markup: {
            keyboard: [
                [
                    {text: "Yes", callback_data: "Yes"}
                ],
                [
                    {text: "No", callback_data: "No"}
                ],
            ]
        }
    })
    return ctx.wizard.next();
})

const step9 = new Composer()

step9.on("text", ctx => {
    const amendCategory = ctx.update.message.text
    if (!methods.answers.includes(amendCategory)) {
        const currentStepIndex = ctx.wizard.cursor;
        ctx.reply(
          "Please select Yes or No"
        );
        return ctx.wizard.selectStep(currentStepIndex);
    } 
    if (amendCategory === "Yes") {
        // console.log("here")
        ctx.wizard.state.data.isAmend =  true
        // ctx.wizard.next()
        return ctx.wizard.selectStep(5);
    } else {
        ctx.reply(`Your goal is to keep your monthly expenses below ${methods.salaryBreakdown.expense}.I will be there with you every step of the way! Good luck! 👍🏻`)
        return ctx.scene.leave()
    }
})





const introScene = new WizardScene(
    "introScene", ctx => step1(ctx), 
                         step2,
                         step3,
                         step4,
                         step5,
                         step6,
                         step7,
                         step8,
                         step9
);

module.exports = {introScene}
