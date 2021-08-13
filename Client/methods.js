const axios = require('axios');
const Moment = require('moment-timezone')
const QuickChart = require('quickchart-js');

const category = ["Work Food", "Good Food", "Coffee", "Alcohol", "Necessities", "Shopping & Leisure", "Ciggs", "Private Transport", "Groceries", "Others" ]
const occupation = ["Polytechnic", "University", "Fresh Graduate", "Employed", "Unemployed"]
const budgetAllocation = ["Cash Savings & Loans", "Expenses", "Retirement Planning", "Insurance"]
const answers = ["Yes", "No"]

var calendar = {
              1 : "January",
              2 : "Feburary",
              3 : "March",
              4 : "April",
              5 : "May",
              6 : "June",
              7 : "July",
              8 : "August",
              9 : "September",
              10 : "October",
              11 : "November",
              12 : "December"
            }

async function getMontlyExpenseReport(telegramId, monthlyExpense) {
    try {
        const res = await axios.get(`http://localhost:8080/api/getCurrentMonthExpense/${telegramId}`);
        if (res.data != []) {
            var total = 0
            var labels = []
            var data = []
            for (const category of res.data){
              labels.push(category.Category)
              const expenseValue = parseFloat(category.Total)
              data.push(expenseValue)
              total += expenseValue
            }
            const currentTime = Moment().tz('Asia/Singapore')
            const month = String(currentTime.month() + 1).padStart(2, '0')
            const myChart = new QuickChart();
            myChart
              .setConfig(
                {
                  type: 'doughnut',
                  data: {
                    labels: labels,
                    datasets: [{
                      data: data
                    }]
                  },
                  options: {
                    plugins: {
                      datalabels: {
                        display: true,
                        backgroundColor: '#ccc',
                        borderRadius: 3,
                        font: {
                          weight: 'bold',
                        }
                      },
                      doughnutlabel: {
                        labels: [{
                          text: `$${total.toFixed(2)}`,
                          font: {
                            size: 20,
                            weight: 'bold'
                          }
                        }, {
                          text: 'total'
                        }]
                      }
                    }
                  }
                }
              )
              .setBackgroundColor('transparent');
            return ({
              url: myChart.getUrl(),
              month:  calendar[parseInt(month)],
              isOverSpent: total/monthlyExpense >= 0.8 
            })
        }
      } catch (error) {
        console.error(error);
      }
}


exports.category = category
exports.occupation = occupation
exports.budgetAllocation = budgetAllocation
exports.getMontlyExpenseReport = getMontlyExpenseReport
exports.answers = answers
exports.calendar = calendar