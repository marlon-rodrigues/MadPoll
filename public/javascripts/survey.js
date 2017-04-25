/************* NOT BEING USED - IGNORE - KEEPING CODE FOR REFERENCE ONLY ********************/
$(document).ready(function(){ 

	getPollData();

	$('.poll-previous-btn').click(function(){
		navigation('backwards');
	});
	$('.poll-next-btn').click(function(){
		navigation('forward');
	});

	function getPollData() {
			//get poll URL
		var pollURL = $('.pollURL').text();
		
		$.ajax({
		    url: 'http://localhost:3000/api/polls/' + pollURL, 
		    type: 'GET', 
		    contentType: 'application/json', 
		    data: {},
		    success: function(data) {
		    	if (data.length > 0) {
                    createViews(data);
                } else {
                    jQuery('#eventsListCalendar').append('<div class="alert-message">The poll you requested does not exist.</div>');
                }
		    }
		});
	}

	function createViews(data) {
		var htmlString = '';

		$('.poll-container').attr('id', data[0]['pollID']);

		for(var i=0; i<data.length; i++) {
			var htmlTabs = '';
			var optionsIDs = data[i]['question_options_id'].split('|'); 
			var options = data[i]['question_options'].split('|');
			var hiddenClass = (i!=0) ? 'poll-tab-hidden' : '';

			htmlTabs += '<div class="poll-tab-' + i + ' poll-tab-item ' + hiddenClass + '">';
			
			htmlTabs += '<div id="poll-question-id-' + data[i]['questionID'] + '" class="poll-question">';
			htmlTabs += '<h2>' + data[i]['question'] + '</h2>';
			htmlTabs += '</div>';

			htmlTabs += '<div class="options-container">';
			$.each(options, function(idx, val) {
				htmlTabs += '<div id="option-' + optionsIDs[idx] + '" class="poll-option">';
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

		$('.poll-container').prepend(htmlString);

		if($('.poll-container .poll-tab-item').length == 1) {
			$('.navigation-buttons').hide();
		}

		$('input').checkboxradio({
	    	icon: false
	    });

	    $('.poll-tab-item .poll-option label').click(function() {
	    	var currParent = $(this).parent().parent().parent();
	    	currParent.find('.poll-option').removeClass('option-selected');
	    	currParent.find($(this)).parent().addClass('option-selected');
	    });
	}

	function navigation(direction) {
		var totalQuestions = $('.poll-container .poll-tab-item').length;
		var loopQuestionIdx = 1;

		if(totalQuestions != 1) {
			$('.poll-container .poll-tab-item').each(function(){ 
				if(!$(this).hasClass('poll-tab-hidden')) {

					$(this).addClass('poll-tab-hidden');

					if(direction == 'forward') { 
						$(this).next().removeClass('poll-tab-hidden');

						$('.poll-previous-btn').show();

						if(loopQuestionIdx == totalQuestions - 1) {
							$('.poll-next-btn').hide();
						} 
					} else {
						$(this).prev().removeClass('poll-tab-hidden');

						$('.poll-next-btn').show();

						if(loopQuestionIdx == 2) {
							$('.poll-previous-btn').hide();
						} 
					}

					return false;
				} 

				loopQuestionIdx++;
			});
		}
	}

});