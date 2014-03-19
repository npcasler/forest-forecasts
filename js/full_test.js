/**
 *   Global variables.
 */
var pageHeight = $(window).height();
var pageWidth = $(window).width();
var navigationHeight = $("#navigation").outerHeight();

/**
 *   ON RESIZE, check again
 */
$(window).resize(function () {
    pageWidth = $(window).width();
    pageHeight = $(window).height();
});
//Declare variables
var ge; //GEPlugin
var folderCur; //Container for layers
var folder20;
var folder30;
var folder40;
var folder50;
var folder60;
var folder70;
var folder80;
var folder90;
var folderRef;
var activeFolder;
var networkLink;
var networkLink1;
var networkLink2;
var networkLink3;
var networkLink4;
var networkLink5;
var networkLink6;
var networkLink7;
var networkLink8;
var networkLinkRef;
var url;
//var screenOverlay;
var paths = [];
var mapIndex = 0;
var myTimer;
var geocoder = null; //GClientGeocoder

// Initialize google earth

google.load("earth", "1", {
    "other_params": "sensor={true_or_false}"
});
google.load("maps", "3.6", {
    other_params: 'sensor=false'
}); //or true

//Main function
function init() {
    //Create the google earth instance
    google.earth.createInstance('map3d', initCB, failureCB);

    //declare buttons
    $('#time').button();
    $('#switch').button();
    $('#change').button();
    $('#remove').button();
    $("#gcm").select2();
    $("#rcp").select2({
        placeholder: "rcp45"
    });
    $('#sidebar-iframe').hide();

    $('#page-welcome').height(pageHeight - navigationHeight)
        .offset({
            top: 50
        });

    //toggle function for the time button
    $('#time button').click(function () {
        //if the time value is 'current' call the current function
        //otherwise call future function
        $('#time button').addClass('active').not(this).removeClass('active');
        //$(this).val() == "current" ? current_int() : current_future();
        switchTime();
    });
	
	$('#rcp').on("change", function() { switchLayer();})
	$('#gcm').on("change", function() { switchLayer();})

    legend('growth.png');

    //Run through the checkboxes to find reference layers to display
    $('input.ref').click(function () {
        $('input.ref:checkbox').each(function () {
            var layer = $(this).val();
            this.checked ? setRefLayer(layer, true) : setRefLayer(layer, false);
        });
    });

    $('input.little').click(function () {
        this.checked ? setLittleMap(true) : setLittleMap(false);
    });

    $('input.test').click(function () {
        if (this.checked) {
            $('#time').hide();
            $('#period').show();
            $('#time-slider').show();
			switchLayer();
            //setTimeSlice(true);
        } else {
            $('#time-slider').hide();
            $('#period').hide();
            $('#time').show();
        } //setTimeSlice(false);
    });

    $("input[name=species]:radio").change(function () {
        switchLayer();
		if  ($('#little').is(':checked') == true) {
		changeLittleMap();
		} 
    });

    $("#cycleMaps").change(function () {
        if (this.checked) {
            myTimer = setInterval('cycleLayers()', 1000);
        } else {
            clearInterval(myTimer);
        }
    });

    //try jquery slider function... probably looks better than googles
    $(function () {
        $('#slider-container').slider({
            orientation: "horizontal",
            range: "min",
            min: 0,
            max: 100,
            value: 60,
            slide: function (event, ui) {
                $('#amount').val(ui.value + '%');

                activeFolder.setOpacity(ui.value / 100);



            }
        });
        $('#amount').val($('#slider-container').slider("value") + "%");

    });

    $(function () {
        $('#time-slider').slider({
            orientation: "horizontal",
            range: "min",
            min: 1,
            max: 9,
            value: 1,
            step: 1,
            slide: function (event, ui) {
                $('#period').val('20' + ui.value + '0');
				mapIndex = ui.value;
				switchTime();

                //setTimeSlice('20'+ ui.value +'0');

            }
        });
        $('#period').val('20' + $('#time-slider').slider("value") + '0');
    });




    //end init function
}

//call back function
function initCB(instance) {
    //initialize google earth instance
    ge = instance;
    geocoder = new window.google.maps.Geocoder(); //v3 Geocoder
    ge.getWindow().setVisibility(true);

    //add navigation control
    ge.getNavigationControl().setVisibility(ge.VISIBILITY_SHOW);
    ge.getNavigationControl().getScreenXY().setXUnits(ge.UNITS_INSET_PIXELS);
    ge.getNavigationControl().getScreenXY().setYUnits(ge.UNITS_INSET_PIXELS);


    //create a folder to hold the various features and opacity values
    folderCur = ge.createFolder('');
    folder20 = ge.createFolder('');
    folder30 = ge.createFolder('');
    folder40 = ge.createFolder('');
    folder50 = ge.createFolder('');
    folder60 = ge.createFolder('');
    folder70 = ge.createFolder('');
    folder80 = ge.createFolder('');
    folder90 = ge.createFolder('');
    folderRef = ge.createFolder('');

    networkLink = ge.createNetworkLink('');
    networkLink1 = ge.createNetworkLink('');
    networkLink2 = ge.createNetworkLink('');
    networkLink3 = ge.createNetworkLink('');
    networkLink4 = ge.createNetworkLink('');
    networkLink5 = ge.createNetworkLink('');
    networkLink6 = ge.createNetworkLink('');
    networkLink7 = ge.createNetworkLink('');
    networkLink8 = ge.createNetworkLink('');
    networkLinkRef = ge.createNetworkLink('');



    //check the positioning of this scalebar
    ge.getFeatures().appendChild(folderCur);
    ge.getFeatures().appendChild(folder20);
    ge.getFeatures().appendChild(folder30);
    ge.getFeatures().appendChild(folder40);
    ge.getFeatures().appendChild(folder50);
    ge.getFeatures().appendChild(folder60);
    ge.getFeatures().appendChild(folder70);
    ge.getFeatures().appendChild(folder80);
    ge.getFeatures().appendChild(folder90)
    ge.getFeatures().appendChild(folderRef);

    activeFolder = folderCur;
    folder20.setOpacity(0);
    folder30.setOpacity(0);
    folder40.setOpacity(0);
    folder50.setOpacity(0);
    folder60.setOpacity(0);
    folder70.setOpacity(0);
    folder80.setOpacity(0);
    folder90.setOpacity(0);
    folderRef.setOpacity(1);
    //add first layer and zoom to extent
    addKmlFromUrl('current/abies_lasiocarpa', true);
    addKmlFromUrl('maxent/' + $('#gcm').val() + '/' + $('#rcp').val() + '/2050/abies_lasiocarpa', false, 1);
    addKmlFromUrl('maxent/' + $('#gcm').val() + '/' + $('#rcp').val() + '/2070/abies_lasiocarpa', false, 2);




}

// callback function in case of failure
function failureCB(errorCode) {
    alert('There was an error loading the page: ' + errorCode);
}

function switchLayer() {

	if ($('#testNewMaps').is(':checked') == true) {
	
	    
	removeLayer();
	
	var modpath = 'maxent_test/' + $('#gcm').val() + '/' + $('#rcp').val() + '/';
	
	var years = ['2010/', '2020/', '2030/', '2040/', '2050/', '2060/', '2070/', '2080/', '2090/'];
	
	var urls = [];
	
	for (var i=0, tot=years.length; i < tot; i++) {
		urls.push(modpath + years[i] + $('input:radio[name=species]:checked').val());
		console.log(urls[i]);
		addKmlFromUrl(urls[i], false, i);
	}
	
	legend('growth.png');
	} else {
	
	
	currUrl = modpath + '2010/' + $('input:radio[name=species]:checked').val();
	


    var modpath = 'maxent/' + $('#gcm').val() + '/' + $('#rcp').val() + '/'; //+ $('#time > button.active').val() + '/';
    /*if ($('#time > button.active').val() == "current") {
				url = 'current/' + $('input:radio[name=species]:checked').val();
				mapIndex = 1;
			} else if ($('#time > button.active').val() == "2050"){
				url = modpath + $('input:radio[name=species]:checked').val();
				mapIndex = 2;
			} else  {
				url = modpath + $('input:radio[name=species]:checked').val();
				mapIndex = 0;
			}*/

    currUrl = 'current/' + $('input:radio[name=species]:checked').val();
    nextUrl = modpath + '2050/' + $('input:radio[name=species]:checked').val();
    lastUrl = modpath + '2070/' + $('input:radio[name=species]:checked').val();


    console.log(url);
    //console.log($("#time > button.active").val());
    //ge.getFeatures().removeChild(networkLink);
    removeLayer();
    //test folder to set opacity


    addKmlFromUrl(currUrl, false);
    addKmlFromUrl(nextUrl, false, 4);
    addKmlFromUrl(lastUrl, false, 6);
    //add legend
    legend('growth.png');
    //addOverlay('growth_leg1.png', 380, 760, 350, 35);
	}
}

function switchTime() {

	if ($('#testNewMaps').is(':checked') == true) {
	
	timeVar = mapIndex;
	
	var folders = [folderCur, folder20, folder30, folder40, folder50, folder60, folder70, folder80, folder90];
	
	activeFolder = folders[mapIndex - 1];
	
	for (var i=0, tot=folders.length; i < tot; i++) {
		if (i === mapIndex - 1) {
			activeFolder = folders[i];
		} else {
			folders[i].setOpacity(0);
		}
	}
	
	activeFolder.setOpacity($('#slider-container').slider('value') / 100);
	

		

} else {
    timeVar = $('#time > button.active').val();

    if (timeVar == 0) {
        activeFolder = folderCur;
        folder50.setOpacity(0);
        folder70.setOpacity(0);
        mapIndex = 0;
    } else if (timeVar == 1) {
        activeFolder = folder50;
        folderCur.setOpacity(0);
        folder70.setOpacity(0);
        mapIndex = 1;
    } else {
        activeFolder = folder70;
        folderCur.setOpacity(0);
        folder50.setOpacity(0);
        mapIndex = 2;
    }
    activeFolder.setOpacity($('#slider-container').slider('value') / 100);

}
}



//function to view change layer
function viewChange() {
    //set url for change layer
    removeLayer();
    
    url = 'maxent/' + $('#gcm').val() + '/' + $('#rcp').val() + '/' + $('input:radio[name=species]:checked').val();
    //clear current layer
    folderCur.getFeatures().removeChild(networkLink);
    //add change layer
    addKmlFromUrl(url, false);
    //add new scalebar
    legend('change.png');
}

//function to add kml superoverlays to google earth
function addKmlFromUrl(kmlUrl, flyVar, folderVar) {
    var link = ge.createLink('');
    link.setHref('http://scooby.iplantcollaborative.org/' + kmlUrl + '/doc.kml');


    /*if (folderVar > 0) {
				folderUrl = 'folder' + folderVar;
				folderUrl.getFeatures().appendChild(networkLink);
			} else {
				folderCur.getFeatures().appendChild(networkLink);
			}*/
    switch (folderVar) {
    case 1:
        networkLink1.setLink(link);
        networkLink1.setFlyToView(flyVar);
        folder20.getFeatures().appendChild(networkLink1);
        break;
    case 2:
        networkLink2.setLink(link);
        networkLink2.setFlyToView(flyVar);
        folder30.getFeatures().appendChild(networkLink2);
        break;
    case 3:
        networkLink3.setLink(link);
        networkLink3.setFlyToView(flyVar);
        folder40.getFeatures().appendChild(networkLink3);
        break;
	case 4:
	    networkLink4.setLink(link);
        networkLink4.setFlyToView(flyVar);
        folder50.getFeatures().appendChild(networkLink4);
        break;
	case 5:
	    networkLink5.setLink(link);
        networkLink5.setFlyToView(flyVar);
        folder60.getFeatures().appendChild(networkLink5);
        break;
	case 6:
        networkLink6.setLink(link);
        networkLink6.setFlyToView(flyVar);
        folder70.getFeatures().appendChild(networkLink6);
        break;
	case 7:
        networkLink7.setLink(link);
        networkLink7.setFlyToView(flyVar);
        folder80.getFeatures().appendChild(networkLink7);
        break;
	case 8:
        networkLink8.setLink(link);
        networkLink8.setFlyToView(flyVar);
        folder90.getFeatures().appendChild(networkLink8);
        break;
    case 99:
        //reserved for extraneous data(little maps and extinction maps)
        networkLinkRef.setLink(link);
        networkLinkRef.setFlyToView(flyVar);
        folderRef.getFeatures().appendChild(networkLinkRef);
        break;
    default:
        networkLink.setLink(link);
        networkLink.setFlyToView(flyVar);
        folderCur.getFeatures().appendChild(networkLink);
    }

}

//function to clear layers from google earth
function removeLayer() {
    //remove layer
    folderCur.getFeatures().removeChild(networkLink);
    folder20.getFeatures().removeChild(networkLink1);
    folder30.getFeatures().removeChild(networkLink2);
	folder40.getFeatures().removeChild(networkLink3);
    folder50.getFeatures().removeChild(networkLink4);
    folder60.getFeatures().removeChild(networkLink5);
    folder70.getFeatures().removeChild(networkLink6);
	folder80.getFeatures().removeChild(networkLink7);
    folder90.getFeatures().removeChild(networkLink8);
}

function setRefLayer(layerId, state) {
    //add reference layer from google earth
    ge.getLayerRoot().enableLayerById(ge[layerId], state);

}

//Function to loop through time series of species
function cycleLayers() {

	if ($('#testNewMaps').is(':checked') == true) {
	
	ts = $('#time-slider').slider();
	if (mapIndex == 9) {
		ts.slider('option','value', 1);
		ts.slider('option', 'slide').call(ts,null,{ handle: $('.ui-slider-handle', ts), value: 1});
		
	} else {
		$('#time-slider').slider('value', mapIndex + 1);
		ts.slider('option', 'slide').call(ts,null,{ handle: $('.ui-slider-handle', ts), value: mapIndex + 1});
	}
	
} else {
	
	

    if (mapIndex > 2) {
        mapIndex = 0;
    }

    var times = ["current", "2050", "2070"];
    //add next layer to map

    //activate appropriate button
    $("#time > button.active").removeClass('active');
    $("#" + times[mapIndex]).addClass('active');
    switchTime();
    mapIndex = mapIndex + 1;
}
};


var geocode = function (address) {
    geocoder.geocode({
        'address': address
    }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            //do something with the result such as flying in to it
            var point = results[0].geometry.location;
            var lookat = ge.createLookAt('');
            lookat.set(point.lat(), point.lng(), 100, ge.ALTITUDE_RELATIVE_TO_GROUND, 0, 0, 4000);
            ge.getView().setAbstractView(lookat);
        } else {
            alert("Geocode Error: " + status);
        }
    });
};


function submitLocation() {
    geocode(el('address').value);
    console.log(el('address').value);
}



// Resets the legend if the source url doesnt match with the existing img src
function legend(thisLegend) {
    var node = document.getElementById('legendDiv');
    var img = document.createElement("IMG");
    var src = "static/" + thisLegend;


    if ($("#legendDiv").children().length > 0) {
        if ($("#legendDiv").children('img').attr('src') !== src) {
            $("#legendDiv").children('img').attr('src', src);
        }
    } else {
        img.src = src;
        node.appendChild(img);
    }
}

function setLittleMap(checked) {
    if (checked == true) {
        addKmlFromUrl('shp/little/' + $('input:radio[name=species]:checked').val(), false, 99);
        console.log('shp/little/' + $('input:radio[name=species]:checked').val());
    } else {
        folderRef.getFeatures().removeChild(networkLinkRef);
    }
}

function changeLittleMap() {
	folderRef.getFeatures().removeChild(networkLinkRef);
	addKmlFromUrl('shp/little/' + $('input:radio[name=species]:checked').val(), false, 99);
}
	


function el(e) {
    return document.getElementById(e);
}

