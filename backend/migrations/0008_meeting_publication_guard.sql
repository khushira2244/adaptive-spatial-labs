CREATE OR REPLACE FUNCTION asl_meeting_live_content() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_meeting_id uuid; v_phase text;
BEGIN
 IF TG_TABLE_NAME='shared_meeting_item_revisions' THEN
  SELECT p.meeting_id INTO v_meeting_id FROM shared_meeting_items p WHERE p.id=NEW.publication_id;
 ELSE
  IF TG_OP='DELETE' THEN v_meeting_id=OLD.meeting_id; ELSE v_meeting_id=NEW.meeting_id; END IF;
 END IF;
 SELECT m.state INTO v_phase FROM meetings m WHERE m.id=v_meeting_id FOR UPDATE;
 IF v_phase IS DISTINCT FROM 'LIVE' THEN RAISE EXCEPTION 'Live Meeting content is closed' USING ERRCODE='23514'; END IF;
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Meeting shared history is retained' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='shared_meeting_items' THEN
  IF TG_OP='UPDATE' THEN
   IF NEW.meeting_id<>OLD.meeting_id OR NEW.author_participant_id<>OLD.author_participant_id OR NEW.category<>OLD.category OR NEW.change_stamp<OLD.change_stamp
   THEN RAISE EXCEPTION 'Publication identity is immutable' USING ERRCODE='23514'; END IF;
  END IF;
 END IF;
 RETURN NEW;
END $$;
