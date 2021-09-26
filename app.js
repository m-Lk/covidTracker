const express = require('express');
//const bodyParser = require("body-parser");
const data = require('./data');
const app = express();

// create application/json parser
app.use(express.json());
//var jsonParser = bodyParser.json()

// create application/x-www-form-urlencoded parser
//var urlencodedParser = bodyParser.urlencoded({ extended: false })

// POST /login gets urlencoded bodies
app.post('/login', function (req, res) {
  res.send('welcome, ' + req.body.username)
})

const port = 3000;

app.get('/', (req, res) => res.send(data));

app.post('/registerUser', (req, res) => {
    console.log(req.body);
    let objUser = {
        "userId": data.User.length + 1,
        "name": req.body.name,
        "phoneNumber":req.body.ph_no,
        "pinCode":req.body.pin,
        "symptoms":[],
        "travelHistory":false,
        "contactWithCovidPatient":false,
        "isAdmin": 0
    };

    //save user data
    data.User.push(objUser);

    console.log(data.User);

    res.send({"userId": objUser.userId})
});

app.put('/selfAssessment', (req, res) => {
    /*{
        "userId":req.body.userId,
        "symptoms":req.body.symptoms,
        "travelHistory":req.body.travelHistory,
        "contactWithCovidPatient":req.body.contactWithCovidPatient
    }*/

    //fetch User from DB based on Id
    let user = {};
    for(let i = 0; i < data.User.length; i++) {
        let DBuser = data.User[i];

        if(DBuser.userId === req.body.userId) {
            user = DBuser;
            break;
        }
    }
    
    //send message to user if user not found with given id
    user.symptoms = req.body.symptoms;
    user.travelHistory = req.body.travelHistory;
    user.contactWithCovidPatient = req.body.contactWithCovidPatient;

    let risk = 0;
    if(user.symptoms.length === 0 && (user.travelHistory === false || contactWithCovidPatient === false)) {
        risk = 5;
    } else if(user.symptoms.length === 1 && (user.travelHistory === true || contactWithCovidPatient === true)) {
        risk = 50;
    } else if(user.symptoms.length === 2 && (user.travelHistory === true || contactWithCovidPatient === true)) {
        risk = 75;
    } else if(user.symptoms.length > 2 && (user.travelHistory === true || contactWithCovidPatient === true)) {
        risk = 95;
    }

    //update userinfo in db
    console.log(user);

    res.send({"riskPercentage": risk});
});

app.post('/registerAdmin', (req, res) => {
    let objUser = {
        "userId": data.User.length + 1,
        "name": req.body.name,
        "phoneNumber":req.body.ph_no,
        "pinCode":req.body.pin,
        "symptoms":[],
        "travelHistory":false,
        "contactWithCovidPatient":false,
        "isAdmin": 1
    };

    //save user data
    data.User.push(objUser);

    res.send({"adminId": objUser.userId});
});

app.put('/updateCovidResult', (req, res) => {
    let covidResult = {};
    for(let i = 0; i < data.CovidResult.length; i++) {
        let DBResult = data.CovidResult[i];

        if(DBResult.userId === req.body.userId) {
            covidResult = DBResult;
            break;
        }
    }

    if(covidResult.hasOwnProperty("userId")) {
        covidResult.adminId = req.body.adminId;
        covidResult.result = req.body.result;
    }
    else {
        data.CovidResult.push(req.body);
    }

    res.send({"updated":true});
});

app.get('/zoneInfo', (req, res) => {
    let resultMap = {};

    for(let i = 0; i < data.CovidResult.length; i++) {
        let objCovidRes = data.CovidResult[i];
        if(!resultMap.hasOwnProperty(objCovidRes.userId)) {
            resultMap[objCovidRes.userId] = objCovidRes.result;
        }
    }

    let zoneMap = {};

    for(let i = 0; i < data.User.length; i++) {
        let objUser = data.User[i];
        if(zoneMap.hasOwnProperty(objUser.pinCode)) {
            if(resultMap[objUser.userId] == "positive") {
                zoneMap[objUser.pinCode] = zoneMap[objUser.pinCode] + 1;
            }
        }
        else {
            if(resultMap[objUser.userId] == "positive") {
                zoneMap[objUser.pinCode] = 1;
            }
            else {
                zoneMap[objUser.pinCode] = 0;
            }
        }
    }

    let type = zoneMap[req.body.pinCode] < 5 ? "ORANGE" : "RED";

    res.send({"numCases": zoneMap[req.body.pinCode],"zoneType": type});
});

app.listen(port, () => console.log(`Application listening on port ${port}!`));