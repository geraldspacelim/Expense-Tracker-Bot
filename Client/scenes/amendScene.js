const WizardScene = require("telegraf/scenes/wizard");
const Composer = require("telegraf/composer");
const axios = require('axios');
const methods = require("../methods.js");

const step1 = ctx => {
    ctx.reply("What would you like to amend today?", {
        reply_markup: {
            keyboard: [
                [
                    {text: "Name"}
                ],
                [
                    {text: "DOB"}
                ],
                [
                    {text: "Occupation"}
                ],
                [
                    {text: "Monthly Income or Allowance"}
                ],
            ],
            one_time_keyboard: true,
        }
    })
    return ctx.wizard.next()
}

const step2 = new Composer();

step2.on("text", ctx => {
    const amendCategory = ctx.message.text
    if (!methods.particulars.includes(amendCategory)) {
        const currentStepIndex = ctx.wizard.cursor;
        ctx.reply(
          "Please select from the categories:"
        );
        return ctx.wizard.selectStep(currentStepIndex);
    }
    switch (amendCategory) {
        case "Name":
            ctx.reply("What would you like to change your name to?")
            return ctx.wizard.selectStep(2)
        case "DOB":
            ctx.reply("What would you like to change your DOB to? (DD-MM-YYYY)")
            return ctx.wizard.selectStep(3)       
        case "Occupation": 
            ctx.reply("What category would you like to change to?", {
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
                    ],
                    one_time_keyboard: true,
                }
            })
            return ctx.wizard.selectStep(4)       
        case "Monthly Income or Allowance":
            ctx.reply("What is your updated monthly income or allowance?")
            return ctx.wizard.selectStep(5)  
    }
})

const step3 = new Composer();

step3.on("text", async ctx => {
    const data = {
        category: 'Username',
        value: ctx.message.text
    }
    const rst  = await updateParticulars(data, ctx.from.id)
    if (rst == 200) {
        ctx.reply("Your particulars has been updated")
        return ctx.scene.leave()
    }
    
})

const step4 = new Composer();

step4.on("text", async ctx => {
    var dtRegex = new RegExp(/^\d\d?-\w\w\-\d\d\d\d/);
    if (!dtRegex.test(ctx.message.text)) {
        const currentStepIndex = ctx.wizard.cursor;
        ctx.reply(
          "Please enter your date of birth in this format DD-MM-YYYY."
        );
        return ctx.wizard.selectStep(currentStepIndex);
    }
    const data = {
        category: 'DOB',
        value: ctx.message.text
    }
    const rst  = await updateParticulars(data, ctx.from.id)
    if (rst == 200) {
        ctx.reply("Your particulars has been updated")
        return ctx.scene.leave()
    }
    return ctx.scene.leave()
})

const step5 = new Composer();

step5.on("text", async ctx => {
    const occupation = ctx.message.text
    if (!methods.occupation.includes(occupation)) {
        const currentStepIndex = ctx.wizard.cursor;
        ctx.reply(
          "Please select from the categories:"
        );
        return ctx.wizard.selectStep(currentStepIndex);
    }
    const data = {
        category: 'Occupation',
        value: ctx.message.text
    }
    const rst  = await updateParticulars(data, ctx.from.id)
    if (rst == 200) {
        ctx.reply("Your particulars has been updated")
        return ctx.scene.leave()
    }
    return ctx.scene.leave()
})

const step6 = new Composer();

step6.on("text", async ctx => {
    if (isNaN(ctx.message.text)) {
        const currentStepIndex = ctx.wizard.cursor;
        ctx.reply(
          "Please enter a valid number:"
        );
        return ctx.wizard.selectStep(currentStepIndex);
    }
    const data = {
        category: 'Salary',
        value: ctx.message.text
    }
    const rst  = await updateParticulars(data, ctx.from.id)
    if (rst == 200) {
        ctx.reply("Your particulars has been updated")
        return ctx.scene.leave()
    }
    return ctx.scene.leave()
})

async function updateParticulars(data, id) {
    const res = await axios.post(`http://localhost:8080/api/updateParticulars/${id}`, data)
    return res.status
}


const amendScene = new WizardScene(
    "amendScene", ctx => step1(ctx), 
                         step2,
                         step3,
                         step4,
                         step5,
                         step6
);

module.exports = {amendScene}