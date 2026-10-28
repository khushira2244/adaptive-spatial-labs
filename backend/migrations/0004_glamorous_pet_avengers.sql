ALTER TABLE "snapshots" ALTER COLUMN "project_id" DROP NOT NULL;
--> statement-breakpoint
-- Filing a capture under a project is optional; access always follows the exact architecture anchor.
CREATE OR REPLACE FUNCTION asl_snapshot_anchor_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE a architectures; g architecture_graphs;
BEGIN
 SELECT * INTO a FROM architectures WHERE id=NEW.architecture_id FOR SHARE;
 SELECT * INTO g FROM architecture_graphs WHERE id=NEW.graph_id;
 IF a.state IS DISTINCT FROM 'CONFIRMED' OR g.state IS DISTINCT FROM 'CONFIRMED'
 OR (NEW.project_id IS NOT NULL AND a.project_id IS DISTINCT FROM NEW.project_id)
 OR g.architecture_id IS DISTINCT FROM a.id
 OR NEW.scope->>'architectureId' IS DISTINCT FROM a.id::text
 OR NEW.scope->>'architectureGraphRef' IS DISTINCT FROM g.id::text
 OR (NEW.scope->>'architectureStamp')::bigint IS DISTINCT FROM a.change_stamp THEN
 RAISE EXCEPTION 'Snapshot requires exact confirmed context' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;

