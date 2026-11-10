CREATE TABLE pack_draft (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  intent TEXT NOT NULL
) STRICT;
INSERT INTO pack_draft (id, intent) VALUES (1, '');
