
CREATE TABLE public.knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL DEFAULT 'document',
  source_ref TEXT,
  title TEXT NOT NULL,
  description TEXT,
  mesa_id UUID REFERENCES public.mesas(id) ON DELETE CASCADE,
  user_id UUID,
  metadata_json JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.knowledge_documents(id) ON DELETE CASCADE NOT NULL,
  chunk_index INT NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  content_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('portuguese', content)) STORED,
  token_count INT,
  metadata_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_knowledge_chunks_tsv ON public.knowledge_chunks USING GIN (content_tsv);
CREATE INDEX idx_knowledge_chunks_document ON public.knowledge_chunks (document_id);
CREATE INDEX idx_knowledge_documents_mesa ON public.knowledge_documents (mesa_id);
CREATE INDEX idx_knowledge_documents_source ON public.knowledge_documents (source_type);

ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read platform knowledge"
  ON public.knowledge_documents FOR SELECT TO authenticated
  USING (source_type != 'mesa_material' OR mesa_id IS NULL);

CREATE POLICY "Mesa participants can read mesa knowledge"
  ON public.knowledge_documents FOR SELECT TO authenticated
  USING (
    source_type = 'mesa_material' AND mesa_id IS NOT NULL AND (
      user_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.mesas WHERE id = mesa_id AND gm_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM public.bookings WHERE game_table_id = mesa_id AND player_user_id = auth.uid() AND status = 'confirmed')
    )
  );

CREATE POLICY "GMs can insert knowledge docs"
  ON public.knowledge_documents FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Owners can update knowledge docs"
  ON public.knowledge_documents FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Owners can delete knowledge docs"
  ON public.knowledge_documents FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Read chunks via document access"
  ON public.knowledge_chunks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.knowledge_documents WHERE id = document_id));

CREATE POLICY "Insert chunks"
  ON public.knowledge_chunks FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.knowledge_documents WHERE id = document_id AND (user_id = auth.uid() OR public.is_admin(auth.uid()))));

CREATE POLICY "Delete chunks"
  ON public.knowledge_chunks FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.knowledge_documents WHERE id = document_id AND (user_id = auth.uid() OR public.is_admin(auth.uid()))));

CREATE OR REPLACE FUNCTION public.search_knowledge(
  _query TEXT,
  _mesa_id UUID DEFAULT NULL,
  _source_types TEXT[] DEFAULT NULL,
  _limit INT DEFAULT 10
)
RETURNS TABLE (
  chunk_id UUID,
  document_id UUID,
  document_title TEXT,
  source_type TEXT,
  content TEXT,
  rank REAL
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT
    c.id AS chunk_id,
    d.id AS document_id,
    d.title AS document_title,
    d.source_type,
    c.content,
    ts_rank_cd(c.content_tsv, plainto_tsquery('portuguese', _query)) AS rank
  FROM public.knowledge_chunks c
  JOIN public.knowledge_documents d ON d.id = c.document_id
  WHERE d.is_active = true
    AND c.content_tsv @@ plainto_tsquery('portuguese', _query)
    AND (_mesa_id IS NULL OR d.mesa_id = _mesa_id OR d.source_type != 'mesa_material')
    AND (_source_types IS NULL OR d.source_type = ANY(_source_types))
  ORDER BY rank DESC
  LIMIT _limit;
$$;
