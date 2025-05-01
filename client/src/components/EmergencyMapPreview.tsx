import React from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';

interface EmergencyMapPreviewProps {
  latitude: string;
  longitude: string;
}

const containerStyle = {
  width: '200px',
  height: '200px',
  borderRadius: '8px',
  overflow: 'hidden'
};

export function EmergencyMapPreview({ latitude, longitude }: EmergencyMapPreviewProps) {
  const center = {
    lat: parseFloat(latitude),
    lng: parseFloat(longitude)
  };

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      options={{
        disableDefaultUI: true,
        zoomControl: false,
        streetViewControl: false,
        mapTypeControl: false,
      }}
    >
      <Marker position={center} />
    </GoogleMap>
  );
} 