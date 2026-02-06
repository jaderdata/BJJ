-- Adicionar coluna de fotos na tabela de visitas
ALTER TABLE visits ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';

-- Criar bucket para fotos de visitas se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('visit-photos', 'visit-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies para o bucket (público para leitura, autenticado para upload)
CREATE POLICY "Fotos de visitas acessíveis publicamente"
ON storage.objects FOR SELECT
USING (bucket_id = 'visit-photos');

CREATE POLICY "Vendedores podem fazer upload de fotos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'visit-photos');
