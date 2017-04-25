var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Dynamic Poll', pageHeader: 'Create New Poll' });
});

router.get('/admin/:pollURL', function (req, res, next) {
	var poll_URL = req.params.pollURL;
	res.render('index', { title: 'Dynamic Poll', pageHeader: 'Update Poll', pollURL: poll_URL });
});

module.exports = router;
