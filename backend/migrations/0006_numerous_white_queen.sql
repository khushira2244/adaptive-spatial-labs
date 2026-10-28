CREATE TABLE "frozen_meeting_captures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"email" text NOT NULL,
	"state" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_participant_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meeting_invitation_state" CHECK ("meeting_invitations"."state" IN ('PENDING','ACCEPTED','DECLINED','CANCELLED','EXPIRED'))
);
--> statement-breakpoint
CREATE TABLE "meeting_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"user_id" uuid,
	"guest_id" uuid,
	"state" text NOT NULL,
	"connected" boolean DEFAULT false NOT NULL,
	"connection_epoch" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "participant_actor_exclusive" CHECK (("meeting_participants"."user_id" IS NOT NULL) <> ("meeting_participants"."guest_id" IS NOT NULL)),
	CONSTRAINT "participant_state" CHECK ("meeting_participants"."state" IN ('ADMITTED','LEFT','REVOKED'))
);
--> statement-breakpoint
CREATE TABLE "meeting_shared_state" (
	"meeting_id" uuid PRIMARY KEY NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"state" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_presentation_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"presentation_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" text NOT NULL,
	"start_from_screen_id" uuid NOT NULL,
	"scheduled_at" timestamp with time zone,
	"state" text NOT NULL,
	"change_stamp" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meeting_lifecycle" CHECK ("meetings"."state" IN ('DRAFT','SCHEDULED','LIVE','ENDED') AND "meetings"."change_stamp">=0)
);
--> statement-breakpoint
CREATE TABLE "participant_private_state" (
	"participant_id" uuid PRIMARY KEY NOT NULL,
	"checkpoint" jsonb NOT NULL,
	"change_stamp" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "presenter_transfer_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"requester_participant_id" uuid NOT NULL,
	"target_participant_id" uuid NOT NULL,
	"authority_generation" integer NOT NULL,
	"state" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transfer_state" CHECK ("presenter_transfer_requests"."state" IN ('PENDING','ACCEPTED','DECLINED','CANCELLED'))
);
--> statement-breakpoint
CREATE TABLE "shared_meeting_item_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publication_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"body" jsonb NOT NULL,
	"origin_kind" text NOT NULL,
	"origin_id" uuid NOT NULL,
	"origin_stamp" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shared_meeting_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"author_participant_id" uuid NOT NULL,
	"category" text NOT NULL,
	"current_revision_id" uuid,
	"visible" boolean DEFAULT true NOT NULL,
	"change_stamp" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "publication_category" CHECK ("shared_meeting_items"."category" IN ('NOTE','QUESTION','DISCUSSION_POINT','ACTION_SUGGESTION','SNAPSHOT'))
);
--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD COLUMN "meeting_id" uuid;--> statement-breakpoint
ALTER TABLE "snapshots" ADD COLUMN "meeting_id" uuid;--> statement-breakpoint
ALTER TABLE "frozen_meeting_captures" ADD CONSTRAINT "frozen_meeting_captures_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_invitations" ADD CONSTRAINT "meeting_invitations_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_invitations" ADD CONSTRAINT "meeting_invitations_accepted_participant_id_meeting_participants_id_fk" FOREIGN KEY ("accepted_participant_id") REFERENCES "public"."meeting_participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_guest_id_scoped_guest_access_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."scoped_guest_access"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_shared_state" ADD CONSTRAINT "meeting_shared_state_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_shared_state" ADD CONSTRAINT "meeting_shared_state_snapshot_id_meeting_presentation_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."meeting_presentation_snapshots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_presentation_snapshots" ADD CONSTRAINT "meeting_presentation_snapshots_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_presentation_id_presentations_id_fk" FOREIGN KEY ("presentation_id") REFERENCES "public"."presentations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participant_private_state" ADD CONSTRAINT "participant_private_state_participant_id_meeting_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."meeting_participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presenter_transfer_requests" ADD CONSTRAINT "presenter_transfer_requests_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presenter_transfer_requests" ADD CONSTRAINT "presenter_transfer_requests_requester_participant_id_meeting_participants_id_fk" FOREIGN KEY ("requester_participant_id") REFERENCES "public"."meeting_participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presenter_transfer_requests" ADD CONSTRAINT "presenter_transfer_requests_target_participant_id_meeting_participants_id_fk" FOREIGN KEY ("target_participant_id") REFERENCES "public"."meeting_participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_meeting_item_revisions" ADD CONSTRAINT "shared_meeting_item_revisions_publication_id_shared_meeting_items_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."shared_meeting_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_meeting_items" ADD CONSTRAINT "shared_meeting_items_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_meeting_items" ADD CONSTRAINT "shared_meeting_items_author_participant_id_meeting_participants_id_fk" FOREIGN KEY ("author_participant_id") REFERENCES "public"."meeting_participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "meeting_frozen_once" ON "frozen_meeting_captures" USING btree ("meeting_id");--> statement-breakpoint
CREATE UNIQUE INDEX "meeting_participant_user_unique" ON "meeting_participants" USING btree ("meeting_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "meeting_participant_guest_unique" ON "meeting_participants" USING btree ("meeting_id","guest_id");--> statement-breakpoint
CREATE UNIQUE INDEX "meeting_snapshot_once" ON "meeting_presentation_snapshots" USING btree ("meeting_id");--> statement-breakpoint
CREATE UNIQUE INDEX "meeting_one_pending_transfer" ON "presenter_transfer_requests" USING btree ("meeting_id") WHERE "presenter_transfer_requests"."state"='PENDING';--> statement-breakpoint
CREATE UNIQUE INDEX "publication_revision_sequence" ON "shared_meeting_item_revisions" USING btree ("publication_id","sequence");--> statement-breakpoint
ALTER TABLE "knowledge_items" ADD CONSTRAINT "knowledge_items_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX meeting_snapshot_identity ON meeting_presentation_snapshots(id,meeting_id);
--> statement-breakpoint
CREATE UNIQUE INDEX meeting_participant_identity ON meeting_participants(id,meeting_id);
--> statement-breakpoint
CREATE UNIQUE INDEX publication_revision_identity ON shared_meeting_item_revisions(id,publication_id);
--> statement-breakpoint
ALTER TABLE meeting_shared_state ADD CONSTRAINT shared_snapshot_same_meeting FOREIGN KEY(snapshot_id,meeting_id) REFERENCES meeting_presentation_snapshots(id,meeting_id);
--> statement-breakpoint
ALTER TABLE shared_meeting_items ADD CONSTRAINT publication_current_revision FOREIGN KEY(current_revision_id,id) REFERENCES shared_meeting_item_revisions(id,publication_id) DEFERRABLE INITIALLY DEFERRED;
--> statement-breakpoint
ALTER TABLE shared_meeting_items ADD CONSTRAINT publication_author_same_meeting FOREIGN KEY(author_participant_id,meeting_id) REFERENCES meeting_participants(id,meeting_id);
--> statement-breakpoint
ALTER TABLE presenter_transfer_requests ADD CONSTRAINT transfer_requester_same_meeting FOREIGN KEY(requester_participant_id,meeting_id) REFERENCES meeting_participants(id,meeting_id);
--> statement-breakpoint
ALTER TABLE presenter_transfer_requests ADD CONSTRAINT transfer_target_same_meeting FOREIGN KEY(target_participant_id,meeting_id) REFERENCES meeting_participants(id,meeting_id);
--> statement-breakpoint
CREATE FUNCTION asl_meeting_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Meeting frozen representation is immutable' USING ERRCODE='23514'; END $$;
--> statement-breakpoint
CREATE TRIGGER start_snapshot_immutable BEFORE UPDATE OR DELETE ON meeting_presentation_snapshots FOR EACH ROW EXECUTE FUNCTION asl_meeting_immutable();
--> statement-breakpoint
CREATE TRIGGER end_capture_immutable BEFORE UPDATE OR DELETE ON frozen_meeting_captures FOR EACH ROW EXECUTE FUNCTION asl_meeting_immutable();
--> statement-breakpoint
CREATE TRIGGER publication_revision_immutable BEFORE UPDATE OR DELETE ON shared_meeting_item_revisions FOR EACH ROW EXECUTE FUNCTION asl_meeting_immutable();
--> statement-breakpoint
CREATE FUNCTION asl_meeting_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE p presentations;
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Meetings are retained' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (OLD.state='ENDED' OR NEW.id<>OLD.id OR NEW.project_id<>OLD.project_id OR NEW.presentation_id<>OLD.presentation_id OR NEW.owner_id<>OLD.owner_id OR NEW.change_stamp<OLD.change_stamp
 OR (OLD.state='LIVE' AND NEW.state NOT IN ('LIVE','ENDED'))) THEN RAISE EXCEPTION 'Meeting identity/lifecycle is frozen' USING ERRCODE='23514'; END IF;
 SELECT * INTO p FROM presentations WHERE id=NEW.presentation_id;
 IF p.project_id IS DISTINCT FROM NEW.project_id OR p.owner_id IS DISTINCT FROM NEW.owner_id THEN RAISE EXCEPTION 'Meeting presentation scope mismatch' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER meeting_guard BEFORE INSERT OR UPDATE OR DELETE ON meetings FOR EACH ROW EXECUTE FUNCTION asl_meeting_guard();
--> statement-breakpoint
CREATE FUNCTION asl_meeting_consistency() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE m meetings; s meeting_shared_state; snap meeting_presentation_snapshots; presenter meeting_participants; cnt integer; owner_id uuid;
BEGIN
 IF TG_TABLE_NAME='meetings' THEN owner_id=NEW.id; ELSE owner_id=NEW.meeting_id; END IF;
 SELECT * INTO m FROM meetings WHERE id=owner_id;
 SELECT * INTO s FROM meeting_shared_state WHERE meeting_id=owner_id;
 SELECT * INTO snap FROM meeting_presentation_snapshots WHERE meeting_id=owner_id;
 SELECT count(*) INTO cnt FROM frozen_meeting_captures WHERE meeting_id=owner_id;
 IF TG_TABLE_NAME='meetings' AND TG_OP='UPDATE' AND m.change_stamp<=OLD.change_stamp THEN RAISE EXCEPTION 'Meeting command requires a new stamp' USING ERRCODE='23514'; END IF;
 IF m.state IN ('LIVE','ENDED') THEN
  SELECT * INTO presenter FROM meeting_participants WHERE id=(s.state->>'presenterParticipantId')::uuid;
  IF snap.id IS NULL OR s.snapshot_id IS DISTINCT FROM snap.id OR presenter.meeting_id IS DISTINCT FROM m.id
  OR presenter.state IS DISTINCT FROM 'ADMITTED' OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(snap.payload->'screens') entry WHERE entry->>'id'=s.state->>'screenId')
  THEN RAISE EXCEPTION 'No live Meeting without frozen scope and presenter' USING ERRCODE='23514'; END IF;
 END IF;
 IF (m.state='ENDED' AND cnt<>1) OR (m.state<>'ENDED' AND cnt<>0) THEN RAISE EXCEPTION 'End capture must commit atomically' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER meeting_consistency AFTER INSERT OR UPDATE ON meetings DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION asl_meeting_consistency();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER meeting_shared_consistency AFTER INSERT OR UPDATE ON meeting_shared_state DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION asl_meeting_consistency();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER meeting_capture_consistency AFTER INSERT ON frozen_meeting_captures DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION asl_meeting_consistency();
--> statement-breakpoint
CREATE FUNCTION asl_meeting_live_content() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE owner_id uuid; phase text; pub uuid;
BEGIN
 IF TG_TABLE_NAME='shared_meeting_item_revisions' THEN
  pub=NEW.publication_id; SELECT meeting_id INTO owner_id FROM shared_meeting_items WHERE id=pub;
 ELSE
  IF TG_OP='DELETE' THEN owner_id=OLD.meeting_id; ELSE owner_id=NEW.meeting_id; END IF;
 END IF;
 SELECT state INTO phase FROM meetings WHERE id=owner_id FOR UPDATE;
 IF phase IS DISTINCT FROM 'LIVE' THEN RAISE EXCEPTION 'Live Meeting content is closed' USING ERRCODE='23514'; END IF;
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Meeting shared history is retained' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='shared_meeting_items' AND TG_OP='UPDATE' AND (NEW.meeting_id<>OLD.meeting_id OR NEW.author_participant_id<>OLD.author_participant_id OR NEW.category<>OLD.category OR NEW.change_stamp<OLD.change_stamp) THEN RAISE EXCEPTION 'Publication identity is immutable' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER live_publication_guard BEFORE INSERT OR UPDATE OR DELETE ON shared_meeting_items FOR EACH ROW EXECUTE FUNCTION asl_meeting_live_content();
--> statement-breakpoint
CREATE TRIGGER live_revision_guard BEFORE INSERT ON shared_meeting_item_revisions FOR EACH ROW EXECUTE FUNCTION asl_meeting_live_content();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION asl_knowledge_item_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Authored knowledge is retained; archive instead' USING ERRCODE='23514'; END IF;
 IF NEW.id<>OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.guest_id IS DISTINCT FROM OLD.guest_id
 OR NEW.project_id IS DISTINCT FROM OLD.project_id OR NEW.meeting_id IS DISTINCT FROM OLD.meeting_id OR NEW.visibility<>OLD.visibility OR NEW.created_at<>OLD.created_at
 OR NEW.change_stamp<>OLD.change_stamp+1 THEN RAISE EXCEPTION 'Knowledge identity is immutable and edits require next stamp' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;

