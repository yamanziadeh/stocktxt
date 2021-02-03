var express = require('express'),
    session = require('express-session'),
    MongoStore = require('connect-mongo')(session),
    schedule = require('node-schedule'),
    axios = require('axios'),
    { PythonShell } = require('python-shell'),
    app = express();

require('dotenv').config();
app.set("view engine", "ejs");

// Python Script Options
let options = {
    mode: 'text',
    pythonPath: '/Users/yamanziadeh/opt/miniconda3/bin/Python',
    pythonOptions: ['-u'],
    scriptPath: 'PythonScripts',
};

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

// Recurring Main Function
schedule.scheduleJob('0 0 0 * * *', function () {
    // 5 astrixes, 6th on the left is optional (represents seconds), like shown belo
    // */2 * * * * <-- every 2 minutes
    // 0 0 0 * * * <-- every day at midnight
    // 30 8 * * * <-- 8:30am - Market open time
    // 30 8 * * 1 <-- 8:30am every monday (weekly)
    axios.get('https://socialsentiment.io/api/v1/stocks/sentiment/daily/', {
        headers: {
            Authorization: 'Token ' + process.env.SOC_SENT_TOKEN //the token is a variable which holds the token
        }
    }).then(function (data) {
        data.data.results.sort((a, b) => { return b.score - a.score });
        var sentimentTxtBody = `** Top Stocks by Sentiment **\n${data.data.results[0].stock} ${data.data.results[1].stock} ${data.data.results[2].stock} ${data.data.results[3].stock} ${data.data.results[4].stock}`
        PythonShell.run('Algo.py', options, function (err, res) {
            if (err) throw err;
            var txtBody = `** Top Stocks this Month **\n${res}\n\n` + sentimentTxtBody;
            UserModel.find({}).select('phonenumber').exec((err, result) => {
                result.forEach(element => {
                    client.messages.create({
                        to: "+1" + element.phonenumber,
                        from: process.env.TWILIO_PHONENUM,
                        body: txtBody
                    }).then(() => console.log("Update Sent to " + element.phonenumber)).catch((err) => console.log(err));
                });
            });
        });

    }).catch(err => console.log(err.message));
});

app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}...`);
})

