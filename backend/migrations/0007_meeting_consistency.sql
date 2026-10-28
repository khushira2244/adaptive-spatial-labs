-- Correct the deferred invariant using an unambiguous local identifier.
CREATE OR REPLACE FUNCTION asl_meeting_consistency() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE m meetings; s meeting_shared_state; snap meeting_presentation_snapshots; presenter meeting_participants; cnt integer; v_meeting_id uuid;
BEGIN
 IF TG_TABLE_NAME='meetings' THEN v_meeting_id=NEW.id; ELSE v_meeting_id=NEW.meeting_id; END IF;
 SELECT * INTO m FROM meetings mm WHERE mm.id=v_meeting_id;
 SELECT * INTO s FROM meeting_shared_state ss WHERE ss.meeting_id=v_meeting_id;
 SELECT * INTO snap FROM meeting_presentation_snapshots ps WHERE ps.meeting_id=v_meeting_id;
 SELECT count(*) INTO cnt FROM frozen_meeting_captures fc WHERE fc.meeting_id=v_meeting_id;
 IF TG_TABLE_NAME='meetings' AND TG_OP='UPDATE' THEN
  IF m.change_stamp<=(to_jsonb(OLD)->>'change_stamp')::integer THEN RAISE EXCEPTION 'Meeting command requires a new stamp' USING ERRCODE='23514'; END IF;
 END IF;
 IF m.state IN ('LIVE','ENDED') THEN
  SELECT * INTO presenter FROM meeting_participants mp WHERE mp.id=(s.state->>'presenterParticipantId')::uuid;
  IF snap.id IS NULL OR s.snapshot_id IS DISTINCT FROM snap.id OR presenter.meeting_id IS DISTINCT FROM m.id
  OR presenter.state IS DISTINCT FROM 'ADMITTED' OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(snap.payload->'screens') entry WHERE entry->>'id'=s.state->>'screenId')
  THEN RAISE EXCEPTION 'No live Meeting without frozen scope and presenter' USING ERRCODE='23514'; END IF;
 END IF;
 IF (m.state='ENDED' AND cnt<>1) OR (m.state<>'ENDED' AND cnt<>0) THEN RAISE EXCEPTION 'End capture must commit atomically' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
--> statement-breakpoint
CREATE FUNCTION asl_meeting_shared_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE phase text;
BEGIN
 SELECT state INTO phase FROM meetings WHERE id=OLD.meeting_id FOR UPDATE;
 IF TG_OP='DELETE' OR phase<>'LIVE' OR NEW.meeting_id<>OLD.meeting_id OR NEW.snapshot_id<>OLD.snapshot_id
 OR (NEW.state->>'authorityGeneration')::integer < (OLD.state->>'authorityGeneration')::integer
 THEN RAISE EXCEPTION 'Shared scope is frozen or authority is stale' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER meeting_shared_guard BEFORE UPDATE OR DELETE ON meeting_shared_state FOR EACH ROW EXECUTE FUNCTION asl_meeting_shared_guard();
--> statement-breakpoint
CREATE FUNCTION asl_meeting_participant_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Participant attribution is retained' USING ERRCODE='23514'; END IF;
 IF NEW.id<>OLD.id OR NEW.meeting_id<>OLD.meeting_id OR NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.guest_id IS DISTINCT FROM OLD.guest_id OR NEW.connection_epoch<OLD.connection_epoch
 THEN RAISE EXCEPTION 'Participant identity is immutable' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER meeting_participant_guard BEFORE UPDATE OR DELETE ON meeting_participants FOR EACH ROW EXECUTE FUNCTION asl_meeting_participant_guard();
