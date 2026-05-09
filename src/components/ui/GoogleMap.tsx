"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { MapPin, Locate } from "lucide-react";

interface LatLng { lat: number; lng: number }

export interface MapMarker {
  position: LatLng;
  label: string;
  type: "rider" | "destination" | "order";
}

interface Props {
  /** Single rider location (tracking mode) */
  riderLocation?: LatLng;
  /** Single destination (tracking mode) */
  destinationLocation?: LatLng;
  /** Multiple markers (admin live map) */
  markers?: MapMarker[];
  /** If true, user can click map or use GPS to pick a delivery location */
  pickMode?: boolean;
  /** Called when user picks a location in pickMode */
  onLocationPicked?: (coords: LatLng, address: string) => void;
  /** Override default zoom (15) */
  zoom?: number;
  height?: string;
  className?: string;
}

// Lamu Town default centre
const LAMU: LatLng = { lat: -2.2694, lng: 40.9023 };

const MAP_STYLES = [
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0096B4" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f0f4f8" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e2e8f0" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

const RIDER_ICON_URL = "https://maps.google.com/mapfiles/ms/icons/motorcycling.png";
const DEST_ICON_URL  = "https://maps.google.com/mapfiles/ms/icons/red-dot.png";
const ORDER_ICON_URL = "https://maps.google.com/mapfiles/ms/icons/orange-dot.png";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const HAS_KEY = !!API_KEY && API_KEY !== "your_google_maps_api_key";

export default function GoogleMapComponent({
  riderLocation,
  destinationLocation,
  markers,
  pickMode = false,
  onLocationPicked,
  zoom = 15,
  height = "h-64",
  className = "",
}: Props) {
  const [pickedLocation, setPickedLocation] = useState<LatLng | null>(destinationLocation ?? null);
  const [center, setCenter] = useState<LatLng>(
    riderLocation ?? destinationLocation ?? markers?.[0]?.position ?? LAMU
  );
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: API_KEY,
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

  // ── No API key fallback ──
  if (!HAS_KEY) {
    return (
      <div className={`bg-gradient-to-br from-navy to-teal rounded-2xl ${height} flex flex-col items-center justify-center gap-3 ${className}`}>
        <div className="text-5xl">🗺️</div>
        <p className="font-josefin text-white font-semibold text-sm">Live Map — Lamu · Shela · Manda</p>
        <p className="font-josefin text-white/50 text-xs text-center px-4">
          Add <span className="font-mono bg-white/10 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</span> to enable
        </p>
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

  const iconSize = new google.maps.Size(36, 36);

  return (
    <div className={`relative rounded-2xl overflow-hidden ${height} ${className}`}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center}
        zoom={zoom}
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
        {/* Single rider marker (tracking mode) */}
        {riderLocation && (
          <Marker
            position={riderLocation}
            title="Rider"
            icon={{ url: RIDER_ICON_URL, scaledSize: iconSize }}
          />
        )}

        {/* Single destination marker */}
        {(pickedLocation ?? destinationLocation) && (
          <Marker
            position={pickedLocation ?? destinationLocation!}
            title="Delivery location"
            icon={{ url: DEST_ICON_URL, scaledSize: iconSize }}
          />
        )}

        {/* Multiple markers (admin live map) */}
        {markers?.map((m) => (
          <Marker
            key={m.label}
            position={m.position}
            title={m.label}
            label={{
              text: m.label,
              color: "#ffffff",
              fontSize: "11px",
              fontFamily: "Outfit, sans-serif",
              fontWeight: "700",
            }}
            icon={{
              url: m.type === "rider" ? RIDER_ICON_URL : m.type === "destination" ? DEST_ICON_URL : ORDER_ICON_URL,
              scaledSize: iconSize,
              labelOrigin: new google.maps.Point(18, -8),
            }}
          />
        ))}
      </GoogleMap>

      {/* GPS button */}
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
