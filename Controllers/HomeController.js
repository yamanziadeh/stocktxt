var express = require("express"),
    router = express.Router();

router.use("/", require("./LoginController.js"));
router.use("/", require("./SignupController.js"));
router.use("/", require("./DashboardController.js"));

router.get("/", (req, res) => {
    if (req.session.user) return res.redirect("dashboard");
    res.render("home");
})

module.exports = router;