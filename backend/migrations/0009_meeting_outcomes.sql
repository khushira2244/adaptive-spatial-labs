CREATE TABLE "action_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"meeting_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"assignee_participant_id" uuid,
	"assignee" jsonb,
	"due_date" text,
	"decision_id" uuid,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"evidence_keys" jsonb NOT NULL,
	"accepted_by" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "action_initial_status" CHECK ("action_items"."status"='OPEN')
);
--> statement-breakpoint
CREATE TABLE "decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"meeting_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"statement" text NOT NULL,
	"rationale" text NOT NULL,
	"evidence_keys" jsonb NOT NULL,
	"accepted_by" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"capture_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"state" text DEFAULT 'DRAFT' NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"change_stamp" integer DEFAULT 0 NOT NULL,
	"manifest" jsonb,
	"saved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_state" CHECK ("meeting_reviews"."state" IN ('DRAFT','REVIEWING','READY_TO_SAVE','SAVED') AND "meeting_reviews"."change_stamp">=0),
	CONSTRAINT "review_manifest_state" CHECK (("meeting_reviews"."state"='SAVED')=("meeting_reviews"."manifest" IS NOT NULL AND "meeting_reviews"."saved_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "meeting_review_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"source_key" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"classification" text DEFAULT 'RAISED' NOT NULL,
	"retained" boolean DEFAULT true NOT NULL,
	"sort_order" integer NOT NULL,
	"evidence_keys" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_item_classification" CHECK ("meeting_review_items"."classification" IN ('RAISED','DISCUSSED','ADDRESSED','UNRESOLVED','DEFERRED','NOT_DISCUSSED','DECISION','ACTION'))
);
--> statement-breakpoint
CREATE TABLE "review_outcome_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"decision_id" uuid,
	"action_id" uuid,
	CONSTRAINT "one_typed_outcome" CHECK (("review_outcome_links"."decision_id" IS NOT NULL)<>("review_outcome_links"."action_id" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_review_id_meeting_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."meeting_reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_assignee_participant_id_meeting_participants_id_fk" FOREIGN KEY ("assignee_participant_id") REFERENCES "public"."meeting_participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_decision_id_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_accepted_by_users_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_review_id_meeting_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."meeting_reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_accepted_by_users_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_reviews" ADD CONSTRAINT "meeting_reviews_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_reviews" ADD CONSTRAINT "meeting_reviews_capture_id_frozen_meeting_captures_id_fk" FOREIGN KEY ("capture_id") REFERENCES "public"."frozen_meeting_captures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_reviews" ADD CONSTRAINT "meeting_reviews_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_reviews" ADD CONSTRAINT "meeting_reviews_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_review_items" ADD CONSTRAINT "meeting_review_items_review_id_meeting_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."meeting_reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_outcome_links" ADD CONSTRAINT "review_outcome_links_review_id_meeting_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."meeting_reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_outcome_links" ADD CONSTRAINT "review_outcome_links_item_id_meeting_review_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."meeting_review_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_outcome_links" ADD CONSTRAINT "review_outcome_links_decision_id_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decisions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_outcome_links" ADD CONSTRAINT "review_outcome_links_action_id_action_items_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."action_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "one_review_per_meeting" ON "meeting_reviews" USING btree ("meeting_id");--> statement-breakpoint
CREATE UNIQUE INDEX "one_review_per_capture" ON "meeting_reviews" USING btree ("capture_id");--> statement-breakpoint
CREATE UNIQUE INDEX "review_source_once" ON "meeting_review_items" USING btree ("review_id","source_key");--> statement-breakpoint
CREATE UNIQUE INDEX "review_item_decision_once" ON "review_outcome_links" USING btree ("item_id","decision_id");--> statement-breakpoint
CREATE UNIQUE INDEX "review_item_action_once" ON "review_outcome_links" USING btree ("item_id","action_id");
--> statement-breakpoint
-- Outcomes owns review/acceptance. Existing Meeting and Knowledge tables remain unchanged.
CREATE FUNCTION asl_review_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE m meetings%ROWTYPE; c frozen_meeting_captures%ROWTYPE;
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Reviews are retained'; END IF;
 IF TG_OP='UPDATE' THEN
  IF OLD.state='SAVED' THEN RAISE EXCEPTION 'Saved review is immutable'; END IF;
  IF ROW(NEW.id,NEW.meeting_id,NEW.capture_id,NEW.project_id,NEW.owner_id,NEW.created_at)
    IS DISTINCT FROM ROW(OLD.id,OLD.meeting_id,OLD.capture_id,OLD.project_id,OLD.owner_id,OLD.created_at)
  THEN RAISE EXCEPTION 'Review binding is immutable'; END IF;
 END IF;
 SELECT * INTO m FROM meetings WHERE id=NEW.meeting_id;
 SELECT * INTO c FROM frozen_meeting_captures WHERE id=NEW.capture_id;
 IF m.state<>'ENDED' OR c.meeting_id IS DISTINCT FROM m.id OR NEW.project_id<>m.project_id OR NEW.owner_id<>m.owner_id
 THEN RAISE EXCEPTION 'Review requires exact ended Meeting capture and owner'; END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER review_binding_guard BEFORE INSERT OR UPDATE OR DELETE ON meeting_reviews FOR EACH ROW EXECUTE FUNCTION asl_review_guard();
--> statement-breakpoint
CREATE FUNCTION asl_review_child_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r meeting_reviews%ROWTYPE; rid uuid; did uuid; aid uuid; iid uuid;
BEGIN
 IF TG_OP='DELETE' THEN rid=OLD.review_id; ELSE rid=NEW.review_id; END IF;
 SELECT * INTO r FROM meeting_reviews WHERE id=rid FOR UPDATE;
 IF NOT FOUND OR r.state='SAVED' THEN RAISE EXCEPTION 'Saved review children are immutable'; END IF;
 IF TG_OP='UPDATE' THEN
  IF ROW(NEW.id,NEW.review_id) IS DISTINCT FROM ROW(OLD.id,OLD.review_id)
  THEN RAISE EXCEPTION 'Review child identity is immutable'; END IF;
  IF TG_TABLE_NAME='meeting_review_items' THEN
   IF ROW(NEW.source_key,NEW.category,NEW.created_at)
    IS DISTINCT FROM ROW(OLD.source_key,OLD.category,OLD.created_at)
  THEN RAISE EXCEPTION 'Review source anchor is immutable'; END IF;
  END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 IF TG_TABLE_NAME IN ('decisions','action_items') THEN
  IF NEW.project_id<>r.project_id OR NEW.meeting_id<>r.meeting_id OR NEW.created_by<>r.owner_id
   OR (NEW.accepted_by IS NOT NULL AND NEW.accepted_by<>r.owner_id)
  THEN RAISE EXCEPTION 'Outcome scope/authority mismatch'; END IF;
  IF TG_OP='UPDATE' THEN
   IF ROW(NEW.project_id,NEW.meeting_id,NEW.created_by,NEW.created_at)
      IS DISTINCT FROM ROW(OLD.project_id,OLD.meeting_id,OLD.created_by,OLD.created_at)
   THEN RAISE EXCEPTION 'Outcome origin is immutable'; END IF;
  END IF;
 END IF;
 IF TG_TABLE_NAME='action_items' THEN
  IF NEW.decision_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM decisions d WHERE d.id=NEW.decision_id AND d.review_id=rid)
   THEN RAISE EXCEPTION 'Primary Decision outside review'; END IF;
  IF NEW.assignee_participant_id IS NOT NULL AND NOT EXISTS(
   SELECT 1 FROM frozen_meeting_captures f, jsonb_array_elements(f.payload->'participants') p
   WHERE f.id=r.capture_id AND p->>'id'=NEW.assignee_participant_id::text AND p->'actor'=NEW.assignee)
   THEN RAISE EXCEPTION 'Assignee outside frozen Meeting actors'; END IF;
 END IF;
 IF TG_TABLE_NAME='review_outcome_links' THEN
  IF NOT EXISTS(SELECT 1 FROM meeting_review_items i WHERE i.id=NEW.item_id AND i.review_id=rid)
  THEN RAISE EXCEPTION 'Assessment link outside review'; END IF;
  IF NEW.decision_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM decisions d WHERE d.id=NEW.decision_id AND d.review_id=rid)
  THEN RAISE EXCEPTION 'Decision link outside review'; END IF;
  IF NEW.action_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM action_items a WHERE a.id=NEW.action_id AND a.review_id=rid)
  THEN RAISE EXCEPTION 'Action link outside review'; END IF;
 END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER review_item_guard BEFORE INSERT OR UPDATE OR DELETE ON meeting_review_items FOR EACH ROW EXECUTE FUNCTION asl_review_child_guard();
--> statement-breakpoint
CREATE TRIGGER decision_guard BEFORE INSERT OR UPDATE OR DELETE ON decisions FOR EACH ROW EXECUTE FUNCTION asl_review_child_guard();
--> statement-breakpoint
CREATE TRIGGER action_guard BEFORE INSERT OR UPDATE OR DELETE ON action_items FOR EACH ROW EXECUTE FUNCTION asl_review_child_guard();
--> statement-breakpoint
CREATE TRIGGER outcome_link_guard BEFORE INSERT OR UPDATE OR DELETE ON review_outcome_links FOR EACH ROW EXECUTE FUNCTION asl_review_child_guard();
--> statement-breakpoint
CREATE FUNCTION asl_review_final_consistency() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE r meeting_reviews%ROWTYPE; rid uuid; ids jsonb; n integer; named text;
BEGIN
 IF TG_TABLE_NAME='meeting_reviews' THEN rid=NEW.id; ELSE rid=NEW.review_id; END IF;
 SELECT * INTO r FROM meeting_reviews WHERE id=rid;
 IF r.state<>'SAVED' THEN
  IF EXISTS(SELECT 1 FROM decisions WHERE review_id=rid AND accepted_by IS NOT NULL)
    OR EXISTS(SELECT 1 FROM action_items WHERE review_id=rid AND accepted_by IS NOT NULL)
  THEN RAISE EXCEPTION 'Partial outcome acceptance forbidden'; END IF;
  RETURN NULL;
 END IF;
 IF r.manifest->>'savedBy' IS DISTINCT FROM r.owner_id::text
 OR EXISTS(SELECT 1 FROM decisions WHERE review_id=rid AND accepted_by IS DISTINCT FROM r.owner_id)
 OR EXISTS(SELECT 1 FROM action_items WHERE review_id=rid AND (accepted_by IS DISTINCT FROM r.owner_id OR assignee_participant_id IS NULL OR assignee IS NULL))
 THEN RAISE EXCEPTION 'Acceptance authority or responsibility missing'; END IF;
 FOR named IN SELECT unnest(ARRAY['decisionIds','actionIds','itemIds','unresolvedIds','deferredIds']) LOOP
  IF named='decisionIds' THEN SELECT coalesce(jsonb_agg(id::text),'[]'::jsonb) INTO ids FROM decisions WHERE review_id=rid;
  ELSIF named='actionIds' THEN SELECT coalesce(jsonb_agg(id::text),'[]'::jsonb) INTO ids FROM action_items WHERE review_id=rid;
  ELSE SELECT coalesce(jsonb_agg(id::text),'[]'::jsonb) INTO ids FROM meeting_review_items
   WHERE review_id=rid AND retained AND (named='itemIds' OR classification=CASE named WHEN 'unresolvedIds' THEN 'UNRESOLVED' ELSE 'DEFERRED' END);
  END IF;
  IF jsonb_typeof(r.manifest->named) IS DISTINCT FROM 'array' OR NOT (r.manifest->named @> ids AND ids @> r.manifest->named)
    OR jsonb_array_length(r.manifest->named)<>jsonb_array_length(ids)
  THEN RAISE EXCEPTION 'Accepted manifest does not match exact outcome set'; END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM review_outcome_links l JOIN meeting_review_items i ON i.id=l.item_id WHERE l.review_id=rid AND NOT i.retained)
 THEN RAISE EXCEPTION 'Accepted links require retained assessment'; END IF;
 RETURN NULL;
END $$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER review_final_consistency AFTER INSERT OR UPDATE ON meeting_reviews DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION asl_review_final_consistency();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER decision_final_consistency AFTER INSERT OR UPDATE ON decisions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION asl_review_final_consistency();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER action_final_consistency AFTER INSERT OR UPDATE ON action_items DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION asl_review_final_consistency();
