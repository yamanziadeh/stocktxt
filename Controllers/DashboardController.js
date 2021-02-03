var express = require("express"),
    router = express.Router(),
    authSession = require("../Middlewares/authSession.js");

var User = require("../models/User.js");

router.get("/dashboard", authSession, (req, res) => {
    res.render("dashboard");
})

module.exports = router;