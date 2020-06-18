var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var mysql = require("mysql");
const bodyParser = require("body-parser");
const request = require("request");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});


connectionsArray = [];
var con = mysql.createConnection({
    host: "172.18.0.162",
    user: "robo1",
    password: "@vjqNu3@a#zrkTx",
    database: "automated",
  });

  

server.listen(5012);
var POLLING_INTERVAL = 3000,
pollingTimer;

con.connect(function(err) {
    if (err) {
        console.log('Error connecting to Db');
        return;
    }
    console.log('Connection To AGVadmin DB_Server.');
});

var pollingLoop = function() {
let db1 = "SELECT * FROM automated.day_dashboard ";
    con.query(db1, function(error, results, fields) {
        if (error) throw error;
        var agv001 = [];
        agv001.push(results);
        if (connectionsArray.length) {
            //  pollingTimer = setTimeout(pollingLoop, POLLING_INTERVAL);
           updateSockets({
            agv001: agv001
        }, "dashboardAGV001");
       } else {
        console.log('Not Client Connected?');
    }
});

let db2 = "SELECT * FROM automated.day7day_total ";
    con.query(db2, function(error, results, fields) {
        if (error) throw error;
        var agv002 = [];
        agv002.push(results);
        if (connectionsArray.length) {
            //  pollingTimer = setTimeout(pollingLoop, POLLING_INTERVAL);
           updateSockets({
            agv002: agv002
        }, "dashboardAGV002");
       } else {
        console.log('Not Client Connected?');
    }

});

let db3 = "SELECT * FROM automated.online_bytime ORDER BY timeTitle ASC";
    con.query(db3, function(error, results, fields) {
        if (error) throw error;
        var agv003 = [];
        agv003.push(results);
        if (connectionsArray.length) {
         //  pollingTimer = setTimeout(pollingLoop, POLLING_INTERVAL);
           updateSockets({
            agv003: agv003
        }, "dashboardAGV003");
       } else {
        console.log('Not Client Connected?');
    }

});

let db5 = "SELECT * FROM automated.online_bytime_pick ORDER BY timeTitle ASC";
    con.query(db5, function(error, results, fields) {
        if (error) throw error;
        var agv006P = [];
        agv006P.push(results);
        if (connectionsArray.length) {
            //  pollingTimer = setTimeout(pollingLoop, POLLING_INTERVAL);
           updateSockets({
            agv006P: agv006P
        }, "dashboardAGV006P");
       } else {
        console.log('Not Client Connected?');
    }

});

let db4 = "SELECT * FROM automated.processagv ";
    con.query(db4, function(error, results, fields) {
        if (error) throw error;
        var agv011 = [];
        agv011.push(results);
        if (connectionsArray.length) {
            //  pollingTimer = setTimeout(pollingLoop, POLLING_INTERVAL);
           updateSockets({
            agv011: agv011
        }, "dashboardAGV011");
       } else {
        console.log('Not Client Connected?');
    }

});

// callOnlineOrder
var headersOpt = {
    "content-type": "application/json",
    "X-JIB-Client-Secret": "06de3aa437da4dff4174e8629d4c8090",
    "X-JIB-Client-Id": "6602170006",
  };
  var options = {
    method: "GET",
    url: "https://mapi.jib.co.th/api/v1/agv/order_wait",
    headers: headersOpt,
    json: true,
  };

  request(options, function (error, response) {
    if (error) {
        console.log(error);
        if (connectionsArray.length) {
        pollingTimer = setTimeout(pollingLoop, POLLING_INTERVAL);
        }
    }else{
        var agvonline = [];
        agvonline.push(response.body);
        if (connectionsArray.length) {
             pollingTimer = setTimeout(pollingLoop, POLLING_INTERVAL);
           updateSockets({
            agvonline: agvonline
        }, "waitToagv");
       } else {
        console.log('Not Client Connected?');
    }

    }
    });

};



// creating a new websocket to keep the content updated without any AJAX request
io.sockets.on('connection', function(socket) {
    var socketId = socket.id;
    var clientIp = socket.request.connection.remoteAddress;
    console.log('[' + connectionsArray.length + ']New Client is Connected!' + clientIp);
    if (!connectionsArray.length) {

        pollingLoop();

    }
    socket.on('disconnect', function() {
        var socketIndex = connectionsArray.indexOf(socket);
        console.log(clientIp + '>>Client = %s  LogOut', socketIndex);
        if (~socketIndex) {
            connectionsArray.splice(socketIndex, 1);
        }
    });
    connectionsArray.push(socket);
});

var updateSockets = function(data, messager) {
    data.time = new Date();
    connectionsArray.forEach(function(tmpSocket) {
        tmpSocket.volatile.emit(messager, data);
    });
};

