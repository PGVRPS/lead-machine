-- Scrape configuration: custom regions and search terms
CREATE TABLE IF NOT EXISTS scrape_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  regions jsonb NOT NULL DEFAULT '[]'::jsonb,
  search_terms jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Seed with Gulf Coast defaults
INSERT INTO scrape_config (regions, search_terms) VALUES (
  '["Gulf Shores, AL","Orange Beach, AL","Pensacola Beach, FL","Destin, FL","Miramar Beach, FL","Fort Walton Beach, FL","Panama City Beach, FL"]'::jsonb,
  '["condominium complex","condo resort","beach condo","vacation rental condo","condominium association","beach resort condominiums"]'::jsonb
);
