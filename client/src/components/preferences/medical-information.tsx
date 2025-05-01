import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { apiRequest } from "@/lib/queryClient";

interface MedicalInfo {
  id: number;
  bloodType: string;
  allergies: string;
  conditions: string;
  medications: string;
}

export function MedicalInformation() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: medicalInfo, isLoading } = useQuery<MedicalInfo>({
    queryKey: ["/api/medical-info"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/medical-info");
      if (!response.ok) {
        throw new Error("Failed to fetch medical information");
      }
      return response.json();
    }
  });

  const [formData, setFormData] = useState<Partial<MedicalInfo>>({
    bloodType: medicalInfo?.bloodType || "",
    allergies: medicalInfo?.allergies || "",
    conditions: medicalInfo?.conditions || "",
    medications: medicalInfo?.medications || ""
  });

  const updateMedicalInfoMutation = useMutation({
    mutationFn: async (data: Partial<MedicalInfo>) => {
      const response = await apiRequest("PUT", "/api/medical-info", data);
      if (!response.ok) {
        throw new Error("Failed to update medical information");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-info"] });
      setIsEditing(false);
      toast.success("Medical information updated successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update medical information");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMedicalInfoMutation.mutate(formData);
  };

  if (isLoading) {
    return <div>Loading medical information...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Medical Information</h2>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)}>
                Edit Information
              </Button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Blood Type</label>
                <Input
                  value={formData.bloodType}
                  onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                  placeholder="e.g., A+, B-, O+"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Allergies</label>
                <Textarea
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="List any allergies..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Medical Conditions</label>
                <Textarea
                  value={formData.conditions}
                  onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                  placeholder="List any medical conditions..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Current Medications</label>
                <Textarea
                  value={formData.medications}
                  onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                  placeholder="List current medications..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMedicalInfoMutation.isPending}
                >
                  {updateMedicalInfoMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Blood Type</h3>
                <p>{medicalInfo?.bloodType || "Not specified"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-1">Allergies</h3>
                <p className="whitespace-pre-wrap">{medicalInfo?.allergies || "None listed"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-1">Medical Conditions</h3>
                <p className="whitespace-pre-wrap">{medicalInfo?.conditions || "None listed"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-1">Current Medications</h3>
                <p className="whitespace-pre-wrap">{medicalInfo?.medications || "None listed"}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 