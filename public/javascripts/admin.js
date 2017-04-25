/* NOTES
 - For new polls, we always use the API to prevent openning unnecessary connections with the server
 - For update pools, the api is still used. Upon a success call with the API, we call the socket emit to update its clients
 - The admin page nevers listens for sockets, it only emits (when its update)
 - The variable "isUpdate" controls what kind of connection is being stablished
*/
$(document).ready(function(){ 
	/****************************************** BEGIN STANDARD POLL FUNCTIONALITY CODE ********************************/
		//add/remove new rows as the user interacts with the page
	var rowManager = function(e){
		if($(this).val().length > 0) {
			if(e.keyCode != 8) {
				addRow($(this));
			}
		} else if($(this).val().length < 1 && e.keyCode == 8) {
			removeRow(e, $(this));
		}
	};

	$('.question-input-field').bind('keydown', rowManager);
	$('.answer-input-field').bind('keydown', rowManager);

	var showOptions = function() {
		$(this).parent().parent().parent().toggleClass('opt-visible');
	}

	$('.question-item-btn button').bind('click', showOptions);

	var closeOptions = function() {
		$(this).parent().parent().parent().toggleClass('opt-visible');
	}

	$('.answers-close-section .close-options').bind('click', closeOptions);	

	var activateQuestion = function() { 
		$(this).toggleClass('active');

		if($(this).hasClass('active')) {
			$(this).parent().attr('question-active', 'true');
		} else {
			$(this).parent().attr('question-active', 'false');
		}
	}

	$('.activate-button').bind('click', activateQuestion);

	var graphActivateQuestion = function() { 
		$(this).toggleClass('active');

		if($(this).hasClass('active')) {
			$(this).parent().attr('question-graph-active', 'true');
		} else {
			$(this).parent().attr('question-graph-active', 'false');
		}
	}

	$('.activate-graph-button').bind('click', graphActivateQuestion);

	$(document).tooltip();

		//open socket with the server
	//var socket = io.connect('http://localhost:3001');
	var socket = io();

		//if user is editing a poll, fill form with poll information 
	var pollURL = $('.pollURL').text();
	var isUpdate = false; 

	if(pollURL != '') {
			//clear view
		$('.questions-container').html('');
		getPollData(pollURL);	
		isUpdate = true;
	}

	function addRow(currRow) {
		if(currRow.hasClass('question-input-field')) { //for questions
			var addNewRow = true;
				//verify if there are any rows with empty data
			$('.questions-container .question-row').each(function(){
				if($(this).find('.question-input-field').val() == '') {
					addNewRow = false;
				}
			})
			
			if(addNewRow) {
				var newRow = $('<div class="question-row">' + 
							   '<i class="activate-button fa fa-eye" title="Activate Question"></i>' +
							   '<i class="activate-graph-button fa fa-pie-chart" title="Show on Results"></i>' +
					           '<div class="draggable-question-icon fa fa-arrows"></div>' + 
							   '<div class="question-item-container">' +	
							   '<div class="question-item-input"><input type="text" class="question-input-field" placeholder="Enter Question"></div>' + 
							   '<div class="question-item-btn"><button type="button">Options</button></div>' + 
							   '</div>' +
							   '<div class="answers-item-container">' +
							   '<div class="answers-close-section"><button class="fa fa-minus-square-o close-options"></button></div>' +
							   //'<input type="text" placeholder="Enter Answer" class="answer-input-field">' +
							   '<div class="draggable-option-container"><i class="fa fa-arrows"></i><input type="text" placeholder="Enter Answer" class="answer-input-field"></div>' +
							   '</div>' + 
							   '</div>');
				$('.questions-container').append(newRow);
				bindElements();
			}	
		} else { //for answers
			var addNewRow = true;
			var questionParent = currRow.parent().parent();
				//verify if there are any rows with empty data
			questionParent.find('.answer-input-field').each(function(){
				if($(this).val() == '') {
					addNewRow = false;
				}
			})
			
			if(addNewRow) {
				var newRow = $('<div class="draggable-option-container"><i class="fa fa-arrows"></i><input type="text" placeholder="Enter Answer" class="answer-input-field"></div>');
				questionParent.append(newRow);
				bindElements();
			}	
		}	
	}

	function removeRow(e, currRow) {
			//remove rows with empty questions, except if its the only row
		if(currRow.hasClass('question-input-field')) { //for questions
			if($('.question-row').length > 1 && $('.question-row:visible').length > 1) {
				e.preventDefault();
				currRow.parent().parent().parent().next('.question-row').find('.question-input-field').focus();
				if(!isUpdate) {
					currRow.parent().parent().parent().remove();
				} else {
					currRow.parent().parent().parent().hide();
					currRow.parent().parent().parent().attr('delete-question', '1');
				}				
			}
		} else { //for answers
			var questionParent = currRow.parent().parent();
			//if(questionParent.children('.answer-input-field').length > 1 && questionParent.children('.answer-input-field:visible').length > 1) {
			if(questionParent.find('.draggable-option-container .answer-input-field').length > 1 && questionParent.find('.draggable-option-container .answer-input-field:visible').length > 1) {
				e.preventDefault();
				currRow.parent().next('.draggable-option-container').find('.answer-input-field').focus();
				if(!isUpdate) {
					currRow.remove();
				} else {
					currRow.hide();
					currRow.attr('delete-option', '1');
				}
			}
		}
	}

	function bindElements() {
		$('.question-input-field').unbind('keydown', rowManager);
		$('.question-input-field').bind('keydown', rowManager);
		$('.question-item-btn button').unbind('click', showOptions);
		$('.question-item-btn button').bind('click', showOptions);
		$('.answers-close-section .close-options').unbind('click', closeOptions);
		$('.answers-close-section .close-options').bind('click', closeOptions);
		$('.answer-input-field').unbind('keydown', rowManager);
		$('.answer-input-field').bind('keydown', rowManager);
		$('.activate-button').unbind('click', activateQuestion);
		$('.activate-button').bind('click', activateQuestion);
		$('.activate-graph-button').unbind('click', graphActivateQuestion);
		$('.activate-graph-button').bind('click', graphActivateQuestion);

		$('.questions-container').sortable({
	    	revert: true,
	    	handle: '.draggable-question-icon',
	    	placeholder: "custom-sortable-drag-state"
	    });

	    $('.answers-item-container').sortable({
	    	revert: true,
	    	handle: '.fa',
	    	placeholder: "custom-sortable-drag-state"
	    });
	}
	/****************************************** END STANDARD POLL FUNCTIONALITY CODE ********************************/

	/******************************************  START POLL EDITING CODE ******************************/
	function getPollData(pollURL) {
		$.ajax({
		    url: webServicePath + '/api/polls/' + pollURL, 
		    type: 'GET', 
		    contentType: 'application/json', 
		    data: {},
		    success: function(data) {
		    	if (data.length > 0) {
                    createViews(data);
                } else {
                    jQuery('.questions-container').append('<div class="alert-message">The poll you requested does not exist.</div>');
                }
		    }
		});
	}

	function createViews(data) { 
		$('.questions-container').attr('poll-id', data[0]['pollID']);

		for(var i=0; i<data.length; i++) { 
			var optionsIDs = data[i]['question_options_id'].split('|'); 
			var options = data[i]['question_options'].split('|');
			var htmlOptions = '';
			var questionActive = 'false';
			var questionGraphActive = 'false';
			var questionActiveClass = '';
			var questionGraphActiveClass = '';

			if(data[i]['active'] == 1) {
				questionActive = 'true';
				questionActiveClass = 'active';
			}

			if(data[i]['graphActive'] == 1) {
				questionGraphActive = 'true';
				questionGraphActiveClass = 'active';
			}

			var newRow = $('<div class="question-row opt-visible" poll-question-id="' + data[i]['questionID'] + '" question-active="' + questionActive + '" question-graph-active="' + questionGraphActive + '">' + 
						   '<i class="activate-button fa fa-eye ' + questionActiveClass + '" title="Activate Question"></i>' +
						   '<i class="activate-graph-button fa fa-pie-chart ' + questionGraphActiveClass + '" title="Show on Results"></i>' +
						   '<div class="draggable-question-icon fa fa-arrows"></div>' + 
						   '<div class="question-item-container">' +	
						   '<div class="question-item-input"><input type="text" class="question-input-field" placeholder="Enter Question" value="' + data[i]['question'] + '"></div>' + 
						   '<div class="question-item-btn"><button type="button">Options</button></div>' + 
						   '</div>' +
						   '<div class="answers-item-container">' +
						   '<div class="answers-close-section"><button class="fa fa-minus-square-o close-options"></button></div>' +
						   '</div>' +
						   '</div>');

			$('.questions-container').append(newRow);

			$.each(options, function(idx, val) {
				htmlOptions += '<div class="draggable-option-container"><i class="fa fa-arrows"></i><input type="text" placeholder="Enter Answer" class="answer-input-field" poll-answer-id="' + optionsIDs[idx] + '" value="' + val + '"></div>';
			});
			htmlOptions += '<div class="draggable-option-container"><i class="fa fa-arrows"></i><input type="text" placeholder="Enter Answer" class="answer-input-field"></div>';

			$('[poll-question-id=' + data[i]['questionID'] + ']').find('.answers-item-container').append(htmlOptions);
		}

		var newEmptyRow = $('<div class="question-row">' + 
				       '<i class="activate-button fa fa-eye" title="Activate Question"></i>' +
				       '<i class="activate-graph-button fa fa-pie-chart" title="Show on Results"></i>' +
					   '<div class="draggable-question-icon fa fa-arrows"></div>' + 
					   '<div class="question-item-container">' +	
					   '<div class="question-item-input"><input type="text" class="question-input-field" placeholder="Enter Question"></div>' + 
					   '<div class="question-item-btn"><button type="button">Options</button></div>' + 
					   '</div>' +
					   '<div class="answers-item-container">' +
					   '<div class="answers-close-section"><button class="fa fa-minus-square-o close-options"></button></div>' +
					   '<div class="draggable-option-container"><i class="fa fa-arrows"></i><input type="text" placeholder="Enter Answer" class="answer-input-field"></div>' +
					   '</div>' + 
					   '</div>');
		$('.questions-container').append(newEmptyRow);

		bindElements();

			//create the poll info section
		$('.poll-info-container').show();
		$('.poll-admin-info').append($('<div class="poll-info-title">Poll Admin</div><a href="/admin/' + pollURL + '" class="poll-info-body">admin/' + pollURL + '</a><div id="qr-code-admin"></div>'));
		$('.poll-survey-info').append($('<div class="poll-info-title">Poll Vote</div><a href="/vote/' + pollURL + '" class="poll-info-body">vote/' + pollURL + '</a><div id="qr-code-survey"></div>'));
		$('.poll-results-info').append($('<div class="poll-info-title">Poll Results</div><a href="/results/' + pollURL + '" class="poll-info-body">results/' + pollURL + '</a><div id="qr-code-results"></div>'));

			//create qr-codes - TODO //Replace by the correct URL
		new QRCode(document.getElementById("qr-code-admin"), "https://madpoll.herokuapp.com/admin/" + pollURL);
		new QRCode(document.getElementById("qr-code-survey"), "https://madpoll.herokuapp.com/vote/" + pollURL);
		new QRCode(document.getElementById("qr-code-results"), "https://madpoll.herokuapp.com/results/" + pollURL);
	}
	/******************************************  END POLL EDITING CODE ******************************/


	/****************************************** BEGIN SAVE POLL CODE ********************************/
	function savePoll() {
		var arrPoll = {};
		var arrPollDeleteIDs = {};
		var newIDsForUpdate = -1; //add negative index to new questions/answers
		var allQuestionsHaveAnAnswer = true;
		var countQuestions = 0;


		$('.question-row').each(function(){
			var countOptions = 0;

			if($(this).find('.question-input-field').val() != '' && $(this).attr('delete-question') != '1') {
				var currQuestion = $(this).find('.question-input-field').val();
				arrPoll[countQuestions] = {};

				var currQuestionID = ''; 
				if($(this).attr('poll-question-id') === undefined) {
					currQuestionID = newIDsForUpdate; //flag to indicate this is a new question
				} else {
					currQuestionID = $(this).attr('poll-question-id');	
				}
				arrPoll[countQuestions].id = currQuestionID;
				arrPoll[countQuestions].question = currQuestion;
				arrPoll[countQuestions].options = {};
				
				if($(this).attr('question-active') !== undefined && $(this).attr('question-active') === 'true') {
					arrPoll[countQuestions].active = 1;
				} else {
					arrPoll[countQuestions].active = 0;
				}

				if($(this).attr('question-graph-active') !== undefined && $(this).attr('question-graph-active') === 'true') {
					arrPoll[countQuestions].graphActive = 1;
				} else {
					arrPoll[countQuestions].graphActive = 0;
				}

				$(this).find('.answers-item-container .answer-input-field').each(function(){
					if($(this).val() != '' && $(this).attr('delete-option') != '1') {
						arrPoll[countQuestions].options[countOptions] = {};
						arrPoll[countQuestions].options[countOptions].option = $(this).val();

						if($(this).attr('poll-answer-id') === undefined) {
							arrPoll[countQuestions].options[countOptions].id = newIDsForUpdate; //flag to indicate this is a new option
						} else {
							arrPoll[countQuestions].options[countOptions].id = $(this).attr('poll-answer-id');
						}

						countOptions++;		
					} else if($(this).attr('delete-option') == '1') {
						if(arrPollDeleteIDs[currQuestionID] === undefined) {
							arrPollDeleteIDs[currQuestionID] = [];
						} 
						arrPollDeleteIDs[currQuestionID].push($(this).attr('poll-answer-id'));						
					} 	
				});				
			} else if($(this).attr('delete-question') == '1') {
				var currQuestionID = $(this).attr('poll-question-id');
				arrPollDeleteIDs[currQuestionID] = [];
			} 

			countQuestions++;		
		});

		//console.log(arrPoll);
		//console.log(JSON.stringify(arrPoll));

		if(Object.keys(arrPoll).length <= 0) {
			swal("Error!", "Please, enter your questions before continuing!", "error");
		} else {
			for(obj in arrPoll) {
				if(arrPoll[obj].length <= 0) {
					allQuestionsHaveAnAnswer = false;
				}
			}

			if(!allQuestionsHaveAnAnswer) {
				swal("Error!", "One of your questions do not have answers. Please, enter at least one answer before continuing!", "error");
			} else {
				var callType = '';
				var parameters =  '';

				if(isUpdate)  {
					callType = 'PUT';
					parameters = JSON.stringify({ 'pollID': $('.questions-container').attr('poll-id') ,'poll': arrPoll, 'pollDeleteIDs': arrPollDeleteIDs });
				} else{
					callType = 'POST';
					parameters = JSON.stringify({ 'poll': arrPoll});
				}

				console.log(parameters);

				$.ajax({
				    url: webServicePath + '/api/polls', 
				    type: callType, 
				    contentType: 'application/json', 
				    data: parameters,
				    success: function(data) {
				    	if(data['success'] != undefined) {
				    		swal({
				    			title: "Success!",
				    			text: data['success'],
				    			type: "success",
				    		}, function() { 
			    				if(isUpdate) {
			    						//emit to sockets
			    					socket.emit('poll updated', {poll_URL: pollURL});

			    						//refresh page	
									location.reload();
			    				} else {
			    					document.location.href="/admin/" + data['poll_URL'];
			    				}
				    		});
				    	}
				    }, error: function(data) {
				    	 if(data['server_error'] != undefined) {
							swal("Error!", data['server_error'], "error");
				    	} else {
				    		swal("Error!", 'There was a problem adding/updating your poll. Please, contact the administrator.', "error");
				    	}				    	
				    }
				});
			}
		}
	}

	$('.save-button').bind('click', savePoll);
	/****************************************** END SAVE POLL CODE ********************************/
});