const axios = require("axios");
const Moment = require("moment-timezone");
const QuickChart = require("quickchart-js");

const category = [
  "Food & Drinks",
  "Fun & Entertainment",
  "Shopping",
  "Necessities",
  "Groceries",
  "Private Transport & Petrol",
  "Subscriptions & Memberships",
  "Personal Care (Facial, Nails, etc)",
  "Others (Hobby, Nicotine, etc)",
  "Business Expenses",
];
const occupation = ["Polytechnic", "University", "Employed", "Unemployed"];
const budgetAllocation = ["Needs", "Flexible Spendings", "Savings"];
const answers = ["Yes", "No"];
const particulars = [
  "Name",
  "Contact",
  "DOB",
  "Occupation",
  "Monthly Income or Allowance",
];
const calendar = {
  1: "January",
  2: "Feburary",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December",
};

const shortCalendar = {
  jan: "January",
  feb: "Feburary",
  mar: "March",
  apr: "April",
  may: "May",
  jun: "June",
  jul: "July",
  aug: "August",
  sep: "September",
  oct: "October",
  nov: "November",
  dec: "December",
};

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

async function getMontlyExpenseReport(telegramId) {
  try {
    const res = await axios.get(
      `http://localhost:8080/api/getCurrentMonthExpense/${telegramId}`
    );
    if (res.data != []) {
      var total = 0;
      var labels = [];
      var data = [];
      for (const category of res.data) {
        labels.push(category.Category);
        const expenseValue = parseFloat(category.Total);
        data.push(expenseValue);
        total += expenseValue;
      }
      var percent_data = data.map((expense) =>
        ((expense / total) * 100).toFixed(1)
      );
      const currentTime = Moment().tz("Asia/Singapore");
      const month = String(currentTime.month() + 1).padStart(2, "0");
      const myChart = new QuickChart();
      myChart
        .setConfig({
          type: "doughnut",
          data: {
            labels: labels,
            datasets: [
              {
                data: percent_data,
              },
            ],
          },
          options: {
            plugins: {
              datalabels: {
                formatter: (value) => {
                  return value + "%";
                },
                display: true,
                backgroundColor: "#ccc",
                borderRadius: 3,
                font: {
                  weight: "bold",
                },
              },
              doughnutlabel: {
                labels: [
                  {
                    text: `$${total.toFixed(2)}`,
                    font: {
                      size: 20,
                      weight: "bold",
                    },
                  },
                  {
                    text: "Total",
                  },
                ],
              },
            },
          },
        })
        .setBackgroundColor("transparent");
      return {
        url: myChart.getUrl(),
        month: calendar[parseInt(month)],
        expenses: res.data,
      };
    }
  } catch (error) {
    console.error(error);
  }
}

function numberWithCommas(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

exports.category = category;
exports.occupation = occupation;
exports.budgetAllocation = budgetAllocation;
exports.getMontlyExpenseReport = getMontlyExpenseReport;
exports.answers = answers;
exports.capitalize = capitalize;
exports.shortCalendar = shortCalendar;
exports.particulars = particulars;
exports.numberWithCommas = numberWithCommas;
