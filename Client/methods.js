const axios = require('axios');
const Moment = require('moment-timezone')

let userTeleId = undefined

const category = ["Work Food", "Good Food", "Coffee", "Alcohol", "Necessities", "Shopping & Leisure", "Ciggs", "Private Transport", "Groceries", "Others" ]

async function getMontlyExpenseReport(telegramId) {
    try {
        const res = await axios.get(`http://localhost:8080/api/getCurrentMonthExpense/${telegramId}`);
        if (res.data != []) {
            var report = ""
            var total = 0
            for(let i = 0; i<res.data.length; i++){
                report += res.data[i]['Category'] + ": " + "$" + res.data[i]['Total'].toFixed(2) + "\n"
                total += parseFloat(res.data[i]['Total'])
            }
            const currentTime = Moment().tz('Asia/Singapore')
            const month = String(currentTime.month() + 1).padStart(2, '0')
            var dict = new Object()
            dict = {
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
            return "This is your monthly expenses for " + dict[parseInt(month)] + ".\n" + report + "\nTotal: $" + total.toFixed(2)
            // return "https://quickchart.io/chart?bkg=white&c={type:%27bar%27,data:{labels:[2012,2013,2014,2015,2016],datasets:[{label:%27Users%27,data:[120,60,50,180,120]}]}}"
        }
      } catch (error) {
        console.error(error);
      }
}

function capitalize(s)
{
    return s[0].toUpperCase() + s.slice(1);
}

exports.userTeleId = userTeleId
exports.category = category
exports.getMontlyExpenseReport = getMontlyExpenseReport
exports.capitalize = capitalize