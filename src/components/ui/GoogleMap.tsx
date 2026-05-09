"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { MapPin, Locate } from "lucide-react";

interface LatLng { lat: number; lng: number }

interface Props {
  /** Fixed rider location (tracking mode) */
  riderLocation?: LatLng;
  /** Fixed destination (tracking mode) */
  destinationLocation?: LatLng;
  /** If true, user can click map or use GPS to pick a delivery location */
  pickMode?: boolean;
  /** Called when user picks a location in pickMode */
  onLocationPicked?: (coords: LatLng, address: string) => void;
  height?: string;
  className?: string;
}

// Lamu Town default
const LAMU: LatLng = { lat: -2.2694, lng: 40.9023 };

const MAP_STYLES = [
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0096B4" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f0f4f8" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e2e8f0" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const HAS_KEY = !!API_KEY && API_KEY !== "your_google_maps_api_key";

export default function GoogleMapComponent({
  riderLocation,
  destinationLocation,
  pickMode = false,
  onLocationPicked,
  height = "h-64",
  className = "",
}: Props) {
  const [pickedLocation, setPickedLocation] = useState<LatLng | null>(destinationLocation ?? null);
  const [center, setCenter] = useState<LatLng>(riderLocation ?? destinationLocation ?? LAMU);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: API_KEY,
    // Only load if we have a key
    id: HAS_KEY ? "google-maps-script" : "",
  });

  const reverseGeocode = useCallback((coords: LatLng) => {
    if (!geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder();
    }
    geocoderRef.current.geocode({ location: coords }, (results, status) => {
      const address =
        status === "OK" && results?.[0]
          ? results[0].formatted_address
          : `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
      onLocationPicked?.(coords, address);
    });
  }, [onLocationPicked]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!pickMode || !e.latLng) return;
    const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setPickedLocation(coords);
    setCenter(coords);
    reverseGeocode(coords);
  }, [pickMode, reverseGeocode]);

  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation not supported by your browser");
      return;
    }
    setGpsLoading(true);
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPickedLocation(coords);
        setCenter(coords);
        setGpsLoading(false);
        reverseGeocode(coords);
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(
          err.code === 1
            ? "Location access denied. Please allow location or tap the map."
            : "Could not get your location. Tap the map to pin manually."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [reverseGeocode]);

  // Auto-request GPS when in pick mode
  useEffect(() => {
    if (pickMode && HAS_KEY && isLoaded && !pickedLocation) {
      handleGPS();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  if (!HAS_KEY) {
    return (
      <div className={`bg-gradient-to-br from-navy to-teal rounded-2xl ${height} flex flex-col items-center justify-center gap-3 ${className}`}>
        <div className="text-5xl">🗺️</div>
        <p className="font-josefin text-white font-semibold text-sm">Live Map — Lamu · Shela · Manda</p>
        <p className="font-josefin text-white/50 text-xs">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`bg-gray-100 rounded-2xl ${height} flex items-center justify-center animate-pulse ${className}`}>
        <p className="font-josefin text-gray-400 text-sm">Loading map...</p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden ${height} ${className}`}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center}
        zoom={15}
        onClick={handleMapClick}
        options={{
          styles: MAP_STYLES,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "cooperative",
          clickableIcons: false,
          cursor: pickMode ? "crosshair" : "grab",
        }}
      >
        {riderLocation && (
          <Marker
            position={riderLocation}
            title="Rider"
            icon={{ url: "https://maps.google.com/mapfiles/ms/icons/motorcycling.png", scaledSize: new google.maps.Size(40, 40) }}
          />
        )}
        {(pickedLocation ?? destinationLocation) && (
          <Marker
            position={pickedLocation ?? destinationLocation!}
            title="Delivery location"
            icon={{ url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png", scaledSize: new google.maps.Size(40, 40) }}
          />
        )}
      </GoogleMap>

      {/* GPS button — shown in pick mode */}
      {pickMode && (
        <button
          onClick={handleGPS}
          disabled={gpsLoading}
          className="absolute bottom-4 right-4 bg-white shadow-lg rounded-xl px-3 py-2 flex items-center gap-2 font-josefin text-navy text-sm font-semibold hover:bg-navy hover:text-white transition-colors disabled:opacity-60"
        >
          <Locate className={`w-4 h-4 ${gpsLoading ? "animate-spin" : ""}`} />
          {gpsLoading ? "Locating..." : "Use my location"}
        </button>
      )}

      {/* Tap-to-pin hint */}
      {pickMode && !pickedLocation && !gpsLoading && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-navy/80 text-white text-xs font-josefin px-3 py-1.5 rounded-lg flex items-center gap-1.5 backdrop-blur-sm">
          <MapPin className="w-3 h-3" /> Tap map to pin your location
        </div>
      )}

      {/* GPS error */}
      {gpsError && (
        <div className="absolute top-3 left-3 right-3 bg-red-500/90 text-white text-xs font-josefin px-3 py-2 rounded-lg backdrop-blur-sm">
          {gpsError}
        </div>
      )}
    </div>
  );
}
