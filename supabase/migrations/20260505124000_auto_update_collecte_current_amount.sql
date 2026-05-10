/*
  # Auto-update collecte current_amount on donation

  1. New Functions
    - `update_collecte_current_amount()` trigger function
      Automatically recalculates current_amount from sum of all donations
      whenever a donation is inserted, updated, or deleted

  2. New Triggers
    - `on_collecte_don_change` on collecte_dons
      Fires AFTER INSERT OR UPDATE OR DELETE to recalculate the parent collecte's current_amount

  3. Important Notes
    - This replaces the client-side update of current_amount which failed due to RLS
    - The trigger runs with SECURITY DEFINER so it bypasses RLS
    - current_amount is now always accurate and derived from actual donations
*/

-- Fix existing data: set current_amount to sum of existing dons
UPDATE collectes c
SET current_amount = COALESCE((
  SELECT SUM(d.amount) FROM collecte_dons d WHERE d.collecte_id = c.id
), 0);

-- Create trigger function
CREATE OR REPLACE FUNCTION update_collecte_current_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE collectes
  SET current_amount = COALESCE((
    SELECT SUM(amount) FROM collecte_dons WHERE collecte_id = COALESCE(NEW.collecte_id, OLD.collecte_id)
  ), 0)
  WHERE id = COALESCE(NEW.collecte_id, OLD.collecte_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_collecte_don_change ON collecte_dons;

-- Create trigger
CREATE TRIGGER on_collecte_don_change
  AFTER INSERT OR UPDATE OR DELETE ON collecte_dons
  FOR EACH ROW
  EXECUTE FUNCTION update_collecte_current_amount();
