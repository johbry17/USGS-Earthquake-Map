// pick a data set from USGS

// use url to call for data with d3
// remember, d3 is mean and doesn't like to share data outside of the call
// create a global to save the data? or just pass it to a function?
// pass it to a function createMap(createMarkers(d3Response))
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson").then(function(response){
    console.log(response);
    createMap(response);
});

//function createMap(markers) {
function createMap(markers) {
    // create a titleLayer
    let base = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });

    // create objects to hold base and overlay map for L.control
    let baseMaps = {
        "Base Map": base,
    };

    let earthquakes = {
        "Earthquakes": markers
    };

    // create map with center, zoom, initial layers
    let map = L.map("map", {
        center: [39.8283, -118.5795],
        zoom: 5,
        layers: [base]
    });

    // create L.control with legend
    // legend shows color-coded depth (3rd coordinate features.geometry.coordinates.depth)

};

// function createMarkers()
    // store data property 

    // create array

    // for loop, create marker, bidPopup, push to array
    // marker size goes up with magnitude, marker color gets darker as depth increases

    // return L.layerGroup(array)



// Bonus

// add extra layer(s) and toggle L.control in createMap
// presumably just use a d3 call to the tectonic plate dataset and creatMap(createMarkers(response))?
