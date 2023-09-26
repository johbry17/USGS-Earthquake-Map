// call USGS eathquake data for the past month with d3
d3.json(
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson",
).then(function (earthquakes) {
  d3.json("static/data/tectonic_plates.json").then(function (plates) {
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
    // Street: L.esri.basemapLayer("Streets"),
    Satellite: satMap,
    "National Geographic": L.esri.basemapLayer("NationalGeographic"),
    // Topographic: L.esri.basemapLayer("Topographic"),
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
  map = L.map("map", {
    center: [39.8283, -118.5795],
    zoom: 4,
    layers: [satMap, earthquakes],
  });

  // create toggle for map layers
  L.control
    .layers(baseMap, maps, {
      collapsed: false,
    })
    .addTo(map);

  // call function to add legend to map
  let legendToggle = addLegend();
  legendToggle.addTo(map);

  // remove legend if earthquake layer toggled off
  map.on("overlayremove", function (eventLayer) {
    if (eventLayer.name === "Earthquakes") {
      map.removeControl(legendToggle);
    }
  });

  // add legend if earthquake layer toggled on
  map.on("overlayadd", function (eventLayer) {
    if (eventLayer.name === "Earthquakes") {
      legendToggle.addTo(map);
    }
  });
}

// function to create earthquake marker layer
function createMarkers(response) {
  // store data
  let markers = L.geoJSON(response, {
    // pointToLayer from the leaflet geoJSON documentation
    pointToLayer: function (feature, latlng) {
      // store variables
      let mag = feature.properties.mag;
      let depth = feature.geometry.coordinates[2];
      let datetime = new Date(feature.properties.time);

      // create circle markers and popup
      let circle = L.circle(latlng, {
        radius: mag * 10000,
        // color set by colors() function immediately below
        color: colors(depth),
        fillOpacity: 0.9,
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

      return circle;
    },
  });

  // function to change marker color based on depth
  function colors(depth) {
    return colorScale(depth);
  };

  // return entire marker layer
  return markers;
};

// create color range for createMarkers() and addLegend()
// linear scale maps input depth to output colors
colorScale = d3
  .scaleLinear()
  .domain([0, 10, 30, 50, 70, 90])
  .range(["limegreen", "gold", "orange", "red", "firebrick", "darkred"]);

// create tectonic plates layer
function tecPlates(plates) {
  return L.geoJSON(plates, {
    style: {
      color: "firebrick",
      weight: 5,
    },
  });
}

// create heat map layer
function heatMap(data) {
  // create array to pass to L.heatLayer
  coords = data.features.map((feature) => [
    feature.geometry.coordinates[1],
    feature.geometry.coordinates[0],
  ]);

  return L.heatLayer(coords, {
    radius: 40,
    blur: 5,
    gradient: { 0.1: "orange", 0.3: "red", 0.6: "firebrick", 1.0: "darkred" },
  });
}

// create legend
function addLegend() {
  let legend = L.control({
    position: "bottomright",
  });

  // format legend
  legend.onAdd = function () {
    let div = L.DomUtil.create("div", "custom-legend");

    labels = ["<10", "10-30", "30-50", "50-70", "70-90", "90+"];

    div.innerHTML =
      '<div class="legend-title">Depth (km)<br>below ground</div>';

    // use colorScale() to populate legend
    colorScale.domain().forEach(function (depth, index) {
      color = colorScale(depth);
      div.innerHTML += `<div><i class="legend-color" style="background:${color}"></i>${labels[index]}`;
    });

    div.innerHTML +=
      `<div class="legend-mini-text">Earthquake markers
      <br>scaled to magnitude,
      <br>USGS, last 30 days</div>`;

    return div;
  };

  return legend;
}
