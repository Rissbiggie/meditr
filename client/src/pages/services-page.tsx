import { useState, useMemo, useEffect } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEmergency } from "@/hooks/use-emergency";
import { EmergencyModal } from "@/components/modals/emergency-modal";
import { LocationMap } from "@/components/maps/location-map";
import { useLocation, calculateDistance } from "@/hooks/use-maps";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type FacilityType = "all" | "hospitals" | "urgent" | "pharmacies" | "specialists";
type SortOption = "distance" | "rating" | "name";

interface EnhancedFacility {
  id: number;
  name: string;
  type: string;
  latitude: string;
  longitude: string;
  rating: string | null;
  openHours: string | null;
  distance: number;
  address: string;
  phone: string | null;
  capacity?: number | null;
  currentOccupancy?: number | null;
  lastUpdate?: Date | null;
  googlePlaceId?: string | null;
  updatedAt?: Date | null;
}

export default function ServicesPage() {
  const [activeFilter, setActiveFilter] = useState<FacilityType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("distance");
  const [selectedFacility, setSelectedFacility] = useState<EnhancedFacility | null>(null);
  const { nearbyFacilities, isLoadingEmergencies } = useEmergency();
  const { latitude, longitude, error: locationError, isLoading: isLoadingLocation } = useLocation();
  const { toast } = useToast();

  // Show loading state for both location and facilities
  const isLoading = isLoadingLocation || isLoadingEmergencies;

  // Calculate distances and enhance facilities with additional info
  const enhancedFacilities = useMemo(() => {
    if (!latitude || !longitude || !nearbyFacilities) return [];

    return nearbyFacilities.map(facility => ({
      ...facility,
      distance: calculateDistance(
        latitude,
        longitude,
        parseFloat(facility.latitude),
        parseFloat(facility.longitude)
      )
    }));
  }, [latitude, longitude, nearbyFacilities]);

  // Show error if location is required but not available
  useEffect(() => {
    if (locationError) {
      toast({
        title: "Location Error",
        description: locationError,
        variant: "destructive",
      });
    }
  }, [locationError, toast]);

  // Filter and sort facilities
  const filteredFacilities = useMemo(() => {
    let filtered = enhancedFacilities.filter(facility => {
      const matchesSearch = searchQuery.length === 0 || 
        facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        facility.address.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = activeFilter === "all" || 
        (activeFilter === "hospitals" && facility.type === "Hospital") ||
        (activeFilter === "urgent" && facility.type === "Urgent Care") ||
        (activeFilter === "pharmacies" && facility.type === "Pharmacy") ||
        (activeFilter === "specialists" && facility.type === "Specialist");
      
      return matchesSearch && matchesType;
    });

    // Sort facilities
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "distance":
          return a.distance - b.distance;
        case "rating":
          return (parseFloat(b.rating || "0") - parseFloat(a.rating || "0"));
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [enhancedFacilities, searchQuery, activeFilter, sortBy]);

  // Format distance for display
  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  };

  return (
    <div className="min-h-screen bg-primary pb-20">
      <AppHeader title="Find Services" />

      <main className="pt-20 px-4">
        <div className="fade-in">
          {/* Search and Filter Section */}
          <Card className="bg-white/10 backdrop-blur-sm rounded-xl mb-6 border-none">
            <CardContent className="p-4">
              <h2 className="text-white font-semibold text-lg mb-3">Find Medical Services</h2>
              <div className="relative mb-4">
                <Input
                  type="text"
                  placeholder="Search by name or address..."
                  className="w-full bg-white/20 rounded-lg pl-10 pr-4 py-3 text-white border border-white/10 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={isLoading}
                />
                <i className="fas fa-search absolute left-3 top-3.5 text-white/70"></i>
              </div>
              <div className="flex overflow-x-auto space-x-3 pb-2 mb-4 hide-scrollbar">
                {['all', 'hospitals', 'urgent', 'pharmacies', 'specialists'].map((type) => (
                  <Button
                    key={type}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm ${
                      activeFilter === type
                        ? "bg-secondary text-primary"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                    onClick={() => setActiveFilter(type as FacilityType)}
                    disabled={isLoading}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Map Section */}
          <div className="h-64 rounded-xl mb-4 overflow-hidden">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
              </div>
            ) : locationError ? (
              <div className="w-full h-full bg-destructive/10 flex items-center justify-center">
                <p className="text-destructive text-sm p-4 text-center">{locationError}</p>
              </div>
            ) : latitude && longitude ? (
              <LocationMap
                latitude={latitude}
                longitude={longitude}
                zoom={13}
                markers={filteredFacilities?.map(facility => ({
                  lat: parseFloat(facility.latitude),
                  lng: parseFloat(facility.longitude),
                  title: facility.name,
                  icon: facility.type === 'Hospital' 
                    ? '/icons/hospital.png' 
                    : facility.type === 'Pharmacy'
                    ? '/icons/pharmacy.png'
                    : '/icons/clinic.png',
                  info: `
                    <div class="text-sm">
                      <h3 class="font-semibold">${facility.name}</h3>
                      <p class="text-gray-600">${facility.address}</p>
                      <p class="text-gray-600">
                        ${facility.rating ? `⭐ ${facility.rating} • ` : ''}
                        ${formatDistance(facility.distance)}
                      </p>
                      ${facility.openHours ? `<p class="text-green-600">Open • ${facility.openHours}</p>` : ''}
                      ${facility.phone ? `<p class="text-blue-600">${facility.phone}</p>` : ''}
                    </div>
                  `
                }))}
                onMarkerClick={(marker) => {
                  const facility = filteredFacilities.find(
                    f => parseFloat(f.latitude) === marker.lat && parseFloat(f.longitude) === marker.lng
                  );
                  if (facility) {
                    setSelectedFacility(facility);
                  }
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-800/50 flex items-center justify-center">
                <div className="text-white/40 text-center">
                  <i className="fas fa-map-marked-alt text-3xl mb-2"></i>
                  <p className="text-sm">Waiting for location...</p>
                </div>
              </div>
            )}
          </div>

          {/* Nearby Services Section */}
          <Card className="bg-white/10 backdrop-blur-sm rounded-xl mb-6 border-none">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-white font-semibold">Nearby Services</h3>
                <Select 
                  value={sortBy} 
                  onValueChange={(value: SortOption) => setSortBy(value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-[140px] bg-white/10 border-none text-white">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                {isLoading ? (
                  // Loading skeletons
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center bg-white/5 p-3 rounded-lg">
                      <Skeleton className="w-14 h-14 rounded-lg mr-3" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))
                ) : filteredFacilities && filteredFacilities.length > 0 ? (
                  filteredFacilities.map((facility) => (
                    <div 
                      key={facility.id} 
                      className={`flex items-center bg-white/5 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedFacility?.id === facility.id ? 'bg-white/20' : 'hover:bg-white/10'
                      }`}
                      onClick={() => setSelectedFacility(facility)}
                    >
                      <div className="w-14 h-14 rounded-lg bg-gray-700 mr-3 flex items-center justify-center overflow-hidden">
                        <i className={`fas fa-${facility.type === 'Hospital' ? 'hospital' : facility.type === 'Pharmacy' ? 'prescription-bottle-alt' : 'clinic-medical'} text-white/60 text-xl`}></i>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium text-sm">{facility.name}</h3>
                        <div className="flex items-center text-white/60 text-xs">
                          {facility.rating && (
                            <>
                              <i className="fas fa-star text-yellow-400 mr-1"></i>
                              <span>{facility.rating}</span>
                              <span className="mx-2">•</span>
                            </>
                          )}
                          <span>{formatDistance(facility.distance)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-block bg-green-900/30 text-green-400 text-xs px-2 py-0.5 rounded-full">
                            Open • {facility.openHours || '24/7'}
                          </span>
                          {facility.phone && (
                            <span className="inline-block bg-blue-900/30 text-blue-400 text-xs px-2 py-0.5 rounded-full">
                              <i className="fas fa-phone-alt mr-1"></i>
                              {facility.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="bg-secondary/20 text-secondary rounded-full p-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`,
                            '_blank'
                          );
                        }}
                      >
                        <i className="fas fa-directions"></i>
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-white/60">
                      {locationError 
                        ? "Location services are required to find nearby services"
                        : "No services found matching your criteria"}
                    </p>
                  </div>
                )}
              </div>
              {filteredFacilities && filteredFacilities.length > 0 && (
                <Button variant="link" className="w-full text-secondary text-sm mt-4">View All Services</Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Navbar />
      <EmergencyModal />
    </div>
  );
}
