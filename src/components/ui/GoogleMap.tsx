"use client";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";

interface LatLng { lat: number; lng: number }

interface Props {
  center?: LatLng;
  riderLocation?: LatLng;
  destinationLocation?: LatLng;
  height?: string;
  className?: string;
}

// Default center: Lamu Town
const LAMU_CENTER: LatLng = { lat: -2.2694, lng: 40.9023 };

const mapStyles = [
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0096B4" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
];

export default function GoogleMapComponent({
  center = LAMU_CENTER,
  riderLocation,
  destinationLocation,
  height = "h-64",
  className = "",
}: Props) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  });

  if (loadError || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === "your_google_maps_api_key") {
    return (
      <div className={`bg-gradient-to-br from-navy to-teal rounded-2xl ${height} flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="text-5xl mb-2">🗺️</div>
          <p className="font-josefin text-white font-semibold text-sm">Live Map</p>
          <p className="font-josefin text-white/60 text-xs">Lamu · Shela · Manda</p>
        </div>
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
    <div className={`rounded-2xl overflow-hidden ${height} ${className}`}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={riderLocation ?? center}
        zoom={14}
        options={{
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "cooperative",
        }}
      >
        {riderLocation && (
          <Marker
            position={riderLocation}
            label={{ text: "🛵", fontSize: "20px" }}
            title="Rider"
          />
        )}
        {destinationLocation && (
          <Marker
            position={destinationLocation}
            label={{ text: "📍", fontSize: "20px" }}
            title="Destination"
          />
        )}
      </GoogleMap>
    </div>
  );
}
