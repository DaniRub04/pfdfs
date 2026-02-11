-- Fix mismatch between users.id (bigint) and publicaciones.user_id (uuid)

ALTER TABLE publicaciones
DROP COLUMN user_id;

ALTER TABLE publicaciones
ADD COLUMN user_id bigint
REFERENCES users(id)
ON DELETE CASCADE;
