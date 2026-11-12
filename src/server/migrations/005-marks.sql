CREATE TABLE marks (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL UNIQUE,
  image_id TEXT NOT NULL REFERENCES images (id),
  kind TEXT NOT NULL CHECK (kind IN ('like', 'dislike')),
  area_left REAL NOT NULL,
  area_top REAL NOT NULL,
  area_right REAL NOT NULL,
  area_bottom REAL NOT NULL,
  comment TEXT NOT NULL DEFAULT ''
) STRICT;
