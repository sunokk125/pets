var express = require('express');
var router = express.Router();
var connection = require('../mysql-connecter');
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

    var pId = req.query.pId;
    var uId = req.session.uId;
    var uName = req.session.uName;

    if(pId != null){
        console.log("자세히 보기");
        console.log(pId);

        var result;

        connection.query('SELECT * FROM (SELECT * from post where pid = ' + pId + ') AS posts, user WHERE posts.puid = user.uid;', function(err, rows, fields) {
            if (!err) {
                result = rows[0];

                function setUserComent(){
                    return new Promise(function (resolve, reject) {
                        connection.query('SELECT * FROM img WHERE ipid = ' + rows[0]['pid'] + ';', function (err, irows, fields) {
                           if(!err){
                               result.images = irows;
                               connection.query('SELECT * FROM likes WHERE lpid = ' + pId + ' and luId = ' + uId + ';', function (err, lrows) {
                                   if(!err){
                                       if(lrows[0]){
                                           result.like = true;
                                       }else{
                                           result.like = false;
                                       }
                                       connection.query('SELECT * FROM (SELECT * FROM coment WHERE cpid = ' + rows[0]['pid'] + ') AS postcoment, user WHERE postcoment.cuid = user.uid;', function (err, curows, fields) {
                                           if(!err){
                                               result.coments = curows;
                                               resolve();
                                           }else{
                                               console.log('Error while performing Query.', err);
                                           }
                                       });
                                   }else{
                                       console.log('Error while performing Query.', err);
                                   }
                               });
                           }else{
                               console.log('Error while performing Query.', err);
                           }
                        });
                    });
                }

                setUserComent().then(
                    function () {
                        console.log(result);
                        res.render('postdetail', { title: 'Express', data: result, uname: uName});
                    }
                );
            }else{
                console.log('Error while performing Query.', err);
            }
        });
    }else{
        console.log("전체보기");
    }
});

router.post('/', function (req, res, next) {
    uId = req.body['uId'];

    connection.query("SELECT * FROM post WHERE puid = " + uId + ";", function (err, rows, fields) {
        if(!err){
            function setImg(){
                return new Promise(function (resolve, reject) {
                    rows.forEach(function (item, index) {
                        connection.query("SELECT * FROM img WHERE ipid = " + item.pid + ";", function (err, irows, fields) {
                            if(!err) {
                                console.log(irows[0].image);
                                rows[index].titleImage = irows[0].image;
                            }else{
                                console.log('Error while performing Query.', err);
                            }
                        })
                    });
                });
            }

            setImg().then(function () {
                console.log(rows);
            });


        }else{
            res.json({'success': false});
        }
    });

});

router.post('/create', upload.array('photo'), function(req, res, next) {

    var pText = req.body['pText'];
    var uId = req.session.uId;
    var imgs = req.files;

    console.log(imgs);
    console.log(pText);

    connection.query("INSERT INTO post(ptext, puid) VALUES('" + pText + "', " + uId + ");", function(err, rows, fields) {
        if (!err) {
            connection.query("SELECT * FROM post WHERE puId=" + uId + " ORDER BY ptime DESC;", function (err, rows) {
                if(!err){
                    imgs.forEach(function (item) {
                        connection.query("INSERT INTO img(ipid,image) VALUES(" + rows[0].pid + ", '" + item.filename + "');", function (err) {
                            if (!err) {
                                res.redirect('/');
                            }else
                                console.log('Error while performing Query.', err);
                        });
                    });
                }else{
                    console.log('Error while performing Query.', err);
                }
            })
        }else
            console.log('Error while performing Query.', err);
    });
});

router.post('/like', function (req, res, next) {

    var pId = req.body['pId'];
    var uId = req.session.uId;

    console.log(pId + "    " + uId);
    
    connection.query('SELECT * FROM likes where luid = ' + uId + ' and lpid = ' + pId + ';', function (err, rows, fields) {
        if (!err) {
            if(rows[0]){
                connection.query('DELETE FROM likes where luid = ' + uId + ' and lpid = ' + pId + ';', function (err, rows, fields) {
                    if (!err) {
                        res.json({'like': false});
                    } else {
                        res.send('error : ' + err);
                    }
                });
            }else{
                connection.query('INSERT INTO likes(luid, lpid) values(?, ?);', [uId, pId], function (err, rows, fields) {
                    if (!err) {
                        res.json({'like': true});
                    } else {
                        res.send('error : ' + err);
                    }
                });
            }
        }else
            console.log('Error while performing Query.', err);
    });
});

router.post('/coment', function (req, res, next) {

   var pId = req.body['pId'];
   var cText = req.body['cText'];
   var uId = req.session['uId'];

   connection.query('INSERT INTO coment(ctext, cuid, cpid) VALUES(?, ?, ?);', [cText, uId, pId], function (err, rows, fields) {
      if(!err){
          res.json({result: true});
      }else{
          res.json({result: false});
      }
   });
});

module.exports = router;