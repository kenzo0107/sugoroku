import { geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import land from "world-atlas/land-110m.json";
import { MAP } from "./mapLayout";

export const projection = geoEquirectangular()
  .rotate([-MAP.centerLon, 0])
  .scale(MAP.width / (2 * Math.PI))
  .translate([MAP.width / 2, MAP.north]);

const topology = land as unknown as Topology<{ land: GeometryCollection }>;

export const LAND_PATH = geoPath(projection)(feature(topology, topology.objects.land)) ?? "";
