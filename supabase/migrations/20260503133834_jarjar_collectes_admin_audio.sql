/*
  # JarJar - Collectes, Admin, Audio & Subcategories

  1. New Tables
    - `collectes`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `collecte_type` (text: 'urgence' or 'projet')
      - `urgency_details` (text, nullable)
      - `target_amount` (numeric)
      - `current_amount` (numeric, default 0)
      - `currency` (text, default 'XOF')
      - `documents` (jsonb, array of document URLs)
      - `video_url` (text, nullable)
      - `status` (text: 'pending/approved/rejected/completed', default 'pending')
      - `admin_notes` (text, nullable)
      - `requester_id` (uuid, references profiles)
      - `reviewed_by` (uuid, nullable)
      - `reviewed_at` (timestamptz, nullable)
      - `created_at`, `updated_at` (timestamptz)

  2. Modified Tables
    - `posts` - add 'audio' to post_type, add `subcategory` column
    - `categories` - add `subcategories` jsonb column

  3. Security
    - RLS on collectes: approved visible to all, own visible to requester
    - Only requester or admin can update

  4. Notes
    - Collectes default to 'pending' - NOT published until admin approves
    - Admin role checked via profiles table role field
*/

-- Add role column to profiles for admin detection
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user';
  END IF;
END $$;

-- Collectes table
CREATE TABLE IF NOT EXISTS collectes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  collecte_type text NOT NULL DEFAULT 'urgence' CHECK (collecte_type IN ('urgence', 'projet')),
  urgency_details text DEFAULT '',
  target_amount numeric NOT NULL DEFAULT 0,
  current_amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'XOF',
  documents jsonb DEFAULT '[]'::jsonb,
  video_url text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  admin_notes text DEFAULT '',
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE collectes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View approved or own collectes"
  ON collectes FOR SELECT
  TO authenticated
  USING (status = 'approved' OR requester_id = auth.uid());

CREATE POLICY "Authenticated can create pending collectes"
  ON collectes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id AND status = 'pending');

CREATE POLICY "Requester or admin can update collectes"
  ON collectes FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (auth.uid() = requester_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Update posts to add audio type and subcategory
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_post_type_check;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE posts ADD COLUMN subcategory text DEFAULT '';
  END IF;
END $$;
ALTER TABLE posts ADD CONSTRAINT posts_post_type_check CHECK (post_type IN ('article', 'video', 'audio', 'confession'));

-- Update categories to add subcategories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'subcategories'
  ) THEN
    ALTER TABLE categories ADD COLUMN subcategories jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Update category subcategories
UPDATE categories SET subcategories = '["Resilience", "Combat personnel", "Victoire", "Transformation"]'::jsonb WHERE slug = 'parcours-de-vie';
UPDATE categories SET subcategories = '["Entrepreneuriat", "Emploi", "Etudes", "Reconversion"]'::jsonb WHERE slug = 'carriere';
UPDATE categories SET subcategories = '["Maladie", "Guerison", "Bien-etre", "Mental"]'::jsonb WHERE slug = 'sante';
UPDATE categories SET subcategories = '["Secret", "Liberation", "Temoignage", "Anonyme"]'::jsonb WHERE slug = 'confessions';
UPDATE categories SET subcategories = '["Discipline", "Perseverance", "Foi", "Action"]'::jsonb WHERE slug = 'motivation';
UPDATE categories SET subcategories = '["Islam", "Priere", "Gratitude", "Sagesse"]'::jsonb WHERE slug = 'spiritualite';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_collectes_requester ON collectes(requester_id);
CREATE INDEX IF NOT EXISTS idx_collectes_status ON collectes(status);
CREATE INDEX IF NOT EXISTS idx_collectes_type ON collectes(collecte_type);
CREATE INDEX IF NOT EXISTS idx_collectes_created ON collectes(created_at DESC);
