var express = require("express"),
    mongoose = require("mongoose"),
    bcrypt = require("bcryptjs"),
    authSession = require("../Middlewares/authSession.js"),
    router = express.Router(),
    User = mongoose.model('User');

router.get("/login", (req, res) => {
    res.render("login");
})

router.post("/login", (req, res) => {
    User.findOne({ phonenumber: req.body.phonenumber }, (err, result) => {
        if (result == null || err) return res.render("login", { errorMessage: "Invalid Credentials!" });
        bcrypt.compare(req.body.password, result.password, (err, equal) => {
            if (equal == false || err) return res.render("login", { errorMessage: "Invalid Credentials!" });
            req.session.user = { phonenumber: result.phonenumber, username: result.username };
            req.session.save((err) => {
                if (!err) {
                    res.redirect("dashboard");
                } else {
                    console.log(err);
                }
            })
        })
    })
})

router.post("/logout", authSession, (req, res) => {
    req.session.destroy();
    res.redirect("/");
})

module.exports = router;