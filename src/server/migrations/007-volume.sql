ALTER TABLE images ADD COLUMN content_hash TEXT;
ALTER TABLE images ADD COLUMN thumb_mime_type TEXT;
CREATE INDEX images_content_hash ON images (content_hash);
