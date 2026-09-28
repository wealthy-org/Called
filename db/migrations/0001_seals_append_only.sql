CREATE OR REPLACE FUNCTION seals_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'seals is append-only: % is not allowed', TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS seals_append_only_update ON seals;
--> statement-breakpoint
CREATE TRIGGER seals_append_only_update
  BEFORE UPDATE ON seals
  FOR EACH ROW EXECUTE FUNCTION seals_append_only();
--> statement-breakpoint
DROP TRIGGER IF EXISTS seals_append_only_delete ON seals;
--> statement-breakpoint
CREATE TRIGGER seals_append_only_delete
  BEFORE DELETE ON seals
  FOR EACH ROW EXECUTE FUNCTION seals_append_only();
