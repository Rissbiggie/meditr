/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Marker {
  lat: number;
  lng: number;
  title: string;
  icon?: string;
  info?: string;
}

interface LocationMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  markers?: Marker[];
  className?: string;
  onMarkerClick?: (marker: Marker) => void;
}

export function LocationMap({ 
  latitude, 
  longitude, 
  zoom = 15, 
  markers = [],
  className,
  onMarkerClick
}: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [infoWindow, setInfoWindow] = useState<any>(null);
  const { toast } = useToast();

  // Cleanup function to remove markers
  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
  };

  useEffect(() => {
    let scriptLoaded = false;
    let mapInitialized = false;

    // Initialize map when component mounts
    if (!mapRef.current) return;

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      const error = 'Google Maps API key is not configured';
      console.error(error);
      setMapError(error);
      toast({
        title: "Map Error",
        description: error,
        variant: "destructive",
      });
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onerror = () => {
      const error = 'Failed to load Google Maps. Please check your internet connection.';
      console.error(error);
      setMapError(error);
      toast({
        title: "Map Error",
        description: error,
        variant: "destructive",
      });
    };

    script.onload = () => {
      scriptLoaded = true;
      initMap();
    };

    document.head.appendChild(script);

    function initMap() {
      if (!mapRef.current || mapInitialized) return;
      
      try {
        console.log('Initializing map with coordinates:', { latitude, longitude });
        
        // Create the map instance
        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center: { lat: latitude, lng: longitude },
          zoom: zoom,
          disableDefaultUI: false,
          styles: [
            {
              "elementType": "geometry",
              "stylers": [{ "color": "#242f3e" }]
            },
            {
              "elementType": "labels.text.stroke",
              "stylers": [{ "color": "#242f3e" }]
            },
            {
              "elementType": "labels.text.fill",
              "stylers": [{ "color": "#746855" }]
            },
            {
              "featureType": "administrative.locality",
              "elementType": "labels.text.fill",
              "stylers": [{ "color": "#d59563" }]
            },
            {
              "featureType": "poi",
              "elementType": "labels.text.fill",
              "stylers": [{ "color": "#d59563" }]
            },
            {
              "featureType": "poi.park",
              "elementType": "geometry",
              "stylers": [{ "color": "#263c3f" }]
            },
            {
              "featureType": "poi.park",
              "elementType": "labels.text.fill",
              "stylers": [{ "color": "#6b9a76" }]
            },
            {
              "featureType": "road",
              "elementType": "geometry",
              "stylers": [{ "color": "#38414e" }]
            },
            {
              "featureType": "road",
              "elementType": "geometry.stroke",
              "stylers": [{ "color": "#212a37" }]
            },
            {
              "featureType": "road",
              "elementType": "labels.text.fill",
              "stylers": [{ "color": "#9ca5b3" }]
            },
            {
              "featureType": "road.highway",
              "elementType": "geometry",
              "stylers": [{ "color": "#746855" }]
            },
            {
              "featureType": "road.highway",
              "elementType": "geometry.stroke",
              "stylers": [{ "color": "#1f2835" }]
            },
            {
              "featureType": "road.highway",
              "elementType": "labels.text.fill",
              "stylers": [{ "color": "#f3d19c" }]
            },
            {
              "featureType": "transit",
              "elementType": "geometry",
              "stylers": [{ "color": "#2f3948" }]
            },
            {
              "featureType": "transit.station",
              "elementType": "labels.text.fill",
              "stylers": [{ "color": "#d59563" }]
            },
            {
              "featureType": "water",
              "elementType": "geometry",
              "stylers": [{ "color": "#17263c" }]
            },
            {
              "featureType": "water",
              "elementType": "labels.text.fill",
              "stylers": [{ "color": "#515c6d" }]
            },
            {
              "featureType": "water",
              "elementType": "labels.text.stroke",
              "stylers": [{ "color": "#17263c" }]
            }
          ]
        });

        // Create info window instance
        const infoWindow = new google.maps.InfoWindow();
        setInfoWindow(infoWindow);

        // Add user location marker
        const userMarker = new google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map: mapInstanceRef.current,
          title: 'Your Location',
          zIndex: 1000,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillOpacity: 1,
            fillColor: '#EF4444',
            strokeWeight: 2,
            strokeColor: '#FFFFFF',
          }
        });
        markersRef.current.push(userMarker);

        // Add additional markers
        markers.forEach(marker => {
          const markerInstance = new google.maps.Marker({
            position: { lat: marker.lat, lng: marker.lng },
            map: mapInstanceRef.current,
            title: marker.title,
            icon: marker.icon,
          });
          markersRef.current.push(markerInstance);

          // Add click listener to marker
          markerInstance.addListener('click', () => {
            // Close any open info window
            infoWindow.close();

            if (marker.info) {
              // Set info window content and open it
              infoWindow.setContent(marker.info);
              infoWindow.open(mapInstanceRef.current, markerInstance);
            }

            // Call onMarkerClick callback if provided
            if (onMarkerClick) {
              onMarkerClick(marker);
            }
          });
        });

        mapInitialized = true;
        setMapError(null);
      } catch (error) {
        const errorMessage = 'Error initializing map: ' + (error instanceof Error ? error.message : String(error));
        console.error(errorMessage);
        setMapError(errorMessage);
        toast({
          title: "Map Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }

    return () => {
      if (scriptLoaded) {
        clearMarkers();
        if (infoWindow) {
          infoWindow.close();
        }
      }
    };
  }, [latitude, longitude, zoom, markers, toast, onMarkerClick]);

  // Update map center when position changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.setCenter({ lat: latitude, lng: longitude });
        clearMarkers();
        
        // Re-add user location marker
        const userMarker = new google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map: mapInstanceRef.current,
          title: 'Your Location',
          zIndex: 1000,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillOpacity: 1,
            fillColor: '#EF4444',
            strokeWeight: 2,
            strokeColor: '#FFFFFF',
          }
        });
        markersRef.current.push(userMarker);
        
        // Re-add facility markers
        markers.forEach(marker => {
          const markerInstance = new google.maps.Marker({
            position: { lat: marker.lat, lng: marker.lng },
            map: mapInstanceRef.current,
            title: marker.title,
            icon: marker.icon,
          });
          markersRef.current.push(markerInstance);
        });
      } catch (error) {
        console.error('Error updating map center:', error);
      }
    }
  }, [latitude, longitude, markers]);

  if (mapError) {
    return (
      <div className={`w-full h-full rounded-lg overflow-hidden bg-destructive/10 flex items-center justify-center ${className || ''}`}>
        <p className="text-destructive text-sm p-4 text-center">{mapError}</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .custom-map-control {
          margin: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .custom-map-control:hover {
          background-color: #f3f4f6;
        }
      `}</style>
      <div 
        ref={mapRef} 
        className={`w-full h-full rounded-lg overflow-hidden ${className || ''}`}
      />
    </>
  );
}

export default LocationMap;
