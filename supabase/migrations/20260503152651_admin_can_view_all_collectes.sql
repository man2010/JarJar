/*
  # Allow admins to view all collectes

  1. Security changes
    - Add RLS policy for admins to SELECT all collectes regardless of status
    - Existing "View approved or own collectes" policy remains for regular users
    - This fixes the issue where admins couldn't see pending collectes from other users in the dashboard
*/

CREATE POLICY "Admins can view all collectes"
  ON collectes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
