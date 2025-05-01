CREATE TABLE "emergency_resource_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"emergency_id" integer NOT NULL,
	"resource_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now(),
	"status" text DEFAULT 'assigned' NOT NULL,
	"notes" text
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
	"type_id" integer NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
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
	"resource_type_id" integer NOT NULL,
	"priority" integer DEFAULT 1 NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "location_updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"latitude" numeric NOT NULL,
	"longitude" numeric NOT NULL,
	"accuracy" numeric,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"source" text DEFAULT 'user' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ambulance_units" ALTER COLUMN "latitude" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "ambulance_units" ALTER COLUMN "longitude" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "emergency_alerts" ALTER COLUMN "latitude" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "emergency_alerts" ALTER COLUMN "longitude" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "emergency_alerts" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "medical_facilities" ALTER COLUMN "latitude" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "medical_facilities" ALTER COLUMN "longitude" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "ambulance_units" ADD COLUMN "accuracy" numeric;--> statement-breakpoint
ALTER TABLE "ambulance_units" ADD COLUMN "last_location_update" timestamp;--> statement-breakpoint
ALTER TABLE "ambulance_units" ADD COLUMN "current_emergency_id" integer;--> statement-breakpoint
ALTER TABLE "emergency_alerts" ADD COLUMN "accuracy" numeric;--> statement-breakpoint
ALTER TABLE "emergency_alerts" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "emergency_alerts" ADD COLUMN "resolved_at" timestamp;--> statement-breakpoint
ALTER TABLE "emergency_alerts" ADD COLUMN "assigned_at" timestamp;--> statement-breakpoint
ALTER TABLE "emergency_alerts" ADD COLUMN "priority" text DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "emergency_alerts" ADD COLUMN "required_resources" text;--> statement-breakpoint
ALTER TABLE "emergency_alerts" ADD COLUMN "assigned_resources" text;--> statement-breakpoint
ALTER TABLE "medical_facilities" ADD COLUMN "capacity" integer;--> statement-breakpoint
ALTER TABLE "medical_facilities" ADD COLUMN "current_occupancy" integer;--> statement-breakpoint
ALTER TABLE "medical_facilities" ADD COLUMN "last_update" timestamp;--> statement-breakpoint
ALTER TABLE "emergency_resource_assignments" ADD CONSTRAINT "emergency_resource_assignments_emergency_id_emergency_alerts_id_fk" FOREIGN KEY ("emergency_id") REFERENCES "public"."emergency_alerts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_resource_assignments" ADD CONSTRAINT "emergency_resource_assignments_resource_id_emergency_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."emergency_resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_resources" ADD CONSTRAINT "emergency_resources_type_id_emergency_resource_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."emergency_resource_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_type_resources" ADD CONSTRAINT "emergency_type_resources_resource_type_id_emergency_resource_types_id_fk" FOREIGN KEY ("resource_type_id") REFERENCES "public"."emergency_resource_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_updates" ADD CONSTRAINT "location_updates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ambulance_units" ADD CONSTRAINT "ambulance_units_current_emergency_id_emergency_alerts_id_fk" FOREIGN KEY ("current_emergency_id") REFERENCES "public"."emergency_alerts"("id") ON DELETE no action ON UPDATE no action;