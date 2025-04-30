import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { EmergencyAlert, AmbulanceUnit, EmergencyResource, EmergencyResourceType, EmergencyTypeResource } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EmergencyModal } from "@/components/modals/emergency-modal";
import { Loader2 } from "lucide-react";

export default function ResponseTeamPage() {
  const { toast } = useToast();
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyAlert | null>(null);
  const [selectedResources, setSelectedResources] = useState<EmergencyResource[]>([]);

  // Query for active emergencies
  const { 
    data: activeEmergencies, 
    isLoading: isLoadingEmergencies 
  } = useQuery<EmergencyAlert[]>({
    queryKey: ['/api/emergencies/active'],
  });

  // Query for available resources
  const { 
    data: availableResources, 
    isLoading: isLoadingResources 
  } = useQuery<EmergencyResource[]>({
    queryKey: ['/api/resources/available'],
  });

  // Query for resource types
  const { 
    data: resourceTypes 
  } = useQuery<EmergencyResourceType[]>({
    queryKey: ['/api/resource-types'],
  });

  // Query for emergency type resources
  const { 
    data: emergencyTypeResources 
  } = useQuery<EmergencyTypeResource[]>({
    queryKey: ['/api/emergency-type-resources'],
  });

  // Assign resources mutation
  const { mutate: assignResources } = useMutation({
    mutationFn: async (data: { emergencyId: number; resourceIds: number[] }) => {
      const res = await apiRequest('POST', '/api/emergencies/assign-resources', data);
      if (!res.ok) {
        throw new Error('Failed to assign resources');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Resources Assigned",
        description: "Resources have been successfully assigned to the emergency.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/emergencies/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/resources/available'] });
      setSelectedEmergency(null);
      setSelectedResources([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleEmergencySelect = (emergency: EmergencyAlert) => {
    setSelectedEmergency(emergency);
    setSelectedResources([]);
  };

  const handleResourceSelect = (resource: EmergencyResource) => {
    if (selectedResources.some(r => r.id === resource.id)) {
      setSelectedResources(selectedResources.filter(r => r.id !== resource.id));
    } else {
      setSelectedResources([...selectedResources, resource]);
    }
  };

  const handleAssignResources = () => {
    if (!selectedEmergency || selectedResources.length === 0) return;
    
    assignResources({
      emergencyId: selectedEmergency.id,
      resourceIds: selectedResources.map(r => r.id)
    });
  };

  const getRequiredResources = (emergency: EmergencyAlert) => {
    if (!emergency.requiredResources) return [];
    const requirements = JSON.parse(emergency.requiredResources);
    return emergencyTypeResources?.filter(etr => 
      etr.emergencyType === emergency.emergencyType
    ) || [];
  };

  return (
    <div className="min-h-screen bg-primary">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Emergencies */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Active Emergencies</h2>
              {isLoadingEmergencies ? (
                <div className="flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : activeEmergencies?.length ? (
                <div className="space-y-4">
                  {activeEmergencies.map(emergency => (
                    <div 
                      key={emergency.id}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedEmergency?.id === emergency.id 
                          ? 'bg-accent/20 border border-accent' 
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                      onClick={() => handleEmergencySelect(emergency)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-white font-medium">{emergency.emergencyType}</h3>
                          <p className="text-white/60 text-sm">{emergency.description}</p>
                        </div>
                        <span className={`${
                          emergency.priority === 'high' 
                            ? 'bg-red-900/30 text-red-400' 
                            : emergency.priority === 'medium'
                            ? 'bg-yellow-900/30 text-yellow-400'
                            : 'bg-green-900/30 text-green-400'
                        } text-xs px-2 py-1 rounded-full`}>
                          {emergency.priority}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="text-white/60 text-sm">
                          Required Resources:
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {getRequiredResources(emergency).map(req => (
                            <span 
                              key={req.id}
                              className="bg-white/10 text-white/80 text-xs px-2 py-1 rounded-full"
                            >
                              {resourceTypes?.find(rt => rt.id === req.resourceTypeId)?.name} x{req.quantity}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-white/60 text-center">
                  No active emergencies
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Resources */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Available Resources</h2>
              {isLoadingResources ? (
                <div className="flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : availableResources?.length ? (
                <div className="space-y-4">
                  {availableResources.map(resource => (
                    <div 
                      key={resource.id}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedResources.some(r => r.id === resource.id)
                          ? 'bg-accent/20 border border-accent'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                      onClick={() => handleResourceSelect(resource)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-white font-medium">{resource.name}</h3>
                          <p className="text-white/60 text-sm">
                            {resourceTypes?.find(rt => rt.id === resource.typeId)?.name}
                          </p>
                        </div>
                        <span className="bg-white/10 text-white/80 text-xs px-2 py-1 rounded-full">
                          {resource.status}
                        </span>
                      </div>
                      {resource.specializations && (
                        <div className="mt-2">
                          <div className="text-white/60 text-sm">
                            Specializations:
                          </div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {JSON.parse(resource.specializations).map((spec: string) => (
                              <span 
                                key={spec}
                                className="bg-white/10 text-white/80 text-xs px-2 py-1 rounded-full"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-white/60 text-center">
                  No available resources
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assignment Controls */}
        {selectedEmergency && (
          <div className="fixed bottom-0 left-0 right-0 bg-primary/95 border-t border-accent/50 p-4">
            <div className="container mx-auto flex justify-between items-center">
              <div>
                <h3 className="text-white font-medium">Selected Emergency: {selectedEmergency.emergencyType}</h3>
                <p className="text-white/60 text-sm">
                  Selected Resources: {selectedResources.length}
                </p>
              </div>
              <Button
                onClick={handleAssignResources}
                disabled={selectedResources.length === 0}
                className="bg-accent hover:bg-accent/90 text-white"
              >
                Assign Resources
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
