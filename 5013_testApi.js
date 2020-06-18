var express = require("express");
const app = express();
const mysql = require("mysql");
const bodyParser = require("body-parser");
const request = require("request");
var async = require("async");
var path = require("path");
const fs = require("fs");
var sha512 = require("js-sha512");
var dateFormat = require("dateformat");

var staticPath = path.join(__dirname, "/");
app.use(express.static(staticPath));
const port = 5013;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});
// app.get("/helps", function (req, res) {
//   res.sendFile(__dirname + "/index.html");
// });
app.listen(port, () => console.log(`Server AGV on port ${port}`));
var con = mysql.createConnection({
  host: "172.18.0.162",
  user: "robo1",
  password: "@vjqNu3@a#zrkTx",
  database: "automated",
});
// var con155 = mysql.createConnection({
//   host: "172.18.0.155",
//   user: "apiuser",
//   password: "gvH,wvgvl",
//   database: "jib",
// });
// con.connect(function (err) {
//   if (err) throw err;
//   console.log("Connected!");
// });

// API
app.get("/jibonline/logsApi/:id", function (req, res) {
  console.log("Connect API {"+req.params.id+"}");
  res.json({status:true})
});


app.use(function (err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    res.status(401).send(err);
  } else {
    next(err);
  }
});
function verifyToken(req, res, next) {
  var token = req.headers["mis-access-token"];
  // e4101879-3ae5-452c-b750-7b88c82e76a4
  if (!token)
    return res
      .status(401)
      .send({ status: false, message: "No token provided." });
  if (token === "e4101879-3ae5-452c-b750-7b88c82e76a4") {
    next();
  } else {
    console.log("No token provided");
    return res
      .status(401)
      .send({ status: false, message: "No token provided." });
  }
}
