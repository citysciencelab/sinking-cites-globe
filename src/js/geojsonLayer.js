import mapboxgl from "mapbox-gl";

// default styles for all geometry types
const styles = {
  point: {
    type: "circle",
    paint: {
      "circle-radius": 6,
      "circle-color": "#00ffff",
      "circle-opacity": 0.9,
    },
    layout: {},
  },
  line: {
    type: "line",
    paint: {
      "line-color": "#00ffff",
      "line-width": 2,
      "line-opacity": 0.9,
    },
    layout: {},
  },
  fill: {
    type: "fill",
    paint: {
      "fill-color": "#00ffff",
      "fill-opacity": 0.25,
    },
    layout: {},
  },
  outline: {
    type: "line",
    paint: {
      "line-color": "#00ffff",
      "line-width": 2,
      "line-opacity": 0.9,
    },
    layout: {},
  },
};

/** Accept map instance or Vue ref to instance. */
function resolveMap(maybeRef) {
  const m =
    maybeRef && typeof maybeRef === "object" && "value" in maybeRef
      ? maybeRef.value
      : maybeRef;
  if (!m || typeof m.getLayer !== "function") return null;
  return m;
}

/** Upsert GeoJSON source. */
function upsertSource(map, sourceId, data) {
  const src = map.getSource(sourceId);
  if (src) src.setData(data);
  else map.addSource(sourceId, { type: "geojson", data });
}

// check geometry types in json
function scanGeometryTypes(gj) {
  let hasPoint = false;
  let hasLine = false;
  let hasPolygon = false;

  const mark = (t) => {
    if (t === "Point" || t === "MultiPoint") hasPoint = true;
    else if (t === "LineString" || t === "MultiLineString") hasLine = true;
    else if (t === "Polygon" || t === "MultiPolygon") hasPolygon = true;
  };

  const walk = (geom) => {
    if (!geom) return;
    const { type, geometries } = geom;
    if (type === "GeometryCollection") (geometries || []).forEach(walk);
    else mark(type);
  };

  if (!gj) return { hasPoint, hasLine, hasPolygon };
  if (gj.type === "FeatureCollection") gj.features.forEach((f) => walk(f.geometry));
  else if (gj.type === "Feature") walk(gj.geometry);
  else walk(gj);

  return { hasPoint, hasLine, hasPolygon };
}

// compute bounds for jsons
function geojsonToBounds(gj) {
  const bounds = new mapboxgl.LngLatBounds();
  let has = false;

  const extend = (c) => {
    // check against invalid coords
    if (Array.isArray(c) && c.length >= 2 && isFinite(c[0]) && isFinite(c[1])) {
      bounds.extend(c);
      has = true;
    }
  };

  const walk = (geom) => {
    if (!geom) return;
    const { type, coordinates, geometries } = geom;

    switch (type) {
      case "Point":
        extend(coordinates);
        break;
      case "MultiPoint":
      case "LineString":
        coordinates.forEach(extend);
        break;
      case "MultiLineString":
      case "Polygon":
        coordinates.flat(1).forEach(extend);
        break;
      case "MultiPolygon":
        coordinates.flat(2).forEach(extend);
        break;
      case "GeometryCollection":
        (geometries || []).forEach(walk);
        break;
      default:
        break;
    }
  };

  if (!gj) return null;
  if (gj.type === "FeatureCollection") gj.features.forEach((f) => walk(f.geometry));
  else if (gj.type === "Feature") walk(gj.geometry);
  else walk(gj);

  return has ? bounds : null;
}

/**
 * Build paint with expressions that respect per-feature style properties (if present).
 * Fallbacks: basePaint -> overrides by caller.
 * - Lines use: stroke, stroke-width, stroke-opacity
 * - Fills use: fill, fill-opacity
 * - Points use: fill OR stroke for circle-color, and stroke/fill opacity if present
 */
function buildPaintWithProps(type, basePaint, overridePaint) {
  const paint = { ...basePaint };

  if (type === "line") {
    paint["line-color"] = ["coalesce", ["get", "stroke"], paint["line-color"]];
    paint["line-width"] = ["coalesce", ["get", "stroke-width"], paint["line-width"]];
    paint["line-opacity"] = ["coalesce", ["get", "stroke-opacity"], paint["line-opacity"]];
  } else if (type === "fill") {
    paint["fill-color"] = ["coalesce", ["get", "fill"], paint["fill-color"]];
    paint["fill-opacity"] = ["coalesce", ["get", "fill-opacity"], paint["fill-opacity"]];
  } else if (type === "circle") {
    // Prefer fill, then stroke, then fallback
    paint["circle-color"] = ["coalesce", ["get", "fill"], ["get", "stroke"], paint["circle-color"]];
    // Try to respect either circle-opacity, stroke-opacity, or fill-opacity
    const fallbackOpacity = paint["circle-opacity"] ?? 1;
    paint["circle-opacity"] = [
      "coalesce",
      ["get", "circle-opacity"],
      ["get", "stroke-opacity"],
      ["get", "fill-opacity"],
      fallbackOpacity,
    ];
    // Optional: support per-feature circle-radius if provided
    if (typeof paint["circle-radius"] !== "undefined") {
      paint["circle-radius"] = ["coalesce", ["get", "circle-radius"], paint["circle-radius"]];
    }
  } else if (type === "symbol") {
    // No default mapping; users can still override via overridePaint
  }

  // Apply explicit overrides last
  if (overridePaint) {
    for (const k of Object.keys(overridePaint)) {
      paint[k] = overridePaint[k];
    }
  }

  return paint;
}

/**
 * Add mixed-geometry fallback layers (point/line/fill/outline) as needed.
 * Uses per-feature properties (stroke/fill/etc.) via expressions where present.
 * Allows optional per-type overrides via payload.styleOverrides = { point?: {paint,layout}, line?:..., fill?:..., outline?:... }
 */
function ensureMixedLayers(map, sourceId, baseId, data, beforeId, styleOverrides) {
  const { hasPoint, hasLine, hasPolygon } = scanGeometryTypes(data);

  // POINTS
  if (hasPoint && !map.getLayer(`${baseId}-point`)) {
    const base = styles.point;
    const paint = buildPaintWithProps(base.type, base.paint, styleOverrides?.point?.paint);
    const layout = { ...base.layout, ...(styleOverrides?.point?.layout || {}) };

    map.addLayer(
      {
        id: `${baseId}-point`,
        type: base.type,
        source: sourceId,
        paint,
        layout,
        filter: [
          "any",
          ["==", ["geometry-type"], "Point"],
          ["==", ["geometry-type"], "MultiPoint"],
        ],
      },
      beforeId
    );
  }

  // LINES
  if (hasLine && !map.getLayer(`${baseId}-line`)) {
    const base = styles.line;
    const paint = buildPaintWithProps(base.type, base.paint, styleOverrides?.line?.paint);
    const layout = { ...base.layout, ...(styleOverrides?.line?.layout || {}) };

    map.addLayer(
      {
        id: `${baseId}-line`,
        type: base.type,
        source: sourceId,
        paint,
        layout,
        filter: [
          "any",
          ["==", ["geometry-type"], "LineString"],
          ["==", ["geometry-type"], "MultiLineString"],
        ],
      },
      beforeId
    );
  }

  // POLYGONS (fill + outline)
  if (hasPolygon) {
    if (!map.getLayer(`${baseId}-fill`)) {
      const base = styles.fill;
      const paint = buildPaintWithProps(base.type, base.paint, styleOverrides?.fill?.paint);
      const layout = { ...base.layout, ...(styleOverrides?.fill?.layout || {}) };

      map.addLayer(
        {
          id: `${baseId}-fill`,
          type: base.type,
          source: sourceId,
          paint,
          layout,
          filter: [
            "any",
            ["==", ["geometry-type"], "Polygon"],
            ["==", ["geometry-type"], "MultiPolygon"],
          ],
        },
        beforeId
      );
    }
    if (!map.getLayer(`${baseId}-outline`)) {
      const base = styles.outline;
      const paint = buildPaintWithProps(base.type, base.paint, styleOverrides?.outline?.paint);
      const layout = { ...base.layout, ...(styleOverrides?.outline?.layout || {}) };

      map.addLayer(
        {
          id: `${baseId}-outline`,
          type: base.type,
          source: sourceId,
          paint,
          layout,
          filter: [
            "any",
            ["==", ["geometry-type"], "Polygon"],
            ["==", ["geometry-type"], "MultiPolygon"],
          ],
        },
        beforeId
      );
    }
  }
}

/**
 * PUBLIC: Add/update mixed-geometry overlay with fallback styles.
 * @param {mapboxgl.Map | import("vue").Ref<mapboxgl.Map>} mapLike
 * @param {{
 *   id?: string,                       // optional base id; if missing, uses "story-geojson"
 *   data: import("geojson").GeoJSON,
 *   sourceId?: string,                 // optional explicit ids (otherwise derived from id)
 *   layerId?: string,                  // base layer id (suffixes -point/-line/-fill/-outline will be used)
 *   beforeId?: string,                 // optional z-order
 *   fitBounds?: boolean,               // default false
 *   styleOverrides?: {                 // optional per-geometry overrides
 *     point?: { paint?: any, layout?: any },
 *     line?: { paint?: any, layout?: any },
 *     fill?: { paint?: any, layout?: any },
 *     outline?: { paint?: any, layout?: any },
 *   }
 * }} payload
 */
export function addGeoJsonLayer(mapLike, payload) {
  const map = resolveMap(mapLike);
  if (!map || !payload?.data) return;

  // fixed ids per your snippet
  const base = "story-geojson";
  const sourceId = `${base}-source`;
  const baseLayerId = `${base}-layer`;

  // Ensure source exists/updates
  upsertSource(map, sourceId, payload.data);

  // Create missing layers per geometry type with fallback + per-feature styles
  ensureMixedLayers(
    map,
    sourceId,
    baseLayerId,
    payload.data,
    "sinking_cities", // beforeId (optional)
    payload.styleOverrides
  );

  if (payload.fitBounds) {
    const b = geojsonToBounds(payload.data);
    if (b) map.fitBounds(b, { padding: 40, duration: 800 });
  }
}

/**
 * Remove only the layers/sources created by this module (by our fixed IDs).
 * Safe if missing.
 */
export function removeGeoJsonLayer(mapLike) {
  const map = resolveMap(mapLike);
  if (!map) return;

  const base = "story-geojson";
  const sourceId = `${base}-source`;
  const baseLayerId = `${base}-layer`;

  const layerIds = [
    `${baseLayerId}-point`,
    `${baseLayerId}-line`,
    `${baseLayerId}-fill`,
    `${baseLayerId}-outline`,
  ];

  layerIds.forEach((id) => {
    if (map.getLayer(id)) {
      map.removeLayer(id); 
    }
  });

  if (map.getSource(sourceId)) {
    map.removeSource(sourceId);
  }
}
