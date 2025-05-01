import { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient, getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/hooks/use-maps';
import { connectWebSocket, sendWSMessage, addWSListener } from '@/lib/websocket';
import { 
  EmergencyAlert, 
  InsertEmergencyAlert, 
  AmbulanceUnit,
  MedicalFacility,
  User as SelectUser
} from '@shared/schema';

interface EmergencySubmissionData {
  emergencyType: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  severity: 'low' | 'medium' | 'high';
  symptoms?: string[];
  patientCount?: number;
}

interface EmergencyContextType {
  isEmergencyModalOpen: boolean;
  openEmergencyModal: () => void;
  closeEmergencyModal: () => void;
  submitEmergency: (data: EmergencySubmissionData) => Promise<void>;
  isSubmittingEmergency: boolean;
  activeEmergencies: EmergencyAlert[] | null;
  isLoadingEmergencies: boolean;
  nearbyAmbulances: AmbulanceUnit[] | null;
  nearbyFacilities: MedicalFacility[] | null;
  userEmergencyHistory: EmergencyAlert[] | null;
}

const EmergencyContext = createContext<EmergencyContextType | null>(null);

export function EmergencyProvider({ children }: { children: ReactNode }) {
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const { toast } = useToast();
  const { getCurrentLocation, startWatchingLocation, stopWatchingLocation } = useLocation();
  
  // Get current user directly from the API instead of using useAuth
  const { data: user = null } = useQuery<SelectUser | null>({
    queryKey: ['/api/user'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  // Get active emergencies
  const {
    data: activeEmergencies = null,
    isLoading: isLoadingEmergencies,
  } = useQuery<EmergencyAlert[]>({
    queryKey: ['/api/emergencies/active'],
    enabled: !!user,
  });

  // Get nearby ambulances with location
  const {
    data: nearbyAmbulances = null,
  } = useQuery<AmbulanceUnit[]>({
    queryKey: ['/api/ambulances/nearby'],
    queryFn: async () => {
      const location = await getCurrentLocation();
      if (!location) return [];
      
      const res = await apiRequest(
        'GET', 
        `/api/ambulances/nearby?latitude=${location.latitude}&longitude=${location.longitude}`
      );
      return await res.json();
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get nearby medical facilities with location
  const {
    data: nearbyFacilities = null,
  } = useQuery<MedicalFacility[]>({
    queryKey: ['/api/facilities/nearby'],
    queryFn: async () => {
      const location = await getCurrentLocation();
      if (!location) return [];
      
      const res = await apiRequest(
        'GET', 
        `/api/facilities/nearby?latitude=${location.latitude}&longitude=${location.longitude}`
      );
      return await res.json();
    },
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute
  });

  // Get user emergency history
  const {
    data: userEmergencyHistory = null,
  } = useQuery<EmergencyAlert[]>({
    queryKey: ['/api/emergencies/user'],
    enabled: !!user,
  });

  // Create emergency
  const { mutate: submitEmergencyMutation, isPending: isSubmittingEmergency } = useMutation({
    mutationFn: async (data: EmergencySubmissionData) => {
      if (!user) {
        throw new Error('You must be logged in to submit an emergency');
      }
      
      if (!data.location) {
        throw new Error('Location data is required');
      }
      
      const emergencyData: InsertEmergencyAlert = {
        userId: user.id,
        latitude: data.location.latitude.toString(),
        longitude: data.location.longitude.toString(),
        accuracy: data.location.accuracy?.toString(),
        emergencyType: data.emergencyType,
        description: data.description || '',
        priority: data.severity,
        requiredResources: JSON.stringify({
          patientCount: data.patientCount || 1,
          symptoms: data.symptoms || [],
          severity: data.severity
        })
      };
      
      const res = await apiRequest('POST', '/api/emergencies', emergencyData);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to submit emergency alert' }));
        throw new Error(errorData.message || 'Failed to submit emergency alert');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      setIsEmergencyModalOpen(false);
      toast({
        title: "Emergency Submitted",
        description: "Help is on the way. Stay calm and wait for assistance.",
      });
      
      // Start tracking location more frequently during emergency
      startWatchingLocation();
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/emergencies/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/emergencies/user'] });
      
      // Broadcast emergency via WebSocket
      sendWSMessage('emergency_broadcast', {
        id: data.id,
        userId: user?.id,
        type: data.emergencyType,
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy
        }
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Emergency Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const submitEmergency = async (data: EmergencySubmissionData) => {
    try {
      await submitEmergencyMutation(data);
    } catch (error) {
      // Error will be handled by onError callback
      throw error;
    }
  };

  const openEmergencyModal = () => setIsEmergencyModalOpen(true);
  const closeEmergencyModal = () => {
    setIsEmergencyModalOpen(false);
    stopWatchingLocation(); // Stop tracking location when modal is closed
  };

  // Set up WebSocket connection and listeners
  useEffect(() => {
    // Connect to WebSocket
    connectWebSocket();

    // Set up listener for real-time updates
    const removeListener = addWSListener((data) => {
      if (data.type === 'emergency_broadcast') {
        // Invalidate queries to get fresh data
        queryClient.invalidateQueries({ queryKey: ['/api/emergencies/active'] });
        
        // Show a toast notification for others' emergencies
        if (data.data.userId !== user?.id) {
          toast({
            title: "New Emergency Alert",
            description: `A new ${data.data.emergencyType} emergency has been reported nearby.`,
          });
        }
      }
      
      if (data.type === 'location_update') {
        // Invalidate queries for ambulances and facilities
        queryClient.invalidateQueries({ queryKey: ['/api/ambulances/nearby'] });
        queryClient.invalidateQueries({ queryKey: ['/api/facilities/nearby'] });
      }

      if (data.type === 'emergency_status_update' && data.data.userId === user?.id) {
        toast({
          title: "Emergency Update",
          description: data.data.message,
          variant: data.data.status === 'resolved' ? 'default' : 'accent',
        });
      }
    });

    // Clean up listener on unmount
    return () => {
      removeListener();
      stopWatchingLocation();
    };
  }, [toast, user?.id]);
  
  // Send location updates if user is logged in and has an active emergency
  useEffect(() => {
    if (!user || !activeEmergencies?.some(e => e.userId === user.id)) return;
    
    let locationInterval: NodeJS.Timeout;
    
    const updateLocation = async () => {
      try {
        const location = await getCurrentLocation();
        if (location && location.accuracy && location.accuracy <= 100) { // Only send if accuracy is within 100 meters
          sendWSMessage('location_update', {
            type: 'location_update',
            id: user.id,
            role: user.role,
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error('Failed to send location update:', error);
        // If there's an error, try reconnecting WebSocket
        connectWebSocket();
      }
    };

    // Initial update
    updateLocation();
    
    // Set interval for updates - 30 seconds is more battery-friendly
    locationInterval = setInterval(updateLocation, 30000);
    
    return () => {
      if (locationInterval) {
        clearInterval(locationInterval);
      }
    };
  }, [user, activeEmergencies, getCurrentLocation]);

  return (
    <EmergencyContext.Provider
      value={{
        isEmergencyModalOpen,
        openEmergencyModal,
        closeEmergencyModal,
        submitEmergency,
        isSubmittingEmergency,
        activeEmergencies,
        isLoadingEmergencies,
        nearbyAmbulances,
        nearbyFacilities,
        userEmergencyHistory,
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
}

export function useEmergency() {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
}
