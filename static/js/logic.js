// call USGS eathquake data for the past month with d3
d3.json(
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson"
).then(function (earthquakes) {
  d3.json("static/data/tectonic_plates.json").then((plates) => {
    // createMarkers, tecPlates, heatMap are all layers added to createMap
    createMap(
      createMarkers(earthquakes),
      tecPlates(plates),
      heatMap(earthquakes)
    );
  });
});

// function to create base maps and layers
function createMap(earthquakes, tectonicPlates, heat) {
  // create base layer
  let satMap = L.esri.basemapLayer("Imagery");

  // create objects to hold the base maps...
  let baseMap = {
    Satellite: satMap,
    "National Geographic": L.esri.basemapLayer("NationalGeographic"),
    Physical: L.esri.basemapLayer("Physical"),
    Oceans: L.esri.basemapLayer("Oceans"),
    Grayscale: L.esri.basemapLayer("Gray"),
    Firefly: L.esri.basemapLayer("ImageryFirefly"),
  };
  // ...and overlay maps
  let maps = {
    Earthquakes: earthquakes,
    "Tectonic Plates": tectonicPlates,
    "Heat Map": heat,
  };

  // create map with center, zoom, initial layers
  let mainMap = L.map("map", {
    center: [0, -60],
    zoom: 3,
    layers: [satMap, earthquakes],
    // loads data when crossing the international date line
    worldCopyJump: true,
  });

  // create toggle for map layers
  L.control
    .layers(baseMap, maps, {
      // collapsed: false,
    })
    .addTo(mainMap);

  // call function to add legend to map
  let legendToggle = addLegend();
  legendToggle.addTo(mainMap);

  // remove legend if earthquake layer toggled off
  mainMap.on("overlayremove", function (eventLayer) {
    if (eventLayer.name === "Earthquakes") {
      mainMap.removeControl(legendToggle);
    }
  });

  // add legend if earthquake layer toggled on
  mainMap.on("overlayadd", function (eventLayer) {
    if (eventLayer.name === "Earthquakes") {
      legendToggle.addTo(mainMap);
    }
  });

  // set Leaflet attribution control to bottom left
  mainMap.attributionControl.setPosition("bottomleft");
}

// function to create earthquake marker layer
function createMarkers(response) {
  // wrap geoJSON data - duplicate and shift left and right
  // for crossing the international date line
  let wrappedMarkers = wrapGeoJSON(response);

  // store data
  let markers = L.geoJSON(wrappedMarkers, {
    // pointToLayer from the leaflet geoJSON documentation
    pointToLayer: (feature, latlng) => {
      // store variables
      let mag = feature.properties.mag;
      let depth = feature.geometry.coordinates[2];
      let datetime = new Date(feature.properties.time);

      // create circle markers and popup
      let circle = L.circle(latlng, {
        radius: mag * 10000,
        // color set by colors() function below
        color: colors(depth),
        fillOpacity: 0.5,
      }).bindPopup(
        `<h3>Magnitude: ${mag}</h3>
        Place: ${feature.properties.place}
        <br>Time: ${datetime.toLocaleString()}
        <br>${latlng}
        <br>Depth: ${depth}`
      );

      // open popup on mouseover
      circle.on("mouseover", (e) => circle.openPopup());

      // close popup on mouseout
      circle.on("mouseout", (e) => circle.closePopup());

      // return individual marker
      return circle;
    },
  });

  // return entire marker layer
  return markers;
}

// create tectonic plates layer
function tecPlates(plates) {
  // duplicate the plates layer and shift it to the left and right
  // for crossing the international date line
  let wrappedPlates = wrapGeoJSON(plates);

  // return layer
  return L.geoJSON(wrappedPlates, {
    style: {
      color: "darkred",
      weight: 5,
    },
  });
}

// function to wrap geoJSON data
// basically duplicates the data and shifts it to the left and right
// so I can display the data across the international date line
function wrapGeoJSON(geojsonLayer) {
  let wrappedFeatures = [];

  geojsonLayer.features.forEach((feature) => {
    // original feature
    wrappedFeatures.push(feature);

    // duplicate and shift -360 degrees
    let leftFeature = JSON.parse(JSON.stringify(feature));
    leftFeature.geometry.coordinates = shiftCoordinates(
      leftFeature.geometry.coordinates,
      -360
    );
    wrappedFeatures.push(leftFeature);

    // duplicate and shift +360 degrees
    let rightFeature = JSON.parse(JSON.stringify(feature));
    rightFeature.geometry.coordinates = shiftCoordinates(
      rightFeature.geometry.coordinates,
      360
    );
    wrappedFeatures.push(rightFeature);
  });

  return { type: "FeatureCollection", features: wrappedFeatures };
}

// function to shift coordinates
// basically just adds or subtracts 360 degrees from the longitude
function shiftCoordinates(coords, shift) {
  if (Array.isArray(coords[0])) {
    // recursively handle nested coordinates (tectonic plates polygons)
    return coords.map((c) => shiftCoordinates(c, shift));
  }
  // return shifted longitude, latitude unchanged
  return [coords[0] + shift, coords[1]];
}

// create heat map layer
function heatMap(data) {
  // create array to pass to L.heatLayer
  let wrappedCoords = [];

  // duplicate and shift layer left and right
  // for crossing the international date line
  data.features.forEach((feature) => {
    let coords = feature.geometry.coordinates;

    // original coordinates
    wrappedCoords.push([coords[1], coords[0]]);

    // shifted -360 degrees
    wrappedCoords.push([coords[1], coords[0] - 360]);

    // shifted +360 degrees
    wrappedCoords.push([coords[1], coords[0] + 360]);
  });

  // return layer
  return L.heatLayer(wrappedCoords, {
    radius: 40,
    blur: 2,
    gradient: {
      0.1: "orange",
      0.3: "red",
      0.6: "firebrick",
      1.0: "darkred",
    },
  });
}

// create color range for createMarkers() and addLegend()
// function colors(depth) { // Original Colors
//   if (depth < 10) return "green";
//   if (depth < 30) return "gold";
//   if (depth < 50) return "orange";
//   if (depth < 70) return "red";
//   if (depth < 90) return "firebrick";
//   return "darkred";
// }

// function colors(depth) { // Earth Tones
//   if (depth < 10) return "#A3C586"; // Muted Green
//   if (depth < 30) return "#E1C16E"; // Sand
//   if (depth < 50) return "#D08C60"; // Rust
//   if (depth < 70) return "#B35A3C"; // Burnt Orange
//   if (depth < 90) return "#8A3324"; // Brick Red
//   return "#5A1E1E"; // Deep Maroon
// }

// function colors(depth) { // Sunset Gradient
//   if (depth < 10) return "#ffcccb"; // Light Pink
//   if (depth < 30) return "#ff9966"; // Peach
//   if (depth < 50) return "#ff6666"; // Coral
//   if (depth < 70) return "#cc3333"; // Crimson
//   if (depth < 90) return "#990000"; // Dark Red
//   return "#660000"; // Deep Burgundy
// }

// function colors(depth) { // Grayscale
//   if (depth < 10) return "#f0f0f0"; // Light Gray
//   if (depth < 30) return "#d9d9d9"; // Medium Light Gray
//   if (depth < 50) return "#bdbdbd"; // Medium Gray
//   if (depth < 70) return "#969696"; // Dark Gray
//   if (depth < 90) return "#636363"; // Very Dark Gray
//   return "#252525"; // Black
// }

function colors(depth) {
  // Heat Map
  if (depth < 10) return "#ffffcc"; // Pale Yellow
  if (depth < 30) return "#ffeda0"; // Light Yellow
  if (depth < 50) return "#feb24c"; // Orange
  if (depth < 70) return "#f03b20"; // Bright Red
  if (depth < 90) return "#bd0026"; // Dark Red
  return "#800026"; // Deep Red
}

// function colors(depth) { // Viridis
//   if (depth < 10) return "#440154"; // Dark Purple
//   if (depth < 30) return "#3b528b"; // Purple
//   if (depth < 50) return "#21918c"; // Teal
//   if (depth < 70) return "#5ec962"; // Light Green
//   if (depth < 90) return "#fde725"; // Yellow
//   return "#fee08b"; // Light Yellow
// }

// function colors(depth) { // Blues
//   if (depth < 10) return "#d4f1f9"; // Light Blue
//   if (depth < 30) return "#76c7f2"; // Sky Blue
//   if (depth < 50) return "#1f78b4"; // Medium Blue
//   if (depth < 70) return "#08306b"; // Dark Blue
//   if (depth < 90) return "#041f4a"; // Navy Blue
//   return "#021026"; // Deep Ocean
// }

// create legend
function addLegend() {
  let legend = L.control({
    position: "bottomright",
  });

  // format legend
  legend.onAdd = function () {
    let div = L.DomUtil.create("div", "custom-legend");

    let labels = ["<10", "10-30", "30-50", "50-70", "70-90", "90+"];

    // add title to legend
    div.innerHTML =
      '<div class="legend-title">Depth (km)<br>below ground</div>';

    // use colors() and labels[] to populate legend
    labels.forEach(function (label, index) {
      // colors((index) *20) because it always returns the right value [0, 20, 40, 60, 80, 100]
      div.innerHTML += `<div><i class="legend-color" style="background:${colors(
        index * 20
      )}"></i>${labels[index]}`;
    });

    // add final text to div
    div.innerHTML += `<div class="legend-mini-text">Markers scaled to
      <br>earthquake magnitude
      <br><b>USGS, last 30 days</b></div>`;

    return div;
  };

  return legend;
}
