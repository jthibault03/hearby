import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

const HeatmapLayer = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    const heat = L.heatLayer(points, {
      radius: 45,
      blur: 20,
      maxZoom: 17,
      max: 1.0,
      // Softer, cooler palette: deep blue -> teal -> green
  gradient: {
    0.2: "rgba(0, 31, 63, 0.2)",  // very transparent navy
    0.4: "rgba(0, 80, 164, 0.2)", // light blue
    0.6: "rgba(0, 136, 204, 0.2)", // cyan/teal
    0.8: "rgba(0, 184, 148, 0.2)",  // teal‑green
    1.0: "rgba(46, 204, 113, 0.2)", // soft green
  },
    });

    heat.addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);

  return null;
};

export default HeatmapLayer;
