var express = require('express');
var router = express.Router();
var connection = require('../mysql-connecter');
var session = require('express-session');
const multer = require('multer');
const path = require('path');

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, new Date().valueOf() + path.extname(file.originalname));
    }
  }),
});

/* GET users listing. */
router.get('/', function(req, res, next) {

  var uId = req.session.uId;
  var follow, follower, udata;

  connection.query('SELECT * FROM post WHERE puid = ' + uId + ';', function (err, rows, fields) {
    if(!err){
      function setFriend() {
        return new Promise(function (resolve, reject) {
          connection.query('SELECT * FROM user WHERE uid = ' + uId + ';',function (err, urows) {
            if(!err){
              udata = urows[0];
              connection.query('SELECT * FROM friend WHERE fuidm = ' + uId + ';', function (err, frows) {
                if (!err) {
                  follow = frows.length;
                  connection.query('SELECT * FROM friend WHERE fuidf = ' + uId + ';', function (err, frows) {
                    if (!err) {
                      follower = frows.length;
                      resolve();
                    }else
                      console.log('Error while performing Query.', err);
                  });
                }else
                  console.log('Error while performing Query.', err);
              });
            }else{
              console.log('Error while performing Query.', err);
            }
          });
        });
      }
      if(rows[0]) {
        function setImg() {
          return new Promise(function (resolve, reject) {
            rows.forEach(function (item, index, array) {
              connection.query('SELECT * FROM img WHERE ipid = ' + item.pid + ';', function (err, irows, fields) {
                if (!err) {
                  rows[index].image = irows;
                  if (array.length - 1 == index) resolve();
                } else {
                  console.log('Error while performing Query.', err);
                }
              });
            });
          });
        }

        setImg().then(function () {
          setFriend().then(function () {
            console.log(rows);
            res.render('mypage', {title: 'Express', data: rows, udata: udata, follow: follow, follower: follower, friend:'mypage'});
          });
        });
      }else {
        setFriend().then(function () {
          res.render('mypage', {title: 'Express', data: {}, udata: udata, follow: follow, follower: follower, friend:'mypage'});
        });
      }
    }else{
      console.log('Error while performing Query.', err);
    }
  });
});

router.post('/', function (req, res, next) {
  var uId = req.body['uId'];
  var muId = req.session.uId;

  console.log(uId + "   " + muId);

  var follow, follower, udata, friend;

  connection.query('SELECT * FROM post WHERE puid = ' + uId + ';', function (err, rows, fields) {
    if(!err){
      function setFriend() {
        return new Promise(function (resolve, reject) {
          connection.query('SELECT * FROM user WHERE uid = ' + uId + ';',function (err, urows) {
            if(!err){
              udata = urows[0];
              connection.query('SELECT * FROM friend WHERE fuidm = ' + uId + ';', function (err, frows) {
                if (!err) {
                  follow = frows.length;
                  connection.query('SELECT * FROM friend WHERE fuidf = ' + uId + ';', function (err, frows) {
                    if (!err) {
                      follower = frows.length;
                      connection.query('SELECT * FROM friend WHERE fuidf = ' + uId + ' and fuidm = ' + muId + ';', function () {
                        if(!err){
                          if(rows[0]){
                            friend = true;
                            resolve();
                          }else{
                            friend = false;
                            resolve();
                          }
                        }else{

                        }
                      });
                    }else
                      console.log('Error while performing Query.', err);
                  });
                }else
                  console.log('Error while performing Query.', err);
              });
            }else{
              console.log('Error while performing Query.', err);
            }
          });
        });
      }
      if(rows[0]) {
        function setImg() {
          return new Promise(function (resolve, reject) {
            rows.forEach(function (item, index, array) {
              connection.query('SELECT * FROM img WHERE ipid = ' + item.pid + ';', function (err, irows, fields) {
                if (!err) {
                  rows[index].image = irows;
                  if (array.length - 1 == index)
                    resolve();
                } else {
                  console.log('Error while performing Query.', err);
                }
              });
            });
          });
        }

        setImg().then(function () {
          setFriend().then(function () {
            console.log(rows);
            res.render('mypage', {title: 'Express', data: rows, udata: udata, follow: follow, follower: follower, friend: friend});
          });
        });
      }else {
        setFriend().then(function () {
          res.render('mypage', {title: 'Express', data: {}, udata: udata, follow: follow, follower: follower, friend: friend});
        });
      }
    }else{
      console.log('Error while performing Query.', err);
    }
  });
});

router.get('/join', function(req, res, next) {
  res.render('join', { title: 'Express' });
});

router.post('/join', function(req, res, next) {

  var uid = req.body['id'];
  var upw = req.body['pw'];
  var uname = req.body['name'];

  connection.query("INSERT INTO user(uemail, upw, uname) VALUES(?, ?, ?)", [uid, upw, uname], function (err, rows, fields) {
    if (!err) {
      res.redirect('/users/login');
    } else {
      res.send('err : ' + err);
    }
  });
});

router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Express' });
});

router.post('/login', function(req, res, next) {

  var uId = req.body['id'];
  var uPw = req.body['pw'];

  connection.query("SELECT * from user where uemail = '" + uId + "' and upw = '" + uPw + "';", function(err, rows, fields) {
    if (!err)
      if(rows[0] != null){
        req.session.uId = rows[0]['uid'];
        req.session.uName = rows[0]['uname'];
        res.redirect('/');
      }else{
        res.redirect('/users/loginError');
      }
    else
      console.log('Error while performing Query.', err);
  });
});

router.get('/loginError', function (req, res, next) {
  res.render('loginError',{});
});

router.post('/checkId', function (req, res, next) {
  var uId = req.body['id'];

  connection.query("SELECT * from user where uemail = '" + uId + "';", function(err, rows, fields) {
    if (!err)
      if(rows[0] != null){
        res.json({check: false});
      }else{
        res.json({check: true});
      }
    else
      console.log('Error while performing Query.', err);
  });
});

router.get('/modify', function (req, res, next) {
  var uId = req.session.uId;
  var uName = req.session.uName;

  if(!uId){
    res.redirect('/users/login');
  }

  connection.query('SELECT * FROM user WHERE uid = ' + uId + ';', function (err, rows) {
    if(!err){
      res.render('modifyuser', {data: rows[0]});
    }
  });
});

router.post('/modify', upload.single('photo'), function (req, res, next) {
  var uId = req.session.uId;
  var uName, uPw, uText, uNum, uImage;

  function setUser(){
    return new Promise(function (resolve, reject) {
      connection.query('SELECT * FROM user WHERE uid = ' + uId + ';', function (err, rows) {
        if(!err){
          uName = req.body['uname'] || rows[0].uname;
          uPw = req.body['upw'] || rows[0].upw;
          uText = req.body['utext'] || rows[0].utext;
          uNum = req.body['unum'] || rows[0].unum;
          uImage = req.file? req.file.filename: rows[0].uimage;
        }else{
          console.log(err);
        }
        resolve();
      });
    });
  }

  setUser().then(function () {
    console.log(uNum);
    console.log(uImage);
    connection.query("UPDATE user SET uname = ?, upw = ?, utext = ?, unum = ?, uimage = ? WHERE uid = ?;", [uName, uPw, uText, uNum, uImage, uId], function (err, rows) {
      if(!err){
        res.redirect('/users');
      }else{
        console.log(err);
      }
    });
  });
});

router.post('/friend',function (req, res, next) {
  var uId = req.body['uId'];
  var muId = req.session.uId;

  connection.query('SELECT * FROM friend WHERE fuidm = ? and fuidf = ?;', [muId, uId], function (err, rows) {
    if(!err){
      if(rows[0]){
        connection.query('DELETE FROM friend WHERE fuidm = ? and fuidf = ?;', [muId, uId], function (err) {
          if(!err){
            res.json({result:false});
          }else{
            console.log(err);
          }
        });
      }else{
        connection.query('INSERT INTO friend(fuidf, fuidm) VALUES(?, ?);', [uId, muId], function (err) {
          if(!err){
            res.json({result:true});
          }else{
            console.log(err);
          }
        });
      }
    }else{
      console.log(err);
    }
  });
});

router.get('/search', function(req, res, next){
  res.render('search',{search: false});
});

router.post('/search', function (req, res, next) {
  var uEmail = req.body['searchEmail'];
  var muId = req.session.uId;
  var uId;
  
  connection.query("SELECT * FROM user WHERE uemail = '" + uEmail + "';", function (err, rows) {
    if(rows[0]){
      uId = rows[0].uid;

      connection.query('SELECT * FROM post WHERE puid = ' + uId + ';', function (err, rows, fields) {
        if(!err){
          function setFriend() {
            return new Promise(function (resolve, reject) {
              connection.query('SELECT * FROM user WHERE uid = ' + uId + ';',function (err, urows) {
                if(!err){
                  udata = urows[0];
                  connection.query('SELECT * FROM friend WHERE fuidm = ' + uId + ';', function (err, frows) {
                    if (!err) {
                      follow = frows.length;
                      connection.query('SELECT * FROM friend WHERE fuidf = ' + uId + ';', function (err, frows) {
                        if (!err) {
                          follower = frows.length;
                          connection.query('SELECT * FROM friend WHERE fuidf = ' + uId + ' and fuidm = ' + muId + ';', function () {
                            if(!err){
                              if(rows[0]){
                                friend = true;
                                resolve();
                              }else{
                                friend = false;
                                resolve();
                              }
                            }else{

                            }
                          });
                        }else
                          console.log('Error while performing Query.', err);
                      });
                    }else
                      console.log('Error while performing Query.', err);
                  });
                }else{
                  console.log('Error while performing Query.', err);
                }
              });
            });
          }
          if(rows[0]) {
            function setImg() {
              return new Promise(function (resolve, reject) {
                rows.forEach(function (item, index, array) {
                  connection.query('SELECT * FROM img WHERE ipid = ' + item.pid + ';', function (err, irows, fields) {
                    if (!err) {
                      rows[index].image = irows;
                      if (array.length - 1 == index)
                        resolve();
                    } else {
                      console.log('Error while performing Query.', err);
                    }
                  });
                });
              });
            }

            setImg().then(function () {
              setFriend().then(function () {
                console.log(rows);
                res.json({title: 'Express', data: rows, udata: udata, follow: follow, follower: follower, friend: friend, search: true});
              });
            });
          }else {
            setFriend().then(function () {
              res.json({title: 'Express', data: {}, udata: udata, follow: follow, follower: follower, friend: friend, search: true});
            });
          }
        }else{
          console.log('Error while performing Query.', err);
        }
      });
    }else{
      res.json({search: false});
    }
  });
});

module.exports = router;