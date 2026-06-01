-- Pipeline run tracking
-- Replaces the in-memory store in src/lib/store.ts so that pipeline status
-- survives Vercel lambda swaps and page reloads.

CREATE TABLE pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL CHECK (status IN (
    'scraping_buildings',
    'scraping_reviews',
    'analyzing',
    'scoring',
    'enriching',
    'complete',
    'error'
  )),
  progress TEXT DEFAULT '',
  error TEXT,
  summary JSONB,
  params JSONB,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX pipeline_runs_started_at_idx ON pipeline_runs (started_at DESC);
