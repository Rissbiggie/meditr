import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface GeoLocationError {
  code: number;
  message: string;
}

interface GeoLocationOptions {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
}

interface UseLocationResult {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  isLoading: boolean;
  accuracy: number | null;
  timestamp: number | null;
  getCurrentLocation: () => Promise<{ latitude: number; longitude: number; accuracy?: number; } | null>;
  startWatchingLocation: () => void;
  stopWatchingLocation: () => void;
}

export function useLocation(): UseLocationResult {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [watchId, setWatchId] = useState<number | null>(null);
  const { toast } = useToast();

  const highAccuracyOptions: GeoLocationOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0
  };

  const lowAccuracyOptions: GeoLocationOptions = {
    enableHighAccuracy: false,
    timeout: 10000,
    maximumAge: 30000
  };

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setLatitude(position.coords.latitude);
    setLongitude(position.coords.longitude);
    setAccuracy(position.coords.accuracy);
    setTimestamp(position.timestamp);
    setError(null);
    setIsLoading(false);
  }, []);

  const handleError = useCallback((error: GeoLocationError) => {
    let errorMessage = '';
    switch (error.code) {
      case 1:
        errorMessage = 'Location access denied. Please enable location services in your browser settings and refresh the page.';
        break;
      case 2:
        errorMessage = 'Location unavailable. Please check your device\'s location settings.';
        break;
      case 3:
        errorMessage = 'Location request timed out. Please try again.';
        break;
      default:
        errorMessage = error.message;
    }
    
    setError(errorMessage);
    setIsLoading(false);
    toast({
      title: "Location Error",
      description: errorMessage,
      variant: "destructive",
    });
  }, [toast]);

  const getCurrentLocation = useCallback(async (): Promise<{ latitude: number; longitude: number; accuracy?: number; } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const errorMsg = "Geolocation is not supported by your browser";
        setError(errorMsg);
        setIsLoading(false);
        toast({
          title: "Location Error",
          description: errorMsg,
          variant: "destructive",
        });
        resolve(null);
        return;
      }

      setIsLoading(true);

      // Try high accuracy first
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          handleSuccess(position);
          resolve({ latitude, longitude, accuracy });
        },
        // If high accuracy fails, try low accuracy
        (error) => {
          if (error.code === 2) { // POSITION_UNAVAILABLE
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                handleSuccess(position);
                resolve({ latitude, longitude, accuracy });
              },
              (lowAccError) => {
                handleError(lowAccError);
                resolve(null);
              },
              lowAccuracyOptions
            );
          } else {
            handleError(error);
            resolve(null);
          }
        },
        highAccuracyOptions
      );
    });
  }, [handleSuccess, handleError, toast]);

  const startWatchingLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    // Clear existing watch
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }

    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      highAccuracyOptions
    );

    setWatchId(id);
  }, [handleSuccess, handleError, watchId]);

  const stopWatchingLocation = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  useEffect(() => {
    // Check permissions on mount
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'denied') {
          setError("Location access denied. Please enable it in your browser settings and refresh the page.");
          setIsLoading(false);
          toast({
            title: "Location Access Required",
            description: "Please enable location access in your browser settings and refresh the page to use this feature",
            variant: "destructive",
          });
          return;
        }
        
        // Get initial location
        getCurrentLocation();
      });
    } else {
      // Fallback for browsers that don't support permissions API
      getCurrentLocation();
    }

    return () => {
      stopWatchingLocation();
    };
  }, [getCurrentLocation, stopWatchingLocation, toast]);

  return { 
    latitude, 
    longitude, 
    error, 
    isLoading, 
    accuracy,
    timestamp,
    getCurrentLocation,
    startWatchingLocation,
    stopWatchingLocation
  };
}

// Calculate distance between two points
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
