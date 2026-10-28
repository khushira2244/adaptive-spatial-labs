CREATE TABLE "knowledge_contexts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"architecture_id" uuid,
	"graph_id" uuid,
	"node_id" uuid,
	"connection_id" uuid,
	"inner_link_id" uuid,
	"source_reference_id" uuid,
	"snapshot_id" uuid,
	"descriptor" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	CONSTRAINT "knowledge_context_target_valid" CHECK (
 ("knowledge_contexts"."kind"='ARCHITECTURE' AND "knowledge_contexts"."architecture_id" IS NOT NULL AND "knowledge_contexts"."graph_id" IS NOT NULL AND "knowledge_contexts"."source_reference_id" IS NULL AND "knowledge_contexts"."snapshot_id" IS NULL)
 OR ("knowledge_contexts"."kind"='SOURCE_REFERENCE' AND "knowledge_contexts"."source_reference_id" IS NOT NULL AND "knowledge_contexts"."architecture_id" IS NULL AND "knowledge_contexts"."graph_id" IS NULL AND "knowledge_contexts"."snapshot_id" IS NULL AND "knowledge_contexts"."node_id" IS NULL AND "knowledge_contexts"."connection_id" IS NULL AND "knowledge_contexts"."inner_link_id" IS NULL)
 OR ("knowledge_contexts"."kind"='SNAPSHOT' AND "knowledge_contexts"."snapshot_id" IS NOT NULL AND "knowledge_contexts"."architecture_id" IS NULL AND "knowledge_contexts"."graph_id" IS NULL AND "knowledge_contexts"."source_reference_id" IS NULL AND "knowledge_contexts"."node_id" IS NULL AND "knowledge_contexts"."connection_id" IS NULL AND "knowledge_contexts"."inner_link_id" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "knowledge_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"guest_id" uuid,
	"project_id" uuid,
	"visibility" text DEFAULT 'PRIVATE' NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"state" text NOT NULL,
	"change_stamp" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "knowledge_actor_exclusive" CHECK (("knowledge_items"."user_id" IS NOT NULL) <> ("knowledge_items"."guest_id" IS NOT NULL)),
	CONSTRAINT "knowledge_private_only" CHECK ("knowledge_items"."visibility"='PRIVATE'),
	CONSTRAINT "knowledge_category_valid" CHECK ("knowledge_items"."category" IN ('NOTE','QUESTION','DISCUSSION_POINT')),
	CONSTRAINT "knowledge_state_valid" CHECK ("knowledge_items"."state" IN ('ACTIVE','ARCHIVED')),
	CONSTRAINT "knowledge_stamp_valid" CHECK ("knowledge_items"."change_stamp">=0)
);
--> statement-breakpoint
CREATE TABLE "snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"guest_id" uuid,
	"project_id" uuid NOT NULL,
	"visibility" text DEFAULT 'PRIVATE' NOT NULL,
	"architecture_id" uuid NOT NULL,
	"graph_id" uuid NOT NULL,
	"scope" jsonb NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "snapshot_actor_exclusive" CHECK (("snapshots"."user_id" IS NOT NULL) <> ("snapshots"."guest_id" IS NOT NULL)),
	CONSTRAINT "snapshot_private_only" CHECK ("snapshots"."visibility"='PRIVATE')
);
--> statement-breakpoint
ALTER TABLE "knowledge_contexts" ADD CONSTRAINT "knowledge_contexts_item_id_knowledge_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_contexts" ADD CONSTRAINT "knowledge_contexts_architecture_id_architectures_id_fk" FOREIGN KEY ("architecture_id") REFERENCES "public"."architectures"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_contexts" ADD CONSTRAINT "knowledge_contexts_source_reference_id_source_references_id_fk" FOREIGN KEY ("source_reference_id") REFERENCES "public"."source_references"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_contexts" ADD CONSTRAINT "knowledge_contexts_snapshot_id_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."snapshots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_contexts" ADD CONSTRAINT "knowledge_context_graph_family_fk" FOREIGN KEY ("graph_id","architecture_id") REFERENCES "public"."architecture_graphs"("id","architecture_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_guest_id_scoped_guest_access_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."scoped_guest_access"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_guest_id_scoped_guest_access_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."scoped_guest_access"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshot_architecture_fk" FOREIGN KEY ("architecture_id") REFERENCES "public"."architectures"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshot_graph_family_fk" FOREIGN KEY ("graph_id","architecture_id") REFERENCES "public"."architecture_graphs"("id","architecture_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "knowledge_context_current_idx" ON "knowledge_contexts" USING btree ("item_id","ended_at");--> statement-breakpoint
CREATE INDEX "knowledge_context_graph_idx" ON "knowledge_contexts" USING btree ("graph_id");--> statement-breakpoint
CREATE INDEX "knowledge_user_project_idx" ON "knowledge_items" USING btree ("user_id","project_id");--> statement-breakpoint
CREATE INDEX "knowledge_guest_idx" ON "knowledge_items" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "snapshot_user_project_idx" ON "snapshots" USING btree ("user_id","project_id");--> statement-breakpoint
CREATE INDEX "snapshot_guest_idx" ON "snapshots" USING btree ("guest_id");
--> statement-breakpoint
CREATE FUNCTION asl_snapshot_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Semantic snapshot is immutable' USING ERRCODE='23514'; END $$;
--> statement-breakpoint
CREATE TRIGGER snapshot_immutable BEFORE UPDATE OR DELETE ON snapshots FOR EACH ROW EXECUTE FUNCTION asl_snapshot_immutable();
--> statement-breakpoint
CREATE FUNCTION asl_snapshot_anchor_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE a architectures; g architecture_graphs;
BEGIN
 SELECT * INTO a FROM architectures WHERE id=NEW.architecture_id FOR SHARE;
 SELECT * INTO g FROM architecture_graphs WHERE id=NEW.graph_id;
 IF a.state IS DISTINCT FROM 'CONFIRMED' OR g.state IS DISTINCT FROM 'CONFIRMED'
 OR a.project_id IS DISTINCT FROM NEW.project_id OR g.architecture_id IS DISTINCT FROM a.id
 OR NEW.scope->>'architectureId' IS DISTINCT FROM a.id::text
 OR NEW.scope->>'architectureGraphRef' IS DISTINCT FROM g.id::text
 OR (NEW.scope->>'architectureStamp')::bigint IS DISTINCT FROM a.change_stamp THEN
 RAISE EXCEPTION 'Snapshot requires exact confirmed context' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER snapshot_anchor_guard BEFORE INSERT ON snapshots FOR EACH ROW EXECUTE FUNCTION asl_snapshot_anchor_guard();
--> statement-breakpoint
CREATE FUNCTION asl_knowledge_item_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Authored knowledge is retained; archive instead' USING ERRCODE='23514'; END IF;
 IF NEW.id<>OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.guest_id IS DISTINCT FROM OLD.guest_id
 OR NEW.project_id IS DISTINCT FROM OLD.project_id OR NEW.visibility<>OLD.visibility OR NEW.created_at<>OLD.created_at
 OR NEW.change_stamp<>OLD.change_stamp+1 THEN
 RAISE EXCEPTION 'Knowledge identity is immutable and edits require next stamp' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER knowledge_item_guard BEFORE UPDATE OR DELETE ON knowledge_items FOR EACH ROW EXECUTE FUNCTION asl_knowledge_item_guard();
--> statement-breakpoint
CREATE FUNCTION asl_knowledge_context_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Context bindings are retained' USING ERRCODE='23514'; END IF;
 IF OLD.ended_at IS NOT NULL OR NEW.ended_at IS NULL
 OR (to_jsonb(NEW)-'ended_at') IS DISTINCT FROM (to_jsonb(OLD)-'ended_at') THEN
 RAISE EXCEPTION 'Captured binding cannot be repointed; end and replace it' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER knowledge_context_guard BEFORE UPDATE OR DELETE ON knowledge_contexts FOR EACH ROW EXECUTE FUNCTION asl_knowledge_context_guard();

