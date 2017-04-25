var express = require('express');
var router = express.Router();

/* GET survey page. */
router.get('/', function(req, res, next) {
	//TODO - REDIRECT USERS TO A NOT FOUND PAGE
  res.render('survey', { title: 'Dynamic Poll- Survey' });
});

router.get('/:pollURL', function(req, res, next) {
  res.render('survey', { title: 'Dynamic Poll - Survey', pollURL: req.params.pollURL});
});


module.exports = router;
