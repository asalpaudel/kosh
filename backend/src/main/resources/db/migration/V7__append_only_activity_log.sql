CREATE OR REPLACE FUNCTION reject_activity_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'activity logs are append-only';
END;
$$;

DROP TRIGGER IF EXISTS activity_logs_append_only ON activity_logs;
CREATE TRIGGER activity_logs_append_only
BEFORE UPDATE OR DELETE ON activity_logs
FOR EACH ROW
EXECUTE FUNCTION reject_activity_log_mutation();
