/* NOTES
 - The function getResults is called on the firt load and on every time the socket receives a message
 - The results page only receives messages from the socket - message is sent upon user voting
*/
$(document).ready(function(){ 
		//open socket with the server
	//var socket = io.connect('http://localhost:3001');
	var socket = io();

		//get poll URL
	var pollURL = $('.pollURL').text();

		//listens to votes
    socket.on('vote registered', function(data){
        //console.log(data);	
        if(pollURL == data.poll_URL) {
        	getResults(true);
        }	        
    });

    	//listens to admin poll
    socket.on('poll updated', function(data){
        //console.log(data);	
        if(pollURL == data.poll_URL) {
        	getResults(true);
        }	        
    });

    var defaultBackgroundColors = [
    	'rgba(255, 99, 132, 1)',
    	'rgba(246, 69, 37, 1)',
    	'rgba(141, 198, 63, 1)',
        'rgba(48, 76, 104, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(193, 68, 68, 1)',
        'rgba(107, 205, 68, 1)',
        'rgba(62, 139, 197, 1)'
    ];
	var defaultBorderColors =[
		'rgba(255, 99, 132, 1)',
    	'rgba(246, 69, 37, 1)',
    	'rgba(141, 198, 63, 1)',
        'rgba(255,99,132,1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(193, 68, 68, 1)',
        'rgba(107, 205, 68, 1)',
        'rgba(62, 139, 197, 1)'
    ];

		//hide the original legends
	Chart.defaults.global.legend.display = false;

	getResults(false);

	function getResults(reload) {		
		$.ajax({
		    url: webServicePath + '/api/polls/results/' + pollURL + '/active', 
		    type: 'GET', 
		    contentType: 'application/json', 
		    data: {},
		    success: function(data) {
		    	if (data.length > 0) {
		    		createView(data, reload);
                } else {
                    jQuery('.results-container .donut-chart-graph').html('<div class="alert-message">Waiting for results...</div>');
                }
		    }
		});
	}

	function createView(data, reload) {
		var optionsLabel = [];
		var optionsValue = [];
		var borderColors = [];
		var backgroundColors = [];


		var currQuestionID = data[0]['questionID'];
		var optionsCount = 1;

			//clear view before updating graphs
		$('.results-container .donut-chart-graph').html('');

		for(var i=0; i<data.length; i++) {
			randomColorDark=randomColor();
			randomColorLight=shadeColor(randomColorDark,.5);

			if(currQuestionID != data[i]['questionID']) {
				drawGraph(optionsLabel, optionsValue, optionsCount, data[i-1]['questionDesc'], data[i-1]['questionID'], reload);
				
				optionsLabel = [];
				optionsValue = [];
				borderColors = [];
				backgroundColors = [];

				currQuestionID = data[i]['questionID'];
				optionsCount++;

				optionsLabel.push(data[i]['optionDesc']);
				optionsValue.push(data[i]['numberVotes']);
				if(i > 11) {
					borderColors.push(randomColorDark);
					backgroundColors.push(randomColorLight);
				} else {
					borderColors.push(defaultBorderColors[i]);
					backgroundColors.push(defaultBackgroundColors[i]);
				}				
			} else {
				optionsLabel.push(data[i]['optionDesc']);
				optionsValue.push(data[i]['numberVotes']);
				if(i > 11) {
					borderColors.push(randomColorDark);
					backgroundColors.push(randomColorLight);
				} else {
					borderColors.push(defaultBorderColors[i]);
					backgroundColors.push(defaultBackgroundColors[i]);
				}
			}

				//make sure prints the last interation
			if(i+1 == data.length) {
				drawGraph(optionsLabel, optionsValue, optionsCount, data[i]['questionDesc'], data[i]['questionID'], reload);
			}			
		}				
	}

	function drawGraph(optionsLabel, optionsValue, optionsCount, questionDesc, questionID, reload) {
			//build pie chart
		htmlString = '';
		htmlString += '<div class="row custom-graph-row" question-id="' + questionID + '">';
		htmlString += '<div class="custom-graph-title">' + questionDesc + '</div>';
		htmlString += '<div class="custom-graph-item custom-pie-graph-item-' + optionsCount + ' col-xs-12 col-md-6">';
		htmlString += '<canvas id="custom-pie-graph-' + optionsCount + '" class="ct-chart custom-pie-chart" height="100" width="100"></canvas>';
		htmlString += '</div>';
		htmlString += '<div class="custom-graph-item-legend custom-legend-' + optionsCount + ' col-xs-12 col-md-4"><h3>Poll Labels</h3></div>';
		htmlString += '</div>';

		$('.results-container .donut-chart-graph').append(htmlString);

		var ctx = document.getElementById("custom-pie-graph-" + optionsCount).getContext("2d");

		var chartOptions;

			//create set of different options depending if its a graph reload or not
			//if its a graph reload, animation is turned off
		if(reload) {			
			chartOptions =  {
		        responsive: true,
		        animation: false,
	        	tooltips: {
	        		titleFontSize:20,
	        		bodyFontSize:20,
		            callbacks: {
		                label: function(tooltipItem, data) {
		                    var allData = data.datasets[tooltipItem.datasetIndex].data;
		                    var tooltipLabel = data.labels[tooltipItem.index];
		                    var tooltipData = allData[tooltipItem.index];
		                    var total = 0;
		                    for (var i in allData) {
		                        total += allData[i];
		                    }
		                    var tooltipPercentage = Math.round((tooltipData / total) * 100);
		                    return tooltipLabel + ': ' + tooltipData + ' (' + tooltipPercentage + '%)';
		                }
		            }
		        }
		    };
		 } else {
			chartOptions =  {
		        responsive: true,
	        	tooltips: {
	        		titleFontSize:20,
	        		bodyFontSize:20,
		            callbacks: {
		                label: function(tooltipItem, data) {
		                    var allData = data.datasets[tooltipItem.datasetIndex].data;
		                    var tooltipLabel = data.labels[tooltipItem.index];
		                    var tooltipData = allData[tooltipItem.index];
		                    var total = 0;
		                    for (var i in allData) {
		                        total += allData[i];
		                    }
		                    var tooltipPercentage = Math.round((tooltipData / total) * 100);
		                    return tooltipLabel + ': ' + tooltipData + ' (' + tooltipPercentage + '%)';
		                }
		            }
		        }
		    };
		 }


		var myChart = new Chart(ctx, {
		    type: 'doughnut',
		    data: {
		        labels: optionsLabel,
		        datasets: [{
		            label: '# of Votes',
		            data: optionsValue,
		            backgroundColor: defaultBackgroundColors,
		            borderColor: defaultBorderColors,
		            borderWidth: 1
		        }]
		    },
		    legend: {
		    	display:false //uses another function to generate the legend
		    },
		    options: chartOptions,
		    animation:{
		    	duration:0,
		    	animateRotate:false,
		        animateScale:false
		    }
		});



		$('.results-container .custom-legend-' + optionsCount).append(myChart.generateLegend());


			//keeps the height of the container to prevent page jump
		var currHeight = parseInt($('.donut-chart-graph').height());
		/*var currHeight = 0;
		$('.custom-graph-row').each(function(){
			currHeight += parseInt($('.custom-graph-row').height());
		});*/

		$('.donut-chart-graph').css('cssText', 'min-height:' + currHeight + 'px;');
		$('.results-container').css('cssText', 'min-height:' + currHeight + 'px;');
	}

	function shadeColor(color, percent) {   
		var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
		return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
	}
	
	function componentToHex(c) {
		var hex = c.toString(16);
		return hex.length == 1 ? "0" + hex : hex;
	}
		
	function randomColor(){
		r = Math.floor(Math.random() * (100))+100;
		g = Math.floor(Math.random() * (100))+100;
		b = Math.floor(Math.random() * (100))+100;
		return('#'+componentToHex(r)+''+componentToHex(g)+''+componentToHex(b)+'');
	}
});