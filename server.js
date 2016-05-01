const Firebase = require("firebase");
const fs = require('fs');
const LineByLineReader = require('line-by-line');
const restify = require('restify');
const skype = require('skype-sdk');
const HashMap = require('hashmap');
const builder = require('botbuilder');
const GoogleMapsAPI = require('googlemaps');
var blockspring = require("blockspring");
var request = require("request");
var imgur = require('imgur-node-api');
var imgur1 = require('imgur');
const path = require('path');
const connector = require('botconnector');
const msRest = require('ms-rest');
var oxford = require('project-oxford');
var client = new oxford.Client('82c85e1cde384aa598c4eb9910045b1c');

var ref = new Firebase("https://project-backpack.firebaseio.com");
var startNavi = false;
var picLink = "";
var needLocation = false;


//recommendation code
var HTTPRequest = require('request');
var HTTPRequest2 = require('request');
var latlng;
var obj; //temporary variable
var obj2;

var URLBuilder;
var URLBuilder2;

var i;
var tempPlaceID;
var maxRating = 0;
var savedMax = 0;

var topLat=0;
var topLong=0;
var topBen = "";


process.env.APP_ID = '2f803c4a-fb46-44ef-b974-742752bf9f3f';
process.env.APP_SECRET = 'vVi5ZGMUOn6NvJAGXr1DT9s';

var publicConfig = {
  key: 'AIzaSyDatgOjWYvmc0sUTxS1V1kuG0fzOUkAho4',
  stagger_time:       1000, // for elevationPath
  encode_polylines:   false,
  secure:             true, // use https
  proxy:              '' // optional, set a proxy for HTTP requests
};

var gmAPI = new GoogleMapsAPI(publicConfig);

imgur.setClientID('31fdaa6d92294ea');
imgur1.setClientId('31fdaa6d92294ea');
/*
imgur.getCredits(function (err, res) {
  console.log(res.data);
});
*/

//var userID = { channelId: 'skype', address: '8:eagle2417' };
var userID = "";
var userName="";
var currNum = 0; 
var directions = "";

var placeName = "";
var notes = "";
var rate = 0;
var state = "";




const botService = new skype.BotService({
    messaging: {
        botId: '28:340042c3-9165-4b28-b4f1-2a051c7cccc6',
        serverUrl : "https://apis.skype.com ",
        requestTimeout : 15000,
        appId: process.env.APP_ID,
        appSecret: process.env.APP_SECRET
    }
});

var model = 'https://api.projectoxford.ai/luis/v1/application?id=8a5d0cec-688c-4255-bc81-115ce7afca9b&subscription-key=f6f9069274c843aba8f5368bab5a74a5';
var dialog = new builder.LuisDialog(model);

// Create bot and add dialogs
var bot = new builder.SkypeBot(botService);

bot.add('/', dialog);

ref.update({
	"Intent": "None",
	"Lights": 4,
	"speaker": -1,
	"getPicture": 0,
	"coord" : "0,0"

});

dialog.on('Greeting', 
    function(session, intents){
        //console.log(JSON.stringify(intents));
        //console.log("UserID: " + session.message.from.address);

        if (!session.userData.name ){
        	userID = session.message.from;
        	session.replaceDialog('/profile');
        	//console.log(userID);

        	/*
        	setInterval(function(){
				var address = {
						to: userID,

				};

				bot.beginDialog(address, '/sendNotification');
			}, 1000 * 60 * 60 * 6);  
        	*/
        }
        else{
        	ref.update({
		    	"speaker": 0

			});
        	session.endDialog('Hi %s! :)', userName);

        	setTimeout(function(){
        		ref.update({
		    	"getPicture": 1

				});
        	}, 3000);
        	

        	

        }
        
    }
);

dialog.on('NextNavigation', 
	function(session){
		if (userID != ""){
			if (startNavi){
				session.replaceDialog('/nextStep');
			}
			else{
				session.endDialog("Your navigation is not started");
			}
		}
		
		
	}
);

dialog.on('DoneNavigation', 
	function(session){
		if (userID != ""){
			if (startNavi){
				currNum = 0; 
				directions = "";
				startNavi = false;
				session.endDialog("Enjoy! Catch you later! :)");
			}
			else{
				session.endDialog("Your navigation is not started");
			}
		}
		
	}
);

dialog.on('None', 
	function(session){
		if (state == "rate"){
			notes = session.message.text;
			
			session.send("Hmmm... That's interesting.");
			session.replaceDialog('/reviews');
			
		}

		
		
	}
);

dialog.on('AnswerYes', 
	function(session){
		if (state == "recommend"){
			state = "";
			
			session.send('Sweet! :)');
			session.send("Let's go!");
			session.replaceDialog('/navigation');

		}
		else{
			session.endDialog();
		}
		
	}
);

dialog.on("AnswerNo", 
	function(session){
		if (state == "recommend"){

			state = "";
			session.send("That's fine. :(" );
			session.endDialog("See you later!");
		}
		else{
			session.endDialog();
		}
		
	}
);



bot.add('/gotPicture', 
	function (session){
		ref.once("value", function(data){

			picLink = data.val().link;
			//console.log(picLink);
			//session.send(picLink);
			session.send(picLink);
			session.send('I am analyzing your surroundings. Give me a moment. :p');
			ref.update({
	    		"speaker": 1,
	    		"Lights": 1

			});
			
			blockspring.runParsed("reverse-image-search", { "image_url":  image}, { api_key: "br_31307_8061ee105ea7606454f51725423229557fd97d80"}, function(res) {

	      //console.log(res.params.best_search);
	      var search = res.params.best_search.replace(" ","%20");
	      request('https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + search + '&key=AIzaSyDw48K6CLCSPrmWECi9o0YNE6uPAvM-bP0', function (error, response, body) {
              if (!error && response.statusCode == 200) {
                //console.log(body) // Show the HTML for the Google homepage. 
                var json = JSON.parse(body);
                var firstPlace = (json.results);
                ref.child("coord").set(firstPlace[0].geometry.location.lat +',' +firstPlace[0].geometry.location.lng);
                //myRootRef.child("placeId").set(firstPlace[0].place_id)

                //console.log(firstPlace[0].place_id);
                session.send("Here is what I see. You are at %s! :)", firstPlace[0].name);
                ref.update({
	    			"speaker": 2,
	    			"Lights": 2



				});
                //console.log("First Place: " + JSON.stringify(firstPlace));
                //session.send("You are at %s!", firstPlace[0].name);
                placeID = firstPlace[0].place_id;
                //request = "cll="+cll;
                URLBuilder = 'https://maps.googleapis.com/maps/api/place/details/json?placeid='+placeID+'&key=AIzaSyDw48K6CLCSPrmWECi9o0YNE6uPAvM-bP0';

                request(URLBuilder, function(error, response, body) {
                  if (!error && response.statusCode == 200) {
                    //console.log(body);
                      obj = JSON.parse(body);

                      var postRef = ref.child("Reviews");

						postRef.once("value", function(data1){
							//console.log(JSON.stringify(data.val() ));
							
							var array;

							console.log(firstPlace[0].name);
							if (firstPlace[0].name == "Los Angeles County Museum of Art"){
								
								array = data1.val().LACMA;
								placeName = "LACMA";
							}
							else if (firstPlace[0].name == "Los Angeles Memorial Coliseum"){
								placeName = "Coliseum";	
								array = data1.val().Coliseum;
							}
							else if (firstPlace[0].name == "TCL Chinese Theatre"){
								placeName = "TCL";
								array = data1.val().TCL;
							}
							else if (firstPlace[0].name == "The Beverly Hills Hotel"){
								placeName = "BHH";
								array = data1.val().BHH;
							}
							
							//console.log(obj.result.reviews[0]);
							session.send("Here are some google reviews:");
							if (obj.result.reviews[0].text.length > 200){
								session.send("1. Rate: " + obj.result.reviews[0].aspects[0].rating + "\n" + obj.result.reviews[0].text.substring(0, 200) + "...");
							}
							else{
								session.send("1. Rate: " + obj.result.reviews[0].aspects[0].rating + "\n" + obj.result.reviews[0].text);
							}

							if (obj.result.reviews[1].text.length > 200){
								session.send("2. Rate: " + obj.result.reviews[1].aspects[0].rating + "\n" + obj.result.reviews[1].text.substring(0, 200) + "...");
							}
							else{
								session.send("2. Rate: " + obj.result.reviews[1].aspects[0].rating + "\n" + obj.result.reviews[1].text);
							}

							
							var arr = [];
							

							for(var x in array){
						  		arr.push(x);
						  		
							}
							session.send("Here are some crowd sourced reviews:");
							var count = 1;
							for (var i = arr.length - 1; i > arr.length - 3; i--){
								//console.log(array[ arr[i] ] );
								session.send(count + ". Rate: " + array[ arr[i] ].rate  + "\n" + array[ arr[i] ].note );
								count += 1;
							}
							
							
							setTimeout(function(){
								//session.endDialog();
								//session.beginDialog('/reviews');
								ref.update({
						    	"Lights": 3

								});
								session.replaceDialog('/askingReview');
							}, 18000);	
							


							//session.replaceDialog('/crap');

						});


                      
                  }
                });
              }
           });

    });
		
			
		});
	}
);

bot.add('/profile', 
	[
	    function (session) {
	    	ref.update({
	    	"speaker": 0
	    	

			});
	        builder.Prompts.text(session, 'Hi! What should I call you?');
	    },
	    function (session, results){
	    	//childName = results.response;
	    	userName = results.response;
	    	session.userData.name = results.response;
	    	session.endDialog('Nice to meet you, %s. I am BackpackBot.', userName);

	    	ref.update({
		    	"getPicture": 1

			});
	        //session.replaceDialog('/gotPicture');
	    }
	]

);

bot.add('/navigation', 
	    function (session) {
	        //console.log(results.response);
	        	console.log("Where are you?");
	        	session.send("Starting your navigation. \nSay next to proceed with next direction.\nSay done whenever you found %s", childName);
	        	startNavi = true;
	        	ref.once("value", function(data) {
	        		var curr = data.val().coord;
					var dest  = topLat + "," + topLong;

	        		var params = getDire(curr , dest);
	        		gmAPI.directions(params, function(err, result){

						directions = result.routes[0].legs[0].steps; 
		
						iterateSteps(currNum, directions.length, directions, session);
						session.endDialog();
					});

	        	});

	    }	
);

bot.add('/nextStep', 
	function (session){
		//console.log("Moves: " + moves);
		
		iterateSteps(currNum, directions.length, directions, session);
		session.endDialog();
		
	}
);
/*
bot.add('/sendNotification', 
	function (session){
		//console.log("Moves: " + moves);
		session.send("Sorry to bother you but...")
		session.send("Don't forget about your child!");
		session.endDialog();
		
	}
);
*/
bot.add('/Greeting', 
    function(session){
        //console.log(JSON.stringify(intents));
        //console.log("UserID: " + session.message.from.address);

        
    	//session.endDialog('Hi %s! :)', userName);

    	ref.update({
	    	"getPicture": 1,
	    	

		});
        
    }
);

bot.add('/askingReview', function(session){
	state = "rate";
	session.endDialog("What did you think, " + userName + "?");
});

bot.add('/reviews', 
	[
	    function (session){
	    	builder.Prompts.text(session, "How would you rate it on a scale from 1 to 5?");
	    	
	    }, function (session, results){
	    	//console.log(rate);
	    	if (results.response){
	    		rate = results.response;
	    		//state = "";

	    		var reviews; 
	    	if (placeName == "BHH"){
	    		reviews = ref.child("Reviews").child("BHH");
	    	}
	    	else if (placeName == "Coliseum"){
	    		reviews = ref.child("Reviews").child("Coliseum");
	    	}
	    	else if (placeName == "LACMA"){
	    		reviews = ref.child("Reviews").child("LACMA");
	    	}
	    	else if (placeName == "TCL"){
	    		reviews = ref.child("Reviews").child("TCL");
	    	}

    		reviews.push({
		    	note: notes,
		    	rate: rate
	  		});

		  	notes = "";
		  	rate = "";
		  	placeName = "";
    	
	    	ref.update({
	    		"speaker": 3,
	    		"Lights": 5

			});

			setTimeout(function(){
				ref.update({
	    		
	    		"Lights": 4

				});
			}, 5000);

		  	//session.endDialog("Wake me up if you need anything more! :)");
			
			if (topBen == ""){ //empty
				state = "";
				session.endDialog("Wake me up if you need me! :)");
			}
			else{
				session.send("Oh, btw I found this cool place nearby.");
				session.send("It's called: " + topBen);
				state = "recommend";
				session.replaceDialog('/recommend');
			}
			
	    	}
	    	
	    }
	
	]

);

bot.add('/recommend', 
	
		function(session){
			session.endDialog( "Would you like to check it out?");
			
		}
	
);


//Firebase
ref.on("child_changed", function(data){

	if ( data.key() == "Intent"){
		
		var address = {
			to: userID,

		};

		switch(data.val() ){
			case "Greeting":
				bot.beginDialog(address, '/Greeting');
				break;
		}

		ref.update({
	    	"Intent": ""

		});
		
	}

	else if (data.key() == "link") {
     image = data.val();
     var address = {
			to: userID,

	 };
	 bot.beginDialog(address, '/gotPicture');
     
  	}

  	else if (data.key() == "coord"){
  		latlng = data.val();
	  //console.log(latlng);
	  URLBuilder = 'https://maps.googleapis.com/maps/api/place/radarsearch/json?location='+latlng+'&radius=1609&type=cafe&key=AIzaSyAhaD4HwgofkA2_9Z7fLbGB1V8Shi-S7do';
	  //console.log(URLBuilder);

	  HTTPRequest(URLBuilder, function(error, response, body) {
	    if (!error && response.statusCode == 200) {
	      //console.log(body);
	      obj= JSON.parse(body);
	      for (i = 0; i<3; i++) {
	        tempPlaceID = obj.results[i].place_id; //store temporary place ID
	        URLBuilder2 = 'https://maps.googleapis.com/maps/api/place/details/json?placeid='+tempPlaceID+'&key=AIzaSyAhaD4HwgofkA2_9Z7fLbGB1V8Shi-S7do'
	        HTTPRequest2(URLBuilder2, function(error, response, body2) {
	          if (!error && response.statusCode==200) {
	            obj2 = JSON.parse(body2);
	            //console.log(body2.result.name);
	            //console.log("Result: " + obj2.result.name);

	            //console.log(obj2);
	            //console.log("Reviews: " + obj2.result.reviews[0].aspects[0].rating);
	            if (obj2.result.reviews[0].aspects[0].rating>maxRating){
	              savedMax = i;
	              topBen = obj2.result.name;
	            }
	          }
	        });

	        //console.log(savedMax);
	        topLat=obj.results[savedMax].geometry.location.lat;
	        topLong=obj.results[savedMax].geometry.location.lng;
        
	      }
	    }

	  });
  	}
  	
});


function iterateSteps(current, end, moves, session){
	if (current == end){
		session.endDialog("You arrived at your destination. End of navigation. Good luck finding %s!", childName);
		directions = "";
		currNum = 0; 
		return;
	}

	var step = moves[current];
    var sLoc = step.start_location.lat + ',' + step.start_location.lng; 
    var eLoc = step.end_location.lat + ',' + step.end_location.lng;
    var params = getMap(sLoc, eLoc);
  
    imgur.upload( gmAPI.staticMap(params) , function (err,res) {
	  	
	  	var str = step.html_instructions;
    	var result = str.replace(/<\/?[^>]+(>|$)/g, "");
    	session.send(res.data.link);
		session.send(current +  ". Green: Start Point\nRed: End Point\n" + 
			"Note:" + result + "\n" + 
			"Distance: " + step.distance.value + " m"
		);
		
		//current = current + 1;
		currNum = currNum + 1;
		//session.beginDialog('/nextStep');
		//iterateSteps(current, end, moves, session);
		
		
	});
}

function getDire(parent, child){
	var params = {
		origin: parent, 
		destination: child, 
		mode: 'walking',
		language: 'en'
	};
	return params;
}


function getDist(parent, child){
	var params = {
		origins: parent,
		destinations: child, 
		mode: 'walking',
		language: 'en'
	};

	return params;
}

function getDistance(start, end){

	var params = getDist(start,end);
	var dist;
	var time;

	gmAPI.distance(params, function(err, result){
								
								
		//console.log(  (result.rows[0]).elements[0].distance.text  );
		dist = (result.rows[0]).elements[0].distance.text;
		time = (result.rows[0]).elements[0].duration.text;
		return dist;
		
	});

	
}



function getMap( parent, child){
	var array = parent.split(",");
	var lat1 = parseFloat(array[0]);
	var lon1 = parseFloat(array[1]);

	array = child.split(",");
	var lat2 = parseFloat(array[0]);
	var lon2 = parseFloat(array[1]);

	var d = parseInt( distance(lat1, lon1, lat2, lon2) * 1000 );

	var zoomLevel;
	if (d > 200){
		zoomLevel = 15;
	}
	else{
		zoomLevel = 19;
	}
	//console.log(d * 1000);
	

	var params = {
			  //center: parent,
			  //zoom: zoomLevel,
			  size: '700x600',
			  format: 'jpg',
			  maptype: 'roadmap',
			  markers: [
			    {
			      //location: '3025 Royal St Los Angeles, CA',
			      location: parent,
			      label   : 'A',
			      color   : 'green',
			      shadow  : true
			    }, 
			    {
			    	location: child,
				    label   : 'B',
				    color   : 'red',
				    shadow  : true
			    }
			  ],
			  style: [
			    {
			      feature: 'road',
			      element: 'all',
			      rules: {
			        hue: '0x00ff00'
			      }
			    }
			  ]
			  
			  ,path: [
			    {
			      color: 'blue',
			      weight: '5',
			      points: [
			        parent,
			        child
			      ]
			    }
			  ]
			
	};
	//console.log(gmAPI.staticMap(params) ); // return static map URL
	return params;
}

function distance(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = (lat2 - lat1) * Math.PI / 180;  // deg2rad below
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a = 
     0.5 - Math.cos(dLat)/2 + 
     Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
     (1 - Math.cos(dLon))/2;

  return R * 2 * Math.asin(Math.sqrt(a));
}

function checkEmpty(obj) {
  return !Object.keys(obj).length;
};




const server = restify.createServer();
server.use(restify.authorizationParser());
server.use(restify.bodyParser());

server.post('/v1/chat',skype.messagingHandler(botService));


const port = process.env.PORT || 8080;
server.listen(port);
console.log('Listening for incoming requests on port ' + port); 


