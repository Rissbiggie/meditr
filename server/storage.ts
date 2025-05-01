import { 
  users, 
  medicalInfo, 
  emergencyContacts, 
  emergencyAlerts, 
  ambulanceUnits, 
  medicalFacilities,
  type User, 
  type InsertUser, 
  type MedicalInfo,
  type InsertMedicalInfo,
  type EmergencyContact,
  type InsertEmergencyContact,
  type EmergencyAlert,
  type InsertEmergencyAlert,
  type AmbulanceUnit,
  type InsertAmbulanceUnit,
  type MedicalFacility,
  type InsertMedicalFacility,
  messages,
  UserRole,
  emergencyResources,
  emergencyResourceTypes,
  emergencyTypeResources,
  emergencyResourceAssignments
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { calculateDistance } from "../client/src/hooks/use-maps";
import { db } from "./db";
import { eq, desc, and, sql, asc } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Medical info operations
  getMedicalInfoByUserId(userId: number): Promise<MedicalInfo | undefined>;
  updateMedicalInfo(info: InsertMedicalInfo): Promise<MedicalInfo>;
  
  // Emergency contact operations
  getEmergencyContactsByUserId(userId: number): Promise<EmergencyContact[]>;
  createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact>;
  
  // Emergency alert operations
  createEmergencyAlert(alert: InsertEmergencyAlert): Promise<EmergencyAlert>;
  getActiveEmergencies(): Promise<EmergencyAlert[]>;
  getUserEmergencyHistory(userId: number): Promise<EmergencyAlert[]>;
  getRecentEmergencies(): Promise<EmergencyAlert[]>;
  resolveEmergency(id: number): Promise<EmergencyAlert>;
  assignAmbulance(emergencyId: number, ambulanceId: number): Promise<EmergencyAlert>;
  
  // Ambulance operations
  getAmbulanceUnits(): Promise<AmbulanceUnit[]>;
  getAvailableAmbulanceUnits(): Promise<AmbulanceUnit[]>;
  getNearbyAmbulances(lat: number, lng: number): Promise<AmbulanceUnit[]>;
  updateAmbulanceStatus(id: number, status: string): Promise<AmbulanceUnit>;
  updateAmbulanceLocation(id: number, lat: number, lng: number): Promise<AmbulanceUnit>;
  
  // Medical facility operations
  getMedicalFacilities(): Promise<MedicalFacility[]>;
  getNearbyFacilities(lat: number, lng: number): Promise<MedicalFacility[]>;
  
  // Session storage
  sessionStore: any; // Express session store instance

  // New methods for email verification and password reset
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  verifyEmail(userId: number): Promise<void>;
  setPasswordResetToken(userId: number, token: string, expiry: Date): Promise<void>;
  clearResetToken(userId: number): Promise<void>;
  updatePassword(userId: number, hashedPassword: string): Promise<void>;
  updateLastLogin(userId: number): Promise<void>;
  getUserByEmail(email: string): Promise<User | undefined>;

  // User count
  getUserCount(): Promise<number>;

  // Support operations
  getSupportAgents(): Promise<any[]>;
  createChatSession(userId: number): Promise<any>;
  storeChatMessage(sessionId: string, message: string): Promise<any>;

  // Checkup operations
  getAvailableTimeSlots(hospitalId: number, date: string): Promise<any[]>;
  scheduleCheckup(data: any): Promise<any>;
  getUserCheckups(userId: number): Promise<any[]>;

  // Resource operations
  getAvailableResources(): Promise<EmergencyResource[]>;
  getResourceTypes(): Promise<EmergencyResourceType[]>;
  getEmergencyTypeResources(): Promise<EmergencyTypeResource[]>;
  assignResources(emergencyId: number, resourceIds: number[]): Promise<EmergencyResourceAssignment[]>;

  // Admin User Management
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  
  // Admin Emergency Management
  getAllEmergencies(): Promise<EmergencyAlert[]>;
  updateEmergency(id: number, emergencyData: Partial<InsertEmergencyAlert>): Promise<EmergencyAlert>;
  
  // Admin Facility Management
  getAllFacilities(): Promise<MedicalFacility[]>;
  createFacility(facilityData: InsertMedicalFacility): Promise<MedicalFacility>;
  updateFacility(id: number, facilityData: Partial<InsertMedicalFacility>): Promise<MedicalFacility>;
  deleteFacility(id: number): Promise<void>;
  
  // Admin Analytics
  getSystemAnalytics(): Promise<{
    totalUsers: number;
    activeEmergencies: number;
    totalFacilities: number;
    emergencyTypes: { type: string; count: number }[];
    userActivity: { date: string; count: number }[];
    facilityUtilization: { facilityId: number; utilization: number }[];
  }>;
}

export const storage = {
  sessionStore: null as any, // Express session store instance

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user ? {
      ...user,
      role: user.role as UserRole,
      isEmailVerified: user.isEmailVerified || false,
      verificationToken: user.verificationToken || undefined,
      verificationExpiry: user.verificationExpiry || undefined,
      resetToken: user.resetToken || undefined,
      resetExpiry: user.resetExpiry || undefined,
      lastLoginAt: user.lastLoginAt || undefined
    } : undefined;
  },

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user ? {
      ...user,
      role: user.role as UserRole,
      isEmailVerified: user.isEmailVerified || false,
      verificationToken: user.verificationToken || undefined,
      verificationExpiry: user.verificationExpiry || undefined,
      resetToken: user.resetToken || undefined,
      resetExpiry: user.resetExpiry || undefined,
      lastLoginAt: user.lastLoginAt || undefined
    } : undefined;
  },

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...userData,
      isEmailVerified: false,
      verificationToken: null,
      verificationExpiry: null,
      resetToken: null,
      resetExpiry: null,
      lastLoginAt: null,
      role: userData.role || UserRole.USER
    }).returning();
    return {
      ...user,
      role: user.role as UserRole,
      isEmailVerified: user.isEmailVerified || false,
      verificationToken: user.verificationToken || undefined,
      verificationExpiry: user.verificationExpiry || undefined,
      resetToken: user.resetToken || undefined,
      resetExpiry: user.resetExpiry || undefined,
      lastLoginAt: user.lastLoginAt || undefined
    };
  },

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return await db.query.users.findFirst({
      where: eq(users.verificationToken, token)
    });
  },

  async getUserByResetToken(token: string): Promise<User | undefined> {
    return await db.query.users.findFirst({
      where: eq(users.resetToken, token)
    });
  },

  async verifyEmail(userId: number): Promise<void> {
    await db.update(users)
      .set({ 
        isEmailVerified: true,
        verificationToken: null,
        verificationExpiry: null
      })
      .where(eq(users.id, userId));
  },

  async setPasswordResetToken(userId: number, token: string, expiry: Date): Promise<void> {
    await db.update(users)
      .set({ 
        resetToken: token,
        resetExpiry: expiry
      })
      .where(eq(users.id, userId));
  },

  async clearResetToken(userId: number): Promise<void> {
    await db.update(users)
      .set({ 
        resetToken: null,
        resetExpiry: null
      })
      .where(eq(users.id, userId));
  },

  async updatePassword(userId: number, hashedPassword: string): Promise<void> {
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
  },

  async updateLastLogin(userId: number): Promise<void> {
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userId));
  },

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user ? {
      ...user,
      role: user.role as UserRole,
      isEmailVerified: user.isEmailVerified || false,
      verificationToken: user.verificationToken || undefined,
      verificationExpiry: user.verificationExpiry || undefined,
      resetToken: user.resetToken || undefined,
      resetExpiry: user.resetExpiry || undefined,
      lastLoginAt: user.lastLoginAt || undefined
    } : undefined;
  },

  // Medical info operations
  async getMedicalInfoByUserId(userId: number): Promise<MedicalInfo | undefined> {
    const [info] = await db.select()
      .from(medicalInfo)
      .where(eq(medicalInfo.userId, userId));
    return info;
  },

  async updateMedicalInfo(info: InsertMedicalInfo): Promise<MedicalInfo> {
    const [updatedInfo] = await db.update(medicalInfo)
      .set(info)
      .where(eq(medicalInfo.userId, info.userId))
      .returning();
    return updatedInfo;
  },

  // Emergency alert operations
  async getActiveEmergencies(): Promise<EmergencyAlert[]> {
    return await db.select()
      .from(emergencyAlerts)
      .where(eq(emergencyAlerts.status, 'active'))
      .orderBy(desc(emergencyAlerts.createdAt));
  },

  async getUserEmergencyHistory(userId: number): Promise<EmergencyAlert[]> {
    return await db.select()
      .from(emergencyAlerts)
      .where(eq(emergencyAlerts.userId, userId))
      .orderBy(desc(emergencyAlerts.createdAt));
  },

  async getRecentEmergencies(): Promise<EmergencyAlert[]> {
    return await db.select()
      .from(emergencyAlerts)
      .orderBy(desc(emergencyAlerts.createdAt))
      .limit(5);
  },

  async resolveEmergency(id: number): Promise<EmergencyAlert> {
    const [updatedEmergency] = await db.update(emergencyAlerts)
      .set({ status: 'resolved' })
      .where(eq(emergencyAlerts.id, id))
      .returning();
    return updatedEmergency;
  },

  async assignAmbulance(emergencyId: number, ambulanceId: number): Promise<EmergencyAlert> {
    const [updatedEmergency] = await db.update(emergencyAlerts)
      .set({ ambulanceId })
      .where(eq(emergencyAlerts.id, emergencyId))
      .returning();
    return updatedEmergency;
  },

  // Ambulance operations
  async getAmbulanceUnits(): Promise<AmbulanceUnit[]> {
    return await db.select().from(ambulanceUnits);
  },
  
  async getAvailableAmbulanceUnits(): Promise<AmbulanceUnit[]> {
    return await db.select()
      .from(ambulanceUnits)
      .where(eq(ambulanceUnits.status, "available"));
  },
  
  async getNearbyAmbulances(lat: number, lng: number): Promise<AmbulanceUnit[]> {
    // First get all ambulances
    const allAmbulances = await db.select().from(ambulanceUnits);
    
    // Filter and sort by distance
    return allAmbulances
      .filter(unit => {
        if (!unit.latitude || !unit.longitude) return false;
        
        const distance = calculateDistance(
          lat, 
          lng, 
          parseFloat(unit.latitude), 
          parseFloat(unit.longitude)
        );
        
        return distance <= 10; // Within 10km
      })
      .sort((a, b) => {
        // Sort by distance
        const distA = calculateDistance(
          lat, 
          lng, 
          parseFloat(a.latitude || "0"), 
          parseFloat(a.longitude || "0")
        );
        const distB = calculateDistance(
          lat, 
          lng, 
          parseFloat(b.latitude || "0"), 
          parseFloat(b.longitude || "0")
        );
        return distA - distB;
      });
  },
  
  async updateAmbulanceStatus(id: number, status: string): Promise<AmbulanceUnit> {
    const [updatedAmbulance] = await db.update(ambulanceUnits)
      .set({ status })
      .where(eq(ambulanceUnits.id, id))
      .returning();
    
    if (!updatedAmbulance) {
      throw new Error("Ambulance unit not found");
    }
    
    return updatedAmbulance;
  },
  
  async updateAmbulanceLocation(id: number, lat: number, lng: number): Promise<AmbulanceUnit> {
    const [updatedAmbulance] = await db.update(ambulanceUnits)
      .set({ 
        latitude: lat.toString(), 
        longitude: lng.toString() 
      })
      .where(eq(ambulanceUnits.id, id))
      .returning();
    
    if (!updatedAmbulance) {
      throw new Error("Ambulance unit not found");
    }
    
    return updatedAmbulance;
  },
  
  // Medical facility operations
  async getMedicalFacilities(): Promise<MedicalFacility[]> {
    return await db.select().from(medicalFacilities);
  },
  
  async getNearbyFacilities(lat: number, lng: number): Promise<MedicalFacility[]> {
    // Get all facilities
    const allFacilities = await db.select().from(medicalFacilities);
    
    // Filter and sort by distance
    return allFacilities
      .filter(facility => {
        const distance = calculateDistance(
          lat, 
          lng, 
          parseFloat(facility.latitude), 
          parseFloat(facility.longitude)
        );
        
        return distance <= 10; // Within 10km
      })
      .sort((a, b) => {
        // Sort by distance
        const distA = calculateDistance(
          lat, 
          lng, 
          parseFloat(a.latitude), 
          parseFloat(a.longitude)
        );
        const distB = calculateDistance(
          lat, 
          lng, 
          parseFloat(b.latitude), 
          parseFloat(b.longitude)
        );
        return distA - distB;
      });
  },

  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(users);
    return Number(result[0].count);
  },

  // Support operations
  async getSupportAgents(): Promise<any[]> {
    // Mock implementation
    return [
      { id: 1, name: "Dr. Smith", specialty: "General Medicine", isAvailable: true },
      { id: 2, name: "Dr. Johnson", specialty: "Emergency Care", isAvailable: true },
      { id: 3, name: "Dr. Williams", specialty: "Cardiology", isAvailable: true }
    ];
  },

  async createChatSession(userId: number): Promise<any> {
    // Mock implementation
    return {
      id: Date.now().toString(),
      userId,
      startTime: new Date(),
      status: 'active'
    };
  },

  async storeChatMessage(sessionId: string, message: string): Promise<any> {
    // Mock implementation
    return {
      id: Date.now().toString(),
      sessionId,
      text: message,
      timestamp: new Date()
    };
  },

  // Checkup operations
  async getAvailableTimeSlots(hospitalId: number, date: string): Promise<any[]> {
    // Mock implementation
    return [
      { id: "1", startTime: "09:00", endTime: "10:00", isAvailable: true },
      { id: "2", startTime: "10:00", endTime: "11:00", isAvailable: true },
      { id: "3", startTime: "11:00", endTime: "12:00", isAvailable: false },
      { id: "4", startTime: "14:00", endTime: "15:00", isAvailable: true }
    ];
  },

  async scheduleCheckup(data: any): Promise<any> {
    // Mock implementation
    return {
      id: Date.now(),
      ...data,
      hospitalName: "Central Hospital",
      status: 'scheduled'
    };
  },

  async getUserCheckups(userId: number): Promise<any[]> {
    // Mock implementation
    return [
      {
        id: 1,
        hospitalName: "Central Hospital",
        date: "2024-03-20",
        timeSlot: "09:00",
        reason: "Annual checkup",
        status: 'scheduled'
      },
      {
        id: 2,
        hospitalName: "City Medical Center",
        date: "2024-03-15",
        timeSlot: "14:00",
        reason: "Follow-up",
        status: 'completed'
      }
    ];
  },

  // Resource operations
  async getAvailableResources(): Promise<EmergencyResource[]> {
    return await db.select()
      .from(emergencyResources)
      .where(eq(emergencyResources.status, 'available'))
      .orderBy(desc(emergencyResources.lastMaintenance));
  },

  async getResourceTypes(): Promise<EmergencyResourceType[]> {
    return await db.select()
      .from(emergencyResourceTypes)
      .orderBy(asc(emergencyResourceTypes.name));
  },

  async getEmergencyTypeResources(): Promise<EmergencyTypeResource[]> {
    return await db.select()
      .from(emergencyTypeResources)
      .orderBy(asc(emergencyTypeResources.emergencyType), asc(emergencyTypeResources.priority));
  },

  async assignResources(emergencyId: number, resourceIds: number[]): Promise<EmergencyResourceAssignment[]> {
    const assignments: EmergencyResourceAssignment[] = [];
    
    for (const resourceId of resourceIds) {
      // Create assignment
      const [assignment] = await db.insert(emergencyResourceAssignments)
        .values({
          emergencyId,
          resourceId,
          status: 'assigned'
        })
        .returning();

      // Update resource status
      await db.update(emergencyResources)
        .set({ status: 'in_use' })
        .where(eq(emergencyResources.id, resourceId));

      // Update emergency assigned resources
      const emergency = await db.select()
        .from(emergencyAlerts)
        .where(eq(emergencyAlerts.id, emergencyId))
        .then(rows => rows[0]);

      if (emergency) {
        const assignedResources = emergency.assignedResources 
          ? JSON.parse(emergency.assignedResources)
          : [];
        
        assignedResources.push(resourceId);
        
        await db.update(emergencyAlerts)
          .set({ 
            assignedResources: JSON.stringify(assignedResources),
            assignedAt: new Date()
          })
          .where(eq(emergencyAlerts.id, emergencyId));
      }

      assignments.push(assignment);
    }

    return assignments;
  },

  // Admin User Management
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  },

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  },
  
  // Admin Emergency Management
  async getAllEmergencies(): Promise<EmergencyAlert[]> {
    return await db.select().from(emergencyAlerts).orderBy(desc(emergencyAlerts.createdAt));
  },

  async updateEmergency(id: number, emergencyData: Partial<InsertEmergencyAlert>): Promise<EmergencyAlert> {
    const [emergency] = await db
      .update(emergencyAlerts)
      .set(emergencyData)
      .where(eq(emergencyAlerts.id, id))
      .returning();
    return emergency;
  },
  
  // Admin Facility Management
  async getAllFacilities(): Promise<MedicalFacility[]> {
    return await db.select().from(medicalFacilities).orderBy(asc(medicalFacilities.name));
  },

  async createFacility(facilityData: InsertMedicalFacility): Promise<MedicalFacility> {
    const [facility] = await db
      .insert(medicalFacilities)
      .values(facilityData)
      .returning();
    return facility;
  },

  async updateFacility(id: number, facilityData: Partial<InsertMedicalFacility>): Promise<MedicalFacility> {
    const [facility] = await db
      .update(medicalFacilities)
      .set(facilityData)
      .where(eq(medicalFacilities.id, id))
      .returning();
    return facility;
  },

  async deleteFacility(id: number): Promise<void> {
    await db.delete(medicalFacilities).where(eq(medicalFacilities.id, id));
  },
  
  // Admin Analytics
  async getSystemAnalytics(): Promise<{
    totalUsers: number;
    activeEmergencies: number;
    totalFacilities: number;
    emergencyTypes: { type: string; count: number }[];
    userActivity: { date: string; count: number }[];
    facilityUtilization: { facilityId: number; utilization: number }[];
  }> {
    const [
      totalUsers,
      activeEmergencies,
      totalFacilities,
      emergencyTypes,
      userActivity,
      facilityUtilization
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(emergencyAlerts).where(eq(emergencyAlerts.status, 'active')),
      db.select({ count: sql<number>`count(*)` }).from(medicalFacilities),
      db.select({
        type: emergencyAlerts.type,
        count: sql<number>`count(*)`
      }).from(emergencyAlerts).groupBy(emergencyAlerts.type),
      db.select({
        date: sql<string>`date_trunc('day', ${locationUpdates.timestamp})`,
        count: sql<number>`count(distinct ${locationUpdates.userId})`
      }).from(locationUpdates).groupBy(sql`date_trunc('day', ${locationUpdates.timestamp})`),
      db.select({
        facilityId: medicalFacilities.id,
        utilization: sql<number>`count(${emergencyAlerts.id})::float / (select count(*) from ${emergencyAlerts}) * 100`
      }).from(medicalFacilities)
        .leftJoin(emergencyAlerts, eq(emergencyAlerts.facilityId, medicalFacilities.id))
        .groupBy(medicalFacilities.id)
    ]);

    return {
      totalUsers: totalUsers[0].count,
      activeEmergencies: activeEmergencies[0].count,
      totalFacilities: totalFacilities[0].count,
      emergencyTypes,
      userActivity,
      facilityUtilization
    };
  }
};

export class DatabaseStorage implements IStorage {
  sessionStore: any; // SessionStore instance

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: 'session'
    });
    
    // Seed the database with initial data if needed
    this.seedDatabaseIfNeeded();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user ? {
      ...user,
      role: user.role as UserRole,
      isEmailVerified: user.isEmailVerified || false,
      verificationToken: user.verificationToken || undefined,
      verificationExpiry: user.verificationExpiry || undefined,
      resetToken: user.resetToken || undefined,
      resetExpiry: user.resetExpiry || undefined,
      lastLoginAt: user.lastLoginAt || undefined
    } : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user ? {
      ...user,
      role: user.role as UserRole,
      isEmailVerified: user.isEmailVerified || false,
      verificationToken: user.verificationToken || undefined,
      verificationExpiry: user.verificationExpiry || undefined,
      resetToken: user.resetToken || undefined,
      resetExpiry: user.resetExpiry || undefined,
      lastLoginAt: user.lastLoginAt || undefined
    } : undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...userData,
      isEmailVerified: false,
      verificationToken: null,
      verificationExpiry: null,
      resetToken: null,
      resetExpiry: null,
      lastLoginAt: null,
      role: userData.role || UserRole.USER
    }).returning();
    return {
      ...user,
      role: user.role as UserRole,
      isEmailVerified: user.isEmailVerified || false,
      verificationToken: user.verificationToken || undefined,
      verificationExpiry: user.verificationExpiry || undefined,
      resetToken: user.resetToken || undefined,
      resetExpiry: user.resetExpiry || undefined,
      lastLoginAt: user.lastLoginAt || undefined
    };
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  // Medical info operations
  async getMedicalInfoByUserId(userId: number): Promise<MedicalInfo | undefined> {
    const [info] = await db.select()
      .from(medicalInfo)
      .where(eq(medicalInfo.userId, userId));
    return info;
  }
  
  async updateMedicalInfo(info: InsertMedicalInfo): Promise<MedicalInfo> {
    const [updatedInfo] = await db.update(medicalInfo)
      .set(info)
      .where(eq(medicalInfo.userId, info.userId))
      .returning();
    return updatedInfo;
  }
  
  // Emergency contact operations
  async getEmergencyContactsByUserId(userId: number): Promise<EmergencyContact[]> {
    return await db.select()
      .from(emergencyContacts)
      .where(eq(emergencyContacts.userId, userId));
  }
  
  async createEmergencyContact(contactData: InsertEmergencyContact): Promise<EmergencyContact> {
    const [contact] = await db.insert(emergencyContacts)
      .values(contactData)
      .returning();
    return contact;
  }
  
  // Emergency alert operations
  async createEmergencyAlert(alertData: InsertEmergencyAlert): Promise<EmergencyAlert> {
    const [alert] = await db.insert(emergencyAlerts)
      .values({
        ...alertData,
        status: "active"
        // createdAt will be set by the default in the schema
      })
      .returning();
    return alert;
  }
  
  async getActiveEmergencies(): Promise<EmergencyAlert[]> {
    return await db.select()
      .from(emergencyAlerts)
      .where(eq(emergencyAlerts.status, 'active'))
      .orderBy(desc(emergencyAlerts.createdAt));
  }
  
  async getUserEmergencyHistory(userId: number): Promise<EmergencyAlert[]> {
    return await db.select()
      .from(emergencyAlerts)
      .where(eq(emergencyAlerts.userId, userId))
      .orderBy(desc(emergencyAlerts.createdAt));
  }
  
  async getRecentEmergencies(): Promise<EmergencyAlert[]> {
    return await db.select()
      .from(emergencyAlerts)
      .orderBy(desc(emergencyAlerts.createdAt))
      .limit(5);
  }
  
  async resolveEmergency(id: number): Promise<EmergencyAlert> {
    const [updatedEmergency] = await db.update(emergencyAlerts)
      .set({ status: "resolved" })
      .where(eq(emergencyAlerts.id, id))
      .returning();
    
    if (!updatedEmergency) {
      throw new Error("Emergency not found");
    }
    
    return updatedEmergency;
  }
  
  async assignAmbulance(emergencyId: number, ambulanceId: number): Promise<EmergencyAlert> {
    // Update ambulance status
    const [updatedAmbulance] = await db.update(ambulanceUnits)
      .set({ status: "dispatched" })
      .where(eq(ambulanceUnits.id, ambulanceId))
      .returning();
    
    if (!updatedAmbulance) {
      throw new Error("Ambulance unit not found");
    }
    
    // Update emergency with ambulance assignment
    const [updatedEmergency] = await db.update(emergencyAlerts)
      .set({ 
        status: "in_progress",
        ambulanceId: ambulanceId
      })
      .where(eq(emergencyAlerts.id, emergencyId))
      .returning();
    
    if (!updatedEmergency) {
      throw new Error("Emergency not found");
    }
    
    return updatedEmergency;
  }
  
  // Ambulance operations
  async getAmbulanceUnits(): Promise<AmbulanceUnit[]> {
    return await db.select().from(ambulanceUnits);
  }
  
  async getAvailableAmbulanceUnits(): Promise<AmbulanceUnit[]> {
    return await db.select()
      .from(ambulanceUnits)
      .where(eq(ambulanceUnits.status, "available"));
  }
  
  async getNearbyAmbulances(lat: number, lng: number): Promise<AmbulanceUnit[]> {
    // First get all ambulances
    const allAmbulances = await db.select().from(ambulanceUnits);
    
    // Filter and sort by distance
    return allAmbulances
      .filter(unit => {
        if (!unit.latitude || !unit.longitude) return false;
        
        const distance = calculateDistance(
          lat, 
          lng, 
          parseFloat(unit.latitude), 
          parseFloat(unit.longitude)
        );
        
        return distance <= 10; // Within 10km
      })
      .sort((a, b) => {
        // Sort by distance
        const distA = calculateDistance(
          lat, 
          lng, 
          parseFloat(a.latitude || "0"), 
          parseFloat(a.longitude || "0")
        );
        const distB = calculateDistance(
          lat, 
          lng, 
          parseFloat(b.latitude || "0"), 
          parseFloat(b.longitude || "0")
        );
        return distA - distB;
      });
  }
  
  async updateAmbulanceStatus(id: number, status: string): Promise<AmbulanceUnit> {
    const [updatedAmbulance] = await db.update(ambulanceUnits)
      .set({ status })
      .where(eq(ambulanceUnits.id, id))
      .returning();
    
    if (!updatedAmbulance) {
      throw new Error("Ambulance unit not found");
    }
    
    return updatedAmbulance;
  }
  
  async updateAmbulanceLocation(id: number, lat: number, lng: number): Promise<AmbulanceUnit> {
    const [updatedAmbulance] = await db.update(ambulanceUnits)
      .set({ 
        latitude: lat.toString(), 
        longitude: lng.toString() 
      })
      .where(eq(ambulanceUnits.id, id))
      .returning();
    
    if (!updatedAmbulance) {
      throw new Error("Ambulance unit not found");
    }
    
    return updatedAmbulance;
  }
  
  // Medical facility operations
  async getMedicalFacilities(): Promise<MedicalFacility[]> {
    return await db.select().from(medicalFacilities);
  }
  
  async getNearbyFacilities(lat: number, lng: number): Promise<MedicalFacility[]> {
    // Get all facilities
    const allFacilities = await db.select().from(medicalFacilities);
    
    // Filter and sort by distance
    return allFacilities
      .filter(facility => {
        const distance = calculateDistance(
          lat, 
          lng, 
          parseFloat(facility.latitude), 
          parseFloat(facility.longitude)
        );
        
        return distance <= 10; // Within 10km
      })
      .sort((a, b) => {
        // Sort by distance
        const distA = calculateDistance(
          lat, 
          lng, 
          parseFloat(a.latitude), 
          parseFloat(a.longitude)
        );
        const distB = calculateDistance(
          lat, 
          lng, 
          parseFloat(b.latitude), 
          parseFloat(b.longitude)
        );
        return distA - distB;
      });
  }
  
  // Seed the database with sample data if needed
  private async seedDatabaseIfNeeded(): Promise<void> {
    try {
      // Check if we already have ambulance units
      const existingAmbulances = await db.select().from(ambulanceUnits);
      
      if (existingAmbulances.length === 0) {
        console.log("Seeding database with initial data...");
        
        // Sample ambulances
        await db.insert(ambulanceUnits).values([
          {
            name: "Ambulance Unit 103",
            latitude: "37.7749",
            longitude: "-122.4194",
            status: "available",
          },
          {
            name: "Ambulance Unit 105",
            latitude: "37.7833",
            longitude: "-122.4167",
            status: "available",
          },
          {
            name: "MedEvac Helicopter",
            latitude: "37.8044",
            longitude: "-122.2711",
            status: "available",
          }
        ]);
        
        // Sample medical facilities
        await db.insert(medicalFacilities).values([
          {
            name: "City General Hospital",
            type: "Hospital",
            address: "123 Main St, Cityville",
            latitude: "37.7749",
            longitude: "-122.4194",
            phone: "555-123-4567",
            openHours: "24/7",
            rating: "4.8",
          },
          {
            name: "Urgent Care Center",
            type: "Urgent Care",
            address: "456 Oak Ave, Townsville",
            latitude: "37.7833",
            longitude: "-122.4167",
            phone: "555-987-6543",
            openHours: "8AM-10PM",
            rating: "4.5",
          },
          {
            name: "HealthPlus Pharmacy",
            type: "Pharmacy",
            address: "789 Elm St, Villageton",
            latitude: "37.7894",
            longitude: "-122.4107",
            phone: "555-456-7890",
            openHours: "9AM-9PM",
            rating: "4.2",
          }
        ]);
        
        console.log("Database seeded successfully!");
      }
    } catch (error) {
      console.error("Error seeding database:", error);
    }
  }
}
