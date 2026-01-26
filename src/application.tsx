import React, { useEffect, useRef, useState } from "react";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile.js";
import { OSM, StadiaMaps } from "ol/source.js";
import { useGeographic } from "ol/proj.js";
import { WMTS } from "ol/source.js";
import { optionsFromCapabilities } from "ol/source/WMTS.js";
import { WMTSCapabilities } from "ol/format.js";
import proj4 from "proj4";

// Styling of OpenLayers components like zoom and pan controls
// @ts-ignore
import "ol/ol.css";
import { register } from "ol/proj/proj4.js";
import { Layer } from "ol/layer.js";

proj4.defs(
  "EPSG:25833",
  "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
);
proj4.defs(
  "EPSG:3571",
  "+proj=laea +lat_0=90 +lon_0=180 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs",
);
proj4.defs(
  "EPSG:3575",
  "+proj=laea +lat_0=90 +lon_0=10 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs",
);

register(proj4);

const parser = new WMTSCapabilities();

const kartverketTopoLayer = new TileLayer();
fetch("https://cache.kartverket.no/v1/wmts/1.0.0/WMTSCapabilities.xml").then(
  async function (response) {
    const result = parser.read(await response.text());
    const options = optionsFromCapabilities(result, {
      layer: "topo",
      matrixSet: "webmercator",
    });
    kartverketTopoLayer.setSource(new WMTS(options!));
  },
);

const flyfotoLayer = new TileLayer();
fetch(
  "http://opencache.statkart.no/gatekeeper/gk/gk.open_nib_utm33_wmts_v2?SERVICE=WMTS&REQUEST=GetCapabilities",
).then(async function (response) {
  const result = parser.read(await response.text());
  const options = optionsFromCapabilities(result, {
    layer: "Nibcache_UTM33_EUREF89_v2",
    matrixSet: "default028mm",
  });
  flyfotoLayer.setSource(new WMTS(options!));
});

const arcticLayer = new TileLayer();
fetch("/arctic.xml").then(async function (response) {
  const result = parser.read(await response.text());
  const options = optionsFromCapabilities(result, {
    layer: "arctic_cascading",
    matrixSet: "3575",
  });
  arcticLayer.setSource(new WMTS(options!));
});
// By calling the "useGeographic" function in OpenLayers, we tell that we want coordinates to be in degrees
//  instead of meters, which is the default. Without this `center: [10.6, 59.9]` brings us to "null island"
useGeographic();

// Here we create a Map object. Make sure you `import { Map } from "ol"`. Otherwise, the standard Javascript
//  map data structure will be used
const map = new Map({
  // The map will be centered on a position in longitude (x-coordinate, east) and latitude (y-coordinate, north),
  //   with a certain zoom level
  view: new View({ center: [10.74, 79], zoom: 6, projection: "EPSG:3575" }),
  // map tile images will be from the Open Street Map (OSM) tile layer
  layers: [new TileLayer({ source: new OSM() })],
});

// A functional React component
const osmLayer = new TileLayer({ source: new OSM() });

const stadiaLayer = new TileLayer({
  source: new StadiaMaps({
    layer: "alidade_smooth",
  }),
});

export function Application() {
  // `useRef` bridges the gap between JavaScript functions that expect DOM objects and React components
  const mapRef = useRef<HTMLDivElement | null>(null);
  // When we display the page, we want the OpenLayers map object to target the DOM object refererred to by the
  // map React component
  useEffect(() => {
    map.setTarget(mapRef.current!);
  }, []);

  const [backgroundLayer, setBackgroundLayer] = useState<Layer>(osmLayer);
  useEffect(() => {
    map.setLayers([backgroundLayer]);
    map.setView(
      new View({
        center: [10.5, 79],
        zoom: 6,
        projection: backgroundLayer.getSource()?.getProjection() || "EPSG:4326",
      }),
    );
  }, [backgroundLayer]);

  function handleClick() {
    setBackgroundLayer(arcticLayer);
  }

  // This is the location (in React) where we want the map to be displayed
  return (
    <>
      <button onClick={handleClick}>Change layer</button>
      <div ref={mapRef}></div>
    </>
  );
}
