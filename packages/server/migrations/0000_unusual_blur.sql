CREATE TABLE "build_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"city_id" integer NOT NULL,
	"building" text NOT NULL,
	"target_level" integer NOT NULL,
	"started_at" timestamp with time zone,
	"event_id" integer
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"world_id" integer NOT NULL,
	"site_id" integer NOT NULL,
	"player_id" integer,
	"name" text NOT NULL,
	"timber" integer NOT NULL,
	"stone" integer NOT NULL,
	"iron" integer NOT NULL,
	"resources_at" timestamp with time zone NOT NULL,
	"levels" jsonb NOT NULL,
	CONSTRAINT "cities_site_id_unique" UNIQUE("site_id")
);
--> statement-breakpoint
CREATE TABLE "game_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"world_id" integer NOT NULL,
	"type" text NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"payload" jsonb NOT NULL,
	"done_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "landmasses" (
	"id" serial PRIMARY KEY NOT NULL,
	"world_id" integer NOT NULL,
	"ring" integer NOT NULL,
	"idx" integer NOT NULL,
	"x" integer NOT NULL,
	"y" integer NOT NULL,
	"radius" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"world_id" integer NOT NULL,
	"joined_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" serial PRIMARY KEY NOT NULL,
	"landmass_id" integer NOT NULL,
	"kind" text NOT NULL,
	"slot" integer NOT NULL,
	"x" integer NOT NULL,
	"y" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worlds" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"seed" integer NOT NULL,
	"speed" integer DEFAULT 1 NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"rings_generated" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "worlds_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "build_orders" ADD CONSTRAINT "build_orders_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "build_orders" ADD CONSTRAINT "build_orders_event_id_game_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."game_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_events" ADD CONSTRAINT "game_events_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "landmasses" ADD CONSTRAINT "landmasses_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_landmass_id_landmasses_id_fk" FOREIGN KEY ("landmass_id") REFERENCES "public"."landmasses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "build_orders_city" ON "build_orders" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "cities_player" ON "cities" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "cities_world" ON "cities" USING btree ("world_id");--> statement-breakpoint
CREATE INDEX "game_events_due" ON "game_events" USING btree ("due_at","id") WHERE "game_events"."done_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "landmasses_world_ring_idx" ON "landmasses" USING btree ("world_id","ring","idx");--> statement-breakpoint
CREATE UNIQUE INDEX "players_user_world" ON "players" USING btree ("user_id","world_id");--> statement-breakpoint
CREATE INDEX "sites_landmass" ON "sites" USING btree ("landmass_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_lower" ON "users" USING btree (lower("username"));--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower" ON "users" USING btree (lower("email"));