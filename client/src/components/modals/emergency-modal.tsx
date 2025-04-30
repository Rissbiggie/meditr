import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useEmergency } from "@/hooks/use-emergency";
import { Heartbeat } from "@/components/ui/heartbeat";
import { Loader2, MapPin, Ambulance, AlertTriangle } from "lucide-react";
import { LocationMap } from "@/components/maps/location-map";
import { useLocation } from "@/hooks/use-maps";
import { Icon } from "@/components/ui/icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

export function EmergencyModal() {
  const { toast } = useToast();
  const { 
    isEmergencyModalOpen, 
    closeEmergencyModal, 
    submitEmergency,
    isSubmittingEmergency
  } = useEmergency();

  const [emergencyType, setEmergencyType] = useState("");
  const [description, setDescription] = useState("");
  const { 
    getCurrentLocation,
    startWatchingLocation,
    stopWatchingLocation,
    latitude,
    longitude,
    accuracy,
    error: locationError,
    isLoading: isLoadingLocation 
  } = useLocation();

  const [locationData, setLocationData] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null>(null);

  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEmergencyModalOpen) {
      // Start watching location for real-time updates
      startWatchingLocation();
      
      // Get initial location
      fetchLocation();
    } else {
      stopWatchingLocation();
      // Reset state when modal closes
      setEmergencyType("");
      setDescription("");
      setLocationData(null);
      setRetryCount(0);
      setIsSubmitting(false);
    }

    return () => {
      stopWatchingLocation();
    };
  }, [isEmergencyModalOpen, startWatchingLocation, stopWatchingLocation]);

  // Update location data when coordinates change
  useEffect(() => {
    if (latitude && longitude) {
      setLocationData({
        latitude,
        longitude,
        accuracy: accuracy || undefined
      });
    }
  }, [latitude, longitude, accuracy]);

  const fetchLocation = async () => {
    try {
      const location = await getCurrentLocation();
      if (location) {
        setLocationData(location);
        setRetryCount(0); // Reset retry count on success
      } else if (retryCount < MAX_RETRIES) {
        // Retry with exponential backoff
        const timeout = Math.pow(2, retryCount) * 1000;
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchLocation();
        }, timeout);
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      toast({
        title: "Location Error",
        description: "Failed to get your location. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!emergencyType) {
      toast({
        title: "Emergency Type Required",
        description: "Please select an emergency type.",
        variant: "destructive",
      });
      return;
    }

    if (!locationData) {
      toast({
        title: "Location Required",
        description: "We need your location to send help. Please enable location access and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitEmergency({
        emergencyType,
        description: description || '',
        location: locationData
      });
    } catch (error) {
      console.error('Error submitting emergency:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit emergency alert. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeSelect = (type: string) => {
    setEmergencyType(type);
  };

  if (!isEmergencyModalOpen) return null;

  const showLocationError = locationError && (!locationData || retryCount >= MAX_RETRIES);
  const isDisabled = !emergencyType || isSubmitting || (showLocationError && !locationData);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-primary border border-accent/50 rounded-xl max-w-md w-full h-[90vh] shadow-2xl">
        <ScrollArea className="h-full p-5">
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto relative animate-pulse">
              <Heartbeat size="lg" className="text-[#EF4444]" />
            </div>
            <h2 className="text-white font-bold text-xl mt-2">Emergency Alert</h2>
            <p className="text-white/80">We're sending help your way</p>
          </div>

          <div className="bg-white/10 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-medium">Your Location</h3>
              {locationData && (
                <span className="bg-accent/20 text-accent text-xs px-2 py-1 rounded-full animate-pulse">
                  Live Tracking
                </span>
              )}
            </div>

            {showLocationError ? (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <div className="ml-2">
                  <h4 className="font-medium">Location Access Required</h4>
                  <p className="text-sm">{locationError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setRetryCount(0);
                      fetchLocation();
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              </Alert>
            ) : isLoadingLocation && !locationData ? (
              <div className="h-40 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
                <span className="ml-2 text-white/80">Getting your location...</span>
              </div>
            ) : locationData ? (
              <div className="h-40 rounded-lg overflow-hidden">
                <LocationMap 
                  latitude={locationData.latitude} 
                  longitude={locationData.longitude}
                  markers={[{
                    lat: locationData.latitude,
                    lng: locationData.longitude,
                    title: 'Your Location',
                  }]}
                />
                {locationData.accuracy && (
                  <div className="mt-2 text-xs text-white/60 text-center">
                    Accuracy: ±{Math.round(locationData.accuracy)}m
                  </div>
                )}
              </div>
            ) : (
              <div className="h-40 bg-gray-800/50 rounded-lg flex items-center justify-center">
                <div className="text-white/40 text-center">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-accent" />
                  <p className="text-sm">Unable to determine location</p>
                </div>
              </div>
            )}
          </div>

          <div className="mb-4">
            <h3 className="text-white font-medium mb-2">Emergency Type</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className={`bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg text-sm transition-all duration-300 ${emergencyType === 'Medical' ? 'bg-accent text-white' : ''}`}
                onClick={() => handleTypeSelect('Medical')}
                disabled={isSubmitting}
              >
                Medical
              </Button>
              <Button 
                variant="outline" 
                className={`bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg text-sm transition-all duration-300 ${emergencyType === 'Accident' ? 'bg-accent text-white' : ''}`}
                onClick={() => handleTypeSelect('Accident')}
                disabled={isSubmitting}
              >
                Accident
              </Button>
              <Button 
                variant="outline" 
                className={`bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg text-sm transition-all duration-300 ${emergencyType === 'Fire' ? 'bg-accent text-white' : ''}`}
                onClick={() => handleTypeSelect('Fire')}
                disabled={isSubmitting}
              >
                Fire
              </Button>
              <Button 
                variant="outline" 
                className={`bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg text-sm transition-all duration-300 ${emergencyType === 'Other' ? 'bg-accent text-white' : ''}`}
                onClick={() => handleTypeSelect('Other')}
                disabled={isSubmitting}
              >
                Other
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-white font-medium mb-2">Additional Information</h3>
            <Textarea 
              className="w-full bg-white/10 rounded-lg p-3 text-white border border-white/10 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent h-24"
              placeholder="Describe your emergency situation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex space-x-3">
            <Button 
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg"
              onClick={closeEmergencyModal}
              disabled={isSubmitting}
            >
              Cancel Emergency
            </Button>
            <Button 
              className="flex-1 bg-accent hover:bg-accent/90 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center"
              onClick={handleSubmit}
              disabled={isDisabled}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Ambulance className="mr-2 h-4 w-4" />
                  Confirm
                </>
              )}
            </Button>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export default EmergencyModal;