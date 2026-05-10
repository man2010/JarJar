/*
  # Add audio_url column to posts

  1. Modified Tables
    - `posts`
      - Add `audio_url` (text, default '') for audio post type support
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'audio_url'
  ) THEN
    ALTER TABLE posts ADD COLUMN audio_url text DEFAULT '';
  END IF;
END $$;
