// global variable to pass to createMap because my computer is mean
let tectonicPlates = L.layerGroup();

// another global for colors
colorScale = d3.scaleLinear().domain([0, 10, 30, 50, 70, 90]).range(['greenyellow', 'gold', 'orange', 'red', 'firebrick', 'darkred']);

// call for USGS eathquake data for the past week with d3
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson").then(function(response){
    createMap(createMarkers(response));
});

// add tectonic plates layer to map
d3.json("static/data/tectonic_plates.json").then(function(plates) {
    tectonicPlates = L.geoJSON(plates, {
        style: {
            color: "red",
            weight: 5,
        },
    }).addTo(tectonicPlates);
});

// function to create map and layers
function createMap(earthquakes) {
    // create a titleLayer
    let base = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });
    
    // create other layers
    let satMap = L.esri.basemapLayer('Imagery');

    // create objects to hold base the map...
    let baseMap = {
        "Street Map": base,
        "Satellite Map": satMap,
        "National Geographic": L.esri.basemapLayer('NationalGeographic'),
        "Topographic": L.esri.basemapLayer('Topographic'),
        "Physical": L.esri.basemapLayer('Physical'),
        "Oceans": L.esri.basemapLayer('Oceans'),
        "Grayscale": L.esri.basemapLayer('Gray'),
        "Firefly": L.esri.basemapLayer('ImageryFirefly'),
    };
    // ...and overlay maps for L.control
    let maps = {
        "Earthquakes": earthquakes,
        "Tectonic Plates": tectonicPlates,
    };

    // create map with center, zoom, initial layers
    map = L.map("map", {
        center: [39.8283, -118.5795],
        zoom: 5,
        layers: [satMap, earthquakes]
    });

    // create L.control with legend
    let legend = L.control({
        position: "bottomright",
    });

    legend.onAdd = function() {
        let div = L.DomUtil.create("div", "custom-legend");

        labels = ['<10', '10-30', '30-50', '50-70', '70-90', '90+'];

        div.innerHTML = '<div class="legend-title">Depth (km)<br>below ground</div>';

        colorScale.domain().forEach(function(depth, index) {
            color = colorScale(depth);
            div.innerHTML += `<div><i class="legend-color" style="background:${color}"></i>${labels[index]}`
        })

        return div;
    }
    
    legend.addTo(map);

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
                radius: mag *20000,
                color: colors(depth),
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
    function colors(depth) {
        return colorScale(depth);
    };

    // return entire marker layer
    return markers;

};
