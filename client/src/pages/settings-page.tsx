import { useState } from "react";
import { useLocation } from "wouter";
import { AppHeader } from "@/components/layout/app-header";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { EmergencyModal } from "@/components/modals/emergency-modal";
import { User, Mail, ChevronRight, LogOut } from "lucide-react";
import { EmergencyContacts } from "@/components/preferences/emergency-contacts";
import { MedicalInformation } from "@/components/preferences/medical-information";
import { PreferredHospitals } from "@/components/preferences/preferred-hospitals";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SettingsPage() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [settings, setSettings] = useState({
    notifications: true,
    locationTracking: true,
    darkMode: true,
    smsNotifications: false
  });

  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  const handleSettingToggle = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleOpenDialog = (dialog: string) => {
    setActiveDialog(dialog);
  };

  const handleCloseDialog = () => {
    setActiveDialog(null);
  };

  return (
    <div className="min-h-screen bg-primary pb-20">
      <AppHeader title="Settings" />

      <main className="pt-20 px-4">
        <div className="mb-6">
          <h2 className="text-white font-semibold text-xl mb-4">Settings</h2>
          
          {/* User Profile Card */}
          <Card className="bg-white/10 backdrop-blur-sm rounded-xl mb-6 border-none">
            <CardContent className="p-4">
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 bg-white/20 rounded-full mr-3 flex items-center justify-center overflow-hidden">
                  <User className="text-white/70 text-2xl" />
                </div>
                <div>
                  <h3 className="text-white font-medium">{user ? `${user.firstName} ${user.lastName}` : "User"}</h3>
                  <p className="text-white/60 text-sm">{user?.email || "user@example.com"}</p>
                </div>
                <Button variant="ghost" size="icon" className="ml-auto bg-white/10 hover:bg-white/20 text-white rounded-full h-8 w-8 flex items-center justify-center">
                  <Mail className="text-sm" />
                </Button>
              </div>
              <Button 
                className="w-full bg-secondary/20 hover:bg-secondary/30 text-secondary font-medium py-2 px-4 rounded-lg transition-all duration-300"
                onClick={() => setLocation('/profile')}
              >
                View Profile
              </Button>
            </CardContent>
          </Card>

          {/* App Settings Card */}
          <Card className="bg-white/10 backdrop-blur-sm rounded-xl mb-6 border-none">
            <CardContent className="p-4">
              <h3 className="text-white font-semibold mb-3">App Settings</h3>
              <div className="space-y-4">
                <SettingToggle
                  title="Notifications"
                  description="Email and push notifications"
                  checked={settings.notifications}
                  onChange={() => handleSettingToggle('notifications')}
                />
                <SettingToggle
                  title="Location Tracking"
                  description="Share location during emergencies"
                  checked={settings.locationTracking}
                  onChange={() => handleSettingToggle('locationTracking')}
                />
                <SettingToggle
                  title="Dark Mode"
                  description="Power between light and dark themes"
                  checked={settings.darkMode}
                  onChange={() => handleSettingToggle('darkMode')}
                />
                <SettingToggle
                  title="SMS Notifications"
                  description="Receive important alerts via SMS"
                  checked={settings.smsNotifications}
                  onChange={() => handleSettingToggle('smsNotifications')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Preferences Card */}
          <Card className="bg-white/10 backdrop-blur-sm rounded-xl mb-6 border-none">
            <CardContent className="p-4">
              <h3 className="text-white font-semibold mb-3">Emergency Preferences</h3>
              <div className="space-y-3">
                <Button 
                  className="flex items-center justify-between w-full bg-white/5 hover:bg-white/10 p-3 rounded-lg text-left"
                  onClick={() => handleOpenDialog('emergency-contacts')}
                >
                  <span className="text-white font-medium text-sm">Emergency Contacts</span>
                  <ChevronRight className="text-white/60" />
                </Button>
                <Button 
                  className="flex items-center justify-between w-full bg-white/5 hover:bg-white/10 p-3 rounded-lg text-left"
                  onClick={() => handleOpenDialog('medical-information')}
                >
                  <span className="text-white font-medium text-sm">Medical Information</span>
                  <ChevronRight className="text-white/60" />
                </Button>
                <Button 
                  className="flex items-center justify-between w-full bg-white/5 hover:bg-white/10 p-3 rounded-lg text-left"
                  onClick={() => handleOpenDialog('preferred-hospitals')}
                >
                  <span className="text-white font-medium text-sm">Preferred Hospitals</span>
                  <ChevronRight className="text-white/60" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Support Card */}
          <Card className="bg-white/10 backdrop-blur-sm rounded-xl mb-6 border-none">
            <CardContent className="p-4">
              <h3 className="text-white font-semibold mb-3">Support</h3>
              <div className="space-y-3">
                <Button 
                  className="flex items-center justify-between w-full bg-white/5 hover:bg-white/10 p-3 rounded-lg text-left"
                  onClick={() => setLocation('/help')}
                >
                  <span className="text-white font-medium text-sm">Help Center</span>
                  <ChevronRight className="text-white/60" />
                </Button>
                <Button 
                  className="flex items-center justify-between w-full bg-white/5 hover:bg-white/10 p-3 rounded-lg text-left"
                  onClick={() => setLocation('/support')}
                >
                  <span className="text-white font-medium text-sm">Contact Support</span>
                  <ChevronRight className="text-white/60" />
                </Button>
                <Button 
                  className="flex items-center justify-between w-full bg-white/5 hover:bg-white/10 p-3 rounded-lg text-left"
                  onClick={() => setLocation('/privacy')}
                >
                  <span className="text-white font-medium text-sm">Privacy Policy</span>
                  <ChevronRight className="text-white/60" />
                </Button>
                <Button 
                  className="flex items-center justify-between w-full bg-white/5 hover:bg-white/10 p-3 rounded-lg text-left"
                  onClick={() => setLocation('/terms')}
                >
                  <span className="text-white font-medium text-sm">Terms of Service</span>
                  <ChevronRight className="text-white/60" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Button 
            className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 mb-8"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </main>

      {/* Emergency Contacts Dialog */}
      <Dialog open={activeDialog === 'emergency-contacts'} onOpenChange={handleCloseDialog}>
        <DialogContent className="bg-primary border-none text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle>Emergency Contacts</DialogTitle>
          </DialogHeader>
          <EmergencyContacts />
        </DialogContent>
      </Dialog>

      {/* Medical Information Dialog */}
      <Dialog open={activeDialog === 'medical-information'} onOpenChange={handleCloseDialog}>
        <DialogContent className="bg-primary border-none text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle>Medical Information</DialogTitle>
          </DialogHeader>
          <MedicalInformation />
        </DialogContent>
      </Dialog>

      {/* Preferred Hospitals Dialog */}
      <Dialog open={activeDialog === 'preferred-hospitals'} onOpenChange={handleCloseDialog}>
        <DialogContent className="bg-primary border-none text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preferred Hospitals</DialogTitle>
          </DialogHeader>
          <PreferredHospitals />
        </DialogContent>
      </Dialog>

      <Navbar />
      <EmergencyModal />
    </div>
  );
}

interface SettingToggleProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

function SettingToggle({ title, description, checked, onChange }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h4 className="text-white font-medium text-sm">{title}</h4>
        <p className="text-white/60 text-xs">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
