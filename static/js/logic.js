// pick a data set from USGS

// use url to call for data with d3
// remember, d3 is mean and doesn't like to share data outside of the call
// create a global to save the data? or just pass it to a function?
// pass it to a function createMap(createMarkers(d3Response))
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson").then(function(response){
    console.log(response);
    createMap(createMarkers(response));
});

//function createMap(markers) {
function createMap(markers) {
    // create a titleLayer
    let base = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });

    let earthquakes = markers;

    // create objects to hold base and overlay map for L.control
    let maps = {
        "Base Map": base,
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

};

// function createMarkers()
function createMarkers(response) {
    // store data property 
    let quakes = response.features;

    // create array
    let markers = [];

    // for loop, create marker, bidPopup, push to array
    // marker size goes up with magnitude, marker color gets darker as depth increases
    for (let i = 0; i < quakes.length; i++) {
        // store variables
        let quake = quakes[i];
        let lat = quake.geometry.coordinates[1];
        let lon = quake.geometry.coordinates[0];
        let mag = quake.properties.mag;
        let depth = quake.geometry.coordinates[2];

        let marker = L.circle([lat, lon],{
            radius: mag *10000,
            color: scaleColor(depth),
            fillOpacity: 0.7,
        }).bindPopup(`<h3>Magnitude: ${mag}</h3><br>Location: ${lat}, ${lon}<br>Depth: ${depth}`);

        markers.push(marker);
    };

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

    // return L.layerGroup(array)
    return L.layerGroup(markers);

};


// Bonus

// add extra layer(s) and toggle L.control in createMap
// presumably just use a d3 call to the tectonic plate dataset and creatMap(createMarkers(response))?
