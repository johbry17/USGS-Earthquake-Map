// call USGS eathquake data for the past month with d3
d3.json(
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson",
).then(function (earthquakes) {
  d3.json("static/data/tectonic_plates.json").then((plates) => {
    // createMarkers, tecPlates, heatMap are all layers added to createMap
    createMap(
      createMarkers(earthquakes),
      tecPlates(plates),
      heatMap(earthquakes),
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
    center: [0, -40],
    zoom: 3,
    layers: [satMap, earthquakes],
    // loads data when crossing the international date line
    worldCopyJump: true,
  });

  // create toggle for map layers
  L.control
    .layers(baseMap, maps, {
      collapsed: false,
    })
    .addTo(mainMap);

  // call function to add legend to map
  let legendToggle = addLegend(earthquakes);
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
}

// create tectonic plates layer
function tecPlates(plates) {
  return L.geoJSON(plates, {
    style: {
      color: "darkred",
      weight: 5,
    }
  });
};

// create heat map layer
function heatMap(data) {
  // create array to pass to L.heatLayer
  let coords = data.features.map((feature) => [
    feature.geometry.coordinates[1],
    feature.geometry.coordinates[0],
  ]);

  return L.heatLayer(coords, {
    radius: 40,
    blur: 2,
    gradient: { 0.1: "orange", 0.3: "red", 0.6: "firebrick", 1.0: "darkred" },
  });
};

// function to create earthquake marker layer
function createMarkers(response) {
  // store data
  let markers = L.geoJSON(response, {
    // pointToLayer from the leaflet geoJSON documentation
    pointToLayer: (feature, latlng) => {
      // store variables
      let mag = feature.properties.mag;
      let depth = feature.geometry.coordinates[2];
      let datetime = new Date(feature.properties.time);

      // create circle markers and popup
      let circle = L.circle(latlng, {
        radius: mag * 10000,
        // color set by colors() function immediately below
        color: colors(depth),
        fillOpacity: 0.5,
      }).bindPopup(
        `<h3>Magnitude: ${mag}</h3>
        Place: ${feature.properties.place}
        <br>Time: ${datetime.toLocaleString()}
        <br>${latlng}
        <br>Depth: ${depth}`,
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

// create color range for createMarkers() and addLegend()
function colors(depth) {
  if (depth < 10) return "mediumseagreen";
  if (depth < 30) return "gold";
  if (depth < 50) return "orange";
  if (depth < 70) return "red";
  if (depth < 90) return "firebrick";
  return "darkred";
}

// create legend
function addLegend(earthquakes) {
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
        index * 20,
      )}"></i>${labels[index]}`;
    });

    // add final text to div
    div.innerHTML += `<div class="legend-mini-text">Earthquake markers
      <br>scaled to magnitude
      <br><b>USGS, last 30 days</b></div>`;

    return div;
  };

  return legend;
}
