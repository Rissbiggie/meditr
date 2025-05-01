import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EmergencyMapPreview } from './EmergencyMapPreview';
import { LoadScript } from '@react-google-maps/api';

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  password?: string;
  phone: string;
}

interface Emergency {
  id: number;
  type: string;
  status: string;
  createdAt: string;
  userId: number;
  latitude: string;
  longitude: string;
  accuracy?: string;
}

interface Facility {
  id: number;
  name: string;
  address: string;
  capacity: number;
  type: string;
  latitude: string;
  longitude: string;
}

// Add analytics interfaces
interface EmergencyType {
  type: string;
  count: number;
}

interface UserActivity {
  date: string;
  count: number;
}

interface FacilityUtilization {
  facilityId: number;
  utilization: number;
}

interface SystemAnalytics {
  totalUsers: number;
  activeEmergencies: number;
  totalFacilities: number;
  emergencyTypes: EmergencyType[];
  userActivity: UserActivity[];
  facilityUtilization: FacilityUtilization[];
}

export function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('users');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '',
    role: 'user',
    phone: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof User, string>>>({});
  const [newFacility, setNewFacility] = useState({ 
    name: '', 
    address: '', 
    capacity: 0, 
    type: '',
    latitude: '',
    longitude: ''
  });
  const [facilityErrors, setFacilityErrors] = useState<Partial<Record<keyof Facility, string>>>({});
  const [editFormErrors, setEditFormErrors] = useState<Partial<Record<keyof User, string>>>({});

  // Fetch data with proper error handling
  const { data: users = [], isLoading: isLoadingUsers, error: usersError } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/users');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch users');
      }
      return response.json();
    },
    enabled: currentUser?.role === 'admin', // Only fetch if user is admin
  });

  // Filter users based on current user's role
  const filteredUsers = users.filter(user => {
    if (currentUser?.role === 'admin') {
      return true; // Admin can see all users
    }
    return user.role !== 'admin'; // Non-admin users can't see other admins
  });

  const { data: emergencies = [], isLoading: isLoadingEmergencies } = useQuery<Emergency[]>({
    queryKey: ['/api/admin/emergencies'],
    queryFn: () => apiRequest('GET', '/api/admin/emergencies').then(res => res.json()),
  });

  const { data: facilities = [], isLoading: isLoadingFacilities, error: facilitiesError } = useQuery<Facility[]>({
    queryKey: ['/api/admin/facilities'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/facilities');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch facilities');
      }
      return response.json();
    },
    enabled: currentUser?.role === 'admin', // Only fetch if user is admin
  });

  const { data: analytics, isLoading: isLoadingAnalytics, error: analyticsError } = useQuery<SystemAnalytics>({
    queryKey: ['/api/admin/analytics'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/analytics');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch analytics');
      }
      return response.json();
    },
    enabled: currentUser?.role === 'admin', // Only fetch if user is admin
  });

  const validateUserForm = (user: Partial<User>) => {
    const errors: Partial<Record<keyof User, string>> = {};
    
    if (!user.username?.trim()) {
      errors.username = 'Username is required';
    } else if (user.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!user.password?.trim()) {
      errors.password = 'Password is required';
    } else if (user.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!user.firstName?.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!user.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!user.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      errors.email = 'Invalid email format';
    }

    if (!user.phone?.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+254[17]\d{8}$/.test(user.phone)) {
      errors.phone = 'Invalid Kenyan phone number format. Use +254 followed by 7 or 1 and 8 digits';
    }

    if (!user.role) {
      errors.role = 'Role is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createUserMutation = useMutation({
    mutationFn: async (user: Partial<User>) => {
      const response = await apiRequest('POST', '/api/admin/users', user);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast.success('User created successfully');
      setNewUser({ username: '', password: '', firstName: '', lastName: '', email: '', role: 'user', phone: '' });
      setFormErrors({});
    },
    onError: (error) => {
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes('username')) {
          setFormErrors(prev => ({ ...prev, username: 'Username already exists' }));
        } else if (errorMessage.includes('email')) {
          setFormErrors(prev => ({ ...prev, email: 'Email already exists' }));
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error('Failed to create user');
      }
    }
  });

  const handleCreateUser = () => {
    if (validateUserForm(newUser)) {
      createUserMutation.mutate(newUser);
    }
  };

  const validateFacilityForm = (facility: Partial<Facility>) => {
    const errors: Partial<Record<keyof Facility, string>> = {};
    
    if (!facility.name?.trim()) {
      errors.name = 'Facility name is required';
    }

    if (!facility.address?.trim()) {
      errors.address = 'Address is required';
    }

    if (!facility.type?.trim()) {
      errors.type = 'Facility type is required';
    }

    if (facility.capacity === undefined || facility.capacity <= 0) {
      errors.capacity = 'Capacity must be greater than 0';
    }

    if (!facility.latitude?.trim()) {
      errors.latitude = 'Latitude is required';
    } else if (isNaN(parseFloat(facility.latitude))) {
      errors.latitude = 'Latitude must be a valid number';
    }

    if (!facility.longitude?.trim()) {
      errors.longitude = 'Longitude is required';
    } else if (isNaN(parseFloat(facility.longitude))) {
      errors.longitude = 'Longitude must be a valid number';
    }

    setFacilityErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createFacilityMutation = useMutation({
    mutationFn: async (facility: Partial<Facility>) => {
      const response = await apiRequest('POST', '/api/admin/facilities', facility);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create facility');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/facilities'] });
      toast.success('Facility created successfully');
      setNewFacility({ name: '', address: '', capacity: 0, type: '', latitude: '', longitude: '' });
      setFacilityErrors({});
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create facility');
    }
  });

  const deleteFacilityMutation = useMutation({
    mutationFn: async (facilityId: number) => {
      const response = await apiRequest('DELETE', `/api/admin/facilities/${facilityId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete facility');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/facilities'] });
      toast.success('Facility deleted successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete facility');
    }
  });

  const handleDeleteFacility = async (facilityId: number) => {
    if (window.confirm('Are you sure you want to delete this facility?')) {
      deleteFacilityMutation.mutate(facilityId);
    }
  };

  const handleCreateFacility = () => {
    if (validateFacilityForm(newFacility)) {
      createFacilityMutation.mutate(newFacility);
    }
  };

  const updateEmergencyMutation = useMutation({
    mutationFn: ({ id }: { id: number, data: Partial<Emergency> }) => 
      apiRequest('POST', `/api/emergencies/${id}/resolve`).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/emergencies'] });
      toast.success('Emergency resolved successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to resolve emergency');
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUserMutation.mutateAsync(userId);
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  // Add edit user mutation
  const editUserMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const response = await apiRequest('PUT', `/api/admin/users/${userData.id}`, userData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast.success('User updated successfully');
      setEditingUser(null);
      setEditFormErrors({});
    },
    onError: (error) => {
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes('username')) {
          setEditFormErrors(prev => ({ ...prev, username: 'Username already exists' }));
        } else if (errorMessage.includes('email')) {
          setEditFormErrors(prev => ({ ...prev, email: 'Email already exists' }));
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error('Failed to update user');
      }
    }
  });

  const validateEditForm = (user: Partial<User>) => {
    const errors: Partial<Record<keyof User, string>> = {};
    
    if (!user.username?.trim()) {
      errors.username = 'Username is required';
    } else if (user.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!user.firstName?.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!user.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!user.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      errors.email = 'Invalid email format';
    }

    if (!user.phone?.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+254[17]\d{8}$/.test(user.phone)) {
      errors.phone = 'Invalid Kenyan phone number format. Use +254 followed by 7 or 1 and 8 digits';
    }

    if (!user.role) {
      errors.role = 'Role is required';
    }

    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditUser = () => {
    if (editingUser && validateEditForm(editingUser)) {
      editUserMutation.mutate(editingUser);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      
      {usersError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {usersError instanceof Error ? usersError.message : 'Failed to load users'}
        </div>
      )}

      {facilitiesError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {facilitiesError instanceof Error ? facilitiesError.message : 'Failed to load facilities'}
        </div>
      )}

      <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="emergencies">Emergencies</TabsTrigger>
            <TabsTrigger value="facilities">Facilities</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                {currentUser?.role === 'admin' && (
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold mb-2">Create New User</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Input
                          placeholder="Username"
                          value={newUser.username}
                          onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                          className={`text-foreground ${formErrors.username ? 'border-red-500' : ''}`}
                        />
                        {formErrors.username && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.username}</p>
                        )}
                      </div>
                      <div>
                        <Input
                          placeholder="Password"
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          className={`text-foreground ${formErrors.password ? 'border-red-500' : ''}`}
                        />
                        {formErrors.password && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
                        )}
                      </div>
                      <div>
                        <Input
                          placeholder="First Name"
                          value={newUser.firstName}
                          onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                          className={`text-foreground ${formErrors.firstName ? 'border-red-500' : ''}`}
                        />
                        {formErrors.firstName && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.firstName}</p>
                        )}
                      </div>
                      <div>
                        <Input
                          placeholder="Last Name"
                          value={newUser.lastName}
                          onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                          className={`text-foreground ${formErrors.lastName ? 'border-red-500' : ''}`}
                        />
                        {formErrors.lastName && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.lastName}</p>
                        )}
                      </div>
                      <div>
                        <Input
                          placeholder="Email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          className={`text-foreground ${formErrors.email ? 'border-red-500' : ''}`}
                        />
                        {formErrors.email && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                        )}
                      </div>
                      <div>
                        <Input
                          placeholder="+254712345678"
                          value={newUser.phone}
                          onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                          className={`text-foreground ${formErrors.phone ? 'border-red-500' : ''}`}
                        />
                        {formErrors.phone && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                        )}
                      </div>
                      <div>
                        <select
                          className={`text-foreground border rounded p-2 w-full ${formErrors.role ? 'border-red-500' : ''}`}
                          value={newUser.role}
                          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        >
                          <option value="user">User</option>
                          <option value="response_team">Response Team</option>
                          {currentUser?.role === 'admin' && <option value="admin">Admin</option>}
                        </select>
                        {formErrors.role && (
                          <p className="text-red-500 text-sm mt-1">{formErrors.role}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      className="mt-2"
                      onClick={handleCreateUser}
                      disabled={createUserMutation.isPending}
                    >
                      {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                    </Button>
                  </div>
                )}

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      {currentUser?.role === 'admin' && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        {currentUser?.role === 'admin' && (
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setEditingUser(user)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="ml-2"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={user.id === Number(currentUser?.id)}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="emergencies">
            <Card>
              <CardHeader>
                <CardTitle>Emergency Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emergencies.map((emergency) => (
                      <TableRow key={emergency.id}>
                        <TableCell>{emergency.id}</TableCell>
                        <TableCell>{emergency.type}</TableCell>
                        <TableCell>{emergency.status}</TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="text-sm">
                              <div>Lat: {parseFloat(emergency.latitude).toFixed(6)}</div>
                              <div>Lng: {parseFloat(emergency.longitude).toFixed(6)}</div>
                            </div>
                            <EmergencyMapPreview 
                              latitude={emergency.latitude} 
                              longitude={emergency.longitude} 
                            />
                            <a 
                              href={`https://www.google.com/maps?q=${emergency.latitude},${emergency.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline text-sm"
                            >
                              View on Google Maps
                            </a>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(emergency.createdAt).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateEmergencyMutation.mutate({
                              id: emergency.id,
                              data: { status: 'resolved' }
                            })}
                            disabled={emergency.status === 'resolved'}
                          >
                            Resolve
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="facilities">
            <Card>
              <CardHeader>
                <CardTitle>Facility Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold mb-2">Add New Facility</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        placeholder="Name"
                        value={newFacility.name}
                        onChange={(e) => setNewFacility({ ...newFacility, name: e.target.value })}
                        className={`text-foreground ${facilityErrors.name ? 'border-red-500' : ''}`}
                      />
                      {facilityErrors.name && (
                        <p className="text-red-500 text-sm mt-1">{facilityErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <Input
                        placeholder="Address"
                        value={newFacility.address}
                        onChange={(e) => setNewFacility({ ...newFacility, address: e.target.value })}
                        className={`text-foreground ${facilityErrors.address ? 'border-red-500' : ''}`}
                      />
                      {facilityErrors.address && (
                        <p className="text-red-500 text-sm mt-1">{facilityErrors.address}</p>
                      )}
                    </div>
                    <div>
                      <Input
                        placeholder="Capacity"
                        type="number"
                        value={newFacility.capacity}
                        onChange={(e) => setNewFacility({ ...newFacility, capacity: parseInt(e.target.value) || 0 })}
                        className={`text-foreground ${facilityErrors.capacity ? 'border-red-500' : ''}`}
                      />
                      {facilityErrors.capacity && (
                        <p className="text-red-500 text-sm mt-1">{facilityErrors.capacity}</p>
                      )}
                    </div>
                    <div>
                      <Input
                        placeholder="Type"
                        value={newFacility.type}
                        onChange={(e) => setNewFacility({ ...newFacility, type: e.target.value })}
                        className={`text-foreground ${facilityErrors.type ? 'border-red-500' : ''}`}
                      />
                      {facilityErrors.type && (
                        <p className="text-red-500 text-sm mt-1">{facilityErrors.type}</p>
                      )}
                    </div>
                    <div>
                      <Input
                        placeholder="Latitude"
                        value={newFacility.latitude}
                        onChange={(e) => setNewFacility({ ...newFacility, latitude: e.target.value })}
                        className={`text-foreground ${facilityErrors.latitude ? 'border-red-500' : ''}`}
                      />
                      {facilityErrors.latitude && (
                        <p className="text-red-500 text-sm mt-1">{facilityErrors.latitude}</p>
                      )}
                    </div>
                    <div>
                      <Input
                        placeholder="Longitude"
                        value={newFacility.longitude}
                        onChange={(e) => setNewFacility({ ...newFacility, longitude: e.target.value })}
                        className={`text-foreground ${facilityErrors.longitude ? 'border-red-500' : ''}`}
                      />
                      {facilityErrors.longitude && (
                        <p className="text-red-500 text-sm mt-1">{facilityErrors.longitude}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    className="mt-4 w-full md:w-auto"
                    onClick={handleCreateFacility}
                    disabled={createFacilityMutation.isPending}
                  >
                    {createFacilityMutation.isPending ? 'Creating...' : 'Add Facility'}
                  </Button>
                </div>

                {isLoadingFacilities ? (
                  <div className="flex justify-center items-center h-32">
                    <p>Loading facilities...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facilities.map((facility) => (
                        <TableRow key={facility.id}>
                          <TableCell>{facility.name}</TableCell>
                          <TableCell>{facility.address}</TableCell>
                          <TableCell>{facility.capacity}</TableCell>
                          <TableCell>{facility.type}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">Edit</Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              className="ml-2"
                              onClick={() => handleDeleteFacility(facility.id)}
                              disabled={deleteFacilityMutation.isPending}
                            >
                              {deleteFacilityMutation.isPending ? 'Deleting...' : 'Delete'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>System Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAnalytics ? (
                  <div className="flex justify-center items-center h-32">
                    <p>Loading analytics...</p>
                  </div>
                ) : analyticsError ? (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {analyticsError instanceof Error ? analyticsError.message : 'Failed to load analytics'}
                  </div>
                ) : analytics ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Total Users</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{analytics.totalUsers}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Active Emergencies</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{analytics.activeEmergencies}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Total Facilities</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{analytics.totalFacilities}</p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Emergency Types</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {analytics.emergencyTypes.map((type: EmergencyType) => (
                            <div key={type.type} className="flex justify-between items-center">
                              <span className="capitalize">{type.type}</span>
                              <span className="font-semibold">{type.count}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>User Activity (Last 7 Days)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {analytics.userActivity.slice(-7).map((activity: UserActivity) => (
                            <div key={activity.date} className="flex justify-between items-center">
                              <span>{new Date(activity.date).toLocaleDateString()}</span>
                              <span className="font-semibold">{activity.count} users</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Facility Utilization</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {analytics.facilityUtilization.map((util: FacilityUtilization) => (
                            <div key={util.facilityId} className="flex justify-between items-center">
                              <span>Facility #{util.facilityId}</span>
                              <span className="font-semibold">{util.utilization.toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </LoadScript>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  placeholder="Username"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  className={`text-foreground ${editFormErrors.username ? 'border-red-500' : ''}`}
                />
                {editFormErrors.username && (
                  <p className="text-red-500 text-sm mt-1">{editFormErrors.username}</p>
                )}
              </div>
              <div>
                <Input
                  placeholder="First Name"
                  value={editingUser.firstName}
                  onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                  className={`text-foreground ${editFormErrors.firstName ? 'border-red-500' : ''}`}
                />
                {editFormErrors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{editFormErrors.firstName}</p>
                )}
              </div>
              <div>
                <Input
                  placeholder="Last Name"
                  value={editingUser.lastName}
                  onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                  className={`text-foreground ${editFormErrors.lastName ? 'border-red-500' : ''}`}
                />
                {editFormErrors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{editFormErrors.lastName}</p>
                )}
              </div>
              <div>
                <Input
                  placeholder="Email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className={`text-foreground ${editFormErrors.email ? 'border-red-500' : ''}`}
                />
                {editFormErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{editFormErrors.email}</p>
                )}
              </div>
              <div>
                <Input
                  placeholder="+254712345678"
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className={`text-foreground ${editFormErrors.phone ? 'border-red-500' : ''}`}
                />
                {editFormErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">{editFormErrors.phone}</p>
                )}
              </div>
              <div>
                <select
                  className={`text-foreground border rounded p-2 w-full ${editFormErrors.role ? 'border-red-500' : ''}`}
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="response_team">Response Team</option>
                  {currentUser?.role === 'admin' && <option value="admin">Admin</option>}
                </select>
                {editFormErrors.role && (
                  <p className="text-red-500 text-sm mt-1">{editFormErrors.role}</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingUser(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditUser}
              disabled={editUserMutation.isPending}
            >
              {editUserMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 