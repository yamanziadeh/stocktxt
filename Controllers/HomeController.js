var express = require("express"),
    router = express.Router(),
    mongoose = require("mongoose"),
    User = mongoose.model("User");

router.use("/", require("./LoginController.js"));
router.use("/", require("./SignupController.js"));
router.use("/", require("./DashboardController.js"));

router.get("/", (req, res) => {
    User.find({}).countDocuments((err, num) => {
        if (err) num = process.env.NUM_OF_ALLOWED_USERS;
        res.render("home", { count: (process.env.NUM_OF_ALLOWED_USERS - num), numUsers: process.env.NUM_OF_ALLOWED_USERS });
    });

})

module.exports = router;