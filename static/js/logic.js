// pick a data set from USGS

// use url to call for data with d3
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson").then(function(response){
    createMap(createMarkers(response));
});

//function createMap(markers) {
function createMap(earthquakes) {
    // create a titleLayer
    let base = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });

    // create objects to hold base the map...
    let baseMap = {
        "Street Map": base,
    };
    // ...and overlay maps for L.control
    let maps = {
        "Earthquakes": earthquakes,
    };

    // create map with center, zoom, initial layers
    let map = L.map("map", {
        center: [39.8283, -118.5795],
        zoom: 5,
        layers: [base, earthquakes]
    });

    // create L.control with legend
    // legend shows color-coded depth (3rd coordinate features.geometry.coordinates.depth)

    // create toggle for map layers
    L.control.layers(baseMap, maps, {
        collapsed: false,
    }).addTo(map);

};

// function createMarkers()
function createMarkers(response) {
    // store data property 
    let markers = L.geoJSON(response, {

        // i stole pointToLayer from the leaflet documentation
        // marker size goes up with magnitude, marker color gets darker as depth increases
        pointToLayer: function(feature, latlng) {
            // store variables
            let lat = feature.geometry.coordinates[1];
            let lon = feature.geometry.coordinates[0];
            let mag = feature.properties.mag;
            let depth = feature.geometry.coordinates[2];

            // create circle markers and popup, with radius of magnitude and color set by scaleColor() function
            let circle = L.circle(latlng,{
                radius: mag *10000,
                color: scaleColor(depth),
                fillOpacity: 0.7,
            }).bindPopup(`<h3>Magnitude: ${mag}</h3><br>Location: ${lat}, ${lon}<br>Depth: ${depth}`);
            
            // open popup on mouseover
            circle.on('mouseover', function(e) {
                this.openPopup();
            });

            // close popup on mouseover
            circle.on('mouseout', function(e) {
                this.closePopup();
            });

            // return circle
            return circle;
        }
    });

    // function to change marker color based on depth
    function scaleColor(depth){
        if (depth < 10) {
            return 'green';
        } else if (depth < 30) {
            return 'yellow';
        } else if (depth < 50) {
            return 'orange';
        } else if (depth < 70) {
            return 'red';
        } else if (depth < 90) {
            return 'darkred';
        } else {
            return 'black';
        };
    };

    // return entire marker layer
    return markers;

};
    

// Bonus

// add extra layer(s) and toggle L.control in createMap
// presumably just use a d3 call to the tectonic plate dataset and creatMap(createMarkers(response))?
