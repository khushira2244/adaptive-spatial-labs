CREATE OR REPLACE FUNCTION asl_review_final_consistency() RETURNS trigger LANGUAGE plpgsql AS $$
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
  IF jsonb_typeof(r.manifest->named) IS DISTINCT FROM 'array' OR NOT ((r.manifest->named) @> ids AND ids @> (r.manifest->named))
    OR jsonb_array_length(r.manifest->named)<>jsonb_array_length(ids)
  THEN RAISE EXCEPTION 'Accepted manifest does not match exact outcome set'; END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM review_outcome_links l JOIN meeting_review_items i ON i.id=l.item_id WHERE l.review_id=rid AND NOT i.retained)
 THEN RAISE EXCEPTION 'Accepted links require retained assessment'; END IF;
 RETURN NULL;
END $$;
