import React from "react";
import { GoogleMap, Marker, LoadScript } from "@react-google-maps/api";

const containerStyle: React.CSSProperties = {
  width: "100%",
  height: "380px",
  borderRadius: "16px",
};

type Props = {
  lat?: number;
  lng?: number;
  zoom?: number;
};

const GoogleMapView: React.FC<Props> = ({
  lat = 16.0544, // Đà Nẵng mặc định
  lng = 108.2022,
  zoom = 14,
}) => {
  const center = { lat, lng };

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={zoom}>
        <Marker position={center} />
      </GoogleMap>
    </LoadScript>
  );
};

export default GoogleMapView;
