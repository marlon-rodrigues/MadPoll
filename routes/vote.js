var express = require('express');
var router = express.Router();
var app = express();
var cookieParser = require('cookie-parser');
var shortid = require('shortid');

app.use(cookieParser());

/* GET vote page. */
router.get('/', function(req, res, next) {
	//TODO - REDIRECT USERS TO A NOT FOUND PAGE
  res.render('vote', { title: 'Dynamic Poll - Vote' });
});

router.get('/:pollURL', function(req, res, next) {
	//set cookie that will be used as the "user id"
  if(req.cookies.ungerboeck_poll_user_id === undefined) {
  	var randomID = shortid.generate();
	res.cookie('ungerboeck_poll_user_id', randomID, { maxAge: (1*24*60*60*1000), httpOnly: false }); //cookies is valid for a day
  } 

  res.render('vote', { title: 'Dynamic Poll - Vote', pollURL: req.params.pollURL});
});


module.exports = router;
