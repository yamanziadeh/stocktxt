var express = require('express'),
    session = require('express-session'),
    MongoStore = require('connect-mongo')(session),
    schedule = require('node-schedule'),
    axios = require('axios'),
    { PythonShell } = require('python-shell'),
    app = express();

require('dotenv').config();
app.set("view engine", "ejs");

// Connect to Twilio Account
const client = require("twilio")(process.env.TWILIO_ACC_SID, process.env.TWILIO_TOKEN);

// Connect to DB
var dbConnection = require("./models/db.js").connection;
var UserModel = require("./models/User");

// Session
app.use(session({
    name: "sid",
    resave: false,
    saveUninitialized: false,
    secret: `${process.env.SESS_SECRET}`,
    cookie: {
        maxAge: 1000 * 60 * 60 * 2, // 2 hours
        sameSite: true,
        secure: false // false for development, true for production
    },
    store: new MongoStore({ mongooseConnection: dbConnection })
}));

app.use((req, res, next) => {
    const { user } = req.session;
    if (user) {
        res.locals.user = user;
    }
    next();
})

// Req Encoding
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static Files
app.use(express.static('public/css'));
app.use(express.static('public/fonts'));
app.use(express.static('public/images'));
app.use(express.static('public/js'));

// Controllers
app.use(require('./Controllers/HomeController.js'))

// Python Utils
function parseEarnings(theStr) {
    return theStr.split("$$$,").join("\n\n").slice(0, -4);
}
let options = {
    mode: 'text',
    pythonPath: '/Users/yamanziadeh/opt/miniconda3/bin/Python', // "/Users/yamanziadeh/opt/miniconda3/bin/Python"
    pythonOptions: ['-u'],
    scriptPath: 'PythonScripts',
};

// Daily Sentiment
schedule.scheduleJob('0 0 * * *', function () { // Every day @ 00:00
    axios.get('https://socialsentiment.io/api/v1/stocks/sentiment/daily/', {
        headers: {
            Authorization: 'Token ' + process.env.SOC_SENT_TOKEN //the token is a variable which holds the token
        }
    }).then(function (data) {
        data.data.results.sort((a, b) => { return b.score - a.score });
        var sentimentTxtBody = `** Daily Sentiment **\n${data.data.results[0].stock} ${data.data.results[1].stock} ${data.data.results[2].stock} ${data.data.results[3].stock} ${data.data.results[4].stock}`
        UserModel.find({}).select('phonenumber').exec((err, result) => {
            result.forEach(element => {
                client.messages.create({
                    to: "+1" + element.phonenumber,
                    from: process.env.TWILIO_PHONENUM,
                    body: sentimentTxtBody
                }).then(() => console.log("Daily Sentiment Sent to " + element.phonenumber)).catch((err) => console.log(err));
            });
        });
    }).catch(err => console.log(err.message));
});

// Weekly Earnings
schedule.scheduleJob('0 8 * * 0', function () { // Every Sunday @ 8AM
    PythonShell.run('Earnings.py', options, function (err, res) {
        if (err) throw err;
        var txtBody = `** Weekly Earnings **\n${res}\n`;
        txtBody = parseEarnings(txtBody);
        UserModel.find({}).select('phonenumber').exec((err, result) => {
            result.forEach(element => {
                client.messages.create({
                    to: "+1" + element.phonenumber,
                    from: process.env.TWILIO_PHONENUM,
                    body: txtBody
                }).then(() => console.log("Weekly Earnings Sent to " + element.phonenumber)).catch((err) => console.log(err));
            });
        });
    });
});

// Monthly Predictions
schedule.scheduleJob('0 0 1 * *', function () { // Every First Day of the Month
    PythonShell.run('Predictions.py', options, function (err, res) {
        if (err) throw err;
        var txtBody = `** Monthly Predictions **\n${res}\n`;
        UserModel.find({}).select('phonenumber').exec((err, result) => {
            result.forEach(element => {
                client.messages.create({
                    to: "+1" + element.phonenumber,
                    from: process.env.TWILIO_PHONENUM,
                    body: txtBody
                }).then(() => console.log("Monthly Predictions Sent to " + element.phonenumber)).catch((err) => console.log(err));
            });
        });
    });
});

app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}...`);
})

