CREATE TABLE "presentation_access_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"presentation_id" uuid NOT NULL,
	"user_id" uuid,
	"guest_id" uuid,
	"role" text NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "presentation_grant_actor" CHECK (("presentation_access_grants"."user_id" IS NOT NULL) <> ("presentation_access_grants"."guest_id" IS NOT NULL)),
	CONSTRAINT "presentation_grant_role" CHECK ("presentation_access_grants"."role" IN ('VIEWER','COLLABORATOR'))
);
--> statement-breakpoint
CREATE TABLE "presentation_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"presentation_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"state" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_user_id" uuid,
	"grant_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "presentation_invite_state" CHECK ("presentation_invitations"."state" IN ('PENDING','ACCEPTED','DECLINED','CANCELLED','EXPIRED')),
	CONSTRAINT "presentation_invite_role" CHECK ("presentation_invitations"."role" IN ('VIEWER','COLLABORATOR'))
);
--> statement-breakpoint
CREATE TABLE "presentation_screens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"presentation_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"draft" jsonb NOT NULL,
	"change_stamp" integer DEFAULT 0 NOT NULL,
	"state" text NOT NULL,
	"last_definition_id" uuid,
	"sort_order" integer NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "presentation_screen_lifecycle" CHECK ("presentation_screens"."kind" IN ('MAIN_ARCHITECTURE','AUTHORED') AND "presentation_screens"."state" IN ('DRAFT','CONFIRMED') AND "presentation_screens"."change_stamp">=0)
);
--> statement-breakpoint
CREATE TABLE "presentations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"architecture_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"purpose" text NOT NULL,
	"state" text NOT NULL,
	"change_stamp" integer DEFAULT 0 NOT NULL,
	"selected_screen_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "presentation_state" CHECK ("presentations"."state" IN ('PREPARING','READY') AND "presentations"."change_stamp">=0)
);
--> statement-breakpoint
CREATE TABLE "scenario_overlay_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"screen_id" uuid NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "presentation_screen_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"screen_id" uuid NOT NULL,
	"presentation_id" uuid NOT NULL,
	"draft_stamp" integer NOT NULL,
	"definition" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "presentation_screen_knowledge_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"screen_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"origin_id" uuid NOT NULL,
	"origin_stamp" integer,
	"included_by_user_id" uuid NOT NULL,
	"representation" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "presentation_inclusion_kind" CHECK ("presentation_screen_knowledge_references"."kind" IN ('KNOWLEDGE','SNAPSHOT','SOURCE_REFERENCE'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "presentation_screen_owner_unique" ON "presentation_screens" USING btree ("id","presentation_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "presentation_definition_owner_unique" ON "presentation_screen_definitions" USING btree ("id","screen_id");
--> statement-breakpoint
ALTER TABLE "presentation_access_grants" ADD CONSTRAINT "presentation_access_grants_presentation_id_presentations_id_fk" FOREIGN KEY ("presentation_id") REFERENCES "public"."presentations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentation_access_grants" ADD CONSTRAINT "presentation_access_grants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentation_access_grants" ADD CONSTRAINT "presentation_access_grants_guest_id_scoped_guest_access_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."scoped_guest_access"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentation_invitations" ADD CONSTRAINT "presentation_invitations_presentation_id_presentations_id_fk" FOREIGN KEY ("presentation_id") REFERENCES "public"."presentations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentation_invitations" ADD CONSTRAINT "presentation_invitations_accepted_user_id_users_id_fk" FOREIGN KEY ("accepted_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentation_invitations" ADD CONSTRAINT "presentation_invitations_grant_id_presentation_access_grants_id_fk" FOREIGN KEY ("grant_id") REFERENCES "public"."presentation_access_grants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentation_screens" ADD CONSTRAINT "presentation_screens_presentation_id_presentations_id_fk" FOREIGN KEY ("presentation_id") REFERENCES "public"."presentations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentations" ADD CONSTRAINT "presentations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentations" ADD CONSTRAINT "presentations_architecture_id_architectures_id_fk" FOREIGN KEY ("architecture_id") REFERENCES "public"."architectures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentations" ADD CONSTRAINT "presentations_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenario_overlay_connections" ADD CONSTRAINT "scenario_overlay_connections_screen_id_presentation_screens_id_fk" FOREIGN KEY ("screen_id") REFERENCES "public"."presentation_screens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentation_screen_definitions" ADD CONSTRAINT "presentation_screen_definitions_screen_id_presentation_screens_id_fk" FOREIGN KEY ("screen_id") REFERENCES "public"."presentation_screens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentation_screen_definitions" ADD CONSTRAINT "presentation_screen_definitions_presentation_id_presentations_id_fk" FOREIGN KEY ("presentation_id") REFERENCES "public"."presentations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentation_screen_definitions" ADD CONSTRAINT "definition_screen_family_fk" FOREIGN KEY ("screen_id","presentation_id") REFERENCES "public"."presentation_screens"("id","presentation_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentation_screen_knowledge_references" ADD CONSTRAINT "presentation_screen_knowledge_references_screen_id_presentation_screens_id_fk" FOREIGN KEY ("screen_id") REFERENCES "public"."presentation_screens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentation_screen_knowledge_references" ADD CONSTRAINT "presentation_screen_knowledge_references_included_by_user_id_users_id_fk" FOREIGN KEY ("included_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "presentation_user_grant_unique" ON "presentation_access_grants" USING btree ("presentation_id","user_id") WHERE "presentation_access_grants"."revoked_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "presentation_guest_grant_unique" ON "presentation_access_grants" USING btree ("presentation_id","guest_id") WHERE "presentation_access_grants"."revoked_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "presentation_base_unique" ON "presentation_screens" USING btree ("presentation_id") WHERE "presentation_screens"."kind"='MAIN_ARCHITECTURE';--> statement-breakpoint
--> statement-breakpoint

--> statement-breakpoint
ALTER TABLE presentation_screens ADD CONSTRAINT screen_last_definition_fk FOREIGN KEY(last_definition_id,id) REFERENCES presentation_screen_definitions(id,screen_id) DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
ALTER TABLE presentations ADD CONSTRAINT presentation_selected_screen_fk FOREIGN KEY(selected_screen_id,id) REFERENCES presentation_screens(id,presentation_id) DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
CREATE FUNCTION asl_presentation_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE a architectures;
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Presentations are retained' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (NEW.project_id<>OLD.project_id OR NEW.architecture_id<>OLD.architecture_id OR NEW.owner_id<>OLD.owner_id OR NEW.id<>OLD.id) THEN
 RAISE EXCEPTION 'Presentation binding is immutable' USING ERRCODE='23514'; END IF;
 SELECT * INTO a FROM architectures WHERE id=NEW.architecture_id FOR SHARE;
 IF a.state IS DISTINCT FROM 'CONFIRMED' OR a.project_id IS DISTINCT FROM NEW.project_id THEN
 RAISE EXCEPTION 'Presentation requires confirmed same-project architecture' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER presentation_guard BEFORE INSERT OR UPDATE OR DELETE ON presentations FOR EACH ROW EXECUTE FUNCTION asl_presentation_guard();
--> statement-breakpoint
CREATE FUNCTION asl_presentation_screen_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Screens are retained; delete current authored screen logically' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (NEW.presentation_id<>OLD.presentation_id OR NEW.id<>OLD.id OR NEW.kind<>OLD.kind) THEN RAISE EXCEPTION 'Screen ownership is immutable' USING ERRCODE='23514'; END IF;
 IF NEW.kind='MAIN_ARCHITECTURE' AND (NEW.deleted_at IS NOT NULL OR NEW.draft->>'type'<>'MAIN_ARCHITECTURE' OR NEW.draft->'scope'->>'kind'<>'WHOLE_ARCHITECTURE') THEN RAISE EXCEPTION 'Main Architecture is protected' USING ERRCODE='23514'; END IF;
 IF NEW.kind='AUTHORED' AND NEW.draft->>'type'='MAIN_ARCHITECTURE' THEN RAISE EXCEPTION 'Only one base screen is allowed' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND OLD.kind='MAIN_ARCHITECTURE' AND (NEW.draft<>OLD.draft OR NEW.state<>OLD.state OR NEW.sort_order<>0) THEN RAISE EXCEPTION 'Base definition is protected' USING ERRCODE='23514'; END IF;
 IF NEW.state='CONFIRMED' AND (NEW.last_definition_id IS NULL AND TG_OP='UPDATE') THEN RAISE EXCEPTION 'Confirmed screen requires definition' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER presentation_screen_guard BEFORE INSERT OR UPDATE OR DELETE ON presentation_screens FOR EACH ROW EXECUTE FUNCTION asl_presentation_screen_guard();
--> statement-breakpoint
CREATE FUNCTION asl_screen_definition_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Confirmed screen definition is immutable' USING ERRCODE='23514'; END $$;
--> statement-breakpoint
CREATE TRIGGER screen_definition_immutable BEFORE UPDATE OR DELETE ON presentation_screen_definitions FOR EACH ROW EXECUTE FUNCTION asl_screen_definition_immutable();
--> statement-breakpoint
CREATE TRIGGER screen_inclusion_immutable BEFORE UPDATE ON presentation_screen_knowledge_references FOR EACH ROW EXECUTE FUNCTION asl_screen_definition_immutable();
--> statement-breakpoint
CREATE FUNCTION asl_presentation_base_consistency() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE owner_id uuid; bases integer; invalid integer;
BEGIN
 IF TG_TABLE_NAME='presentations' THEN owner_id=NEW.id; ELSE owner_id=NEW.presentation_id; END IF;
 SELECT count(*) FILTER(WHERE kind='MAIN_ARCHITECTURE' AND deleted_at IS NULL),
 count(*) FILTER(WHERE state='CONFIRMED' AND last_definition_id IS NULL)
 INTO bases,invalid FROM presentation_screens WHERE presentation_id=owner_id;
 IF bases<>1 OR invalid<>0 THEN RAISE EXCEPTION 'Presentation needs one protected base and confirmed definitions' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER presentation_base_consistency AFTER INSERT OR UPDATE ON presentations DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION asl_presentation_base_consistency();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER presentation_screen_consistency AFTER INSERT OR UPDATE ON presentation_screens DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION asl_presentation_base_consistency();
