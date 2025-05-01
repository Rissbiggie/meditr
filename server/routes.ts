import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { WebSocketServer } from "ws";
import { WebSocket } from "ws";
import { calculateDistance } from "../client/src/hooks/use-maps";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // API routes
  // Get medical information for a user
  app.get("/api/medical-info", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const medicalInfo = await storage.getMedicalInfoByUserId(req.user.id);
      return res.json(medicalInfo);
    } catch (error) {
      console.error("Error retrieving medical info:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update medical information
  app.post("/api/medical-info", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const updatedInfo = await storage.updateMedicalInfo({
        ...req.body,
        userId: req.user.id
      });
      return res.json(updatedInfo);
    } catch (error) {
      console.error("Error updating medical info:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get emergency contacts for a user
  app.get("/api/emergency-contacts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const contacts = await storage.getEmergencyContactsByUserId(req.user.id);
      return res.json(contacts);
    } catch (error) {
      console.error("Error retrieving emergency contacts:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create emergency alert
  app.post("/api/emergencies", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const alert = await storage.createEmergencyAlert({
        ...req.body,
        userId: req.user.id
      });
      return res.status(201).json(alert);
    } catch (error) {
      console.error("Error creating emergency alert:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get active emergencies
  app.get("/api/emergencies/active", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const emergencies = await storage.getActiveEmergencies();
      return res.json(emergencies);
    } catch (error) {
      console.error("Error retrieving active emergencies:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user's emergency history
  app.get("/api/emergencies/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const emergencies = await storage.getUserEmergencyHistory(req.user.id);
      return res.json(emergencies);
    } catch (error) {
      console.error("Error retrieving user emergency history:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get recent emergencies
  app.get("/api/emergencies/recent", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const emergencies = await storage.getRecentEmergencies();
      return res.json(emergencies);
    } catch (error) {
      console.error("Error retrieving recent emergencies:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Mark emergency as resolved
  app.post("/api/emergencies/:id/resolve", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const emergencyId = parseInt(req.params.id);
      const resolvedEmergency = await storage.resolveEmergency(emergencyId);
      return res.json(resolvedEmergency);
    } catch (error) {
      console.error("Error resolving emergency:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Assign ambulance to emergency
  app.post("/api/emergencies/assign", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { emergencyId, ambulanceId } = req.body;
      const updatedEmergency = await storage.assignAmbulance(emergencyId, ambulanceId);
      return res.json(updatedEmergency);
    } catch (error) {
      console.error("Error assigning ambulance:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get ambulance units
  app.get("/api/ambulances", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const ambulances = await storage.getAmbulanceUnits();
      return res.json(ambulances);
    } catch (error) {
      console.error("Error retrieving ambulance units:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get available ambulance units
  app.get("/api/ambulances/available", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const ambulances = await storage.getAvailableAmbulanceUnits();
      return res.json(ambulances);
    } catch (error) {
      console.error("Error retrieving available ambulance units:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get nearby ambulances
  app.get("/api/ambulances/nearby", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { latitude, longitude } = req.query;
      if (!latitude || !longitude) {
        return res.status(400).json({ message: "Latitude and longitude required" });
      }

      const ambulances = await storage.getNearbyAmbulances(
        parseFloat(latitude as string), 
        parseFloat(longitude as string)
      );
      return res.json(ambulances);
    } catch (error) {
      console.error("Error retrieving nearby ambulances:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get nearby medical facilities
  app.get("/api/facilities/nearby", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { latitude, longitude } = req.query;
      if (!latitude || !longitude) {
        return res.status(400).json({ message: "Latitude and longitude required" });
      }

      const facilities = await storage.getNearbyFacilities(
        parseFloat(latitude as string), 
        parseFloat(longitude as string)
      );
      return res.json(facilities);
    } catch (error) {
      console.error("Error retrieving nearby facilities:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all users (admin only)
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(401).json({ message: "Not authorized" });
    }

    try {
      const users = await storage.getAllUsers();
      return res.json(users);
    } catch (error) {
      console.error("Error retrieving users:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Set role as admin for the first user
      const userCount = await storage.getUserCount();
      const role = userCount === 0 ? "admin" : "user";

      const newUser = await storage.createUser({
        ...req.body,
        role
      });
      return res.status(201).json(newUser);
    } catch (error) {
      console.error("Error registering user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      // Check database connection
      const dbStatus = await storage.getUserCount() !== undefined;
      
      // Check ambulance service
      const ambulances = await storage.getAmbulanceUnits();
      const ambulanceStatus = ambulances.length > 0;
      
      // Check medical facilities
      const facilities = await storage.getMedicalFacilities();
      const facilitiesStatus = facilities.length > 0;
      
      return res.json({
        status: "operational",
        services: {
          database: {
            status: dbStatus ? "operational" : "degraded",
            message: dbStatus ? "Database connection is healthy" : "Database connection issues detected"
          },
          ambulanceService: {
            status: ambulanceStatus ? "operational" : "degraded",
            message: ambulanceStatus ? "Ambulance service is available" : "No ambulance units available"
          },
          medicalFacilities: {
            status: facilitiesStatus ? "operational" : "degraded",
            message: facilitiesStatus ? "Medical facilities are available" : "No medical facilities available"
          }
        }
      });
    } catch (error) {
      console.error("Health check failed:", error);
      return res.status(500).json({
        status: "degraded",
        message: "System health check failed",
        error: error.message
      });
    }
  });

  // Support routes
  app.get("/api/support/agents", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      // Mock support agents data for now
      const agents = [
        { id: 1, name: "Dr. Smith", specialty: "General Medicine", isAvailable: true },
        { id: 2, name: "Dr. Johnson", specialty: "Emergency Care", isAvailable: true },
        { id: 3, name: "Dr. Williams", specialty: "Cardiology", isAvailable: true }
      ];
      return res.json(agents);
    } catch (err) {
      const error = err as Error;
      console.error("Error retrieving support agents:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/support/chat", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { userId } = req.body;
      // Create a new chat session
      const session = {
        id: Date.now().toString(),
        userId,
        startTime: new Date(),
        status: 'active'
      };
      return res.json(session);
    } catch (err) {
      const error = err as Error;
      console.error("Error starting chat session:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/support/chat/:sessionId/message", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { sessionId } = req.params;
      const { message } = req.body;
      // Store the message
      const storedMessage = {
        id: Date.now().toString(),
        sessionId,
        text: message,
        timestamp: new Date()
      };
      return res.json(storedMessage);
    } catch (err) {
      const error = err as Error;
      console.error("Error sending chat message:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Appointments routes
  app.get("/api/checkups/slots", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { hospitalId, date } = req.query;
      if (!hospitalId || !date) {
        return res.status(400).json({ message: "Hospital ID and date are required" });
      }

      // Mock time slots data
      const timeSlots = [
        { id: "1", startTime: "09:00", endTime: "10:00", isAvailable: true },
        { id: "2", startTime: "10:00", endTime: "11:00", isAvailable: true },
        { id: "3", startTime: "11:00", endTime: "12:00", isAvailable: false },
        { id: "4", startTime: "14:00", endTime: "15:00", isAvailable: true }
      ];
      return res.json(timeSlots);
    } catch (err) {
      const error = err as Error;
      console.error("Error retrieving time slots:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/checkups/schedule", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { userId, hospitalId, date, timeSlot, reason } = req.body;
      if (!userId || !hospitalId || !date || !timeSlot || !reason) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Mock scheduled checkup data
      const checkup = {
        id: Date.now(),
        userId,
        hospitalId,
        hospitalName: "Central Hospital", // Mock hospital name
        date,
        timeSlot,
        reason,
        status: 'scheduled' as const
      };
      return res.json(checkup);
    } catch (err) {
      const error = err as Error;
      console.error("Error scheduling checkup:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/checkups/user/:userId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { userId } = req.params;
      // Mock user's scheduled checkups
      const checkups = [
        {
          id: 1,
          hospitalName: "Central Hospital",
          date: "2024-03-20",
          timeSlot: "09:00",
          reason: "Annual checkup",
          status: 'scheduled' as const
        },
        {
          id: 2,
          hospitalName: "City Medical Center",
          date: "2024-03-15",
          timeSlot: "14:00",
          reason: "Follow-up",
          status: 'completed' as const
        }
      ];
      return res.json(checkups);
    } catch (err) {
      const error = err as Error;
      console.error("Error retrieving user checkups:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get available resources
  app.get("/api/resources/available", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const resources = await storage.getAvailableResources();
      return res.json(resources);
    } catch (error) {
      console.error("Error retrieving available resources:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get resource types
  app.get("/api/resource-types", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const types = await storage.getResourceTypes();
      return res.json(types);
    } catch (error) {
      console.error("Error retrieving resource types:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get emergency type resources
  app.get("/api/emergency-type-resources", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const mappings = await storage.getEmergencyTypeResources();
      return res.json(mappings);
    } catch (error) {
      console.error("Error retrieving emergency type resources:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Assign resources to emergency
  app.post("/api/emergencies/assign-resources", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { emergencyId, resourceIds } = req.body;
      const assignments = await storage.assignResources(emergencyId, resourceIds);
      return res.json(assignments);
    } catch (error) {
      console.error("Error assigning resources:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin routes
  // Check if user is admin
  const isAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }
    next();
  };

  // Admin User Management
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      return res.json(users);
    } catch (error) {
      console.error("Error retrieving users:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/users", isAdmin, async (req, res) => {
    try {
      // Validate required fields
      const { username, password, firstName, lastName, email, phone, role } = req.body;
      if (!username || !password || !firstName || !lastName || !email || !phone || !role) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser(req.body);
      return res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const updatedUser = await storage.updateUser(userId, req.body);
      return res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Prevent admin from deleting themselves
      const currentUser = req.user as { id: number };
      if (currentUser.id === userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.deleteUser(userId);
      return res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin Emergency Management
  app.get("/api/admin/emergencies", isAdmin, async (req, res) => {
    try {
      const emergencies = await storage.getAllEmergencies();
      return res.json(emergencies);
    } catch (error) {
      console.error("Error retrieving emergencies:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/admin/emergencies/:id", isAdmin, async (req, res) => {
    try {
      const emergencyId = parseInt(req.params.id);
      if (isNaN(emergencyId)) {
        return res.status(400).json({ message: "Invalid emergency ID" });
      }
      const emergency = await storage.updateEmergency(emergencyId, req.body);
      return res.json(emergency);
    } catch (error) {
      console.error("Error updating emergency:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/emergencies/:id/assign-resources", isAdmin, async (req, res) => {
    try {
      const emergencyId = parseInt(req.params.id);
      if (isNaN(emergencyId)) {
        return res.status(400).json({ message: "Invalid emergency ID" });
      }
      const assignments = await storage.assignResources(emergencyId, req.body.resourceIds);
      return res.json(assignments);
    } catch (error) {
      console.error("Error assigning resources:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin Facility Management
  app.get("/api/admin/facilities", isAdmin, async (req, res) => {
    try {
      const facilities = await storage.getAllFacilities();
      return res.json(facilities);
    } catch (error) {
      console.error("Error retrieving facilities:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/facilities", isAdmin, async (req, res) => {
    try {
      // Validate required fields
      const { name, address, capacity, type } = req.body;
      if (!name || !address || !capacity || !type) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Validate capacity is a positive number
      if (typeof capacity !== 'number' || capacity <= 0) {
        return res.status(400).json({ message: "Capacity must be a positive number" });
      }

      const facility = await storage.createFacility(req.body);
      return res.status(201).json(facility);
    } catch (error) {
      console.error("Error creating facility:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/admin/facilities/:id", isAdmin, async (req, res) => {
    try {
      const facilityId = parseInt(req.params.id);
      if (isNaN(facilityId)) {
        return res.status(400).json({ message: "Invalid facility ID" });
      }
      const updatedFacility = await storage.updateFacility(facilityId, req.body);
      return res.json(updatedFacility);
    } catch (error) {
      console.error("Error updating facility:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/facilities/:id", isAdmin, async (req, res) => {
    try {
      const facilityId = parseInt(req.params.id);
      if (isNaN(facilityId)) {
        return res.status(400).json({ message: "Invalid facility ID" });
      }
      await storage.deleteFacility(facilityId);
      return res.json({ message: "Facility deleted successfully" });
    } catch (error) {
      console.error("Error deleting facility:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin Analytics
  app.get("/api/admin/analytics", isAdmin, async (req, res) => {
    try {
      const analytics = await storage.getSystemAnalytics();
      return res.json(analytics);
    } catch (error) {
      const err = error as Error;
      console.error("Error retrieving analytics:", err);
      console.error("Error details:", {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      return res.status(500).json({ 
        message: "Internal server error",
        details: err.message 
      });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Set up WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Keep track of connected clients
  const clients = new Map();

  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    
    // Set up ping-pong to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Validate message structure
        if (!data.type || !data.id) {
          throw new Error('Invalid message format');
        }

        // Handle location updates
        if (data.type === 'location_update') {
          if (!data.latitude || !data.longitude) {
            throw new Error('Invalid location data');
          }

          // Store location update in database
          await storage.createLocationUpdate({
            userId: data.id,
            latitude: data.latitude.toString(),
            longitude: data.longitude.toString(),
            accuracy: data.accuracy?.toString(),
            timestamp: new Date(),
            source: data.role || 'user'
          });

          // Broadcast to relevant clients (e.g., emergency responders)
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'location_update',
                data: {
                  id: data.id,
                  latitude: data.latitude,
                  longitude: data.longitude,
                  accuracy: data.accuracy,
                  role: data.role,
                  timestamp: Date.now()
                }
              }));
            }
          });
        }

        // Handle emergency broadcasts
        if (data.type === 'emergency_broadcast') {
          // Validate emergency data
          if (!data.userId || !data.location) {
            throw new Error('Invalid emergency data');
          }

          // Store emergency in database
          const emergency = await storage.createEmergencyAlert({
            userId: data.userId,
            latitude: data.location.latitude.toString(),
            longitude: data.location.longitude.toString(),
            accuracy: data.location.accuracy?.toString(),
            emergencyType: data.type,
            description: data.description || '',
            priority: data.severity || 'medium'
          });

          // Broadcast emergency to response teams
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'emergency_broadcast',
                data: emergency
              }));
            }
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        // Send error back to client
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
          }));
        }
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clearInterval(pingInterval);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clearInterval(pingInterval);
    });
  });

  return httpServer;
}