// types.ts
export type MarkerType = {
  id: number;
  latitude: number;
  longitude: number;
};

export type RouteType = {
  id: number;
  name: string;
  createdAt: number;
};

export type RoutePointType = {
  id: number;
  routeId: number;
  markerId: number;
  sequence: number;
  latitude: number;
  longitude: number;
};
