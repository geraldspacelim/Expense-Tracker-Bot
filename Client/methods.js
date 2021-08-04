const axios = require('axios');
let userTeleId = undefined
const category = ["Work Food", "Good Food", "Coffee", "Alcohol", "Necessities", "Shopping & Leisure", "Ciggs", "Private Transport", "Groceries" ]
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
            return report + "\nTotal: $" + total.toFixed(2)
        }
      } catch (error) {
        console.error(error);
      }
}

exports.userTeleId = userTeleId
exports.category = category
exports.getMontlyExpenseReport = getMontlyExpenseReport