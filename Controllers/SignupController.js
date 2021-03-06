var express = require("express"),
    mongoose = require("mongoose"),
    router = express.Router(),
    User = mongoose.model('User');

const client = require("twilio")(process.env.TWILIO_ACC_SID, process.env.TWILIO_TOKEN);

router.get("/signup", (req, res) => {
    if (req.session.user) return res.redirect("dashboard");
    res.render("signup");
})

router.post("/signup", (req, res) => {
    User.exists({ phonenumber: req.body.phonenumber }, (err, result) => {
        if (result == true || err) return res.render("signup", { errorMessage: "Account already exists!" });
        User.countDocuments((err, result) => {
            if (result == process.env.NUM_OF_ALLOWED_USERS || err) return res.render("signup", { errorMessage: "No Spots Available!" });
            var newUser = new User({
                phonenumber: req.body.phonenumber,
                username: req.body.username,
                password: req.body.password
            });
            newUser.save();

            client.messages.create({
                to: "+1" + req.body.phonenumber,
                from: process.env.TWILIO_PHONENUM,
                body: `[StockTxt] Thank you ${req.body.username} for signing up!\n\nYou can now login to access your dashboard where you will be able to toggle daily, weekly, or monthly texts on/off.`
            }).then((message) => console.log(message)).catch((err) => console.log(err));

            res.render("signup", { successMessage: "Account created, You can now Login!" });
        })
    })
})

module.exports = router;