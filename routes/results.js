var express = require('express');
var router = express.Router();

/* GET results page. */
router.get('/', function(req, res, next) {
	//TODO - REDIRECT USERS TO A NOT FOUND PAGE
  res.render('results', { title: 'Dynamic Poll - Results' });
});

router.get('/:pollURL', function(req, res, next) {
  res.render('results', { title: 'Dynamic Poll - Results', pollURL: req.params.pollURL});
});


module.exports = router;
