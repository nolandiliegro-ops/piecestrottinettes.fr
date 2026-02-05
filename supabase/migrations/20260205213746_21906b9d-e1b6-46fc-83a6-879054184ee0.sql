-- Add personal_description column to user_garage table
ALTER TABLE user_garage 
ADD COLUMN personal_description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN user_garage.personal_description IS 'Description personnelle de la trottinette écrite par l''utilisateur';