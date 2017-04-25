var express = require('express');
var router = express.Router();
var async = require("async");
var mysql = require('mysql');
var shortid = require('shortid');

//var connection = mysql.createConnection({
var pool = mysql.createPool({
    connectionLimit : 500,
	host            : 'us-cdbr-iron-east-04.cleardb.net',
	user            : 'b72d1291f66004',
	password        : '4f139ffd',
	database        : 'heroku_87c3c0386b85bd4'
});
/*var pool = mysql.createPool({
    connectionLimit : 500,
	host            : 'localhost',
	user            : 'marlon.rodrigues',
	password        : '123porra',
	database        : 'madpoll'
});*/

	//USED FOR TEST ONLY - USE POOL CONNECTION FOR PROD
function dbConnect() {
	connection.connect(function(err) {
		if(!err) {
			console.log("Database is connected..");
		} else {
			console.log("Error connecting database..");
		}
	});
}

/************************ BEGIN GET ALL POLLS ***************************/
router.get('/', function (req, res, next) {
	pool.getConnection(function(err, connection) {
		connection.query('SELECT * FROM polls', function(err, rows, fields) {
			connection.release();
			if(err) throw err;
			console.log('The solution is:', rows)
			res.json(rows);
		});
	});
})
/************************ END GET ALL POLLS ***************************/

/************************ BEGIN GET SINBGLE POLL WITH ALL AVAILABLE QUESTIONS ***************************/
 router.get('/:pollURL', function (req, res, next) {
 	var poll_URL = req.params.pollURL;
	
	pool.getConnection(function(err, connection) {
		var query = 'SELECT \
					polls.ID AS pollID, \
					questions.ID as questionID, \
					questions.Question as question, \
					questions.Active as active, \
					questions.Graph_Active as graphActive, \
					GROUP_CONCAT(options.ID ORDER BY options.Option_Order SEPARATOR "|") as question_options_id, \
					GROUP_CONCAT(options.Description ORDER BY options.Option_Order SEPARATOR "|") as question_options \
					FROM polls \
					LEFT JOIN questions ON questions.Poll_ID = polls.ID \
					LEFT JOIN options ON options.Poll_ID = polls.ID AND options.Question_ID = questions.ID \
					WHERE polls.URL = "' + poll_URL + '" \
					GROUP BY questions.ID \
					ORDER BY questions.Question_Order';

		connection.query(query, function(err, rows, fields) {
			connection.release();
			if(err) {
				throw err;
				res.writeHead(500, {
	  				'Content-Type': 'application/json' 
	  			});
	        	res.end(JSON.stringify({server_error: error}));
			} else {
				console.log('The solution is:', rows);
				//res.json(rows);
				res.writeHead(200, {
		  			'Content-Type': 'application/json' 
		  		});
		        res.end(JSON.stringify(rows));
			}
		});
	}); 	
})
/************************* END GET SINBGLE POLL WITH ALL AVAILABLE QUESTIONS  ***************************/

/************************ BEGIN GET SINBGLE POLL WITH ACTIVE QUESTIONS ONLY ***************************/
 router.get('/:pollURL/active', function (req, res, next) {
 	var poll_URL = req.params.pollURL;
	
	pool.getConnection(function(err, connection) {
		var query = 'SELECT \
					polls.ID AS pollID, \
					questions.ID as questionID, \
					questions.Question as question, \
					questions.Active as active, \
					questions.Graph_Active as graphActive, \
					GROUP_CONCAT(options.ID ORDER BY options.Option_Order SEPARATOR "|") as question_options_id, \
					GROUP_CONCAT(options.Description ORDER BY options.Option_Order SEPARATOR "|") as question_options \
					FROM polls \
					LEFT JOIN questions ON questions.Poll_ID = polls.ID \
					LEFT JOIN options ON options.Poll_ID = polls.ID AND options.Question_ID = questions.ID \
					WHERE polls.URL = "' + poll_URL + '" \
					AND questions.active = "1" \
					GROUP BY questions.ID \
					ORDER BY questions.Question_Order';

		connection.query(query, function(err, rows, fields) {
			connection.release();
			if(err) {
				throw err;
				res.writeHead(500, {
	  				'Content-Type': 'application/json' 
	  			});
	        	res.end(JSON.stringify({server_error: error}));
			} else {
				console.log('The solution is:', rows);
				//res.json(rows);
				res.writeHead(200, {
		  			'Content-Type': 'application/json' 
		  		});
		        res.end(JSON.stringify(rows));
			}
		});
	}); 	
})
/************************* END GET SINBGLE POLL WITH ACTIVE QUESTIONS ONLY ***************************/

/****************** BEGIN INSERT POLLS *********************/
router.post('/', function(req, res){
		//initiate the pool connection
	pool.getConnection(function(err, connection) {
			//get the poll object
	    var obj = req.body.poll;

	    if(obj !== 'null' && obj != 'undefined') {
			var newPollID = '';
			var newQuestion = {};
			var newQuestionOrder = 1;
			var isLast = false;

				//create random URL for this poll
			var randomURL = shortid.generate();

			var newPoll = {ID: 'NULL', URL: randomURL};
			var newPollID = '';

			connection.query('INSERT INTO polls SET ?',  newPoll, function(err, response) {
				if(err) {
					responseBody = err;
					throw err;
					connection.release();
		        	res.writeHead(500, {
		  				'Content-Type': 'application/json' 
		  			});
		        	res.end(JSON.stringify({server_error: error}));
				} else {
					newPollID = response.insertId;
					var totalQuestions = Object.keys(obj).length;
					var totalQuestionsCount = 1;

						//loop through object and add it to the arrays that will be sent to the database
					for (var question in obj) { 
				    	if (obj.hasOwnProperty(question)) {
				    		newQuestion.Poll_ID = newPollID;
				    		newQuestion.Question = obj[question].question;
				    		newQuestion.Question_Order =  newQuestionOrder;
				    		newQuestion.Active = obj[question].active;
				    		newQuestion.Graph_Active = obj[question].graphActive;

							var options = obj[question].options; 
							var newOptions = [];

							if(options !== 'null' && options !== 'undefined') {
								var newOptionsOrder = 1;
								for (var option in options) {
									newOptions.push([newPollID, '', options[option].option, newOptionsOrder]);
									newOptionsOrder++;
								}
							}

							newQuestionOrder++;

							if(totalQuestionsCount == totalQuestions) {
								isLast = true;
							}

							totalQuestionsCount++;

								//call waterfall method to handle aysnc calls to db
							asyncDBInsertInteractions(newQuestion, newOptions, isLast, res, connection, randomURL);
				    	}
				    }
				}
			});
	    }
	});
});

var asyncDBInsertInteractions = function(newQuestion, newOptions, isLast, res, connection, pollURL) {
	async.waterfall([
       createQuestions(newQuestion, newOptions, connection),
       createOptions
    ], function (error, success) {
        if (error) { 
        	console.log('Error:' + error); 
        	connection.release();
        	res.writeHead(500, {
  				'Content-Type': 'application/json' 
  			});
        	res.end(JSON.stringify({server_error: error}));
        } else {
        	console.log('Success!'); 

        	if(isLast) {
        		connection.release();
        		console.log('connection ended');
        		res.writeHead(200, {
  					'Content-Type': 'application/json' 
  				});
        		res.end(JSON.stringify({success: 'Poll was added succesfully!', poll_URL: pollURL}));
        	}
        }        
    });
}

function createQuestions(newQuestion, newOptions, connection, callback) {
	return function(callback) {
		connection.query('INSERT INTO questions SET ?', newQuestion, function(err, response) {
			if(err) {
				responseBody = err;
				throw err;
				//console.log(err);
				callback(err, 'failed');
			} else {
				newQuestionID = response.insertId;
					
				for(var key in newOptions) {
					newOptions[key][1] = newQuestionID;
				}

				callback(null, newOptions, connection);
			}
		});
	}
}

function createOptions(newOptions, connection, callback) { 
	connection.query('INSERT INTO options (Poll_ID, Question_ID, Description, Option_Order) VALUES ?', [newOptions], function(err, response) {
		if(err) {
			responseBody = err;
			throw err;
			//console.log(err);
			callback(err, 'failed');
		} else {
			//console.log('did it bitches');
			callback(null, 'done');
		}
	});
}
/************************* END INSERT POLLS *************************/

/****************** BEGIN UPDATE POLLS *********************/
router.put('/', function(req, res){
		//initiate the pool connection
	pool.getConnection(function(err, connection) {
			//get the poll object
	    var objID = req.body.pollID;
	    var obj = req.body.poll;
	    var objDelete = req.body.pollDeleteIDs;
	    var isLast = false;
	    var questionOrder = 1;

	    if(objID !== 'null' && objID != 'undefined') {
	    	var totalQuestions = Object.keys(obj).length;
	    	var totalQuestionsCount = 1;

	    	for(var question in obj) {
	    		var currQuestion = obj[question].question;
	    		var currQuestionID = obj[question].id;
	    		var currQuestionActive = obj[question].active;
	    		var currQuestionGraphActive = obj[question].graphActive;
	    		var options = obj[question].options;

	    		if(totalQuestionsCount == totalQuestions) {
					isLast = true;
				}

	    		asyncDBUpdateInteractions(objID, options, currQuestion, currQuestionID, currQuestionActive, currQuestionGraphActive, totalQuestionsCount, isLast, res, connection, objDelete);

	    		totalQuestionsCount++;
	    	}	
	    }
	});
});

var asyncDBUpdateInteractions = function(objID, options, currQuestion, currQuestionID, currQuestionActive, currQuestionGraphActive, questionsCount, isLast, res, connection, objDelete) {
	async.waterfall([
       updateQuestions(objID, options, currQuestion, currQuestionID, currQuestionActive, currQuestionGraphActive, questionsCount, connection),
       updateOptions
    ], function (error, success) {
        if (error) {
        	responseError(res, connection, error);
        } else {
        	console.log('Success!'); 

        	if(isLast) {
				if(Object.keys(objDelete).length > 0) {
						//call function to delete options/questions
        			deleteQuestions(objDelete, res, connection);
				} else {
					responseSuccess(res, connection, 'Poll was succesfully updated!');
				}
        	}
        }        
    });
}

function updateQuestions(objID, options, currQuestion, currQuestionID, currQuestionActive, currQuestionGraphActive, questionsCount, connection, callback) {
	return function(callback) {
		var sqlString = '';
		var sqlArray;
		var newQuestionID = '';

		if(currQuestionID < 0) {
			sqlString = 'INSERT INTO questions SET ?';
			sqlArray = {Poll_ID: objID, Question: currQuestion, Question_Order: questionsCount, Active: currQuestionActive, Graph_Active: currQuestionGraphActive};
		} else {
			sqlString = 'UPDATE questions SET Question = ?, Question_Order = ?, Active = ?, Graph_Active = ? WHERE ID = ? AND Poll_ID = ?';
			sqlArray = [currQuestion, questionsCount, currQuestionActive, currQuestionGraphActive, currQuestionID, objID];
		}
		connection.query(sqlString, sqlArray, function(err, response) {
			if(err) {
				responseBody = err;
				throw err;
				//console.log(err);
				callback(err, 'failed');
			} else {
				if(currQuestionID < 0) {
					newQuestionID = response.insertId;
				}

				callback(null, objID, options, currQuestionID, newQuestionID, connection);
			}
		});
	}
}

function updateOptions(objID, options, currQuestionID, newQuestionID, connection, callback) {  
	var totalCurrObjOptions = Object.keys(options).length;
	console.log(totalCurrObjOptions);
	var totalOptionsCount = 1;
	var optionsOrder = 1;

	if(newQuestionID != '') {
		currQuestionID = newQuestionID; 
	} 


	if(options !== 'null' && options !== 'undefined') {
		for (var option in options) {
			var currOption = options[option].option;
			var currOptionID = options[option].id;
			var sqlOptionsArray;
			var sqlOptionString = '';

			if(currOptionID < 0) {
				sqlOptionsString = 'INSERT INTO options SET ?';
				sqlOptionsArray = {Poll_ID: objID, Question_ID: currQuestionID, Description: currOption, Option_Order: optionsOrder};
			} else {
				sqlOptionsString = 'UPDATE options SET Description = ?, Option_Order = ? WHERE ID = ? AND Question_ID = ? AND Poll_ID = ?';
				sqlOptionsArray = [currOption, optionsOrder, currOptionID, currQuestionID, objID];
			}
			optionsOrder++;

			connection.query(sqlOptionsString, sqlOptionsArray, function(err, response) {
				if(err) { 
					//console.log(err);
					responseBody = err;
					throw err;
					//console.log(err);
					callback(err, 'failed');
				} else {
					if(totalCurrObjOptions == totalOptionsCount) {
							//console.log('did it bitches');
						callback(null, 'done');
					} else {
						totalOptionsCount++;
					}
				}
			});
		}
	} else { 
		callback(null, 'done');
	}
}

function deleteQuestions(objDelete, res, connection) { 
	var questionsQuery = 'DELETE FROM questions WHERE';
	var optionsQuery = 'DELETE FROM options WHERE';
	var votesQuery = 'DELETE FROM answers WHERE';
	var hasQuestionsToBeDeleted = false;

	for(var obj in objDelete) {
		if(objDelete[obj].length > 0) { //delete options only
			for(op in objDelete[obj]) {
				optionsQuery += ' ID = ' +  objDelete[obj][op] + ' OR';
				votesQuery += ' Option_ID = ' +  objDelete[obj][op] + ' OR';
			}
		} else { //delete question and all its options
			questionsQuery += ' ID = ' + obj + ' OR';
			votesQuery += ' Question_ID = ' +  obj + ' OR';
			optionsQuery += ' Question_ID = ' + obj + ' OR'; //add the OR as the string will be formatted to remove the last 3 charecters
			hasQuestionsToBeDeleted = true;
		}
	}

	questionsQuery = questionsQuery.slice(0,-3);
	optionsQuery = optionsQuery.slice(0,-3);
	votesQuery = votesQuery.slice(0,-3);

	if(hasQuestionsToBeDeleted) {
		connection.query(questionsQuery, function(err, response) { //delete questions
			if(err) { 
				responseError(res, connection, err);
			} else {
				connection.query(optionsQuery, function(err, response) { //delete options
					if(err) { 
						responseError(res, connection, error);
					} else {
						connection.query(votesQuery, function(err, response) { //delete answers
							if(err) { 
					        	responseError(res, connection, err);
							} else {
				        		responseSuccess(res, connection, 'Poll was succesfully updated!');
							}
						});
					}
				});
			}
		});
	} else {
		connection.query(optionsQuery, function(err, response) { //delete options
			if(err) { 
	        	responseError(res, connection, err);
			} else {
				connection.query(votesQuery, function(err, response) { //delete answers
					if(err) { 
			        	responseError(res, connection, err);
					} else {
		        		responseSuccess(res, connection, 'Poll was succesfully updated!');
					}
				});
			}
		});
	}
}

function responseError(res, connection, error) {
	console.log('Error:' + error); 
	connection.release();
	res.writeHead(500, {
			'Content-Type': 'application/json' 
		});
	res.end(JSON.stringify({server_error: error}));
}

function responseSuccess(res, connection, message) {
	connection.release();
	console.log('connection ended');
	res.writeHead(200, {
			'Content-Type': 'application/json' 
		});
	res.end(JSON.stringify({success: message}));
}
/****************** END UPDATE POLLS *********************/

/****************** BEGIN ADD/UPDATE VOTES ***************/
router.post('/vote/', function(req, res){ 
	var objID = req.body.pollID;
    var obj = req.body.votes;
    var userID = req.body.userID;
    var totalVotes = Object.keys(obj).length;
    var deleteQuery = 'DELETE FROM answers WHERE';

    if(objID !== 'null' && objID != 'undefined' && totalVotes > 0 && userID != '') {
    	var newVotes = [];

    	for(var vote in obj) {
    		var currVote = [];

    		currVote.push(userID);
    		currVote.push(objID);
    		currVote.push(obj[vote].question_id);
    		currVote.push(obj[vote].option_id);
    		
    		newVotes.push(currVote);

    			//build the delete query
    		deleteQuery += ' (Poll_ID = ' + objID + ' AND Question_ID = ' + obj[vote].question_id + ' AND User_ID = "' + userID + '") OR'; 
    	}		
    		
    	deleteQuery = deleteQuery.slice(0,-3);

    	pool.getConnection(function(err, connection) {
	    		//delete all votes for that user before adding updated votes
	    	connection.query(deleteQuery, function(err, response) {
				if(err) {
					responseBody = err;
					throw err;
					connection.release();
		        	res.writeHead(500, {
		  				'Content-Type': 'application/json' 
		  			});
		        	res.end(JSON.stringify({server_error: error}));
				} else {
					connection.query('INSERT INTO answers (User_ID, Poll_ID, Question_ID, Option_ID) VALUES ?',  [newVotes], function(err, response) {
						if(err) {
							responseBody = err;
							throw err;
							connection.release();
				        	res.writeHead(500, {
				  				'Content-Type': 'application/json' 
				  			});
				        	res.end(JSON.stringify({server_error: error}));
						} else {
							connection.release();
							//console.log('connection ended');
							res.writeHead(200, {
								'Content-Type': 'application/json' 
							});
							res.end(JSON.stringify({success: 'Votes were successfully registered.'}));
						}
					});
				}
	    	});
    	});
    }
});
/****************** END ADD/UPDATE VOTES ***************/

/************************ BEGIN GET SINGLE USER VOTES ***************************/
 router.get('/vote/:userID', function (req, res, next) {
 	var userID = req.params.userID;
	
	pool.getConnection(function(err, connection) {
		var query = 'SELECT \
					answers.Poll_ID as pollID, \
					answers.Question_ID as questionID, \
					answers.Option_ID as optionID \
					FROM answers \
					WHERE answers.User_ID = "' + userID + '"';

		connection.query(query, function(err, rows, fields) {
			connection.release();
			if(err) {
				throw err;
				res.writeHead(500, {
	  				'Content-Type': 'application/json' 
	  			});
	        	res.end(JSON.stringify({server_error: error}));
			} else {
				console.log('The solution is:', rows);
				//res.json(rows);
				res.writeHead(200, {
		  			'Content-Type': 'application/json' 
		  		});
		        res.end(JSON.stringify(rows));
			}
		});
	}); 	
})
/************************* END GET SINGLE USER VOTES ***************************/

/************************ BEGIN GET SINGLE POLL RESULTS ***************************/
router.get('/results/:pollURL', function (req, res, next) {
 	var poll_URL = req.params.pollURL;
 	
	pool.getConnection(function(err, connection) {
		var query = 'SELECT \
					polls.URL as pollURL, \
					answers.Poll_ID as pollID, \
					answers.Question_ID as questionID, \
					questions.Question as questionDesc, \
					answers.Option_ID as optionID, \
					options.Description as optionDesc, \
					COUNT(*) as numberVotes \
					FROM answers \
					LEFT JOIN questions ON questions.ID = answers.Question_ID \
					LEFT JOIN options ON options.ID = answers.Option_ID \
					LEFT JOIN polls ON polls.ID = questions.Poll_ID \
					WHERE polls.URL = "' + poll_URL + '" \
					GROUP BY questionID, optionID \
					ORDER BY questionID, optionID';

		connection.query(query, function(err, rows, fields) {
			connection.release();
			if(err) {
				throw err;
				res.writeHead(500, {
	  				'Content-Type': 'application/json' 
	  			});
	        	res.end(JSON.stringify({server_error: error}));
			} else {
				console.log('The solution is:', rows);
				//res.json(rows);
				res.writeHead(200, {
		  			'Content-Type': 'application/json' 
		  		});
		        res.end(JSON.stringify(rows));
			}
		});
	}); 	
})
/************************* END GET SINGLE POLL RESULTS ***************************/

/************************ BEGIN GET SINGLE POLL RESULTS FOR ACTIVE QUESTIONS ***************************/
router.get('/results/:pollURL/active', function (req, res, next) {
 	var poll_URL = req.params.pollURL;
 	
	pool.getConnection(function(err, connection) {
		var query = 'SELECT \
					polls.URL as pollURL, \
					answers.Poll_ID as pollID, \
					answers.Question_ID as questionID, \
					questions.Question as questionDesc, \
					answers.Option_ID as optionID, \
					options.Description as optionDesc, \
					COUNT(*) as numberVotes \
					FROM answers \
					LEFT JOIN questions ON questions.ID = answers.Question_ID \
					LEFT JOIN options ON options.ID = answers.Option_ID \
					LEFT JOIN polls ON polls.ID = questions.Poll_ID \
					WHERE polls.URL = "' + poll_URL + '" \
					AND questions.Graph_Active = "1" \
					GROUP BY questionID, optionID \
					ORDER BY questionID, optionID';

		connection.query(query, function(err, rows, fields) {
			connection.release();
			if(err) {
				throw err;
				res.writeHead(500, {
	  				'Content-Type': 'application/json' 
	  			});
	        	res.end(JSON.stringify({server_error: error}));
			} else {
				console.log('The solution is:', rows);
				//res.json(rows);
				res.writeHead(200, {
		  			'Content-Type': 'application/json' 
		  		});
		        res.end(JSON.stringify(rows));
			}
		});
	}); 	
})
/************************* END GET SINGLE POLL RESULTS FOR ACTIVE QUESTIONS ***************************/

module.exports = router;