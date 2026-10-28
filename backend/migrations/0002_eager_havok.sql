CREATE TABLE "ingestion_run_references" (
	"run_id" uuid NOT NULL,
	"reference_id" uuid NOT NULL,
	"role" text NOT NULL,
	CONSTRAINT "ingestion_run_references_run_id_reference_id_role_pk" PRIMARY KEY("run_id","reference_id","role"),
	CONSTRAINT "ingestion_reference_role_valid" CHECK ("ingestion_run_references"."role" IN ('INPUT','OUTPUT'))
);
--> statement-breakpoint
CREATE TABLE "ingestion_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"input_revision" text NOT NULL,
	"retry_of" uuid,
	"state" text NOT NULL,
	"change_stamp" integer DEFAULT 0 NOT NULL,
	"failure_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "ingestion_state_valid" CHECK ("ingestion_runs"."state" IN ('PENDING','RUNNING','SUCCEEDED','FAILED','CANCELLED')),
	CONSTRAINT "ingestion_stamp_valid" CHECK ("ingestion_runs"."change_stamp" >= 0),
	CONSTRAINT "ingestion_completion_valid" CHECK (("ingestion_runs"."state" IN ('PENDING','RUNNING') AND "ingestion_runs"."completed_at" IS NULL) OR ("ingestion_runs"."state" IN ('SUCCEEDED','FAILED','CANCELLED') AND "ingestion_runs"."completed_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "source_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"revision" text NOT NULL,
	"locator" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "architecture_connections" (
	"id" uuid PRIMARY KEY NOT NULL,
	"graph_id" uuid NOT NULL,
	"source_node_id" uuid NOT NULL,
	"destination_node_id" uuid NOT NULL,
	"relationship" text NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "connection_relationship_valid" CHECK ("architecture_connections"."relationship" IN ('DEPENDS_ON','REQUEST','EVENT','DATA_FLOW','OTHER'))
);
--> statement-breakpoint
CREATE TABLE "architecture_graphs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"architecture_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"state" text NOT NULL,
	CONSTRAINT "graph_kind_valid" CHECK ("architecture_graphs"."kind" IN ('ROOT','INNER')),
	CONSTRAINT "graph_state_valid" CHECK ("architecture_graphs"."state" IN ('CANDIDATE','CONFIRMED'))
);
--> statement-breakpoint
CREATE TABLE "architecture_nodes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"graph_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"position" jsonb NOT NULL,
	"description" text NOT NULL,
	"technology" text NOT NULL,
	CONSTRAINT "node_type_valid" CHECK ("architecture_nodes"."type" IN ('SERVICE','API','DATABASE','CACHE','QUEUE_EVENT','GATEWAY','FRONTEND_CLIENT','EXTERNAL_SYSTEM','GENERIC')),
	CONSTRAINT "node_plane_valid" CHECK ("architecture_nodes"."position"->>'z' = '0')
);
--> statement-breakpoint
CREATE TABLE "architectures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"state" text NOT NULL,
	"change_stamp" integer DEFAULT 0 NOT NULL,
	"correction_state" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	CONSTRAINT "architecture_state_valid" CHECK ("architectures"."state" IN ('CANDIDATE','CONFIRMED')),
	CONSTRAINT "architecture_stamp_valid" CHECK ("architectures"."change_stamp" >= 0),
	CONSTRAINT "architecture_confirmation_valid" CHECK (("architectures"."state" = 'CANDIDATE' AND "architectures"."confirmed_at" IS NULL) OR ("architectures"."state" = 'CONFIRMED' AND "architectures"."confirmed_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "architecture_connection_provenance" (
	"connection_id" uuid NOT NULL,
	"graph_id" uuid NOT NULL,
	"reference_id" uuid NOT NULL,
	CONSTRAINT "architecture_connection_provenance_connection_id_reference_id_pk" PRIMARY KEY("connection_id","reference_id")
);
--> statement-breakpoint
CREATE TABLE "architecture_graph_provenance" (
	"graph_id" uuid NOT NULL,
	"reference_id" uuid NOT NULL,
	CONSTRAINT "architecture_graph_provenance_graph_id_reference_id_pk" PRIMARY KEY("graph_id","reference_id")
);
--> statement-breakpoint
CREATE TABLE "inner_architecture_references" (
	"id" uuid PRIMARY KEY NOT NULL,
	"architecture_id" uuid NOT NULL,
	"parent_graph_id" uuid NOT NULL,
	"parent_node_id" uuid NOT NULL,
	"child_graph_id" uuid NOT NULL,
	CONSTRAINT "inner_not_self" CHECK ("inner_architecture_references"."parent_graph_id" <> "inner_architecture_references"."child_graph_id")
);
--> statement-breakpoint
CREATE TABLE "architecture_node_provenance" (
	"node_id" uuid NOT NULL,
	"graph_id" uuid NOT NULL,
	"reference_id" uuid NOT NULL,
	CONSTRAINT "architecture_node_provenance_node_id_reference_id_pk" PRIMARY KEY("node_id","reference_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "connection_graph_identity_unique" ON "architecture_connections" USING btree ("id","graph_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "graph_family_identity_unique" ON "architecture_graphs" USING btree ("id","architecture_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "node_graph_identity_unique" ON "architecture_nodes" USING btree ("id","graph_id");
--> statement-breakpoint
ALTER TABLE "ingestion_run_references" ADD CONSTRAINT "ingestion_run_references_run_id_ingestion_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."ingestion_runs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_run_references" ADD CONSTRAINT "ingestion_run_references_reference_id_source_references_id_fk" FOREIGN KEY ("reference_id") REFERENCES "public"."source_references"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_runs" ADD CONSTRAINT "ingestion_runs_source_id_project_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."project_sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_runs" ADD CONSTRAINT "ingestion_runs_retry_of_ingestion_runs_id_fk" FOREIGN KEY ("retry_of") REFERENCES "public"."ingestion_runs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_references" ADD CONSTRAINT "source_references_source_id_project_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."project_sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "architecture_connections" ADD CONSTRAINT "architecture_connections_graph_id_architecture_graphs_id_fk" FOREIGN KEY ("graph_id") REFERENCES "public"."architecture_graphs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "architecture_connections" ADD CONSTRAINT "connection_source_same_graph_fk" FOREIGN KEY ("source_node_id","graph_id") REFERENCES "public"."architecture_nodes"("id","graph_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "architecture_connections" ADD CONSTRAINT "connection_destination_same_graph_fk" FOREIGN KEY ("destination_node_id","graph_id") REFERENCES "public"."architecture_nodes"("id","graph_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "architecture_graphs" ADD CONSTRAINT "architecture_graphs_architecture_id_architectures_id_fk" FOREIGN KEY ("architecture_id") REFERENCES "public"."architectures"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "architecture_nodes" ADD CONSTRAINT "architecture_nodes_graph_id_architecture_graphs_id_fk" FOREIGN KEY ("graph_id") REFERENCES "public"."architecture_graphs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "architectures" ADD CONSTRAINT "architectures_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "architecture_connection_provenance" ADD CONSTRAINT "architecture_connection_provenance_reference_id_source_references_id_fk" FOREIGN KEY ("reference_id") REFERENCES "public"."source_references"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "architecture_connection_provenance" ADD CONSTRAINT "connection_provenance_owner_fk" FOREIGN KEY ("connection_id","graph_id") REFERENCES "public"."architecture_connections"("id","graph_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "architecture_graph_provenance" ADD CONSTRAINT "architecture_graph_provenance_graph_id_architecture_graphs_id_fk" FOREIGN KEY ("graph_id") REFERENCES "public"."architecture_graphs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "architecture_graph_provenance" ADD CONSTRAINT "architecture_graph_provenance_reference_id_source_references_id_fk" FOREIGN KEY ("reference_id") REFERENCES "public"."source_references"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inner_architecture_references" ADD CONSTRAINT "inner_architecture_references_architecture_id_architectures_id_fk" FOREIGN KEY ("architecture_id") REFERENCES "public"."architectures"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inner_architecture_references" ADD CONSTRAINT "inner_parent_same_family_fk" FOREIGN KEY ("parent_graph_id","architecture_id") REFERENCES "public"."architecture_graphs"("id","architecture_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inner_architecture_references" ADD CONSTRAINT "inner_child_same_family_fk" FOREIGN KEY ("child_graph_id","architecture_id") REFERENCES "public"."architecture_graphs"("id","architecture_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inner_architecture_references" ADD CONSTRAINT "inner_node_same_graph_fk" FOREIGN KEY ("parent_node_id","parent_graph_id") REFERENCES "public"."architecture_nodes"("id","graph_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "architecture_node_provenance" ADD CONSTRAINT "architecture_node_provenance_reference_id_source_references_id_fk" FOREIGN KEY ("reference_id") REFERENCES "public"."source_references"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "architecture_node_provenance" ADD CONSTRAINT "node_provenance_owner_fk" FOREIGN KEY ("node_id","graph_id") REFERENCES "public"."architecture_nodes"("id","graph_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ingestion_active_source_unique" ON "ingestion_runs" USING btree ("source_id") WHERE "ingestion_runs"."state" IN ('PENDING','RUNNING');--> statement-breakpoint
CREATE UNIQUE INDEX "source_reference_origin_unique" ON "source_references" USING btree ("source_id","revision","locator");--> statement-breakpoint
--> statement-breakpoint
--> statement-breakpoint
CREATE UNIQUE INDEX "graph_root_unique" ON "architecture_graphs" USING btree ("architecture_id") WHERE "architecture_graphs"."kind" = 'ROOT';--> statement-breakpoint
--> statement-breakpoint
CREATE UNIQUE INDEX "architecture_project_unique" ON "architectures" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inner_parent_node_unique" ON "inner_architecture_references" USING btree ("parent_node_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inner_child_graph_unique" ON "inner_architecture_references" USING btree ("child_graph_id");
--> statement-breakpoint
-- Exact provenance is append-only. Availability stays on Source, outside origin identity.
CREATE FUNCTION asl_source_reference_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Source references are immutable' USING ERRCODE='23514'; END $$;
--> statement-breakpoint
CREATE TRIGGER source_reference_immutable BEFORE UPDATE OR DELETE ON source_references FOR EACH ROW EXECUTE FUNCTION asl_source_reference_immutable();
--> statement-breakpoint
CREATE FUNCTION asl_ingestion_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.state IN ('SUCCEEDED','FAILED','CANCELLED') THEN
  RAISE EXCEPTION 'Terminal ingestion is immutable' USING ERRCODE='23514';
 END IF;
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Ingestion attempts are retained' USING ERRCODE='23514'; END IF;
 IF NEW.id<>OLD.id OR NEW.source_id<>OLD.source_id OR NEW.input_revision<>OLD.input_revision OR NEW.retry_of IS DISTINCT FROM OLD.retry_of OR NEW.created_at<>OLD.created_at
 OR NEW.change_stamp<>OLD.change_stamp+1
 OR NOT ((OLD.state='PENDING' AND NEW.state IN ('RUNNING','CANCELLED')) OR (OLD.state='RUNNING' AND NEW.state IN ('SUCCEEDED','FAILED','CANCELLED'))) THEN
  RAISE EXCEPTION 'Invalid ingestion transition' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER ingestion_guard BEFORE UPDATE OR DELETE ON ingestion_runs FOR EACH ROW EXECUTE FUNCTION asl_ingestion_guard();
--> statement-breakpoint
CREATE FUNCTION asl_ingestion_reference_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE run ingestion_runs; origin source_references;
BEGIN
 IF TG_OP<>'INSERT' THEN RAISE EXCEPTION 'Attempt provenance is append-only' USING ERRCODE='23514'; END IF;
 SELECT * INTO run FROM ingestion_runs WHERE id=NEW.run_id FOR UPDATE;
 SELECT * INTO origin FROM source_references WHERE id=NEW.reference_id;
 IF run.state NOT IN ('PENDING','RUNNING') OR origin.source_id<>run.source_id OR origin.revision<>run.input_revision
 OR (NEW.role='INPUT' AND run.state<>'PENDING') OR (NEW.role='OUTPUT' AND run.state<>'RUNNING') THEN
  RAISE EXCEPTION 'Invalid attempt provenance' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER ingestion_reference_guard BEFORE INSERT OR UPDATE OR DELETE ON ingestion_run_references FOR EACH ROW EXECUTE FUNCTION asl_ingestion_reference_guard();
--> statement-breakpoint
CREATE FUNCTION asl_architecture_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' OR OLD.state='CONFIRMED' OR NEW.id<>OLD.id OR NEW.project_id<>OLD.project_id OR NEW.change_stamp<>OLD.change_stamp+1 THEN
  RAISE EXCEPTION 'Architecture is retained or frozen' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER architecture_guard BEFORE UPDATE OR DELETE ON architectures FOR EACH ROW EXECUTE FUNCTION asl_architecture_guard();
--> statement-breakpoint
CREATE FUNCTION asl_graph_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE owner_state text;
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Imported graphs are retained' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (OLD.state='CONFIRMED' OR NEW.id<>OLD.id OR NEW.architecture_id<>OLD.architecture_id OR NEW.kind<>OLD.kind) THEN
  RAISE EXCEPTION 'Graph identity is frozen' USING ERRCODE='23514';
 END IF;
 SELECT state INTO owner_state FROM architectures WHERE id=NEW.architecture_id FOR UPDATE;
 IF owner_state<>'CANDIDATE' THEN RAISE EXCEPTION 'Graph owner is frozen' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER graph_guard BEFORE INSERT OR UPDATE OR DELETE ON architecture_graphs FOR EACH ROW EXECUTE FUNCTION asl_graph_guard();
--> statement-breakpoint
CREATE FUNCTION asl_candidate_content_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE old_graph uuid; new_graph uuid; gstate text; astate text; owner_id uuid;
BEGIN
 IF TG_OP<>'INSERT' THEN old_graph=(to_jsonb(OLD)->>TG_ARGV[0])::uuid; END IF;
 IF TG_OP<>'DELETE' THEN new_graph=(to_jsonb(NEW)->>TG_ARGV[0])::uuid; END IF;
 IF TG_OP='UPDATE' AND (new_graph IS DISTINCT FROM old_graph OR
  (to_jsonb(NEW)->>'id') IS DISTINCT FROM (to_jsonb(OLD)->>'id')) THEN
  RAISE EXCEPTION 'Content identity cannot be repointed' USING ERRCODE='23514';
 END IF;
 SELECT architecture_id INTO owner_id FROM architecture_graphs WHERE id=COALESCE(old_graph,new_graph);
 SELECT state INTO astate FROM architectures WHERE id=owner_id FOR UPDATE;
 SELECT state INTO gstate FROM architecture_graphs WHERE id=COALESCE(old_graph,new_graph);
 IF astate IS DISTINCT FROM 'CANDIDATE' OR gstate IS DISTINCT FROM 'CANDIDATE' THEN
  RAISE EXCEPTION 'Canonical content is frozen' USING ERRCODE='23514';
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER node_candidate_guard BEFORE INSERT OR UPDATE OR DELETE ON architecture_nodes FOR EACH ROW EXECUTE FUNCTION asl_candidate_content_guard('graph_id');
--> statement-breakpoint
CREATE TRIGGER connection_candidate_guard BEFORE INSERT OR UPDATE OR DELETE ON architecture_connections FOR EACH ROW EXECUTE FUNCTION asl_candidate_content_guard('graph_id');
--> statement-breakpoint
CREATE TRIGGER inner_candidate_guard BEFORE INSERT OR UPDATE OR DELETE ON inner_architecture_references FOR EACH ROW EXECUTE FUNCTION asl_candidate_content_guard('parent_graph_id');
--> statement-breakpoint
CREATE TRIGGER graph_provenance_candidate_guard BEFORE INSERT OR UPDATE OR DELETE ON architecture_graph_provenance FOR EACH ROW EXECUTE FUNCTION asl_candidate_content_guard('graph_id');
--> statement-breakpoint
CREATE TRIGGER node_provenance_candidate_guard BEFORE INSERT OR UPDATE OR DELETE ON architecture_node_provenance FOR EACH ROW EXECUTE FUNCTION asl_candidate_content_guard('graph_id');
--> statement-breakpoint
CREATE TRIGGER connection_provenance_candidate_guard BEFORE INSERT OR UPDATE OR DELETE ON architecture_connection_provenance FOR EACH ROW EXECUTE FUNCTION asl_candidate_content_guard('graph_id');
--> statement-breakpoint
-- Deferred check allows one atomic candidate->confirmed promotion, never a partially frozen commit.
CREATE FUNCTION asl_family_consistency() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE owner_id uuid; owner_state text; roots integer; mismatch integer;
BEGIN
 IF TG_TABLE_NAME='architectures' THEN owner_id=NEW.id; ELSE owner_id=NEW.architecture_id; END IF;
 SELECT state INTO owner_state FROM architectures WHERE id=owner_id;
 SELECT count(*) FILTER (WHERE kind='ROOT'), count(*) FILTER (WHERE state<>owner_state)
 INTO roots,mismatch FROM architecture_graphs WHERE architecture_id=owner_id;
 IF roots<>1 OR mismatch<>0 THEN RAISE EXCEPTION 'Architecture family must freeze atomically' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER architecture_family_consistency AFTER INSERT OR UPDATE ON architectures DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION asl_family_consistency();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER graph_family_consistency AFTER INSERT OR UPDATE ON architecture_graphs DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION asl_family_consistency();

