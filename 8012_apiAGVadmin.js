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
const port = 8012;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});
app.listen(port, () => console.log(`Server AGV on port ${port}`));
var con = mysql.createConnection({
  host: "172.18.0.162",
  user: "robo1",
  password: "@vjqNu3@a#zrkTx",
  database: "automated",
});
var con155 = mysql.createConnection({
  host: "172.18.0.155",
  user: "apiuser",
  password: "gvH,wvgvl",
  database: "jib",
});
con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

// API
app.get("/AGVadmin/getviewsProduct/:id", function (req, res) {
  console.log("Connect API /AGVadmin/getviewsProduct");
  let ErrorBox = Array();
  let dataSend = Array();
  let str =
    "SELECT TRIM(Name) AS Name from jib.impproduct where TRIM(Product)='" +
    req.params.id +
    "'";
  con155.query(str, function (err, result) {
    if (!err) {
      res.json({
        status: true,
        data: result,
        message: "พบรายการสำหรับ pending...",
      });
    } else {
      res.json({
        status: false,
        message: "ไม่พบรายการสำหรับ pending...",
      });
    }
  });
});

app.get("/AGVadmin/GetSecret", function (req, res) {
  res.json({
    status: true,
    GetSecretUpdate: GetSecretUpdate(),
    GetjobidUpdate: GetjobidUpdate("CPD"),
  });
});

app.get("/AGVadmin/agvInbound/:branch/:id", function (req, res) {
  var branch = req.params.branch;
  var billID = req.params.id;
  console.log("Connect API /AGVadmin/agvInbound/" + branch + "/" + billID);
  var headersOpt = {
    "content-type": "application/json",
  };
  request(
    {
      method: "get",
      url: "http://172.18.0.135:9203/agvInbound/" + branch + "/" + billID,
      headers: headersOpt,
      json: true,
    },
    function (error, response, body) {
      if (!error) {
        if (response.body[0].length > 0) {
          // var insInbound = inBoundDoc(response.body);
          let ProductIn = Array();
          // let ProductNot = Array();
          var statusBill = true;
          async.forEach(
            response.body[1],
            function (row, callback) {
              let str =
                "SELECT count(*) AS bb FROM automated.agvproduct WHERE productcode='" +
                row.Product +
                "'";

              con.query(str, function (errstr, resultstr) {
                if (!errstr) {
                  if (resultstr[0].bb > 0) {
                    let pronew = Array();
                    pronew = {
                      Product: row.Product,
                      ProductName: row.ProductName,
                      Type: row.Type,
                      Qty: row.Qty,
                      chk: 0,
                    };
                    ProductIn.push(pronew);
                  } else {
                    if (statusBill == true) {
                      statusBill = false;
                    }
                    let pronew = Array();
                    pronew = {
                      Product: row.Product,
                      ProductName: row.ProductName,
                      Type: row.Type,
                      Qty: row.Qty,
                      chk: 1,
                    };
                    ProductIn.push(pronew);
                  }
                  callback(null);
                } else {
                  callback(null);
                }
              });
            },
            function (err) {
              if (err) {
                res.json({
                  status: false,
                  error: err,
                  message: "พบปัญหาเกิดขึ้น ตรวจสอบอีกครั้ง...",
                });
              } else {
                let newdata = Array();
                newdata.push(response.body[0][response.body[0].length - 1]);
                res.json({
                  success: true,
                  BillDoc: newdata,
                  status: statusBill,
                  ProductBill: ProductIn,
                });

                // res.json({
                //   success: true,
                //   BillDoc: response.body[0],
                //   status: statusBill,
                //   ProductBill: ProductIn,
                // });
              }
            }
          );
        } else {
          res.json({
            status: false,
            error: [],
            message: "ไม่พบบิลโอนนี้ในระบบ ตรวจสอบข้อมูลใหม่อีกครั้ง...",
          });
        }
      } else {
        res.json({
          status: false,
          error: error,
          message: "",
        });
      }
    }
  );
});

app.get("/AGVadmin/getForInbound/:branch/:id/:type", function (req, res) {
  var branch = req.params.branch;
  var billID = req.params.id;
  var billtype = "";
  if (req.params.type == 0) {
    billtype = "STOCK-IN";
  } else {
    billtype = "BUY-IN";
  }
  console.log("Connect API /AGVadmin/getForInbound/" + branch + "/" + billID);
  var headersOpt = {
    "content-type": "application/json",
  };
  request(
    {
      method: "get",
      url: "http://172.18.0.135:9203/agvInbound/" + branch + "/" + billID,
      headers: headersOpt,
      json: true,
    },
    function (error, response, body) {
      if (!error) {
        if (response.body[0].length > 0) {
          let ProductIn = Array();
          async.forEach(
            response.body[1],
            function (row, callback) {
              let str =
                "SELECT count(*) AS bb FROM automated.agvproduct WHERE productcode='" +
                row.Product +
                "'";
              con.query(str, function (errstr, resultstr) {
                if (!errstr) {
                  if (resultstr[0].bb > 0) {
                    let pronew = Array();
                    pronew = {
                      boxno: billID + "-" + branch + "-1",
                      skuCode: row.Product,
                      name: row.ProductName,
                      quantity: row.Qty,
                    };
                    ProductIn.push(pronew);
                  }
                  callback(null);
                } else {
                  callback(null);
                }
              });
            },
            function (err) {
              if (err) {
                res.json({
                  status: false,
                  error: err,
                  message: "พบปัญหาเกิดขึ้น ตรวจสอบอีกครั้ง...",
                });
              } else {
                res.json({
                  success: true,
                  billNumber: billID + "-" + branch,
                  billType: billtype,
                  billDate: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss.l"),
                  details: ProductIn,
                });
              }
            }
          );
        } else {
          res.json({
            status: false,
            error: [],
            message: "ไม่พบบิลโอนนี้ในระบบ ตรวจสอบข้อมูลใหม่อีกครั้ง...",
          });
        }
      } else {
        res.json({
          status: false,
          error: error,
          message: "",
        });
      }
    }
  );
});

app.post("/AGVadmin/createProduct", function (req, res) {
  let dataJson = req.body;
  console.log("Connect API /AGVadmin/createProduct/");
  const secret = GetSecretUpdate();
  const jobid = GetjobidUpdate("CPD");
  console.log(jobid);
  let ProductInAGV = Array();
  let resultNotInsert = Array();
  let ProductIn = dataJson.ProductIn;
  // console.log(dataJson.ProductNot)
  async.forEach(
    dataJson.ProductNot,
    function (row, callback) {
      if (row.chk == 0) {
        let Product = Array();
        Product = {
          skuCode: row.Product,
          skuNumber: row.Product,
          name: row.ProductName,
          Type: row.Type,
          Qty: row.Qty,
          packInfoList: [],
        };
        ProductInAGV.push(Product);
        callback(null);
      } else {
        let insLog =
          "INSERT INTO automated.logs_agv SET logdate=NOW(),logs_message='NOT INSERT " +
          row.Product +
          " IN AGV --Bill " +
          dataJson.ID +
          "' ";
        con.query(insLog, function (errins, resultins) {
          if (!errins) {
            resultNotInsert.push("NOT INSERT " + row.Product + " IN AGV ");
            callback(null);
          } else {
            resultNotInsert.push("NOT INSERT " + row.Product + " IN AGV ");
            callback(null);
          }
        });
      }
    },
    function (err) {
      if (!err) {
        if (ProductInAGV.length > 0) {
          var headersOpt = {
            "content-type": "application/json",
            user: "jibmis",
            secret: secret,
            jobid: jobid,
          };
          var options = {
            method: "POST",
            url: "http://172.18.0.162:9500/agv/createProduct",
            headers: headersOpt,
            json: true,
            body: ProductInAGV,
          };
          request(options, function (error, response) {
            if (error) {
              res.json({
                status: false,
                error: error,
              });
            } else {
              if (response.body == null) {
                console.log("พบปัญหาเกิดขึ้น ลองใหม่อีกครั้ง AGV return Null");
                res.json({
                  status: false,
                  response: response.body,
                  stage: "REQUEST TO AGV",
                  message: "พบปัญหาเกิดขึ้น ลองใหม่อีกครั้ง...",
                });
              } else {
                if (response.body.header.resultcode == "SUCCESS") {
                  // ADD INBOUND
                  console.log("เพิ่มรายการสินค้าใน AGV SUCCESS");
                  let resultInsert = Array();
                  let resultNotInsert = Array();
                  async.forEach(
                    ProductInAGV,
                    function (row, callback) {
                      let ins =
                        "INSERT INTO automated.agvproduct SET productcode='" +
                        row.skuCode +
                        "',productname='" +
                        row.name +
                        "',flag=0,upd=NOW()";
                      con.query(ins, function (errins, resultins) {
                        if (!errins) {
                          let insLog =
                            "INSERT INTO automated.logs_agv SET logdate=NOW(),logs_message='INSERT " +
                            row.skuCode +
                            " IN AGV --Bill " +
                            dataJson.ID +
                            "' ";
                          con.query(insLog, function (errins, resultins) {
                            if (!errins) {
                              // let newProAgv = Array();
                              // newProAgv = {
                              //   Product: row.skuCode,
                              //   ProductName: row.name,
                              //   Type: row.Type,
                              //   Qty: row.Qty,
                              //   chk: 0
                              // };
                              // ProductIn.push(newProAgv);
                              resultInsert.push(
                                "NEW INSERT " + row.skuCode + " IN AGV "
                              );
                              callback(null);
                            } else {
                              resultNotInsert.push(
                                "NOT INSERT " + row.skuCode + " IN AGV "
                              );
                              callback(null);
                            }
                          });
                        } else {
                          resultNotInsert.push(
                            "NOT INSERT " + row.skuCode + " IN AGV "
                          );
                          callback(null);
                        }
                      });
                    },
                    function (err) {
                      if (err) {
                        res.json({
                          status: false,
                          error: err,
                          stage: "ADDING TO DB",
                          message: "พบปัญหาเกิดขึ้น ตรวจสอบอีกครั้ง...",
                        });
                      } else {
                        res.json({
                          success: true,
                          ID: dataJson.ID,
                          BF: dataJson.BF,
                          // Items: ProductIn,
                          InAGV_log: resultInsert,
                          NotAGV_log: resultNotInsert,
                          response: response.body,
                        });
                      }
                    }
                  );
                } else {
                  res.json({
                    status: false,
                    response: response.body,
                    message: "พบปัญหาเกิดขึ้น ลองใหม่อีกครั้ง...",
                  });
                }
              }
            }
          });
        } else {
          res.json({
            status: false,
            message: "คุณไม่ได้เลือกรายการนำเข้า AGV ใช่หรือไม่...",
          });
        }
      } else {
        res.json({
          status: false,
          error: err,
          message: "พบปัญหาเกิดขึ้น ตรวจสอบอีกครั้ง...",
        });
      }
    }
  );
});

app.post("/AGVadmin/callInBound", function (req, res) {
  let dataJson = req.body;
  let bodyJson = Array();
  bodyJson.push(dataJson[0]);
  console.log("Connect API /AGVadmin/callInBound");
  const secret = GetSecretUpdate();
  const jobid = GetjobidUpdate("IPD");

  var headersOpt = {
    "content-type": "application/json",
    user: "jibmis",
    secret: secret,
    jobid: jobid,
  };
  var options = {
    method: "POST",
    url: "http://172.18.0.162:9500/agv/inBound",
    headers: headersOpt,
    json: true,
    body: bodyJson,
  };
  request(options, function (error, response) {
    if (error) {
      console.log("ERROR CallInBound" + error);
      res.json({
        status: false,
        error: error,
      });
    } else {
      if (response.body) {
        if (response.body.header.resultcode == "SUCCESS") {
          let int =
            "UPDATE automated.inbound_doc SET ordStatus=1 WHERE billNumber='" +
            dataJson[0].billNumber +
            "'";
          // console.log(int);
          con.query(int, function (errstr2, resultstr2) {
            if (!errstr2) {
              res.json({
                status: true,
                dataJson: dataJson,
                response: response.body,
                error: errstr2,
              });
            } else {
              res.json({
                status: true,
                dataJson: dataJson,
                response: response.body,
                error: errstr2,
              });
            }
          });
        } else {
          res.json({
            status: true,
            dataJson: dataJson,
            response: response.body,
          });
        }
      } else {
        res.json({
          status: true,
          dataJson: dataJson,
          response: response.body,
        });
      }
    }
  });
});

app.post("/AGVadmin/pickingCancel", function (req, res) {
  let dataJson = req.body;
  console.log("Connect API /AGVadmin/pickingCancel");
  const secret = GetSecretUpdate();
  const jobid = GetjobidUpdate("OPD");

  var headersOpt = {
    "content-type": "application/json",
    user: "jibmis",
    secret: secret,
    jobid: jobid,
  };
  let bodySend = Array();
  bodySend.push(dataJson);
  var options = {
    method: "POST",
    url: "http://172.18.0.162:9500/agv/pickingCancel",
    headers: headersOpt,
    json: true,
    body: bodySend,
  };

  request(options, function (error, response) {
    if (error) {
      res.json({
        status: false,
        error: error,
        resAGV: response.body,
      });
    } else {
      if (response.body) {
        if (response.body.header.resultcode == "SUCCESS") {
          let reqSend = Array();
          async.forEach(
            dataJson,
            function (row, callback) {
              let newPro = Array();
              newPro = {
                billNumber: row.billNumber,
                cancel: true,
              };
              // console.log(row)

              // InputLogs(row, 8, "ยกเลิกบิลสำเร็จ", 0);
              Updatecancel(row, 8);
              reqSend.push(newPro);
              callback(null);
            },
            function (err) {
              if (err) {
                console.log("ยกเลิกบิลไม่สำเร็จ..");
                res.json({
                  status: false,
                  err: err,
                  msg: "ทำรายการไม่สำเร็จ ลองใหม่อีกครั้ง",
                  resAGV: response.body,
                });
              } else {
                console.log("ยกเลิกบิลสำเร็จ..");
                res.json({
                  status: true,
                  response: reqSend,
                  msg: "ยกเลิกรายการของคุณแล้ว",
                  resAGV: response.body,
                });
              }
            }
          );
        } else {
          res.json({
            status: false,
            response: [],
            msg: "ทำรายการไม่สำเร็จ ลองใหม่อีกครั้ง",
            resAGV: response.body,
          });
        }
      } else {
        res.json({
          status: true,
          msg: "ทำรายการไม่สำเร็จ ลองใหม่อีกครั้ง",
          resAGV: response.body,
        });
      }
    }
  });
});

app.post("/AGVadmin/pickingManualist", function (req, res) {
  let dataJson = req.body;
  var skuCode = dataJson.skuCode;
  console.log("Connect API /AGVadmin/pickingManualist");
  let instr =
    "SELECT * FROM automated.agvproduct WHERE productcode='" + skuCode + "'";
  con.query(instr, function (errins, resultins) {
    if (!errins) {
      if (resultins.length > 0) {
        let newReturn = Array();
        newReturn = {
          billType: "Manual Request",
          shipToName: dataJson.shipToName,
          remark: "เบิกสินค้าด้วยระบบ Manual",
          details: resultins,
        };
        res.json({
          status: true,
          data: newReturn,
        });
      } else {
        res.json({
          status: false,
          msg: "ไม่พบข้อมูลสินค้า ในระบบ AGV",
        });
      }
    } else {
      res.json({
        status: false,
        msg: errins,
      });
    }
  });
});

app.post("/AGVadmin/pickingManualCall", function (req, res) {
  let dataJson = req.body;
  // var skuCode = dataJson.skuCode;
  // console.log(dataJson)
  console.log("Connect API /AGVadmin/pickingManualCall");

  let last =
    "SELECT IFNULL(MAX(billNumber),'') AS lastdoc FROM automated.picking_manual WHERE YEAR(billDate)=YEAR(CURDATE()) AND MONTH(billDate)=MONTH(CURDATE())";
  con.query(last, function (errins, resultins) {
    if (!errins) {
      var genid = "";

      if (dataJson.billNumber == "") {
        genid = generateCodeID("PM-", resultins[0].lastdoc.slice(2));
      } else {
        genid = dataJson.billNumber;
      }

      var priority = 16;
      var billDate = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss.l");

      let dataSend = Array();
      let details = Array();
      details.push(dataJson.details);
      dataSend = {
        billNumber: genid,
        // billType: dataJson.billType,
        billDate: billDate,
        priority: priority,
        shipToName: dataJson.shipToName,
        remark: dataJson.remark,
        details: details,
      };
      // console.log(dataJson)
      let ins =
        "INSERT INTO automated.picking_manual SET billNumber='" +
        dataSend.billNumber +
        "',billType='" +
        dataJson.billType +
        "',priority=" +
        dataSend.priority +
        ",billDate=NOW(),shipToName='" +
        dataSend.shipToName +
        "',remark='" +
        dataSend.remark +
        "',skuCode='" +
        dataJson.details.skuCode +
        "',quantity=" +
        dataJson.details.quantity +
        ",ordstatus=0,upd=NOW()";

      con.query(ins, function (errins2, resultins2) {
        if (!errins2) {
          const secret = GetSecretUpdate();
          const jobid = GetjobidUpdate("OPD");
          var headersOpt = {
            "content-type": "application/json",
            user: "jibmis",
            secret: secret,
            jobid: jobid,
          };
          let bodySend = Array();
          bodySend.push(dataSend);
          var options = {
            method: "POST",
            url: "http://172.18.0.162:9500/agv/picking",
            headers: headersOpt,
            json: true,
            body: bodySend,
          };

          request(options, function (error, response) {
            if (error) {
              var msg = "ไม่สามารถทำรายการได้ กรุณาลองใหม่อีกครั้ง";
              InputLogs(dataSend.billNumber, 1, msg, 0);
              con.query(
                "UPDATE automated.picking_manual SET ordstatus=2 WHERE billNumber='" +
                  dataSend.billNumber +
                  "'",
                function (errins3, resultins3) {
                  if (!errins3) {
                    res.json({
                      success: true,
                      billNumber: dataSend.billNumber,
                      priority: dataSend.priority,
                      billDate: dataSend.billDate,
                      shipToName: dataSend.shipToName,
                      remark: dataSend.remark,
                      resultMessage: {
                        statusBill: false,
                        msg: msg,
                        responseAGV: response.body,
                      },
                      bodySend: bodySend,
                    });
                  }
                }
              );
            } else {
              if (response.body) {
                if (response.body.header.resultcode == "SUCCESS") {
                  var msg = "ทำรายการสำเร็จ AGV กำลังทำงานกับออร์เดอร์ของคุณ";
                  InputLogs(dataSend.billNumber, 0, msg, priority);
                  con.query(
                    "UPDATE automated.picking_manual SET ordstatus=1 WHERE billNumber='" +
                      dataSend.billNumber +
                      "'",
                    function (errins3, resultins3) {
                      if (!errins3) {
                        res.json({
                          success: true,
                          billNumber: dataSend.billNumber,
                          priority: dataSend.priority,
                          billDate: dataSend.billDate,
                          shipToName: dataSend.shipToName,
                          remark: dataSend.remark,
                          resultMessage: {
                            statusBill: true,
                            msg: msg,
                          },
                          responseAGV: response.body,
                          bodySend: bodySend,
                        });
                      }
                    }
                  );
                } else {
                  var msg = "ไม่สามารถทำรายการได้ กรุณาลองใหม่อีกครั้ง";
                  InputLogs(dataSend.billNumber, 1, msg, 0);
                  con.query(
                    "UPDATE automated.picking_manual SET ordstatus=0 WHERE billNumber='" +
                      dataSend.billNumber +
                      "'",
                    function (errins3, resultins3) {
                      if (!errins3) {
                        res.json({
                          success: true,
                          billNumber: dataSend.billNumber,
                          priority: dataSend.priority,
                          billDate: dataSend.billDate,
                          shipToName: dataSend.shipToName,
                          remark: dataSend.remark,
                          resultMessage: {
                            statusBill: false,
                            msg: msg,
                            responseAGV: response.body,
                            bodySend: bodySend,
                          },
                        });
                      }
                    }
                  );
                }
              } else {
                var msg = "ไม่สามารถทำรายการได้ กรุณาลองใหม่อีกครั้ง";
                InputLogs(dataSend.billNumber, 1, msg, 0);
                con.query(
                  "UPDATE automated.picking_manual SET ordstatus=0 WHERE billNumber='" +
                    dataSend.billNumber +
                    "'",
                  function (errins3, resultins3) {
                    if (!errins3) {
                      res.json({
                        success: true,
                        billNumber: dataSend.billNumber,

                        priority: dataSend.priority,
                        billDate: dataSend.billDate,
                        shipToName: dataSend.shipToName,
                        remark: dataSend.remark,
                        resultMessage: {
                          statusBill: false,
                          msg: msg,
                          responseAGV: response.body,
                        },
                      });
                    }
                  }
                );
              }
            }
          });
        } else {
          res.json({
            status: false,
            msg: errins2,
            sql: ins,
          });
        }
      });
    } else {
      res.json({
        status: false,
        msg: errins,
      });
    }
  });
});

app.get("/AGVadmin/getPickingday", function (req, res) {
  console.log("Connect API /AGVadmin/getPickingday");
  let str =
    "SELECT * FROM automated.picking_manual WHERE date(upd)=CURDATE() ORDER BY upd DESC";
  con.query(str, function (errstr, resultstr) {
    if (!errstr) {
      res.json({
        status: true,
        data: resultstr,
      });
    } else {
      res.json({
        status: false,
        err: errstr,
      });
    }
  });
});

app.get("/AGVadmin/getStockzero/:id", function (req, res) {
  let str = "SELECT productcode,productname FROM agvproduct";
  con.query(str, function (err, result) {
    if (!err) {
      console.log("Connect API /AGVadmin/getStockzero");
      let ErrorBox = Array();
      let dataJson = Array();
      async.forEach(
        result,
        function (row, callback) {
          con155.query(
            "SELECT IFNULL(a.sto,0) AS sto,IFNULL(a.trn,0) AS trn,IFNULL((SELECT sto FROM jib.stocknow_by_product  WHERE branch='75' AND productid=a.productid),0) AS st75 FROM jib.stocknow_by_product a WHERE a.branch='234' AND a.productid='" +
              row.productcode +
              "'",
            function (error, result155) {
              if (!error) {
                let dataSend = Array();
                var sto = 0;
                var trn = 0;
                var st75 = 0;
                if (result155.length > 0) {
                  sto = result155[0].sto;
                  trn = result155[0].trn;
                }

                dataSend = {
                  skuCode: row.productcode,
                  skuName: row.productname,
                  skuStock: sto,
                  skuBilltrn: trn,
                  skuStock75: st75,
                };
                // if(sto==0){
                dataJson.push(dataSend);
                // }

                callback(null);
              } else {
                callback(null);
              }
            }
          );

          // console.log(row.productcode);
        },
        function (err) {
          if (!err) {
            dataJson.sort(function (a, b) {
              return a.skuStock < b.skuStock ? -1 : 1;
            });

            res.json({
              success: true,
              data: dataJson,
              ErrorBox: ErrorBox,
            });
          }
        }
      );
    }
  });
});

// PENDING BILL
app.post("/AGVadmin/createPendingbill", function (req, res) {
  let dataJson = req.body;
  var billNumber = dataJson.DocNo + "-" + dataJson.BF;
  console.log("Connect API /AGVadmin/createPendingbill");
  let ErrorBox = Array();
  async.forEach(
    dataJson.ProductBill,
    function (row, callback) {
      if (row.chk == 0) {
        inBoundDoc(dataJson, row, 0, 0);
        callback(null);
      } else {
        inBoundDoc(dataJson, row, 0, 1);
        callback(null);
      }
    },
    function (err) {
      ErrorBox.push(err);
      if (err) {
        let resdata = {
          status: false,
          error: err,
          ErrorBox: ErrorBox,
          message: "พบปัญหาเกิดขึ้น ตรวจสอบอีกครั้ง...",
        };
        InputFullLogs(billNumber, "CrPending", 0, "", dataJson, resdata, "JIB");
        res.json(resdata);
      } else {
        let resdata = {
          success: true,
          billNumber: billNumber,
          ErrorBox: ErrorBox,
        };
        InputFullLogs(billNumber, "CrPending", 1, "", dataJson, resdata, "JIB");
        res.json(resdata);
      }
    }
  );
});

app.get("/AGVadmin/viewsPendingbill", function (req, res) {
  console.log("Connect API /AGVadmin/viewsPendingbill");
  let ErrorBox = Array();
  let dataSend = Array();
  let str = "SELECT * FROM automated.pending_views ";
  con.query(str, function (err, result) {
    if (!err) {
      if (result.length > 0) {
        var create_status = true;
        var ord_status = true;
        async.forEach(
          result,
          function (row, callback) {
            let str2 =
              "SELECT Product,ProductName,Qty,create_status,ordStatus FROM automated.inbound_doc WHERE billNumber='" +
              row.billNumber +
              "'";
            var createSt = false;
            var ordStatus = false;
            var complete = false;
            con.query(str2, function (err_body, result_body) {
              if (!err_body) {
                let newProduct = Array();
                if (row.createStatus == 0) {
                  createSt = true;
                }

                if (row.ordStatusDoc > 0) {
                  ordStatus = true;
                }
                if (row.complete > 0) {
                  complete = true;
                }

                newProduct = {
                  billNumber: row.billNumber,
                  createDate: row.createDate,
                  BF: row.BF,
                  BranchFrom: row.BranchFrom,
                  BT: row.BT,
                  ToBranch: row.ToBranch,
                  Comment: row.Comment,
                  status_create: createSt,
                  status_ord: ordStatus,
                  complete: complete,
                  Product: result_body,
                };

                dataSend.push(newProduct);
                callback(null);
              } else {
                callback(null);
              }
            });
          },
          function (err) {
            ErrorBox.push(err);
            if (err) {
              res.json({
                status: false,
                ErrorBox: ErrorBox,
                message: "ไม่พบรายการสำหรับ pending...",
              });
            } else {
              res.json({
                success: true,
                data: dataSend,
                ErrorBox: ErrorBox,
              });
            }
          }
        );
      } else {
        res.json({
          status: false,
          ErrorBox: ErrorBox,
          message: "ไม่พบรายการสำหรับ pending...",
        });
      }
    } else {
      ErrorBox.push(err);
      res.json({
        status: false,
        ErrorBox: ErrorBox,
        message: "ไม่พบรายการสำหรับ pending...",
      });
    }
  });
});

app.post("/AGVadmin/createBySku", function (req, res) {
  let dataJson = req.body;
  console.log("Connect API /AGVadmin/createBySku/");
  const secret = GetSecretUpdate();
  const jobid = GetjobidUpdate("CPD");
  var headersOpt = {
    "content-type": "application/json",
    user: "jibmis",
    secret: secret,
    jobid: jobid,
  };

  let bodysend = Array();
  bodysend = {
    skuCode: dataJson.skuCode,
    skuNumber: dataJson.skuCode,
    name: dataJson.name,
    packInfoList: [],
  };
  let agvsend = Array();
  agvsend.push(bodysend);
  var options = {
    method: "POST",
    url: "http://172.18.0.162:9500/agv/createProduct",
    headers: headersOpt,
    json: true,
    body: agvsend,
  };
  request(options, function (error, response) {
    if (error) {
      res.json({
        status: false,
        error: error,
      });
    } else {
      if (response.body) {
        if (response.body.header.resultcode == "SUCCESS") {
          var requestid = response.body.header.requestid;
          let int =
            "UPDATE automated.inbound_doc SET create_status=0,jobid_res='" +
            requestid +
            "' WHERE billNumber='" +
            dataJson.billNumber +
            "' AND Product='" +
            dataJson.skuCode +
            "'";
          con.query(int, function (errstr, resultstr) {
            if (!errstr) {
              let inp =
                "INSERT INTO automated.agvproduct SET productcode='" +
                dataJson.skuCode +
                "',productname='" +
                dataJson.name +
                "',flag=0,upd=NOW()";
              con.query(inp, function (errint, resultint) {
                if (!errint) {
                  res.json({
                    status: true,
                    billNumber: dataJson.billNumber,
                    requestid: requestid,
                    response: response.body,
                    error: errint,
                  });
                } else {
                  res.json({
                    status: true,
                    billNumber: dataJson.billNumber,
                    requestid: requestid,
                    response: response.body,
                    error: errint,
                  });
                }
              });
            } else {
            }
          });
        } else {
          res.json({
            status: false,
            response: response.body,
          });
        }
      } else {
        res.json({
          status: false,
          response: response.body,
        });
      }
    }
  });
});

app.get("/AGVadmin/getSkuNewcreate/:id", function (req, res) {
  console.log("Connect API /AGVadmin/getSkuNewcreate");
  var productcode = req.params.id;
  var headersOpt = {
    "content-type": "application/json",
  };
  request(
    {
      method: "get",
      url:
        "http://172.18.0.135:9202/getProductDetail/" +
        encodeURIComponent(productcode),
      headers: headersOpt,
      json: true,
    },
    function (error, response, body) {
      if (!error) {
        if (response.body.length > 0) {
          let Pro = Array();
          Pro = {
            billNumber: GetBillNumberUpdate(),
            skuCode: response.body[0].Product,
            name: response.body[0].Name,
          };
          res.json({
            status: true,
            response: Pro,
            error: [],
          });
        } else {
          res.json({
            status: false,
            error: [],
            message: "ไม่พบ Sku นี้ในระบบ ตรวจสอบข้อมูลใหม่อีกครั้ง...",
          });
        }
      } else {
        res.json({
          status: false,
          error: error,
          message: "",
        });
      }
    }
  );
});

// AGV Feed back
app.post("/AGVadmin/updateInboundStatus", verifyToken, function (req, res) {
  let dataJson = req.body;
  let ErrorBox = Array();
  let SuccessBox = Array();
  console.log("Connect API /AGVadmin/updateInboundStatus ");
  async.forEach(
    dataJson,
    function (row, callback) {
      con.query(
        "UPDATE automated.inbound_doc SET ordStatus=5,date_complete=NOW(),station=1 WHERE billNumber='" +
          row.billNumber +
          "'",
        function (errst, resultst) {
          if (!errst) {
            SuccessBox.push("UPDATE " + row.billNumber);
            console.log("UPDATE " + row.billNumber);
            InputFullLogs(
              row.billNumber,
              "CallBackIn",
              1,
              "",
              dataJson,
              "{}",
              "JIB"
            );
            callback(null);
          } else {
            ErrorBox.push(errst);
            InputFullLogs(
              row.billNumber,
              "CallBackIn",
              0,
              "",
              dataJson,
              "{}",
              "JIB"
            );
            callback(null);
          }
        }
      );
    },
    function (err) {
      if (err) {
        res.json({
          status: "ERROR_LOOP",
          ErrorBox: ErrorBox,
          SuccessBox: SuccessBox,
        });
        // InputFullLogs(dataSend.billNumber,"OnlinePicking",0,"",bodySend,response.body.header)
      } else {
        res.json({
          status: "SUCCESS",
          SuccessBox: SuccessBox,
          ErrorBox: ErrorBox,
        });
      }
    }
  );
});

app.post("/AGVadmin/updateOutboundStatus", verifyToken, function (req, res) {
  let dataJson = req.body;
  let ErrorBox = Array();
  let SuccessBox = Array();
  console.log("Connect API /AGVadmin/updateOutboundStatus");
  async.forEach(
    dataJson,
    function (row, callback) {
      // InputFullLogs(row.billNumber,"CallBackOut",0,"",dataJson,"{}");
      var old_bill = row.billNumber;
      let billNewArr = old_bill.split("_");
      var billNew = "";
      var billType = "";
      if (billNewArr.length == 1) {
        billNew = billNewArr[0];
      } else {
        billNew = billNewArr[1];
      }
      billType = billNew.substr(0, 3);
      let ord_trn = Array();
      ord_trn = {
        details: row.details,
        billDate: row.billDate,
        billType: row.billType,
        shipDate: row.shipDate,
        billNumber: billNew,
        resultcode: row.resultcode,
      };
      var headersOpt = {
        "content-type": "application/json",
        "X-JIB-Client-Secret": "06de3aa437da4dff4174e8629d4c8090",
        "X-JIB-Client-Id": "6602170006",
      };
      var options = {
        method: "POST",
        url: "https://mapi.jib.co.th/api/v1/agv/order",
        headers: headersOpt,
        json: true,
        body: JSON.stringify(ord_trn),
      };

      request(options, function (error, response) {
        if (error) {
          InputFullLogs(
            row.billNumber,
            "CallBackOut",
            0,
            "",
            row,
            "{}",
            billType
          );
          callback(null);
        } else {
          if (response.body.status == true) {
            InputFullLogs(
              row.billNumber,
              "CallBackOut",
              1,
              "",
              row,
              response.body,
              billType
            );
            Updatecallbacktype(row.billNumber);
            callback(null);
          } else {
            InputFullLogs(
              row.billNumber,
              "CallBackOut",
              0,
              "",
              row,
              response.body,
              billType
            );
            Updatecallbacktype(row.billNumber);
            callback(null);
          }
        }
      });
      // callback(null);
    },
    function (err) {
      if (err) {
        res.json({
          status: "ERROR_LOOP",
          ErrorBox: ErrorBox,
          SuccessBox: SuccessBox,
        });
      } else {
        res.json({
          status: "SUCCESS",
          SuccessBox: SuccessBox,
          ErrorBox: ErrorBox,
        });
      }
    }
  );
});

app.post("/AGVadmin/updateLogs", function (req, res) {
  let data_json = req.body;
  // InputFullLogs(
  //   "411707-75",
  //   "INBOUND",
  //   1,
  //   "JIB-CPD-20200421-103936-06",
  //   data_json,
  //   "{}"
  // );
  let resdata = {
    status: true,
    dataJson: data_json,
  };
  res.json(resdata);
});

app.get("/AGVadmin/getReceiveLimit", function (req, res) {
  console.log("Connect API /AGVadmin/getReceiveLimit");
  let str =
    "SELECT title,total_wait,CASE WHEN total_request > 0 THEN total_request WHEN total_request < 1 THEN 0 ELSE 0 END AS total_request FROM automated.request_limitorder";
  con.query(str, function (errstr, resultstr) {
    if (!errstr) {
      res.json({
        status: true,
        title: resultstr[0].title,
        total_wait: resultstr[0].total_wait,
        total_request: resultstr[0].total_request,
      });
    } else {
      res.json({
        status: false,
        err: errstr,
      });
    }
  });
});

app.post("/AGVadmin/pickingInAGV_TRUE", function (req, res) {
  let dataJson = req.body;
  var billNumber = "";
  if (!dataJson.prefix || dataJson.prefix == "") {
    billNumber = dataJson.billNumber;
  } else {
    billNumber = dataJson.prefix + "_" + dataJson.billNumber;
  }
  console.log("Connect API /AGVadmin/pickingInAGV : " + billNumber);

  var priority = dataJson.priority;
  var billType = dataJson.billType;
  let errorBox = Array();
  let inAgv = Array();
  let inAgvNew = Array();
  let notAgv = Array();
  var reject = false;
  async.forEach(
    dataJson.details,
    function (row, callback) {
      var headersOpt = {
        "content-type": "application/json",
      };
      request(
        {
          method: "get",
          url:
            "http://172.18.0.135:9201/getProductQty/234/" +
            encodeURI(row.skuCode),
          headers: headersOpt,
          json: true,
        },
        function (error, response, body) {
          var stock = 0;
          if (error) {
            callback(null);
          } else {
            if (
              response.body.length > 0 &&
              typeof response.body[0].Qty !== "undefined"
            ) {
              stock = response.body[0].Qty;
            } else {
              stock = 0;
            }
            let str =
              "SELECT count(*) AS bb FROM automated.agvproduct WHERE productcode='" +
              row.skuCode +
              "' AND flag=0 ";
            con.query(str, function (err, result) {
              if (!err) {
                let newAgv = Array();
                newAgv = {
                  skuCode: row.skuCode,
                  skuName: row.skuName,
                  quantity: row.quantity,
                  stocknow: stock,
                };
                if (result[0].bb > 0) {
                  if (reject == false && row.quantity > stock) {
                    reject = true;
                  }
                  inAgv.push(row);
                  inAgvNew.push(newAgv);
                  callback(null);
                } else {
                  notAgv.push(newAgv);
                  callback(null);
                }
              } else {
                errorBox.push(err);
                callback(null);
              }
            });
          }
        }
      );
    },
    function (err) {
      if (!err) {
        if (inAgv.length > 0 && reject == false) {
          const secret = GetSecretUpdate();
          const jobid = GetjobidUpdate("OPD");
          var headersOpt = {
            "content-type": "application/json",
            user: "jibmis",
            secret: secret,
            jobid: jobid,
          };
          var billDate = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss.l");
          let dataSend = Array();
          dataSend = {
            billNumber: billNumber,
            billDate: billDate,
            priority: priority,
            shipToName: dataJson.shipToName,
            remark: dataJson.remark,
            details: inAgv,
          };
          let bodySend = Array();
          bodySend.push(dataSend);

          // Picking AGV
          var options = {
            method: "POST",
            url: "http://172.18.0.162:9500/agv/picking",
            headers: headersOpt,
            json: true,
            body: bodySend,
          };
          // var msg = "ไม่สามารถเชื่อมต่อไปที่ AGV ได้(์NOT REQUEST)";
          // console.log(msg + " -" + billNumber);
          // let res_json = {
          //   success: false,
          //   agvstatus: false,
          //   billNumber: dataSend.billNumber,
          //   reject: true,
          //   inAgv: inAgvNew,
          //   notAgv: notAgv,
          //   msg: msg,
          //   error:'ErrCxx2',
          //   errorBox: errorBox,
          //   bodySend:bodySend
          // };
          // InputFullLogs(
          //   billNumber,
          //   "OnlinePicking",
          //   0,
          //   "",
          //   bodySend,
          //   res_json,
          //   billType
          // );
          // res.json(res_json);

          request(options, function (error, response) {
            if (!error) {
              if (response.body) {
                if (response.body.header.resultcode == "SUCCESS") {
                  var msg = "ทำรายการสำเร็จ";
                  console.log(msg + " -" + billNumber);
                  let res_json = {
                    success: true,
                    agvstatus: true,
                    billNumber: dataSend.billNumber,
                    reject: reject,
                    inAgv: inAgvNew,
                    notAgv: notAgv,
                    msg: "เชื่อมต่อไปที่ AGV สำเร็จ",
                    error: [],
                    errorBox: errorBox,
                    Agv: response.body.header,
                  };
                  InputFullLogs(
                    billNumber,
                    "OnlinePicking",
                    1,
                    "",
                    bodySend,
                    res_json,
                    billType
                  );
                  res.json(res_json);
                } else {
                  var msg = "ออเดอร์ซ้ำ..";
                  console.log(msg + " -" + billNumber);
                  reject = true;
                  let res_json = {
                    success: true,
                    agvstatus: true,
                    billNumber: dataSend.billNumber,
                    reject: reject,
                    inAgv: inAgvNew,
                    notAgv: notAgv,
                    msg: "เชื่อมต่อไปที่ AGV สำเร็จ",
                    error: "ErrSxx2",
                    errorBox: errorBox,
                    Agv: response.body.header,
                  };
                  InputFullLogs(
                    dataSend.billNumber,
                    "OnlinePicking",
                    0,
                    "",
                    bodySend,
                    res_json,
                    billType
                  );
                  res.json(res_json);
                }
              } else {
                var msg = "ไม่สามารถเชื่อมต่อไปที่ AGV ได้";
                console.log(msg + " -" + billNumber);
                let res_json = {
                  success: false,
                  agvstatus: true,
                  billNumber: dataSend.billNumber,
                  reject: true,
                  inAgv: inAgvNew,
                  notAgv: notAgv,
                  msg: "ไม่สามารถเชื่อมต่อไปที่ AGV ได้",
                  error: error,
                  errorBox: errorBox,
                };
                InputFullLogs(
                  billNumber,
                  "OnlinePicking",
                  0,
                  "",
                  bodySend,
                  res_json,
                  billType
                );
                errorBox.push("NO Response , AGV Return is " + response.body);
                res.json(res_json);
              }
            } else {
              var msg = "ไม่สามารถเชื่อมต่อไปที่ AGV ได้(์NOT REQUEST)";
              console.log(msg + " -" + billNumber);
              let res_json = {
                success: false,
                agvstatus: false,
                billNumber: dataSend.billNumber,
                reject: true,
                inAgv: inAgvNew,
                notAgv: notAgv,
                msg: msg,
                error: "ErrCxx2",
                errorBox: errorBox,
              };
              InputFullLogs(
                billNumber,
                "OnlinePicking",
                0,
                "",
                bodySend,
                res_json,
                billType
              );
              res.json(res_json);
            }
          });
        } else {
          var msg = "ไม่มีสินค้าใน AGV";
          console.log(msg + " -" + billNumber);
          let res_json = {
            success: false,
            agvstatus: true,
            billNumber: dataJson.billNumber,
            resend: dataJson,
            reject: true,
            inAgv: inAgvNew,
            notAgv: notAgv,
            msg: "ออเดอร์นี้ไม่มีสินค้าที่สามารถนำออกมาจาก AGV ได้",
            error: "ErrSxx1",
            errorBox: errorBox,
          };
          InputFullLogs(
            billNumber,
            "OnlinePicking",
            0,
            "",
            dataJson,
            res_json,
            billType
          );
          res.json(res_json);
        }
      } else {
        let res_json = {
          success: false,
          reject: true,
          error: err,
          errorBox: errorBox,
        };
        InputFullLogs(
          billNumber,
          "OnlinePicking",
          0,
          "",
          dataJson,
          res_json,
          billType
        );
        res.json(res_json);
      }
    }
  );
});

// API Setting Product
app.post("/AGVadmin/getProductDetail", function (req, res) {
  console.log("Connect API /AGVadmin/getProductDetail");
  let dataJson = req.body;
  let str = "";
  if (dataJson.txtsearch == "") {
    str = "SELECT productcode,productname,flag FROM automated.agvproduct";
  } else {
    str =
      "select R.*FROM(SELECT productcode,productname,flag,CONCAT(productcode,productname) AS txtsearch FROM automated.agvproduct) AS R WHERE R.txtsearch LIKE '%" +
      dataJson.txtsearch +
      "%'";
  }
  con.query(str, function (err, result) {
    if (!err) {
      res.json({
        status: true,
        data: result,
      });
    } else {
      res.json({
        status: false,
        data: [],
      });
    }
  });
});

app.post("/AGVadmin/updateProductStatus", function (req, res) {
  console.log("Connect API /AGVadmin/updateProductStatus");
  let dataJson = req.body;

  if (dataJson.productcode == "") {
    res.json({
      status: false,
      message: "Not Parameter Incorrect??...",
    });
  } else {
    let upd =
      "UPDATE automated.agvproduct SET flag=" +
      dataJson.flag +
      ",upd=NOW() WHERE  productcode='" +
      dataJson.productcode +
      "'";
    con.query(upd, function (err, result) {
      if (!err) {
        res.json({
          status: true,
          message: "Update Success...",
        });
      } else {
        res.json({
          status: false,
          upd: upd,
          message: "Update False....",
        });
      }
    });
  }
});

app.post("/AGVadmin/updateProductNew", function (req, res) {
  console.log("Connect API /AGVadmin/updateProductNew");
  let dataJson = req.body;

  if (dataJson.productcode == "") {
    res.json({
      status: false,
      message: "Not Parameter Incorrect??...",
    });
  } else {
    var headersOpt = {
      "content-type": "application/json",
    };
    request(
      {
        method: "get",
        url:
          "http://172.18.0.135:9202/getProductDetail/" +
          encodeURI(dataJson.productcode),
        headers: headersOpt,
        json: true,
      },
      function (error, response, body) {
        if (response.body.length == 0) {
          res.json({
            status: false,
            message: "ไม่พบสินค้านี้ใน Itec",
          });
        } else {
          const secret = GetSecretUpdate();
          const jobid = GetjobidUpdate("CPD");
          var headersOpt = {
            "content-type": "application/json",
            user: "jibmis",
            secret: secret,
            jobid: jobid,
          };
          let bodysend = Array();
          var productnew = response.body[0].Product;
          var productname = response.body[0].Name;
          bodysend = {
            skuCode: productnew,
            skuNumber: productnew,
            name: productname,
            packInfoList: [],
          };
          let agvsend = Array();
          agvsend.push(bodysend);
          var options = {
            method: "POST",
            url: "http://172.18.0.162:9500/agv/createProduct",
            headers: headersOpt,
            json: true,
            body: agvsend,
          };
          request(options, function (error, response) {
            if (error) {
              res.json({
                status: false,
                error: error,
              });
            } else {
              if (response.body) {
                if (response.body.header.resultcode == "SUCCESS") {
                  con.query(
                    "SELECT COUNT(*) as bb FROM automated.agvproduct WHERE productcode='" +
                      productnew +
                      "'",
                    function (errchk, resultchk) {
                      if (!errchk) {
                        if (resultchk[0].bb == 0) {
                          con.query(
                            "INSERT INTO automated.agvproduct SET productcode='" +
                              productnew +
                              "',productname='" +
                              productname +
                              "',flag=0,upd=now()",
                            function (errin, resultin) {
                              if (!errin) {
                                res.json({
                                  status: true,
                                  response: response.body.header,
                                  message: "INSERT SUCCESS",
                                });
                              } else {
                                res.json({
                                  status: false,
                                  error: errin,
                                  message: "INSERT FALSE",
                                });
                              }
                            }
                          );
                        } else {
                          con.query(
                            "UPDATE automated.agvproduct SET productname='" +
                              productname +
                              "',upd=now() WHERE productcode='" +
                              productnew +
                              "'",
                            function (errup, resultup) {
                              if (!errup) {
                                res.json({
                                  status: true,
                                  response: response.body.header,
                                  message: "UPDATE SUCCESS",
                                });
                              } else {
                                res.json({
                                  status: false,
                                  error: errup,
                                  message: "UPDAYE FALSE",
                                });
                              }
                            }
                          );
                        }
                      } else {
                        res.json({
                          status: false,
                          error: errchk,
                        });
                      }
                    }
                  );
                } else {
                  res.json({
                    status: false,
                    error: response.body,
                  });
                }
              } else {
                res.json({
                  status: false,
                  error: [],
                });
              }
            }
          });
        }
      }
    );

    // let upd ="UPDATE automated.agvproduct SET flag="+dataJson.flag+",upd=NOW() WHERE  productcode='"+dataJson.productcode+"'";
    // con.query(upd, function (err, result) {
    //   if (!err) {
    //     res.json({
    //       status: true,
    //       message: "Update Success...",
    //     });
    //   } else {
    //     res.json({
    //       status: false,
    //       upd:upd,
    //       message: "Update False....",
    //     });
    //   }
    // });
  }
});

// Picking Run Result TABLE
app.get("/AGVadmin/runPickingByProduct", function (req, res) {
  console.log("Connect API /AGVadmin/runPickingByProduct");
  let ResultBox = Array();
  let ErrorBox = Array();

  var headersOpt = {
    "content-type": "application/json",
  };
  var options = {
    method: "GET",
    url: "http://172.18.0.135:9201/getBranchQty/234/0",
    headers: headersOpt,
    json: true,
  };
  request(options, function (error, response) {
    if (error || !response.body) {
      res.json({
        status: true,
        resultBox: ResultBox,
        ErrorBox: error,
      });
    } else {
      let runSt = "CALL update_pickingbyproduct()";
      con.query(runSt, function (err, result) {
        if (!err && result[0].length > 0) {
          async.forEach(
            result[0],
            function (row, callback) {
              let data_arr = response.body.find(
                (element) => element.Product == row.sku_number
              );
              if (data_arr) {
                var stock = data_arr.Qty;
                con.query(
                  "UPDATE automated.picking_byproduct SET sto=" +
                    stock +
                    " WHERE sku_number='" +
                    row.sku_number +
                    "'",
                  function (errIn, resultIn) {
                    if (errIn) {
                      ErrorBox.push(errIn);
                      callback(null);
                    } else {
                      ResultBox.push(row.sku_number + " IS " + data_arr.Qty);
                      callback(null);
                    }
                  }
                );
              } else {
                ErrorBox.push(
                  row.sku_number + " IS " + data_arr + " OR Out of Stock"
                );
                callback(null);
              }
            },
            function (errloop) {
              if (!errloop) {
                res.json({
                  status: true,
                  resultBox: ResultBox.length,
                  ErrorBox: ErrorBox,
                });
              } else {
                res.json({
                  status: false,
                  resultBox: ResultBox.length,
                  ErrorBox: ErrorBox,
                  err: errloop,
                });
              }
            }
          );
        } else {
          res.json({
            status: false,
            err: err,
          });
        }
      });
    }
  });
});

app.get("/AGVadmin/getPickingByProduct", function (req, res) {
  console.log("Connect API /AGVadmin/getPickingByProduct");
  let runSt =
    "SELECT * FROM automated.getpickingbyproduct ORDER BY waitTime DESC,total_picking DESC";
  con.query(runSt, function (err, result) {
    if (!err) {
      res.json({
        status: true,
        data: result,
      });
    } else {
      res.json({
        status: false,
        err: err,
      });
    }
  });
});

app.post("/AGVadmin/pickingInAGV", function (req, res) {
  let dataJson = req.body;
  var billNumber = "";

  if (!dataJson.prefix || dataJson.prefix == "") {
    billNumber = dataJson.billNumber;
  } else {
    billNumber = dataJson.prefix + "_" + dataJson.billNumber;
  }
  console.log("Connect API /AGVadmin/pickingInAGV_Pro : " + billNumber);

  var bill_mkp = billNumber.substring(0, 3);
  var priority = dataJson.priority;
  var billType = dataJson.billType;
  let errorBox = Array();
  let inAgv = Array();
  let inAgvNew = Array();
  let notAgv = Array();
  var reject = false;
  async.forEach(
    dataJson.details,
    function (row, callback) {
      var headersOpt = {
        "content-type": "application/json",
      };
      if (bill_mkp == "SHP") {
        request(
          {
            method: "get",
            url:
              "http://172.18.0.135:9201/getProductQty/122/" +
              encodeURI(row.skuCode),
            headers: headersOpt,
            json: true,
          },
          function (errorH, responseH, bodyH) {
            var stock = 0;
            if (errorH) {
              errorBox.push(errorH);
              callback(null);
            } else {
              if (
                responseH.body.length > 0 &&
                typeof responseH.body[0].Qty !== "undefined"
              ) {
                stock = 0;
                let newAgv = Array();
                newAgv = {
                  skuCode: row.skuCode,
                  skuName: row.skuName,
                  quantity: row.quantity,
                  stocknow: stock,
                };
                if (reject == false) {
                  reject = true;
                }
                notAgv.push(newAgv);
                callback(null);
              } else {
                request(
                  {
                    method: "get",
                    url:
                      "http://172.18.0.135:9201/getProductQty/234/" +
                      encodeURI(row.skuCode),
                    headers: headersOpt,
                    json: true,
                  },
                  function (error, response, body) {
                    var stock = 0;
                    if (error) {
                      callback(null);
                    } else {
                      if (
                        response.body.length > 0 &&
                        typeof response.body[0].Qty !== "undefined"
                      ) {
                        stock = response.body[0].Qty;
                      } else {
                        stock = 0;
                      }
                      let str =
                        "SELECT count(*) AS bb FROM automated.agvproduct WHERE productcode='" +
                        row.skuCode +
                        "' AND flag=0 ";
                      con.query(str, function (err, result) {
                        if (!err) {
                          let newAgv = Array();
                          newAgv = {
                            skuCode: row.skuCode,
                            skuName: row.skuName,
                            quantity: row.quantity,
                            stocknow: stock,
                          };
                          if (result[0].bb > 0) {
                            if (reject == false && row.quantity > stock) {
                              reject = true;
                            }
                            inAgv.push(row);
                            inAgvNew.push(newAgv);
                            callback(null);
                          } else {
                            notAgv.push(newAgv);
                            callback(null);
                          }
                        } else {
                          errorBox.push(err);
                          callback(null);
                        }
                      });
                    }
                  }
                );
              }
            }
          }
        );
      } else {
        request(
          {
            method: "get",
            url:
              "http://172.18.0.135:9201/getProductQty/234/" +
              encodeURI(row.skuCode),
            headers: headersOpt,
            json: true,
          },
          function (error, response, body) {
            var stock = 0;
            if (error) {
              callback(null);
            } else {
              if (
                response.body.length > 0 &&
                typeof response.body[0].Qty !== "undefined"
              ) {
                stock = response.body[0].Qty;
              } else {
                stock = 0;
              }
              let str =
                "SELECT count(*) AS bb FROM automated.agvproduct WHERE productcode='" +
                row.skuCode +
                "' AND flag=0 ";
              con.query(str, function (err, result) {
                if (!err) {
                  let newAgv = Array();
                  newAgv = {
                    skuCode: row.skuCode,
                    skuName: row.skuName,
                    quantity: row.quantity,
                    stocknow: stock,
                  };
                  if (result[0].bb > 0) {
                    if (reject == false && row.quantity > stock) {
                      reject = true;
                    }
                    inAgv.push(row);
                    inAgvNew.push(newAgv);
                    callback(null);
                  } else {
                    notAgv.push(newAgv);
                    callback(null);
                  }
                } else {
                  errorBox.push(err);
                  callback(null);
                }
              });
            }
          }
        );
      }
    },
    function (err) {
      if (!err) {
        // let res_json = {
        //   success: false,
        //   agvstatus: true,
        //   billNumber: billNumber,
        //   resend: dataJson,
        //   reject: reject,
        //   inAgv: inAgvNew,
        //   notAgv: notAgv,
        //   msg: "ออเดอร์นี้ไม่มีสินค้าที่สามารถนำออกมาจาก AGV ได้",
        //   error: "ErrSxx1",
        //   errorBox: errorBox,
        //   bill_mkp: bill_mkp,
        // };
        // res.json(res_json);

        if (inAgv.length > 0 && reject == false) {
          const secret = GetSecretUpdate();
          const jobid = GetjobidUpdate("OPD");
          var headersOpt = {
            "content-type": "application/json",
            user: "jibmis",
            secret: secret,
            jobid: jobid,
          };
          var billDate = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss.l");
          let dataSend = Array();
          dataSend = {
            billNumber: billNumber,
            billDate: billDate,
            priority: priority,
            shipToName: dataJson.shipToName,
            remark: dataJson.remark,
            details: inAgv,
          };
          let bodySend = Array();
          bodySend.push(dataSend);

          var options = {
            method: "POST",
            url: "http://172.18.0.162:9500/agv/picking",
            headers: headersOpt,
            json: true,
            body: bodySend,
          };

          request(options, function (error, response) {
            if (!error) {
              if (response.body) {
                if (response.body.header.resultcode == "SUCCESS") {
                  var msg = "ทำรายการสำเร็จ";
                  console.log(msg + " -" + billNumber);
                  let res_json = {
                    success: true,
                    agvstatus: true,
                    billNumber: dataSend.billNumber,
                    reject: reject,
                    inAgv: inAgvNew,
                    notAgv: notAgv,
                    msg: "เชื่อมต่อไปที่ AGV สำเร็จ",
                    error: [],
                    errorBox: errorBox,
                    Agv: response.body.header,
                  };
                  InputFullLogs(
                    billNumber,
                    "OnlinePicking",
                    1,
                    "",
                    bodySend,
                    res_json,
                    billType
                  );
                  res.json(res_json);
                } else {
                  var msg = "ออเดอร์ซ้ำ..";
                  console.log(msg + " -" + billNumber);
                  reject = true;
                  let res_json = {
                    success: true,
                    agvstatus: true,
                    billNumber: dataSend.billNumber,
                    reject: reject,
                    inAgv: inAgvNew,
                    notAgv: notAgv,
                    msg: "เชื่อมต่อไปที่ AGV สำเร็จ",
                    error: "ErrSxx2",
                    errorBox: errorBox,
                    Agv: response.body.header,
                  };
                  InputFullLogs(
                    dataSend.billNumber,
                    "OnlinePicking",
                    0,
                    "",
                    bodySend,
                    res_json,
                    billType
                  );
                  res.json(res_json);
                }
              } else {
                var msg = "ไม่สามารถเชื่อมต่อไปที่ AGV ได้";
                console.log(msg + " -" + billNumber);
                let res_json = {
                  success: false,
                  agvstatus: true,
                  billNumber: dataSend.billNumber,
                  reject: true,
                  inAgv: inAgvNew,
                  notAgv: notAgv,
                  msg: "ไม่สามารถเชื่อมต่อไปที่ AGV ได้",
                  error: error,
                  errorBox: errorBox,
                };
                InputFullLogs(
                  billNumber,
                  "OnlinePicking",
                  0,
                  "",
                  bodySend,
                  res_json,
                  billType
                );
                errorBox.push("NO Response , AGV Return is " + response.body);
                res.json(res_json);
              }
            } else {
              var msg = "ไม่สามารถเชื่อมต่อไปที่ AGV ได้(์NOT REQUEST)";
              console.log(msg + " -" + billNumber);
              let res_json = {
                success: false,
                agvstatus: false,
                billNumber: dataSend.billNumber,
                reject: true,
                inAgv: inAgvNew,
                notAgv: notAgv,
                msg: msg,
                error: "ErrCxx2",
                errorBox: errorBox,
              };
              InputFullLogs(
                billNumber,
                "OnlinePicking",
                0,
                "",
                bodySend,
                res_json,
                billType
              );
              res.json(res_json);
            }
          });
        } else {
          var msg = "ไม่มีสินค้าใน AGV";
          console.log(msg + " -" + billNumber);
          let res_json = {
            success: false,
            agvstatus: true,
            billNumber: dataJson.billNumber,
            resend: dataJson,
            reject: true,
            inAgv: inAgvNew,
            notAgv: notAgv,
            msg: "ออเดอร์นี้ไม่มีสินค้าที่สามารถนำออกมาจาก AGV ได้",
            error: "ErrSxx1",
            errorBox: errorBox,
          };
          InputFullLogs(
            billNumber,
            "OnlinePicking",
            0,
            "",
            dataJson,
            res_json,
            billType
          );
          res.json(res_json);
        }
      } else {
        let res_json = {
          success: false,
          reject: true,
          error: err,
          errorBox: errorBox,
        };
        InputFullLogs(
          billNumber,
          "OnlinePicking",
          0,
          "",
          dataJson,
          res_json,
          billType
        );
        res.json(res_json);
      }
    }
  );
});

// FUNCTION
function GetSecretUpdate() {
  var now = new Date();
  var day = ("0" + now.getDate()).slice(-2);
  var month = ("0" + (now.getMonth() + 1)).slice(-2);
  var years = now.getFullYear();
  var hours = ("0" + now.getHours()).slice(-2);
  var fullday = years + month + day + hours;
  var fullmath = "**JIB//JIBmis2020**//" + fullday + "**";
  var secret = sha512(fullmath);
  return secret;
}
function GetTypefiles(data) {
  var common = require("./priority.js");
  let result = common.func1();
  const found = result.find((element) => element.label == data);
  return found;
}
function GetjobidUpdate(title) {
  var now = new Date();
  var day = ("0" + now.getDate()).slice(-2);
  var month = ("0" + (now.getMonth() + 1)).slice(-2);
  var years = now.getFullYear();
  var hours = ("0" + now.getHours()).slice(-2);
  var Minutes = ("0" + now.getMinutes()).slice(-2);
  var seconds = ("0" + now.getSeconds()).slice(-2);
  var Milliseconds = ("0" + now.getMilliseconds()).slice(-3);
  // console.log(("0" + now.getMilliseconds()).slice(-3))
  var fullday =
    years + month + day + "-" + hours + Minutes + seconds + "-" + Milliseconds;
  var fullmath = "JIB-" + title + "-" + fullday;

  return fullmath;
}
function GetTypefiles(data) {
  var common = require("./priority.js");
  let result = common.func1();
  const found = result.find((element) => element.label == data);
  return found;
}
// เก็บ logs
function InputLogs(order, status, msg, priority) {
  // console.log(priority)
  let insLog =
    "INSERT INTO automated.logs_agv_online SET orderid='" +
    order +
    "',status=" +
    status +
    ",message='" +
    msg +
    "',priority=" +
    priority +
    ",upd=NOW()," +
    "upd_create=now() ";
  con.query(insLog, function (errins, resultins) {
    if (!errins) {
      return true;
    } else {
      return false;
    }
  });
}
// ยกเลิกเอกสาร
function Updatecancel(order, status) {
  // console.log(order);
  let upd =
    "UPDATE automated.agv_fulllogs SET status=8 where billNumber = '" +
    order +
    "' AND type_logs='OnlinePicking'";
  con.query(upd, function (errstr2, resultstr2) {
    if (!errstr2) {
      return true;
    } else {
      return false;
    }
  });
}
function Updatecallbacktype(order) {
  // console.log(order);

  let upd =
    "UPDATE " +
    "automated.agv_fulllogs AS a," +
    "( " +
    "SELECT " +
    "billType " +
    "FROM " +
    "automated.agv_fulllogs " +
    "WHERE " +
    "billNumber = '" +
    order +
    "' " +
    "AND type_logs = 'OnlinePicking' " +
    "LIMIT 1 " +
    ") AS b " +
    "SET " +
    "a.billType = b.billType " +
    "WHERE a.billNumber='" +
    order +
    "' AND a.type_logs = 'CallBackOut' ";
  con.query(upd, function (errstr2, resultstr2) {
    if (!errstr2) {
      return true;
    } else {
      return false;
    }
  });
}
// สร้างรหัสเอกสาร picking
function generateCodeID(title, lastcode) {
  var now = new Date();
  var yearfull = now.getFullYear() + 543;
  var monthfull = ("0" + (now.getMonth() + 1)).slice(-2);
  if (lastcode == "") {
    var lastdigit = 1;
  } else {
    var lastdigit = lastcode.slice(4) * 1 + 1;
  }
  var digitFull = ("0000" + lastdigit).slice(-5);
  var newcode = title + yearfull.toString().slice(2) + monthfull + digitFull;
  return newcode;
}
// [บันทึกข้อมูลโอนเข้า]
function inBoundDoc(dataJson, data, ordstatus, createstatus) {
  var billNumber = dataJson.DocNo + "-" + dataJson.BF;
  let str =
    "SELECT count(*) AS bb FROM automated.inbound_doc WHERE billNumber='" +
    billNumber +
    "' AND Product='" +
    data.Product +
    "'";
  con.query(str, function (errstr, resultstr) {
    if (!errstr) {
      if (resultstr[0].bb == 0) {
        let ins =
          "INSERT INTO automated.inbound_doc SET billNumber='" +
          billNumber +
          "',billDate=NOW(),DocNo='" +
          dataJson.DocNo +
          "',DocRef='" +
          dataJson.DocRef +
          "',BF='" +
          dataJson.BF +
          "',BranchFrom='" +
          dataJson.BranchFrom +
          "',BT='" +
          dataJson.BT +
          "',ToBranch='" +
          dataJson.ToBranch +
          "',OfID='" +
          dataJson.OfID +
          "',OfName='" +
          dataJson.OfName +
          "',Status=" +
          dataJson.Status +
          ",Received=" +
          dataJson.Received +
          ",Comment='" +
          dataJson.Comment +
          "',Product='" +
          data.Product +
          "',ProductName='" +
          data.ProductName +
          "',Qty=" +
          data.Qty +
          ",create_status=" +
          createstatus +
          ",ordStatus=" +
          ordstatus +
          ",upd=NOW()";

        con.query(ins, function (errstr2, resultstr2) {
          if (!errstr2) {
            console.log(
              billNumber + " --เพิ่มสินค้าใน pending >>" + data.Product
            );
          }
        });
      }
    } else {
      console.log(errstr);
    }
  });
}
function inBoundManualdoc(docid, data, billDate, priority) {
  let ins =
    "INSERT INTO automated.inbound_manual SET in_docid='" +
    docid +
    "',billDate='" +
    billDate +
    "',skuCode='" +
    data.skuCode +
    "',skuName='" +
    data.skuName +
    "',quantity='',userid='',username='',priority='" +
    priority +
    "',ordstatus=0,upd=NOW()";

  con.query(ins, function (err, result) {
    if (!err) {
      return 0;
    } else {
      return 1;
    }
  });
}
function GetBillNumberUpdate() {
  var now = new Date();
  var day = ("0" + now.getDate()).slice(-2);
  var month = ("0" + (now.getMonth() + 1)).slice(-2);
  var years = now.getFullYear();
  var hours = ("0" + now.getHours()).slice(-2);
  var Minutes = ("0" + now.getMinutes()).slice(-2);
  var seconds = ("0" + now.getSeconds()).slice(-2);
  var Milliseconds = ("0" + now.getMilliseconds()).slice(-2);
  var billNumber =
    "CSK" + years + month + day + hours + Minutes + seconds + Milliseconds;

  return billNumber;
}
function InputFullLogs(
  billNumber,
  type_logs,
  status,
  res_id,
  data_json,
  res_json,
  billType
) {
  if (!data_json || data_json == "" || data_json == null) {
    data_json = "{}";
  }
  if (!res_json || res_json == "" || res_json == null) {
    res_json = "{}";
  }

  let insLog =
    "INSERT INTO automated.agv_fulllogs SET billNumber='" +
    billNumber +
    "',type_logs='" +
    type_logs +
    "',status='" +
    status +
    "',res_id='" +
    res_id +
    "',data_json='" +
    JSON.stringify(data_json) +
    "',res_json='" +
    JSON.stringify(res_json) +
    "',upd=NOW(),billType='" +
    billType +
    "'";
  con.query(insLog, function (errins, resultins) {
    if (!errins) {
      // console.log("Logs Success");
      return true;
    } else {
      console.log("Logs ERROR?" + errins);
      return false;
    }
  });
}
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
