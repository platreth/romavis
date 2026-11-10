CREATE TABLE "movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"world_id" integer NOT NULL,
	"type" text NOT NULL,
	"player_id" integer NOT NULL,
	"home_city_id" integer NOT NULL,
	"from_site_id" integer NOT NULL,
	"to_site_id" integer NOT NULL,
	"units" jsonb NOT NULL,
	"loot" jsonb,
	"depart_at" timestamp with time zone NOT NULL,
	"arrive_at" timestamp with time zone NOT NULL,
	"state" text DEFAULT 'moving' NOT NULL,
	"event_id" integer
);
--> statement-breakpoint
CREATE TABLE "native_relations" (
	"player_id" integer NOT NULL,
	"site_id" integer NOT NULL,
	"standing" double precision NOT NULL,
	"standing_at" timestamp with time zone NOT NULL,
	"tribute_at" timestamp with time zone NOT NULL,
	CONSTRAINT "native_relations_player_id_site_id_pk" PRIMARY KEY("player_id","site_id")
);
--> statement-breakpoint
CREATE TABLE "recruit_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"city_id" integer NOT NULL,
	"building" text NOT NULL,
	"unit_type" text NOT NULL,
	"count" integer NOT NULL,
	"started_at" timestamp with time zone,
	"event_id" integer
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"world_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"kind" text NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "unit_stacks" (
	"id" serial PRIMARY KEY NOT NULL,
	"home_city_id" integer NOT NULL,
	"city_id" integer NOT NULL,
	"unit_type" text NOT NULL,
	"count" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "protected_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "night_watch_start" integer;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "gloria_battle" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_home_city_id_cities_id_fk" FOREIGN KEY ("home_city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_from_site_id_sites_id_fk" FOREIGN KEY ("from_site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_to_site_id_sites_id_fk" FOREIGN KEY ("to_site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movements" ADD CONSTRAINT "movements_event_id_game_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."game_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "native_relations" ADD CONSTRAINT "native_relations_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "native_relations" ADD CONSTRAINT "native_relations_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruit_orders" ADD CONSTRAINT "recruit_orders_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruit_orders" ADD CONSTRAINT "recruit_orders_event_id_game_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."game_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_stacks" ADD CONSTRAINT "unit_stacks_home_city_id_cities_id_fk" FOREIGN KEY ("home_city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_stacks" ADD CONSTRAINT "unit_stacks_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "movements_player" ON "movements" USING btree ("player_id") WHERE "movements"."state" = 'moving';--> statement-breakpoint
CREATE INDEX "movements_target" ON "movements" USING btree ("to_site_id") WHERE "movements"."state" = 'moving';--> statement-breakpoint
CREATE INDEX "movements_home" ON "movements" USING btree ("home_city_id") WHERE "movements"."state" = 'moving';--> statement-breakpoint
CREATE INDEX "recruit_orders_city" ON "recruit_orders" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "reports_player" ON "reports" USING btree ("player_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "unit_stacks_home_city_type" ON "unit_stacks" USING btree ("home_city_id","city_id","unit_type");--> statement-breakpoint
CREATE INDEX "unit_stacks_city" ON "unit_stacks" USING btree ("city_id");