const WizardScene = require("telegraf/scenes/wizard");
const Composer = require("telegraf/composer");
const axios = require("axios");
const methods = require("../methods.js");

const step1 = (ctx) => {
  ctx.wizard.state.data = {};
  ctx.wizard.state.data.id = ctx.from.id;
  ctx.reply("What would you like to track?", {
    reply_markup: {
      keyboard: [
        [
          { text: "Food & Drinks", callback_data: "food-drink-category" },
          {
            text: "Fun & Entertainment",
            callback_data: "fun-entertainment-category",
          },
        ],
        [
          { text: "Shopping", callback_data: "shopping-category" },
          { text: "Necessities", callback_data: "Necessities-category" },
        ],
        [
          { text: "Groceries", callback_data: "Groceries-category" },
          {
            text: "Private Transport & Petrol",
            callback_data: "private-transport-category",
          },
        ],
        [
          {
            text: "Subscriptions & Memberships",
            callback_data: "subscriptions-memberships-category",
          },
          {
            text: "Personal Care (Facial, Nails, etc)",
            callback_data: "personal-care-category",
          },
        ],
        [
          {
            text: "Others (Hobby, Nicotine, etc)",
            callback_data: "others-category",
          },
          { text: "Business Expenses", callback_data: "business-category" },
        ],
      ],
      one_time_keyboard: true,
      resize_keyboard: true,
    },
  });
  return ctx.wizard.next();
};

const step2 = new Composer();

step2.on("text", (ctx) => {
  const category = ctx.update.message.text;
  if (!methods.category.includes(category)) {
    const currentStepIndex = ctx.wizard.cursor;
    ctx.reply("Please select from the categories");
    return ctx.wizard.selectStep(currentStepIndex);
  } else if (category === "Others") {
    ctx.reply("Please enter a category:");
    return ctx.wizard.selectStep(3);
  }
  ctx.wizard.state.data.category = category;
  ctx.reply("Enter a value: ");
  return ctx.wizard.next();
});

const step3 = new Composer();

step3.on("text", (ctx) => {
  if (isNaN(ctx.message.text)) {
    const currentStepIndex = ctx.wizard.cursor;
    ctx.reply("Please enter a valid number");
    return ctx.wizard.selectStep(currentStepIndex);
  }
  const expense = parseFloat(ctx.message.text).toFixed(2);
  ctx.wizard.state.data.expense = expense;
  ctx.reply(
    "Please enter a description otherwise press /skip to record expense"
  );
  return ctx.wizard.selectStep(4);
});

const step4 = new Composer();

step4.on("text", (ctx) => {
  if (budget.charAt(0) === "$") {
    budget = budget.substring(1);
  }
  if (!isNaN(ctx.message.text)) {
    const currentStepIndex = ctx.wizard.cursor;
    ctx.reply("Please enter a valid category");
    return ctx.wizard.selectStep(currentStepIndex);
  }
  ctx.wizard.state.data.category = methods.capitalize(ctx.update.message.text);
  ctx.reply("Enter a value: ");
  return ctx.wizard.selectStep(2);
});

const step5 = new Composer();

step5.on("text", (ctx) => {
  if (ctx.message.text === "/skip") {
    ctx.wizard.state.data.description = "";
  } else {
    ctx.wizard.state.data.description = ctx.message.text;
  }
  const expense = ctx.wizard.state.data;
  var expenseText = "";
  if (ctx.wizard.state.edit) {
    const callback_data = ctx.wizard.state.callback_data;
    const uuid = callback_data.update.callback_query.data;
    ctx.wizard.state.data.uuid = uuid;
    axios
      .post("http://localhost:8080/api/updateExpense", ctx.wizard.state.data)
      .then(function (res) {
        if (res.status == 200) {
          expenseText += `Category: ${
            expense.category
          }\nExpense: $${methods.numberWithCommas(expense.expense)}`;
          if (expense.description != "") {
            expenseText += `\nDescription: ${expense.description}`;
          }
          // ctx.answerCbQuery()
          callback_data.editMessageText(
            `Your expense has been updated\n\n${expenseText}`,
            {
              reply_markup: {
                inline_keyboard: [[{ text: "Edit", callback_data: uuid }]],
              },
            }
          );
        }
      });
  } else {
    axios
      .post("http://localhost:8080/api/addNewExpense", expense)
      .then(function (res) {
        if (res.status == 200) {
          expenseText += `Category: ${
            expense.category
          }\nExpense: $${methods.numberWithCommas(expense.expense)}`;
          if (expense.description != "") {
            expenseText += `\nDescription: ${expense.description}`;
          }
          ctx.reply(`Your expense has been recorded\n\n${expenseText}`, {
            reply_markup: {
              inline_keyboard: [
                [{ text: "Edit", callback_data: res.data.uuid }],
              ],
            },
          });
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  }
  return ctx.scene.leave();
});

const expenseScene = new WizardScene(
  "expenseScene",
  (ctx) => step1(ctx),
  step2,
  step3,
  step4,
  step5
);

module.exports = { expenseScene };
