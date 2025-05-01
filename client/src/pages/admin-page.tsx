import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { User, EmergencyAlert, AmbulanceUnit } from "@shared/schema";
import { EmergencyModal } from "@/components/modals/emergency-modal";
import { apiRequest } from "@/lib/queryClient";

export default function AdminPage() {
  // Query for active emergencies
  const { data: activeEmergencies = [], isLoading: isLoadingEmergencies } = useQuery<EmergencyAlert[]>({
    queryKey: ['/api/emergencies/active'],
    queryFn: () => apiRequest('GET', '/api/emergencies/active').then(res => res.json()),
  });

  // Query for ambulance units
  const { data: ambulanceUnits = [], isLoading: isLoadingAmbulances } = useQuery<AmbulanceUnit[]>({
    queryKey: ['/api/ambulances'],
    queryFn: () => apiRequest('GET', '/api/ambulances').then(res => res.json()),
  });

  // Query for users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('GET', '/api/users').then(res => res.json()),
  });

  const isLoading = isLoadingEmergencies || isLoadingAmbulances || isLoadingUsers;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary">
        <AppHeader title="Admin Dashboard" />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary pb-20">
      <AppHeader title="Admin Dashboard" />

      <main className="pt-20 px-4">
        <div className="mb-6">
          <h2 className="text-white font-semibold text-xl mb-4">System Overview</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="bg-white/10 rounded-xl border-none">
              <CardContent className="p-4 text-center">
                <div className="text-secondary text-3xl mb-1"><i className="fas fa-ambulance"></i></div>
                <p className="text-white/80 text-xs">Active Units</p>
                <p className="text-white font-semibold text-xl">{ambulanceUnits.filter(unit => unit.status === "available").length}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 rounded-xl border-none">
              <CardContent className="p-4 text-center">
                <div className="text-[#EF4444] text-3xl mb-1"><i className="fas fa-exclamation-circle"></i></div>
                <p className="text-white/80 text-xs">Active Emergencies</p>
                <p className="text-white font-semibold text-xl">{activeEmergencies.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 rounded-xl border-none">
              <CardContent className="p-4 text-center">
                <div className="text-secondary text-3xl mb-1"><i className="fas fa-user-md"></i></div>
                <p className="text-white/80 text-xs">Response Teams</p>
                <p className="text-white font-semibold text-xl">{users.filter(user => user.role === "response_team").length}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 rounded-xl border-none">
              <CardContent className="p-4 text-center">
                <div className="text-secondary text-3xl mb-1"><i className="fas fa-clock"></i></div>
                <p className="text-white/80 text-xs">Avg. Response Time</p>
                <p className="text-white font-semibold text-xl">5.2 min</p>
              </CardContent>
            </Card>
          </div>
          
          <Card className="bg-white/10 backdrop-blur-sm rounded-xl mb-6 border-none">
            <CardContent className="p-4">
              <h2 className="text-white font-semibold text-lg mb-3">System Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                    <span className="text-white font-medium text-sm">Server Status</span>
                  </div>
                  <span className="text-green-400 text-xs">Operational</span>
                </div>
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                    <span className="text-white font-medium text-sm">GPS Service</span>
                  </div>
                  <span className="text-green-400 text-xs">Operational</span>
                </div>
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-3"></div>
                    <span className="text-white font-medium text-sm">Notification System</span>
                  </div>
                  <span className="text-yellow-400 text-xs">Degraded</span>
                </div>
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                    <span className="text-white font-medium text-sm">SMS Gateway</span>
                  </div>
                  <span className="text-green-400 text-xs">Operational</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-sm rounded-xl mb-6 border-none">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-white font-semibold text-lg">Emergency Overview</h2>
                <Button variant="link" className="text-secondary text-sm">View Map</Button>
              </div>
              <div className="h-48 bg-gray-800/50 rounded-lg mb-4 flex items-center justify-center">
                <div className="text-white/40 text-center">
                  <i className="fas fa-map-marked-alt text-3xl mb-2"></i>
                  <p className="text-sm">System-wide Emergency Map</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-white/5 p-3 rounded-lg text-center">
                  <p className="text-white/80 text-xs mb-1">Medical</p>
                  <p className="text-white font-semibold">{activeEmergencies.filter(e => e.emergencyType === "Medical").length}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg text-center">
                  <p className="text-white/80 text-xs mb-1">Accidents</p>
                  <p className="text-white font-semibold">{activeEmergencies.filter(e => e.emergencyType === "Accident").length}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg text-center">
                  <p className="text-white/80 text-xs mb-1">Fire</p>
                  <p className="text-white font-semibold">{activeEmergencies.filter(e => e.emergencyType === "Fire").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-sm rounded-xl mb-6 border-none">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-white font-semibold text-lg">User Management</h2>
                <Button variant="link" className="text-secondary text-sm">View All</Button>
              </div>
              <div className="space-y-3">
                {users.length > 0 ? (
                  users.slice(0, 3).map((user) => (
                    <div key={user.id} className="flex items-center bg-white/5 p-3 rounded-lg">
                      <div className="bg-white/10 p-2 rounded-full mr-3">
                        <i className={`fas fa-${user.role === "admin" ? "user-shield" : user.role === "response_team" ? "user-md" : "user"} text-secondary`}></i>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium text-sm">{user.firstName} {user.lastName}</h3>
                        <p className="text-white/60 text-xs">{user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ')} • Active</p>
                      </div>
                      <Button variant="ghost" size="sm" className="bg-secondary/20 text-secondary rounded-full p-2">
                        <i className="fas fa-ellipsis-h"></i>
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-white/60">No users found</div>
                )}
              </div>
              <Button className="w-full bg-secondary/20 hover:bg-secondary/30 text-secondary font-medium py-2 px-4 rounded-lg mt-4 transition-all duration-300">
                <i className="fas fa-plus mr-2"></i> Add New User
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-sm rounded-xl mb-6 border-none">
            <CardContent className="p-4">
              <h2 className="text-white font-semibold text-lg mb-3">Recent Activity</h2>
              <div className="space-y-3">
                <div className="flex items-start bg-white/5 p-3 rounded-lg">
                  <div className="bg-white/10 p-2 rounded-full mr-3 mt-1">
                    <i className="fas fa-ambulance text-secondary text-sm"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">Ambulance Unit dispatched to emergency</p>
                    <p className="text-white/60 text-xs">15 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start bg-white/5 p-3 rounded-lg">
                  <div className="bg-white/10 p-2 rounded-full mr-3 mt-1">
                    <i className="fas fa-user-plus text-secondary text-sm"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">New user registered</p>
                    <p className="text-white/60 text-xs">1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-start bg-white/5 p-3 rounded-lg">
                  <div className="bg-white/10 p-2 rounded-full mr-3 mt-1">
                    <i className="fas fa-check-circle text-green-500 text-sm"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">Emergency resolved successfully</p>
                    <p className="text-white/60 text-xs">2 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Admin Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-secondary text-primary shadow-lg z-10">
        <div className="flex justify-around">
          <Button className="flex flex-col items-center py-3 px-4 transition-colors duration-300 text-primary">
            <i className="fas fa-tachometer-alt text-lg"></i>
            <span className="text-xs mt-1 font-medium">Dashboard</span>
          </Button>
          <Button className="flex flex-col items-center py-3 px-4 transition-colors duration-300 text-primary/70 hover:text-primary">
            <i className="fas fa-users text-lg"></i>
            <span className="text-xs mt-1 font-medium">Users</span>
          </Button>
          <Button className="flex flex-col items-center py-3 px-4 transition-colors duration-300 text-primary/70 hover:text-primary">
            <i className="fas fa-ambulance text-lg"></i>
            <span className="text-xs mt-1 font-medium">Units</span>
          </Button>
          <Button className="flex flex-col items-center py-3 px-4 transition-colors duration-300 text-primary/70 hover:text-primary">
            <i className="fas fa-cog text-lg"></i>
            <span className="text-xs mt-1 font-medium">Settings</span>
          </Button>
        </div>
      </nav>
      
      <EmergencyModal />
    </div>
  );
}
