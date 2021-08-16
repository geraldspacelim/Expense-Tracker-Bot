const WizardScene = require("telegraf/scenes/wizard");
const Composer = require("telegraf/composer");
const axios = require('axios');

const step1 = ctx => {
    "Please enter the passphrase:"
    return ctx.wizard.next()
}

const step2 = new Composer();

step2.on("text", ctx => {
    const password = ctx.message.text
    axios.get(`http://localhost:8080/api/authenticate/${ctx.from.id}`).then(res => {
        if (res.data.length == 1) {
            bcrypt.compare(password, res.data[0].hashedPassword, function(err, result) {
                if (result == true) {
                    //get db
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
