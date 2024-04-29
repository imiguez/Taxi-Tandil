export type LatLng = {
  latitude: number;
  longitude: number;
};

export type LatLngDelta = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type LocationWithName = {
  location: LatLng;
  longStringLocation: string;
  shortStringLocation: string;
};

export type Ride = {
  origin: LatLng;
  destination: LatLng;
};

export type RideWithAddress = {
  origin: LocationWithName | null;
  destination: LocationWithName | null;
};

export type GoogleReverseGeocodeApiResponse = {
  plus_code: Pluscode;
  results: Result[];
  status: string;
};

interface Result {
  address_components: Addresscomponent[];
  formatted_address: string;
  geometry: Geometry;
  place_id: string;
  plus_code: Pluscode;
  types: string[];
}

interface Geometry {
  location: Location;
  location_type: string;
  viewport: Viewport;
}

interface Viewport {
  northeast: Location;
  southwest: Location;
}

interface Location {
  lat: number;
  lng: number;
}

interface Addresscomponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface Pluscode {
  compound_code: string;
  global_code: string;
}
