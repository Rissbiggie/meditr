import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { apiRequest } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";

interface EmergencyContact {
  id: number;
  name: string;
  relationship: string;
  phone: string;
}

export function EmergencyContacts() {
  const queryClient = useQueryClient();
  const [newContact, setNewContact] = useState({
    name: "",
    relationship: "",
    phone: ""
  });

  const { data: contacts = [], isLoading } = useQuery<EmergencyContact[]>({
    queryKey: ["/api/emergency-contacts"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/emergency-contacts");
      if (!response.ok) {
        throw new Error("Failed to fetch emergency contacts");
      }
      return response.json();
    }
  });

  const createContactMutation = useMutation({
    mutationFn: async (contact: typeof newContact) => {
      const response = await apiRequest("POST", "/api/emergency-contacts", contact);
      if (!response.ok) {
        throw new Error("Failed to create emergency contact");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-contacts"] });
      setNewContact({ name: "", relationship: "", phone: "" });
      toast.success("Emergency contact added successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to add emergency contact");
    }
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/emergency-contacts/${id}`);
      if (!response.ok) {
        throw new Error("Failed to delete emergency contact");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-contacts"] });
      toast.success("Emergency contact deleted successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete emergency contact");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.relationship || !newContact.phone) {
      toast.error("Please fill in all fields");
      return;
    }
    createContactMutation.mutate(newContact);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-4">Add Emergency Contact</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Name"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              />
              <Input
                placeholder="Relationship"
                value={newContact.relationship}
                onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
              />
              <Input
                placeholder="+254712345678"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                pattern="^\+254[17]\d{8}$"
                title="Enter a valid Kenyan phone number"
              />
            </div>
            <Button type="submit" className="w-full" disabled={createContactMutation.isPending}>
              <Plus className="w-4 h-4 mr-2" />
              {createContactMutation.isPending ? "Adding..." : "Add Contact"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-4">Emergency Contacts</h2>
          {isLoading ? (
            <div>Loading contacts...</div>
          ) : contacts.length === 0 ? (
            <div className="text-center text-gray-500">No emergency contacts added yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>{contact.name}</TableCell>
                    <TableCell>{contact.relationship}</TableCell>
                    <TableCell>{contact.phone}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteContactMutation.mutate(contact.id)}
                        disabled={deleteContactMutation.isPending}
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
    </div>
  );
} 