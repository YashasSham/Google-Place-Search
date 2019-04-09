/*
*Created on: 04/01/2019
*
*@author: Yashas J Shamaraju
*/

var markers = [];
var infowindows = [];
var previous = 0;
var latitude = 35.37;
var longitude = -119.01;
var wordsToNumbers = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'for': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8,  'nine': 9, 'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20
};

/**
 * Summary: This function is called on loading the HTML.
 *
 * Description: contains 2 sub functions
 * 	(1). searchBoxListener - listens to the searchBox
 *	(2). speechToText - speech To Text conversion
 * 
 *	@param {type} NONE.
 * @return {type} NONE.
 */
function initAutocomplete() {
    var map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: latitude, lng: longitude},
    zoom: 12,
    mapTypeId: 'roadmap'
    });
	
	
	// Create the search box and link it to the textbox.
    var input = document.getElementById('pac-input');
    var searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    // restrict SearchBox results within map's viewport.
    map.addListener('bounds_changed', function() {
		searchBox.setBounds(map.getBounds());
    });
	
	GeoCodes = geoCodes(map);
	console.log(GeoCodes[0], GeoCodes[1]);

    // Listen for the event fired when the user selects a prediction and retrieve
    searchBox.addListener('places_changed', searchBoxListener);
	
	/**
	* Function to that returns the places from the search box.
	* 
	*/
	function searchBoxListener() {
		var places = searchBox.getPlaces();
		previous = 0;
	
		console.log(places);
		if (places.length == 0) {
			return;
		}
		//clear old list elements
		while (document.getElementById('list').firstChild) {
			document.getElementById('list').removeChild(document.getElementById('list').firstChild);
		}
		// Clear out the old markers.
		var count = 0;
		markers.forEach(function(marker) {
			marker.setMap(null);
		});
		markers = [];
		//clear out all infoWindows
		infowindows.forEach(function(infowindow) {
			infowindow.setMap(null);
		});
		infowindows = [];


		// For each place, get the required fields and put it in DOM.
		var bounds = new google.maps.LatLngBounds();
		places.forEach(function(place) {
		if (!place.geometry) {
			console.log("Returned place contains no geometry");
			return;
		}
			
		// Create a marker for each place.
		var marker = new google.maps.Marker({
			map: map,
			title: place.name,
			animation: google.maps.Animation.DROP,
			position: place.geometry.location
		});
		markers.push(marker);

		//Photos of the place. I am choosing the first image available for a place.
		var photos = place.photos;
		if (!photos) {
			pic_url = "https://www.nal.res.in/templates/default/newtheme/assets/img/no_imge.png";
		}else{
			pic_url = photos[0].getUrl({maxWidth: 250, maxHeight: 250});
			console.log(photos[0].getUrl());
		}
		//Contenet string of the InfoWindow
		var contentString = '<div><b>' + place.name + '</b></div><div id="content">'+ '<img src=' + pic_url + '>' + '</div>';
	
		/*****FOR DEBUGGING**
		*
		*console.log(contentString);
		*/
	
		//create infowindow for each place
		var infowindow = new google.maps.InfoWindow({
			maxWidth: 275,
			maxHeight: 275,
			content: contentString
		});
		infowindows.push(infowindow);
		
		if (place.geometry.viewport) {
			// Only geocodes have viewport.
			bounds.union(place.geometry.viewport);
		} else {
			bounds.extend(place.geometry.location);
		}
	
		// Elements of the list to be added to the DOM
		var li = document.createElement('li');
		var h3 = document.createElement('h3');
		var h4_rate = document.createElement('h4');
		var cost_element = document.createElement('small');
		var Address = document.createElement('p');
		Address.setAttribute('id', 'Address');
		Address.innerHTML = 'Address: ' + place.formatted_address;
		var isOpen = document.createElement('div')
		h3.innerHTML = (count+1).toString(10) + ': ' +place.name;
		h4_rate.innerHTML = 'Rated: ' + place.rating;
		cost_element.innerHTML = '</br>Price: ' + priceLevel(place.price_level);
		h3.appendChild(h4_rate);
		h3.appendChild(cost_element);
		if(place.opening_hours === undefined){
			isOpen.innerHTML = 'Open Now? : No Clue;)';
		}else{
			console.log(place.opening_hours);
			isOpen.innerHTML = 'Open Now? : ' + place.opening_hours.open_now;
		}
		isOpen.setAttribute('id', 'time_toogle');
		isOpen.style.display = "none"
		li.appendChild(h3);
		li.appendChild(Address);
		li.appendChild(isOpen);
		li.setAttribute('id', count.toString(10));
		count = count + 1;
	
		document.getElementById('list').appendChild(li);
	
		//Request to get Places Details to get Contact Details
		var request = {
			placeId: place.place_id,
			fields: ['name', 'url', 'formatted_phone_number', 'opening_hours','formatted_address']
		};

		service = new google.maps.places.PlacesService(map);
		service.getDetails(request, callback);
		function callback(place, status) {
			var contactDetails = document.createElement('p');
			if (status == google.maps.places.PlacesServiceStatus.OK) {		
				contactDetails.innerHTML = '</br>Phone: ' + place.formatted_phone_number;
			}else{
				contactDetails.innerHTML = '</br>Phone: Not Available';
				console.log(status);
			}
			Address.appendChild(contactDetails);
		}
			
		//listens to the markers- if u click it u select an list element/////////
		google.maps.event.addListener(marker, "click", function() {
			var event = new CustomEvent("click", { "detail": "trigger this list element" });
			li.dispatchEvent(event);
			});
		});
	
		///adds listeners to each list elements and listens to them.
		listClicked(markers, infowindows);
		map.fitBounds(bounds);
    }
	
	var voiceInput = speechToText();
	
	/**
	* Function to that turns speech into commands- ONLY 5 COMMANDS FOR NOW.
	* (1)Search "something" : Enters this 'something' in the search box. NOTE: you still have to press enter.
	* (2)Number "any number" : Selects the 'any number'th element on the list of returned value.
	* (3)Next : Go to the next Element
	* (4)Please reload: Reloads the page. Please is a must.
	* (5)Please close: closes the page. Please is a must.
	*/
	function speechToText(){
		window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
		let finalTranscript = '';
		let recognition = new window.SpeechRecognition();
		recognition.interimResults = true;
		recognition.maxAlternatives = 10;
		recognition.continuous = true;
		recognition.onresult = (event) => {
		let interimTranscript = '';
		for (let i = event.resultIndex, len = event.results.length; i < len; i++) {
			let transcript = event.results[i][0].transcript;
			if (event.results[i].isFinal) {
				finalTranscript += transcript;
			} else {
				interimTranscript += transcript;
			}
		}
		if(finalTranscript !== ''){
			if(finalTranscript.charAt(0) === ' '){
				finalTranscript = finalTranscript.substr(1);
			}
			var command = finalTranscript.split(' ');
			var result = "";
			console.log(finalTranscript);
			switch(command[0].toLowerCase()) {
				case 'search':
					var value = '';
					for(var i = 1; i < command.length; i++){
						value += command[i] + ' ';
					}
					document.getElementById("pac-input").value = value;
					//google.maps.event.trigger(searchBox, 'places_changed');
					finalTranscript = '';
				break;
				case 'please':
					if(command[1] === 'close'){
						finalTranscript = '';
						close();
					}else if(command[1] === 'reload'){
						finalTranscript = '';
						document.location.reload(true);
					}
				break;
				case 'number':
					var number = wordsToNumbers[command[1]];
					if(number > 0){
						google.maps.event.trigger( markers[number-1], 'click' );
					}else{
						if(parseInt(command[1])>0){
							console.log(command[1]);
						google.maps.event.trigger( markers[parseInt(command[1]-1)], 'click' );
						}
					}
					finalTranscript = '';					
				break;
				case 'next':
					if(previous + 1 < markers.length){
						google.maps.event.trigger( markers[previous + 1], 'click' );
					}else{
						google.maps.event.trigger( markers[0], 'click' );
					}		
					finalTranscript = '';					
				break;
				default:
					console.log(finalTranscript);
					finalTranscript = "";
			}
		}
    }
    recognition.start();
	}
	
}

//////Auxilary Functions to the main initAutocomplete method/////////

/**
 * Summary: List element Clicked- does things related to clicking.
 *
 * Description: contains 2 sub functions
 * 	(1). eventScript - call back function for the event - clickinig a list element.
 *	(2). toggle - changes the backgroundColor fo the list element selected.
 * 
 * @param {Object} map     The map being displayed.
 * @param {Object} infoWindows The array of infoWindows of all markers in the map.
 * 
 * @return {type} NONE.
 */
function listClicked(markers, infowindows){
	var li = document.getElementsByTagName("li");

	for(var i = 0;i<li.length;i++){
		li[i].addEventListener("click", eventScript);		
	}
	
	/**
	* Callback function for the event - clickinig a list element
	*/
	function eventScript(e){
		console.log(previous);
		var j = parseInt(e.currentTarget.attributes.id.value);
		toggle(j);
		
		//li.appendChild(openTimeElement);
		markers[j].setAnimation(google.maps.Animation.BOUNCE);
		previous = j;
	}	
	
/**
 * Changes the backgroundColor fo the list element selected
 * also erases previously clicked data: hence called toggle
 *
 * called by eventScript
 */
	function toggle(j){
		if(previous !== j){
			prev_parent_element = document.getElementById(previous.toString(10));
			prev_toggle_element = prev_parent_element.childNodes;
			prev_toggle_element[2].style.display = "none";
			markers[previous].setAnimation(null);
			infowindows[previous].close();
			prev_parent_element.style.backgroundColor = '#fff';
		}
		parent_element = document.getElementById(j.toString(10));
		toggle_element = parent_element.childNodes;
		if (toggle_element[2].style.display === "none") {
			toggle_element[2].style.display = "block";
			infowindows[j].open(map, markers[j]);
			parent_element.style.backgroundColor = '#eee';
			parent_element.scrollIntoView();
			//google.maps.event.trigger(markers[j], 'click');
		} else {
			toggle_element[2].style.display = "none";
			infowindows[j].close();
			parent_element.style.backgroundColor = '#fff';
		}
	}
}

/**
 * Summary: Gets the geo coordinates of the place where the device is in.
 *
 * @param {Object} map     The map being displayed.
 * 
 * @return {list} [lati, longi];.
 */
function geoCodes(map){
	var longi; 
	var lati;
	if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
        
		lati = position.coords.latitude;
        longi = position.coords.longitude;
		//map.setCenter(new google.maps.LatLng(lati, longi));
		var bounds = new google.maps.LatLngBounds();
		bounds.extend(new google.maps.LatLng(lati, longi));
		map.fitBounds(bounds);
		map.setZoom(12);
		var img = 'https://static.slickdealscdn.com/attachment/avatar/1/7/0/2/2/9/0/7/25x25/avatar.normal?dateline=1538480322';
		var marker = new google.maps.Marker({
			position: {lat: lati, lng: longi},
			map: map,
			title: 'My Location',
			icon: img
			});
		
		console.log(map.getBounds);
			
        }, function() {
			return [lati, longi];
          });
		return [lati, longi];
    } else {
        // Browser doesn't support Geolocation
		return [lati, longi];
    }
}
/**
 * Summary: converts numerical price level to nice dollar signs- not at all important functionallay.
 *
 * @param {Integer} price_level     The number represting price.{0: free to 5: very expensive}
 * 
 * @return {String} Price$			values can be{N/A, $, $$, $$$, $$$$, $$$$$}
 */
function priceLevel(price_level){
		var price$;
		switch(price_level) {
		case 0:
			price$ = "Free";
			break;
		case 1:
			price$ = "$";
			break;
		case 2:
			price$ = "$$";
			break;
		case 3:
			price$ = "$$$";
			break;
		case 4:
			price$ = "$$$$";
			break;
		case 5:
			price$ = "$$$$$";
			break;
		default:
			price$ = "N/A";
	}
	return price$;
}

