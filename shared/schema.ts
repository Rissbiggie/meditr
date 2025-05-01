import { pgTable, text, serial, integer, boolean, timestamp, foreignKey, pgEnum, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// User roles enum
export const userRoleEnum = pgEnum('user_role', ['user', 'response_team', 'admin']);

export enum UserRole {
  USER = "user",
  RESPONSE_TEAM = "response_team",
  ADMIN = "admin"
}

// Location tracking table
export const locationUpdates = pgTable("location_updates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  latitude: numeric("latitude").notNull(),
  longitude: numeric("longitude").notNull(),
  accuracy: numeric("accuracy"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  source: text("source").notNull().default("user"), // user, ambulance, etc.
});

export const locationUpdatesRelations = relations(locationUpdates, ({ one }) => ({
  user: one(users, {
    fields: [locationUpdates.userId],
    references: [users.id],
  }),
}));

export const insertLocationUpdateSchema = createInsertSchema(locationUpdates).pick({
  userId: true,
  latitude: true,
  longitude: true,
  accuracy: true,
  source: true,
});

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  role: text("role").notNull().default(UserRole.USER),
  isEmailVerified: boolean("is_email_verified").default(false),
  verificationToken: text("verification_token"),
  verificationExpiry: timestamp("verification_expiry"),
  resetToken: text("reset_token"),
  resetExpiry: timestamp("reset_expiry"),
  lastLoginAt: timestamp("last_login_at")
});

export const usersRelations = relations(users, ({ one, many }) => ({
  medicalInfo: one(medicalInfo, {
    fields: [users.id],
    references: [medicalInfo.userId],
  }),
  emergencyContacts: many(emergencyContacts),
  emergencyAlerts: many(emergencyAlerts),
  locationUpdates: many(locationUpdates),
}));

export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.nativeEnum(UserRole),
  phone: z.string(),
  password: z.string(),
  isEmailVerified: z.boolean().default(false),
  verificationToken: z.string().optional(),
  verificationExpiry: z.date().optional(),
  resetToken: z.string().optional(),
  resetExpiry: z.date().optional(),
  lastLoginAt: z.date().optional()
});

export const loginUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const insertUserSchema = userSchema.omit({ 
  id: true,
  createdAt: true,
  updatedAt: true,
  isEmailVerified: true,
  verificationToken: true,
  verificationExpiry: true,
  resetToken: true,
  resetExpiry: true,
  lastLoginAt: true
});

// Medical info table
export const medicalInfo = pgTable("medical_info", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  bloodType: text("blood_type"),
  allergies: text("allergies"),
  conditions: text("conditions"),
  medications: text("medications"),
});

export const medicalInfoRelations = relations(medicalInfo, ({ one }) => ({
  user: one(users, {
    fields: [medicalInfo.userId],
    references: [users.id],
  }),
}));

export const insertMedicalInfoSchema = createInsertSchema(medicalInfo).pick({
  userId: true,
  bloodType: true,
  allergies: true, 
  conditions: true,
  medications: true,
});

// Emergency contacts table
export const emergencyContacts = pgTable("emergency_contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  relationship: text("relationship").notNull(),
  phone: text("phone").notNull(),
});

export const emergencyContactsRelations = relations(emergencyContacts, ({ one }) => ({
  user: one(users, {
    fields: [emergencyContacts.userId],
    references: [users.id],
  }),
}));

export const insertEmergencyContactSchema = createInsertSchema(emergencyContacts).pick({
  userId: true,
  name: true,
  relationship: true,
  phone: true,
});

// Emergency alerts table
export const emergencyAlerts = pgTable("emergency_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  ambulanceId: integer("ambulance_id").references(() => ambulanceUnits.id),
  latitude: numeric("latitude").notNull(),
  longitude: numeric("longitude").notNull(),
  accuracy: numeric("accuracy"),
  emergencyType: text("emergency_type").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  assignedAt: timestamp("assigned_at"),
  priority: text("priority").notNull().default("medium"), // low, medium, high
  requiredResources: text("required_resources"), // JSON array of required resource types
  assignedResources: text("assigned_resources"), // JSON array of assigned resources
});

export const emergencyAlertsRelations = relations(emergencyAlerts, ({ one }) => ({
  user: one(users, {
    fields: [emergencyAlerts.userId],
    references: [users.id],
  }),
  ambulance: one(ambulanceUnits, {
    fields: [emergencyAlerts.ambulanceId],
    references: [ambulanceUnits.id],
  }),
}));

export const insertEmergencyAlertSchema = createInsertSchema(emergencyAlerts)
  .omit({ 
    ambulanceId: true,
    resolvedAt: true,
    assignedAt: true,
    updatedAt: true,
  })
  .pick({
    userId: true,
    latitude: true,
    longitude: true,
    accuracy: true,
    emergencyType: true,
    description: true,
    priority: true,
  });

// Ambulance units table
export const ambulanceUnits = pgTable("ambulance_units", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  accuracy: numeric("accuracy"),
  lastLocationUpdate: timestamp("last_location_update"),
  status: text("status").notNull().default("available"),
  currentEmergencyId: integer("current_emergency_id").references(() => emergencyAlerts.id),
});

export const ambulanceUnitsRelations = relations(ambulanceUnits, ({ many, one }) => ({
  emergencyAlerts: many(emergencyAlerts),
  currentEmergency: one(emergencyAlerts, {
    fields: [ambulanceUnits.currentEmergencyId],
    references: [emergencyAlerts.id],
  }),
}));

export const insertAmbulanceUnitSchema = createInsertSchema(ambulanceUnits)
  .omit({ currentEmergencyId: true })
  .pick({
    name: true,
    latitude: true,
    longitude: true,
    accuracy: true,
    status: true,
  });

// Medical facilities table
export const medicalFacilities = pgTable("medical_facilities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  address: text("address").notNull(),
  latitude: numeric("latitude").notNull(),
  longitude: numeric("longitude").notNull(),
  phone: text("phone"),
  openHours: text("open_hours"),
  rating: text("rating"),
  capacity: integer("capacity"),
  currentOccupancy: integer("current_occupancy"),
  lastUpdate: timestamp("last_update"),
  googlePlaceId: text("google_place_id").unique(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertMedicalFacilitySchema = createInsertSchema(medicalFacilities)
  .omit({ currentOccupancy: true, lastUpdate: true })
  .pick({
    name: true,
    type: true,
    address: true,
    latitude: true,
    longitude: true,
    phone: true,
    openHours: true,
    rating: true,
    capacity: true,
  });

// Emergency resource types
export const emergencyResourceTypes = pgTable("emergency_resource_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // medical, fire, police, etc.
});

// Emergency resources
export const emergencyResources = pgTable("emergency_resources", {
  id: serial("id").primaryKey(),
  typeId: integer("type_id").notNull().references(() => emergencyResourceTypes.id),
  name: text("name").notNull(),
  status: text("status").notNull().default("available"), // available, in_use, maintenance
  location: text("location"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  capacity: integer("capacity"),
  specializations: text("specializations"), // JSON array of specializations
  lastMaintenance: timestamp("last_maintenance"),
  nextMaintenance: timestamp("next_maintenance"),
});

// Emergency type to resource mapping
export const emergencyTypeResources = pgTable("emergency_type_resources", {
  id: serial("id").primaryKey(),
  emergencyType: text("emergency_type").notNull(),
  resourceTypeId: integer("resource_type_id").notNull().references(() => emergencyResourceTypes.id),
  priority: integer("priority").notNull().default(1), // 1 = required, 2 = recommended, 3 = optional
  quantity: integer("quantity").notNull().default(1),
});

// Emergency resource assignments
export const emergencyResourceAssignments = pgTable("emergency_resource_assignments", {
  id: serial("id").primaryKey(),
  emergencyId: integer("emergency_id").notNull().references(() => emergencyAlerts.id),
  resourceId: integer("resource_id").notNull().references(() => emergencyResources.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  status: text("status").notNull().default("assigned"), // assigned, en_route, on_scene, completed
  notes: text("notes"),
});

// Types export
export type User = z.infer<typeof userSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type MedicalInfo = typeof medicalInfo.$inferSelect;
export type InsertMedicalInfo = z.infer<typeof insertMedicalInfoSchema>;

export type EmergencyContact = typeof emergencyContacts.$inferSelect;
export type InsertEmergencyContact = z.infer<typeof insertEmergencyContactSchema>;

export type EmergencyAlert = typeof emergencyAlerts.$inferSelect;
export type InsertEmergencyAlert = z.infer<typeof insertEmergencyAlertSchema>;

export type AmbulanceUnit = typeof ambulanceUnits.$inferSelect;
export type InsertAmbulanceUnit = z.infer<typeof insertAmbulanceUnitSchema>;

export type MedicalFacility = typeof medicalFacilities.$inferSelect;
export type InsertMedicalFacility = z.infer<typeof insertMedicalFacilitySchema>;

export type LocationUpdate = typeof locationUpdates.$inferSelect;
export type InsertLocationUpdate = z.infer<typeof insertLocationUpdateSchema>;

export type EmergencyResourceType = typeof emergencyResourceTypes.$inferSelect;
export type EmergencyResource = typeof emergencyResources.$inferSelect;
export type EmergencyTypeResource = typeof emergencyTypeResources.$inferSelect;
export type EmergencyResourceAssignment = typeof emergencyResourceAssignments.$inferSelect;
