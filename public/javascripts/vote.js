/* NOTES
 - The function getPollData is called on the firt load and on every time the socket receives a message
 - A message is sent upon user voting
 - The vote page sends and receives messages to the socket (user vote = send, poll updated = receive)
*/
$(document).ready(function(){ 
		//open socket with the server
	//var socket = io.connect('http://localhost:3001');
	var socket = io();

		//get poll URL
	var pollURL = $('.pollURL').text();

		//get the "user_id" - cookie
	var userID = $.cookie('ungerboeck_poll_user_id');

	 // New socket connected, display new count on page - FOR TEST ONLY
    socket.on('users connected', function(data){
        //$('#usersConnected').html('Users connected: ' + data);
        console.log('Users connected: ' + data);
    });

    socket.on('poll updated', function(data){
        //console.log(data);	
        if(pollURL == data.poll_URL) {
        	getPollData();
        }	        
    });

	getPollData();

	function getPollData() {		
		$.ajax({
		    url: webServicePath + '/api/polls/' + pollURL + '/active', 
		    type: 'GET', 
		    contentType: 'application/json', 
		    data: {},
		    success: function(data) {
		    	if (data.length > 0) {
                    createViews(data);
                } else {
                    jQuery('.poll-container').html('<div class="alert-message">Waiting for poll to start...</div>');
                }
		    }
		});
	}

	function createViews(data) {
		var htmlString = '';

		$('.poll-container').attr('poll-id', data[0]['pollID']);

		for(var i=0; i<data.length; i++) {
			var htmlTabs = '';
			var optionsIDs = data[i]['question_options_id'].split('|'); 
			var options = data[i]['question_options'].split('|');
			//var hiddenClass = (i!=0) ? 'poll-tab-hidden' : '';
			var hiddenClass = '';

			htmlTabs += '<div class="poll-tab-' + i + ' poll-tab-item ' + hiddenClass + '">';
			
			htmlTabs += '<div id="poll-question-id-' + data[i]['questionID'] + '" class="poll-question" question_id="' + data[i]['questionID'] + '">';
			htmlTabs += '<h2>' + data[i]['question'] + '</h2>';
			htmlTabs += '</div>';

			htmlTabs += '<div class="options-container">';
			$.each(options, function(idx, val) {
				htmlTabs += '<div id="option-' + optionsIDs[idx] + '" class="poll-option" option_id="' + optionsIDs[idx] + '">';
				htmlTabs += '<label class="radio">';
				htmlTabs += '<span class="outer"><span class="inner"></span></span>';
				htmlTabs += val;
				htmlTabs += '</label>';
				htmlTabs += '</div>';
			});
			htmlTabs += '</div>';

			htmlTabs += '</div>';

			htmlString += htmlTabs;
		}

			//clear poll container 
		$('.poll-container').html('');	
			//append updated data
		$('.poll-container').prepend(htmlString);

	    $('.poll-tab-item .poll-option label').click(function() {
	    	var currParent = $(this).parent().parent().parent();
	    	currParent.find('.poll-option').removeClass('option-selected');
	    	currParent.find($(this)).parent().addClass('option-selected');

	    	saveVote();
	    });

	    if(userID !== undefined) {
	    		//get votes in case user has voted before
	    	getVotes();
	    }
	}

	function getVotes() {
		$.ajax({
		    url: webServicePath + '/api/polls/vote/' + userID, 
		    type: 'GET', 
		    contentType: 'application/json', 
		    data: {},
		    success: function(data) {
		    	if (data.length > 0) { 
                    	//select the questions
                    for(var i=0; i<data.length; i++) {                    	
                    	$('#option-' + data[i]['optionID']).addClass('option-selected');
                    }
                } 
		    }
		});
	}

	function saveVote() {
		var arrVotes = {};
		var countVotes = 0;

		$('.poll-tab-item').each(function(){
			var currQuestionID = $(this).find('.poll-question').attr('question_id');
			var currOptionID = $(this).find('.option-selected').attr('option_id');

			if(currOptionID !== undefined) {
				arrVotes[countVotes] = {};
				arrVotes[countVotes].question_id = currQuestionID;
				arrVotes[countVotes].option_id = currOptionID;

				countVotes++;
			}
		});

		//console.log(arrVotes);
		//console.log(JSON.stringify(arrVotes));

		if(Object.keys(arrVotes).length > 0 && userID !== undefined) {
			parameters = JSON.stringify({ 'pollID': $('.poll-container').attr('poll-id'), 'votes': arrVotes, 'userID': userID });

			$.ajax({
			    url: webServicePath + '/api/polls/vote', 
			    type: 'POST', 
			    contentType: 'application/json', 
			    data: parameters,
			    success: function(data) {
			    	//should we send an emit to the poll updated to update this page? Let's think about it. 
			    	//Case: user has 2 different pages with the same poll. If he votes in one, that should be reflected on the other. 

			    		//show success message
			    	swal({   
			    		title: "Thank You!",   
			    		type: "success",
			    		text: "Your vote has been registered.",   
			    		timer: 2000,   
			    		showConfirmButton: false 
			    	});

			    		//emit to socket
			    	socket.emit('vote registered', {poll_URL: pollURL});
			    	
			    }, error: function(data) {
			    	if(data['server_error'] != undefined) {
						swal("Error!", data['server_error'], "error");
			    	} else {
			    		swal("Error!", 'There was a problem with your vote. Please, contact the administrator.', "error");
			    	}				    	
			    }
			});
		} else {
			swal("Error!", 'There was a problem registering your votes. Please, contact the administrator.', "error");
		}
	}
});