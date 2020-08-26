var express = require('express');
var router = express.Router();
var connection = require('../mysql-connecter');


/* GET home page. */
router.get('/', function(req, res, next) {

  var uId = req.session.uId;
  var name = req.session.uName;

  if(!uId){
    res.redirect('/users/login');
  }

  connection.query('CREATE OR REPLACE VIEW myfriend AS (SELECT * FROM friend WHERE friend.fuidm =' +  uId + ');', function(err, frows, fields) {
    if (!err){
      connection.query('SELECT * FROM myfriend INNER JOIN post ON myfriend.fuidf = post.puid LEFT JOIN user ON myfriend.fuidf = user.uid ORDER BY post.ptime DESC;', function (err, prows) {
        if(!err){
          if(prows[0]) {
            function setImage() {
              return new Promise(function (resolve, reject) {
                prows.forEach(function (item, index, array) {
                  connection.query('SELECT * FROM img WHERE ipid = ' + item.pid + ';', function (err, irows) {
                    if (!err) {
                      prows[index].images = irows;
                      connection.query('SELECT * FROM likes WHERE lpid = ' + item.pid + ' and luid = ' + uId + ';', function (err, lrows) {
                        if (!err) {
                          if (lrows[0])
                            prows[index].like = true;
                          else
                            prows[index].like = false;
                          connection.query('SELECT * FROM (SELECT * FROM coment WHERE cpid = ' + item.pid + ') AS postcoment LEFT JOIN user ON postcoment.cuid = user.uid;', function (err, rows) {
                            prows[index].coments = rows;
                            if (index === array.length - 1) {
                              resolve();
                            }
                          });
                        }
                      });
                    } else {
                      console.log('Error while performing Query.', err);
                    }
                  });
                });
              });
            }

            setImage().then(function () {
              console.log(prows);
              res.render('main', { title: 'Express', data: prows, name: name });
            })
          }else
            res.render('main', {data:{}});
        }else
          console.log('Error while performing Query.', err);
      });
    }else
      console.log('Error while performing Query.', err);
  });

});

module.exports = router;
