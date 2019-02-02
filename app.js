//requiring external modules
const express = require("express");
const path = require("path");
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const cookieParser = require('cookie-parser');
const session = require('express-session');
const multer = require('multer');
var fs = require("fs");
const url = 'mongodb://codeit2218:codeit123@ds239692.mlab.com:39692/codeit';


//requiring internal modules
var usersRouter = require("./routes/users.js");

//middleware
var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'sssshhhhh'
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));


//routes middleware (do not use this now - some error)
//app.use('/users', usersRouter);

var error = 0;
var currentStatus = "hella";

app.get("/dashboard", function(req, res) {
    if (req.session.uid)
        {
        
        var obj = "";
        MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("codeit");
        dbo.collection("users").find({username: req.session.uid}).toArray(function(err, result) {
            if (err) 
            {
                throw err;
            }
            obj = result;
            
            
             obj[0].courses.forEach(function(obj) {
            if(obj.status!="done"){
                var inTime = obj.dateOfEnrollment;
                var currTime = Math.floor(Date.now()/1000);
                var diff = Math.floor((currTime-inTime)/(60*60*24));
                obj.week = diff+1;
                obj.perc = Math.floor(((diff)/7)*100);
                if(diff>0)
                    obj.status="RESUME";
                if(diff>7)
                    obj.status="ATTEMPT QUIZ";
            }
             });
            
            
            db.close();
             res.render('dashboard',{obj: obj,uname: req.session.uid,pageHeading: "DASHBOARD"});
        });
    });   
    }
    else
        res.redirect('./');
});

app.get("/courses", function(req, res) {
    if (req.session.uid)
    {
        
        var obj = "";
        MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("codeit");
        dbo.collection("courses").find({}).toArray(function(err, result) {
            if (err) 
            {
                throw err;
            }
            obj = result;
             
            db.close();
             res.render('courses',{obj: obj,uname: req.session.uid,pageHeading: "ALL COURSES",currentStatus: currentStatus});
            currentStatus = "";
        });
    });       
    }
    else
        res.redirect('./');
});

app.get("/quickNotes", function(req, res) {
    if (req.session.uid)
        res.render("quick-notes",{uname: req.session.uid,pageHeading: "QUICK NOTES"});
    else
        res.redirect('./');
});
app.get("/references", function(req, res) {
    if (req.session.uid)
        res.render("references",{uname: req.session.uid,pageHeading: "REFERENCES"});
    else
        res.redirect('./');
});


app.get("/quiz", function(req, res) {
    if (req.session.uid)
        res.render("quiz_general");
    else
        res.redirect('./');
});
app.get('/requestQuestion', function(req, res) {
    var t = [{
            q: 10,
            a: 11,
            b: 12,
            c: 13,
            d: 14,
            ans: 1
        },
        {
            q: 20,
            a: 21,
            b: 22,
            c: 23,
            d: 24,
            ans: 4
        },
        {
            q: 30,
            a: 31,
            b: 32,
            c: 33,
            d: 34,
            ans: 3
        },
        {
            q: 40,
            a: 41,
            b: 42,
            c: 43,
            d: 44,
            ans: 2
        }
    ];
    res.send(t);
});

app.post("/course", function(req, res) {
    if (req.session.uid)
    {  
        MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("codeit");
        dbo.collection("courses").find({}).toArray(function(err, result) {
            if (err) throw err;
            db.close();
        });
    });
      res.render("course_template",{uname: req.session.uid,pageHeading: "ALL COURSES",cname: req.body.name, week: req.body.week,status: req.body.status});           
    }
    else
        res.redirect('./');
});

app.post("/signup", function(req, response) {

    //getting the values from the form
    var name = req.body.name;
    var phn = req.body.phn;
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    var repwd = req.body.repwd;
    var description = req.body.description;
    var points = 0;

    var flag = true;


    //form validation
    if (password != repwd || !(/^[0-9]{10}$/.test(phn)))
        flag = false;
    else {
        MongoClient.connect(url, function(err, db) {
            //            if (err) throw err;
            var dbo = db.db("codeit");
            dbo.collection('users').findOne({
                username: username
            }, function(err, result) {
                //        if (err) throw err;
                if (result) {
                    error = 2;
                    response.redirect('./');
                } else {
                    MongoClient.connect(url, function(err1, db1) {
                        //                if (err1) throw err;
                        var dbo1 = db1.db("codeit");
                        dbo1.collection('users').insertOne({
                            name: name,
                            phn: phn,
                            username: username,
                            email: email,
                            password: password,
                            description: description,
                            points: points,
                            coursesDone: 0,
                            courses: []
                        }, function(err, res) {
                            if (err) {
                                db1.close();
                            }
                            // Success
                            error = 3;
                            response.redirect('/');
                            db1.close();
                        });
                    });
                }
                // Success
                db.close();
            });
        });
    }
});



app.post("/login", function(req, res) {
    var email = req.body.email;
    var password = req.body.password;

    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("codeit");
        dbo.collection("users").findOne({
            $and: [{
                email: email
            }, {
                password: password
            }]
        }, function(err, result) {
            if (err) throw err;
            if (result) {
                req.session.uid = result.username;
                res.redirect('/dashboard');
            } else {
                error = 1;
                res.redirect('./');
            }
            db.close();
        });
    });

});

app.post('/addCourse',function(req,response){
    var cid = req.body.cid;
    var cname = req.body.cname;
    var uid = req.session.uid;
    var time = Math.floor(Date.now()/1000);
    var courseToAdd = {
            courseId: cid,
            courseName: cname,
            dateOfEnrollment: time,
            status: "BEGIN",
            quiz: "no"
        };
    //add to database here and redirect to courses page
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("codeit");
        var myquery = { username: uid };
        var newvalues = { $push:{courses: courseToAdd}};
        dbo.collection("users").findOne({$and:[{username: uid},{"courses.courseId" : cid}]},function(err,result){
            if(!result){
                dbo.collection("users").updateOne(myquery, newvalues, function(err, res) {
                    if (err) throw err;
                    db.close();
                    currentStatus = "DONE";
                    response.redirect('courses');
                });
            }
            else
                {
                     currentStatus = "ALREADY";
                     response.redirect('courses');
                }
        });
    });
});



app.get('/logout', function(req, res) {
    req.session.destroy();
    res.redirect('./');
});







app.get('/', function(req, res) {
    var t = "";
    if (error == 1)
        t = "404"
    if (error == 2)
        t = "500"
    if (error == 3)
        t = "200";
    var error1 = {
        error: t
    };
    error = 0;
    res.render('index', error1);
});


//server listening
app.listen(3000, function() {
    console.log("Server is listening on port 3000");
});



module.exports = app;