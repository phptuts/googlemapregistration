(function($){
    
    'use strict';        
    
     $.googlemapmylocation = function(element, options) {
        //Default options
        var defaults = 
            {
                latitude_input_id       : '',//Field id for storing latitiude
                longitude_input_id      : '',//Field id for storing longitude
                location_id             : '',  //Field id for the location
                //Coordinates are for dallas, tx
                default_longitude       : '-96.769923',//Default longitude if user decides not to allow geo locations for browser
                default_latitude        : '32.802955',//Default latitude if user decides not to allow geo locations for browser
                zoom                    : 12,//Default zoom for the google maps
                noLocationFound         : 'no_location_found',//Token you can enter for when no zipcode is found
                afterInitialized        : function(){}//Function ran once
             };

        var plugin = this;
        
        plugin.location = null;    ; //Stores where the center of the map will be
        plugin.latitudeField = null; //Field for the latitude
        plugin.longitudeField = null;//Field for the longitude
        plugin.locationField = null;
        plugin.map = null; //The maps div for google
        plugin.marker = null;//The marker for the map
        plugin.geoencoder = new google.maps.Geocoder(); //This is the google map service that geo encodes stuff
        plugin.autocomplete = null; //This is the google map service for auto complete


        plugin.settings = {};

        //This is the google maps element
        var $element = $(element), // reference to the jQuery version of DOM element
             element = element;    // reference to the actual DOM element

        plugin.init = function() 
        {
            plugin.settings = $.extend({}, defaults, options);
            plugin.location = new google.maps.LatLng(plugin.settings.default_latitude, plugin.settings.default_longitude);
            if(plugin.settings.longitude_input_id === '' || plugin.settings.latitude_input_id === '')
            {
                throw "You must have an input field for latitude, longitude, and location.";
            }
            else
            {
                plugin.latitudeField = $("#" + plugin.settings.latitude_input_id);
                plugin.longitudeField = $("#" + plugin.settings.longitude_input_id);
                if(plugin.settings.location_id !== "")
                {
                    plugin.locationField = $("#" + plugin.settings.location_id);
                    plugin.autocomplete  = new google.maps.places.Autocomplete(document.getElementById(plugin.settings.location_id));
                    //Register Event For autocompleting the field
                    google.maps.event.addListener(plugin.autocomplete, 'place_changed', autocompleteFunction);
                }
                
                //No fields found for with the ids
                if(plugin.longitudeField === null || plugin.latitudeField ===  null)
                {
                    throw "Could not find the fields.";
                }
                //Fields contain nothing
                else if(plugin.latitudeField.val() ===  "" || plugin.longitudeField.val() === "")
                {
                    plugin.location = new google.maps.LatLng(parseFloat(plugin.settings.default_latitude), parseFloat(plugin.settings.default_longitude));
                    
                    createMapAndLocationValue();
                }
                //Fields contain location from the server
                else
                {                 
                    plugin.location = new google.maps.LatLng(parseFloat(plugin.latitudeField.val()), parseFloat(plugin.longitudeField.val()));
                    
                    createMapAndLocationValue();
                }
                                
                plugin.settings.afterInitialized();

                
            
                
            }
            
        };
        
        
        
        //This will change pin and map to the location and put the right stuff in the location field
        var autocompleteFunction = function()
        {
            plugin.marker.setVisible(false);
            plugin.location = plugin.autocomplete.getPlace().geometry.location;
            plugin.map.setCenter(plugin.location);
            plugin.marker.setPosition(plugin.location);
            plugin.marker.setVisible(true);
            reverseLocation();
            plugin.latitudeField.val(plugin.location.lat());
            plugin.longitudeField.val(plugin.location.lng());
            
        };
        
        //Records the google position object 
        var recordGooglePositionCreateMap = function(position)
        {
            plugin.location = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);            
            createMapAndLocationValue();
        };

        //This takes the lat long of a location and reverse geo codes it so that I put it in the 
        var reverseLocation = function()
        {
            
            if(plugin.locationField.length > 0)
            {
                plugin.geoencoder.geocode({'latLng': plugin.location}, function(results, status) 
                {
                    if (status === google.maps.GeocoderStatus.OK) 
                    {
                        
                          plugin.locationField.val(processLocationData(results));
                    }
                });
            }
            
        }

        //This get the address via the postal code
        var processLocationData = function(results)
        {
            var city = '';
            var state = '';
            
            for(var index in results)
            {
                if(results[index].types[0] === 'postal_code')
                {
                    return results[index].formatted_address;
                }
            }
            
            return plugin.settings.noLocationFound;
            
        };
        

        //This creates the google map, marker and registers the event
        var createMapAndLocationValue = function() 
        {
            
          var mapOptions = 
                    {
                        zoom: plugin.settings.zoom,
                        center: plugin.location
                    };
                    
          plugin.map = new google.maps.Map(element, mapOptions);
          
          plugin.marker = new google.maps.Marker({
                map: plugin.map,
                draggable:true,
                animation: google.maps.Animation.DROP,
                position: plugin.location
              });
              
          plugin.changeLatLongInputs(plugin.location);
        
          google.maps.event.addListener(plugin.marker, 'dragend', function(event){
                plugin.location = event.latLng;
                plugin.changeLatLongInputs(event.latLng);
            });     
            
         
        };
       
        //This changes the values for hidden input fields latitude and longitude
        plugin.changeLatLongInputs = function(latLng)
        {
            plugin.latitudeField.val(latLng.lat());
            plugin.longitudeField.val(latLng.lng());
            reverseLocation();
        };
        
        //Public function to set all the fields
        plugin.setAllFields = function()
        {
            plugin.changeLatLongInputs(plugin.location);
        }
        //This is to destroy the plugin
        plugin.destroy = function()
        {
            plugin.removeData('googlemapmylocation');
        };


        google.maps.event.addDomListener(window, 'load', plugin.init);

    };
    
    
   // add the plugin to the jQuery.fn object
    $.fn.googlemapmylocation = function(options)
    {
        // iterate through the DOM elements we are attaching the plugin to
        return this.each(function()
        {
           
            // if plugin has not already been attached to the element
            if (undefined === $(this).data('googlemapmylocation')) 
            {
                                
                // create a new instance of the plugin
                // pass the DOM element and the user-provided options as arguments
                var plugin = new $.googlemapmylocation(this, options);

                // in the jQuery version of the element
                // store a reference to the plugin object
                // you can later access the plugin and its methods and properties like
                // element.data('pluginName').publicMethod(arg1, arg2, ... argn) or
                // element.data('pluginName').settings.propertyName
                $(this).data('googlemapmylocation', plugin);

            }
        });
        

    };
    
    
}(jQuery));