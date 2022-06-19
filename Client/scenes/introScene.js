const WizardScene = require("telegraf/scenes/wizard");
const Composer = require("telegraf/composer");
const axios = require("axios");
const methods = require("../methods.js");
const fs = require("fs");

const step1 = (ctx) => {
  ctx.wizard.state.data = {};
  if (ctx.wizard.state.amendBudget) {
    axios
      .get(`http://localhost:8080/api/getSubscriber/${ctx.from.id}`)
      .then((res) => {
        if (res.data) {
          ctx.wizard.state.data.needs = res.data[0].Needs.toFixed(2);
          ctx.wizard.state.data.spendings = res.data[0].Spendings.toFixed(2);
          ctx.wizard.state.data.savings = res.data[0].Savings.toFixed(2);
        }
      });
    ctx.reply("Which category, would you like to amend?", {
      reply_markup: {
        keyboard: [
          [{ text: "Cash Savings & Loans" }],
          [{ text: "Expenses" }],
          [{ text: "Retirement Planning" }],
          [{ text: "Insurance" }],
        ],
        one_time_keyboard: true,
      },
    });
    return ctx.wizard.selectStep(7);
  }
  const telegramId = ctx.from.id;
  ctx.wizard.state.data.id = telegramId;
  ctx.wizard.state.data.username = ctx.from.username;
  ctx.reply("Hey Champ! What's your name?");
  return ctx.wizard.next();
};

const step2 = new Composer();

step2.on("text", (ctx) => {
  ctx.wizard.state.data.name = ctx.message.text;
  ctx.reply(
    `Got it, ${ctx.wizard.state.data.name}! Before we get started, Id like to get to know you a little better, \n\n<i>By using this service, you agree to the <a href="https://tinyurl.com/AAHEADSTARTConsent"> terms and conditions</a> governing your use of @AAheadstart_bot online service.</i> \n\n<i>Just in-case we have bot-updates, whats your phone number?</i>`,
    {
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }
  );
  return ctx.wizard.next();
});

const step3 = new Composer();

step3.on("text", (ctx) => {
  var contactRegex = new RegExp(/^\d{8}$/);
  if (!contactRegex.test(ctx.message.text)) {
    const currentStepIndex = ctx.wizard.cursor;
    ctx.reply("Please enter a valid contact number.");
    return ctx.wizard.selectStep(currentStepIndex);
  }
  ctx.wizard.state.data.contact = ctx.message.text;
  ctx.reply("What is your date of birth? (DD-MM-YYYY)");
  return ctx.wizard.next();
});

const step4 = new Composer();

step4.on("text", (ctx) => {
  var dtRegex = new RegExp(/^\d\d?-\w\w\-\d\d\d\d/);
  if (!dtRegex.test(ctx.message.text)) {
    const currentStepIndex = ctx.wizard.cursor;
    ctx.reply("Please enter your date of birth in this format DD-MM-YYYY.");
    return ctx.wizard.selectStep(currentStepIndex);
  }
  ctx.wizard.state.data.dob = ctx.message.text;
  ctx.reply(
    "To help us better understand the demographic of our users, which category do you fall under? ",
    {
      reply_markup: {
        keyboard: [
          [{ text: "Polytechnic Student" }],
          [{ text: "University Student" }],
          [{ text: "Employed" }],
          [{ text: "Unemployed" }],
        ],
        one_time_keyboard: true,
      },
    }
  );
  return ctx.wizard.next();
});

const step5 = new Composer();

step5.on("text", (ctx) => {
  const occupation = ctx.update.message.text;
  ctx.wizard.state.data.occupation = ctx.message.text;
  ctx.reply(
    "Last question! Would you like us to compute your spending budget (based on your salary) or do you have a set budget?",
    {
      reply_markup: {
        keyboard: [
          [{ text: "Help me count!" }],
          [{ text: "I know my limits" }],
        ],
        one_time_keyboard: true,
      },
    }
  );
  return ctx.wizard.next();
});

const step6 = new Composer();

step6.on("text", (ctx) => {
  if (ctx.message.text == "I know my limits") {
    const currentStepIndex = ctx.wizard.cursor;
    ctx.reply("What is your monthly spending budget?");
    return ctx.wizard.next();
  } else {
    ctx.reply("What’s your monthly salary?");
    return ctx.wizard.selectStep(10);
  }
});

const step7 = new Composer();

step7.on("text", (ctx) => {
  const amendCategory = ctx.update.message.text;
  if (!methods.answers.includes(amendCategory)) {
    const currentStepIndex = ctx.wizard.cursor;
    ctx.wizard.state.data.monthlyspending = ctx.message.text;
    ctx.reply(
      `Your goal is to keep your monthly expenses below $${ctx.wizard.state.data.monthlyspending}. I will be there with you every step of the way! Good luck! 👍🏻 \n\nTo start tracking your expenses, press /expense.`
    );
    return ctx.scene.leave();
  }
  if (amendCategory === "Yes") {
    ctx.wizard.state.data.isAmend = true;
    ctx.reply("Which category, would you like to amend?", {
      reply_markup: {
        keyboard: [
          [{ text: "Savings" }],
          [{ text: "Flexible Spendings" }],
          [{ text: "Needs" }],
        ],
        one_time_keyboard: true,
      },
    });
    return ctx.wizard.next();
  } else {
    const endConvo = `Your goal is to keep your monthly expenses below $${methods.numberWithCommas(
      ctx.wizard.state.data.expense
    )}. We will be there with you every step of the way! Good luck! 👍🏻 \n\nTo start tracking your expesnes, press /expense.`;
    ctx.reply(endConvo);
    return ctx.scene.leave();
  }
});

const step8 = new Composer();

step8.on("text", (ctx) => {
  const budgetAllocation = ctx.update.message.text;
  ctx.wizard.state.data.budgetAllocation = budgetAllocation;
  if (!methods.budgetAllocation.includes(budgetAllocation)) {
    const currentStepIndex = ctx.wizard.cursor;
    ctx.reply("Please select from the categories:");
    return ctx.wizard.selectStep(currentStepIndex);
  }
  ctx.reply("What is your allocated amount for this category?");
  return ctx.wizard.next();
});

const step9 = new Composer();

step9.on("text", (ctx) => {
  let budget = ctx.update.message.text;
  if (budget.charAt(0) === "$") {
    budget = budget.substring(1);
  }
  if (isNaN(budget)) {
    const currentStepIndex = ctx.wizard.cursor;
    ctx.reply("Please enter a valid number:");
    return ctx.wizard.selectStep(currentStepIndex);
  }
  const budgetAllocation = ctx.wizard.state.data.budgetAllocation;
  var budgetAllocationMap = "";
  switch (budgetAllocation) {
    case "Needs":
      budgetAllocationMap = "needs";
      break;
    case "Flexible Spendings":
      budgetAllocationMap = "spendings";
      break;
    case "Savings":
      budgetAllocationMap = "savings ";
      break;
  }
  ctx.wizard.state.data[budgetAllocationMap] = parseFloat(budget).toFixed(2);
  ctx.reply(
    "Would you like to amend the budget for any other categories above?",
    {
      reply_markup: {
        keyboard: [
          [{ text: "Yes", callback_data: "Yes" }],
          [{ text: "No", callback_data: "No" }],
        ],
        one_time_keyboard: true,
      },
    }
  );
  return ctx.wizard.next();
});

const step10 = new Composer();

step10.on("text", (ctx) => {
  const amendCategory = ctx.update.message.text;
  if (!methods.answers.includes(amendCategory)) {
    const currentStepIndex = ctx.wizard.cursor;
    ctx.reply("Please select Yes or No");
    return ctx.wizard.selectStep(currentStepIndex);
  }
  if (amendCategory === "Yes") {
    ctx.wizard.state.data.isAmend = true;
    ctx.reply("Which category, would you like to amend?", {
      reply_markup: {
        keyboard: [
          [{ text: "Needs" }],
          [{ text: "Flexible Spendings" }],
          [{ text: "Savings" }],
        ],
        one_time_keyboard: true,
      },
    });
    return ctx.wizard.selectStep(7);
  } else {
    axios
      .post(
        `http://localhost:8080/api/updateSubscriber/${ctx.from.id}`,
        ctx.wizard.state.data
      )
      .then((res) => {
        if (res.status == 200) {
          var endConvo = `Your goal is to keep your monthly expenses below $${methods.numberWithCommas(
            ctx.wizard.state.data.spendings
          )}. I will be there with you every step of the way! Good luck! 👍🏻\n\nTo start tracking your expesnes, press /expense.`;
          if (ctx.wizard.state.data.isAmend) {
            const updatedBudgetAllocation = `This is your updated customized allocation:\nSavings: $${methods.numberWithCommas(
              ctx.wizard.state.data.savings
            )} \nFlexible Spendings: $${methods.numberWithCommas(
              ctx.wizard.state.data.spendings
            )}\nNeeds: $${methods.numberWithCommas(
              ctx.wizard.state.data.needs
            )}`;
            endConvo = updatedBudgetAllocation + "\n\n" + endConvo;
          }
          ctx.reply(endConvo);
          return ctx.scene.leave();
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

const step11 = new Composer();

step11.on("text", (ctx) => {
  let budget = ctx.update.message.text;
  if (budget.charAt(0) === "$") {
    budget = budget.substring(1);
  }
  if (isNaN(budget)) {
    const currentStepIndex = ctx.wizard.cursor;
    ctx.reply("Please enter a valid number:");
    return ctx.wizard.selectStep(currentStepIndex);
  }
  const salary = parseFloat(budget).toFixed(2);
  ctx.wizard.state.data.savings = (0.2 * salary).toFixed(2);
  ctx.wizard.state.data.spendings = (0.3 * salary).toFixed(2);
  ctx.wizard.state.data.needs = (0.5 * salary).toFixed(2);
  ctx.wizard.state.data.salary = salary;
  axios
    .post("http://localhost:8080/api/addNewUser", ctx.wizard.state.data)
    .then(function (res) {
      ctx.replyWithPhoto(
        {
          source: "./assets/budget.png",
        },
        {
          caption:
            "Recommended allocation for: \n20% Savings: $" +
            ctx.wizard.state.data.savings +
            "\n30% Flexible Spendings: $" +
            ctx.wizard.state.data.spendings +
            "\n50% Needs: $" +
            ctx.wizard.state.data.needs +
            "\n\nYour goal is to keep your monthly flexible spendings below $" +
            ctx.wizard.state.data.spendings +
            ". I will be there with you every step of the way! Good luck! 👍🏻 \n\nWould you like to amend the allocated budget for any of the categories above?",
          reply_markup: {
            keyboard: [[{ text: "Yes" }], [{ text: "No" }]],
          },
        }
      );
      return ctx.wizard.selectStep(9);
    })
    .catch(function (error) {
      console.log(error);
    });
});

const introScene = new WizardScene(
  "introScene",
  (ctx) => step1(ctx),
  step2,
  step3,
  step4,
  step5,
  step6,
  step7,
  step8,
  step9,
  step10,
  step11
);

module.exports = { introScene };
