-- Ajouter slug unique pour URL routing
ALTER TABLE parts ADD COLUMN slug text;

-- Generer les slugs depuis les noms existants (normalisation accents + caracteres speciaux)
UPDATE parts SET slug = lower(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(name, '[àáâãäå]', 'a', 'gi'),
            '[èéêë]', 'e', 'gi'
          ),
          '[ùúûü]', 'u', 'gi'
        ),
        '[ôöò]', 'o', 'gi'
      ),
      '[îïì]', 'i', 'gi'
    ),
    '[^a-z0-9]+', '-', 'gi'
  )
);

-- Supprimer les tirets en debut/fin
UPDATE parts SET slug = trim(both '-' from slug);

-- Ajouter contrainte NOT NULL et UNIQUE
ALTER TABLE parts ALTER COLUMN slug SET NOT NULL;
ALTER TABLE parts ADD CONSTRAINT parts_slug_unique UNIQUE (slug);

-- Ajouter colonne pour YouTube video optionnelle
ALTER TABLE parts ADD COLUMN youtube_video_id text;