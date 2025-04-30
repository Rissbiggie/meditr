CREATE TYPE "public"."user_role" AS ENUM('user', 'response_team', 'admin');--> statement-breakpoint
CREATE TABLE "ambulance_units" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"latitude" text,
	"longitude" text,
	"status" text DEFAULT 'available' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emergency_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"ambulance_id" integer,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"emergency_type" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"required_resources" text,
	"assigned_resources" text
);
--> statement-breakpoint
CREATE TABLE "emergency_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"relationship" text NOT NULL,
	"phone" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_facilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"address" text NOT NULL,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"phone" text,
	"open_hours" text,
	"rating" text
);
--> statement-breakpoint
CREATE TABLE "medical_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"blood_type" text,
	"allergies" text,
	"conditions" text,
	"medications" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"is_email_verified" boolean DEFAULT false,
	"verification_token" text,
	"verification_expiry" timestamp,
	"reset_token" text,
	"reset_expiry" timestamp,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "emergency_resource_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emergency_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"type_id" integer NOT NULL REFERENCES "emergency_resource_types"("id"),
	"name" text NOT NULL,
	"status" text NOT NULL DEFAULT 'available',
	"location" text,
	"latitude" text,
	"longitude" text,
	"capacity" integer,
	"specializations" text,
	"last_maintenance" timestamp,
	"next_maintenance" timestamp
);
--> statement-breakpoint
CREATE TABLE "emergency_type_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"emergency_type" text NOT NULL,
	"resource_type_id" integer NOT NULL REFERENCES "emergency_resource_types"("id"),
	"priority" integer NOT NULL DEFAULT 1,
	"quantity" integer NOT NULL DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE "emergency_resource_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"emergency_id" integer NOT NULL REFERENCES "emergency_alerts"("id"),
	"resource_id" integer NOT NULL REFERENCES "emergency_resources"("id"),
	"assigned_at" timestamp DEFAULT now(),
	"status" text NOT NULL DEFAULT 'assigned',
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "emergency_alerts" ADD CONSTRAINT "emergency_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_alerts" ADD CONSTRAINT "emergency_alerts_ambulance_id_ambulance_units_id_fk" FOREIGN KEY ("ambulance_id") REFERENCES "public"."ambulance_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_info" ADD CONSTRAINT "medical_info_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;