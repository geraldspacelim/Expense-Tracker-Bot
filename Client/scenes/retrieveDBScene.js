const WizardScene = require("telegraf/scenes/wizard");
const Composer = require("telegraf/composer");
const axios = require('axios');
const converter = require('json-2-csv');
// const bcrypt = require('bcrypt');
const fs = require('fs');

const step1 = ctx => {
    ctx.reply("Please enter the passphrase:")
    return ctx.wizard.next()
}

const step2 = new Composer();

step2.on("text", ctx => {
    const password = ctx.message.text
    axios.get(`http://localhost:8080/api/authenticate/${ctx.from.id}`).then(res => {
        if (res.data.length == 1) {
            bcrypt.compare(password, res.data[0].hashedPassword, function(err, result) {
                if (result == true) {
                    axios.get(`http://localhost:8080/api/allSubscribers`).then(res => {
                        converter.json2csv(res.data, (err, csv) => {
                            if (err) {
                                throw err;
                            }
                            fs.writeFileSync('Subscribers.csv', csv);
                        });
                        axios.get(`http://localhost:8080/api/allExpenses`).then(res => {
                            converter.json2csv(res.data, (err, csv) => {
                                if (err) {
                                    throw err;
                                }
                                fs.writeFileSync('Expenses.csv', csv);
                            });
                            ctx.replyWithMediaGroup([
                                {
                                    type: 'document',
                                    media: {
                                        source: 'Subscribers.csv'
                                    }

                                },
                                {
                                    type: 'document',
                                    media: {
                                        source: 'Expenses.csv'
                                    }

                                }
                            ])
                            ctx.scene.leave()
                        }).catch(err => {
                            console.log(err)
                        })
                    }).catch(err => {
                        console.log(err)
                    })
                } else{
                    ctx.reply("Wrong passphrase")
                }
            });
        } else {
           ctx.reply("You are not authorised")
           return ctx.scene.leave()
        }
    })
})

const retrieveDBScene = new WizardScene(
    "retrieveDBScene", ctx => step1(ctx), 
                         step2,
);

module.exports = {retrieveDBScene}
