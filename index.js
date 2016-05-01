// Request API access: http://www.yelp.com/developers/getting_started/api_access
//var Yelp = require('yelp');
var Firebase = require("firebase");
var HTTPRequest = require('request');

//var coordinates;

var URLBuilder;
var PlaceDetailsBuilder;

var myFirebaseRef = new Firebase("httos://project-backpack.firebaseio.com/");
var placeID;
var obj; //temporary variable
//var request = "cll=47.6062,122.3321";

myFirebaseRef.on('child_changed', function(snapshot) {
  if (snapshot.key() == 'placeId') {
    placeID = snapshot.val();
    console.log(placeID);
    //request = "cll="+cll;
    URLBuilder = 'https://maps.googleapis.com/maps/api/place/details/json?placeid='+placeID+'&key=AIzaSyAhaD4HwgofkA2_9Z7fLbGB1V8Shi-S7do';

    HTTPRequest(URLBuilder, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        //console.log(body);
          obj = JSON.parse(body);
          console.log('===================================');
          console.log('Rating num1:');
          console.log(obj.result.reviews[0].aspects.rating);
          console.log('Review num1:');
          console.log(obj.result.reviews[0].text);
          console.log('Rating num2:');
          console.log(obj.result.reviews[1].aspects.rating);
          console.log('Review num2:');
          console.log(obj.result.reviews[1].text);
          console.log('Rating num3:');
          console.log(obj.result.reviews[2].aspects.rating);
          console.log('Review num3:');
          console.log(obj.result.reviews[2].text);
      }
    });
  }
});

/*myFirebaseRef.child("placeId").on("value", function(snapshot) {
  placeID = snapshot.val();
  console.log(placeID);
  //request = "cll="+cll;
  URLBuilder = 'https://maps.googleapis.com/maps/api/place/details/json?placeid='+placeID+'&key=AIzaSyAhaD4HwgofkA2_9Z7fLbGB1V8Shi-S7do';

  HTTPRequest(URLBuilder, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body);
    }
  });
});*/


/*HTTPRequest(URLBuilder, function(error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log(body);

  }
});*/

//ChIJVTPokywQkFQRmtVEaUZlJRA


/*var yelp = new Yelp({
  consumer_key: 'dGCmncBodA3oDwkDMka31w',
  consumer_secret: 'rMm1xW5e0Gs5r3Sr8RCiyMASMMI',
  token: 'oViQMlAguc39FDdWYdo7PNwA7PK5OCTS',
  token_secret: 'S2Sxl4MWJqnOXL-f7fwv6NKewBs',
});

// See http://www.yelp.com/developers/documentation/v2/search_api
yelp.search({ term: 'food', location: "Seattle"})
.then(function (data) {
  //obj = JSON.parse(data);
  //console.log(data);
  console.log(request);
})
.catch(function (err) {
  console.error(err);
});*/




