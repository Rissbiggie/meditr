import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { apiRequest } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Heart, Trash2 } from "lucide-react";

interface Hospital {
  id: number;
  name: string;
  address: string;
  type: string;
  phone: string;
}

export function PreferredHospitals() {
  const queryClient = useQueryClient();

  const { data: allHospitals = [], isLoading: isLoadingAll } = useQuery<Hospital[]>({
    queryKey: ["/api/facilities"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/facilities");
      if (!response.ok) {
        throw new Error("Failed to fetch hospitals");
      }
      return response.json();
    }
  });

  const { data: preferredHospitals = [], isLoading: isLoadingPreferred } = useQuery<Hospital[]>({
    queryKey: ["/api/user/preferred-hospitals"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user/preferred-hospitals");
      if (!response.ok) {
        throw new Error("Failed to fetch preferred hospitals");
      }
      return response.json();
    }
  });

  const addPreferredHospitalMutation = useMutation({
    mutationFn: async (hospitalId: number) => {
      const response = await apiRequest("POST", "/api/user/preferred-hospitals", { hospitalId });
      if (!response.ok) {
        throw new Error("Failed to add preferred hospital");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/preferred-hospitals"] });
      toast.success("Hospital added to preferences");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to add hospital to preferences");
    }
  });

  const removePreferredHospitalMutation = useMutation({
    mutationFn: async (hospitalId: number) => {
      const response = await apiRequest("DELETE", `/api/user/preferred-hospitals/${hospitalId}`);
      if (!response.ok) {
        throw new Error("Failed to remove preferred hospital");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/preferred-hospitals"] });
      toast.success("Hospital removed from preferences");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to remove hospital from preferences");
    }
  });

  const isPreferred = (hospitalId: number) => {
    return preferredHospitals.some(hospital => hospital.id === hospitalId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-4">Preferred Hospitals</h2>
          {isLoadingPreferred ? (
            <div>Loading preferred hospitals...</div>
          ) : preferredHospitals.length === 0 ? (
            <div className="text-center text-gray-500">No preferred hospitals selected</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preferredHospitals.map((hospital) => (
                  <TableRow key={hospital.id}>
                    <TableCell>{hospital.name}</TableCell>
                    <TableCell>{hospital.address}</TableCell>
                    <TableCell>{hospital.type}</TableCell>
                    <TableCell>{hospital.phone}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removePreferredHospitalMutation.mutate(hospital.id)}
                        disabled={removePreferredHospitalMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-4">Available Hospitals</h2>
          {isLoadingAll ? (
            <div>Loading hospitals...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allHospitals.map((hospital) => (
                  <TableRow key={hospital.id}>
                    <TableCell>{hospital.name}</TableCell>
                    <TableCell>{hospital.address}</TableCell>
                    <TableCell>{hospital.type}</TableCell>
                    <TableCell>{hospital.phone}</TableCell>
                    <TableCell>
                      {isPreferred(hospital.id) ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removePreferredHospitalMutation.mutate(hospital.id)}
                          disabled={removePreferredHospitalMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addPreferredHospitalMutation.mutate(hospital.id)}
                          disabled={addPreferredHospitalMutation.isPending}
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 