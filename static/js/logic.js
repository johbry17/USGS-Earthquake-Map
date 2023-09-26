// global variable for colors
colorScale = d3
  .scaleLinear()
  .domain([0, 10, 30, 50, 70, 90])
  .range(["limegreen", "gold", "orange", "red", "firebrick", "darkred"]);

// call USGS eathquake data for the past week with d3
d3.json(
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"
).then(function (earthquakes) {
    d3.json("static/data/tectonic_plates.json").then(function (plates) {
        createMap(createMarkers(earthquakes), tecPlates(plates));
    });
});

// function to create base map and layers
function createMap(earthquakes, tectonicPlates) {
  // create base layer
  let satMap = L.esri.basemapLayer("Imagery");

  // create objects to hold the base maps...
  let baseMap = {
    Street: L.esri.basemapLayer("Streets"),
    Satellite: satMap,
    "National Geographic": L.esri.basemapLayer("NationalGeographic"),
    Topographic: L.esri.basemapLayer("Topographic"),
    Physical: L.esri.basemapLayer("Physical"),
    Oceans: L.esri.basemapLayer("Oceans"),
    Grayscale: L.esri.basemapLayer("Gray"),
    Firefly: L.esri.basemapLayer("ImageryFirefly"),
  };
  // ...and overlay maps
  let maps = {
    "Earthquakes": earthquakes,
    "Tectonic Plates": tectonicPlates,
  };

  // create map with center, zoom, initial layers
  map = L.map("map", {
    center: [39.8283, -118.5795],
    zoom: 4,
    layers: [satMap, earthquakes],
  });

  // call function to add legend to map
  addLegend().addTo(map);

  // create toggle for map layers
  L.control
    .layers(baseMap, maps, {
      collapsed: false,
    })
    .addTo(map);
}


// function to create earthquake markers
function createMarkers(response) {
  // store data
  let markers = L.geoJSON(response, {
    // pointToLayer from the leaflet geoJSON documentation
    // marker size goes up with magnitude, marker color gets darker as depth increases
    pointToLayer: function (feature, latlng) {
      // store variables
      let mag = feature.properties.mag;
      let depth = feature.geometry.coordinates[2];

      // create circle markers and popup, with radius of magnitude and color set by scaleColor() function
      let circle = L.circle(latlng, {
        radius: mag * 20000,
        color: colors(depth),
        fillOpacity: 0.7,
      }).bindPopup(
        `<h3>Magnitude: ${mag}</h3>${latlng}<br>Depth: ${depth}`
      );

      // open popup on mouseover
      circle.on("mouseover", (e) => circle.openPopup());

      // close popup on mouseover
      circle.on("mouseout", (e) => circle.closePopup());

      // return circle
      return circle;
    },
  });

  // function to change marker color based on depth
  function colors(depth) {
    return colorScale(depth);
  }

  // return entire marker layer
  return markers;
}


// function to create tectonic plates layer
function tecPlates(plates) {
  let tectonicPlates = L.geoJSON(plates, {
    style: {
      color: "red",
      weight: 5,
    },
  });

  return tectonicPlates;
};


function addLegend() {
  // create L.control with legend
  let legend = L.control({
    position: "bottomright",
  });

  // format legend
  legend.onAdd = function () {
    let div = L.DomUtil.create("div", "custom-legend");

    labels = ["<10", "10-30", "30-50", "50-70", "70-90", "90+"];

    div.innerHTML =
      '<div class="legend-title">Depth (km)<br>below ground</div>';

    // use global colorScale to populate legend
    colorScale.domain().forEach(function (depth, index) {
      color = colorScale(depth);
      div.innerHTML += `<div><i class="legend-color" style="background:${color}"></i>${labels[index]}`;
    });

    return div;
  };

  return legend;
}
