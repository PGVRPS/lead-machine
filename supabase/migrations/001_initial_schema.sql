-- VRPS AI Lead Machine - Initial Schema

-- Properties scraped from Google Maps
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outscraper_id TEXT UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  google_rating NUMERIC(2,1),
  review_count INTEGER DEFAULT 0,
  website TEXT,
  phone TEXT,
  google_place_id TEXT,
  source TEXT DEFAULT 'outscraper' CHECK (source IN ('outscraper', 'csv_import', 'manual')),
  scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Raw reviews from Google
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  review_text TEXT,
  reviewer_name TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  review_date TIMESTAMPTZ,
  outscraper_review_id TEXT,
  scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI analysis results per property
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('parking', 'units', 'rentals')),

  -- Parking analysis
  parking_score NUMERIC(3,1),
  parking_complaints JSONB,
  parking_categories JSONB,

  -- Unit estimation
  estimated_units INTEGER,
  unit_confidence TEXT CHECK (unit_confidence IN ('high', 'medium', 'low')),
  unit_evidence TEXT,

  -- Vacation rental
  has_vacation_rentals BOOLEAN,
  rental_evidence TEXT,
  rental_platforms TEXT[],

  model_used TEXT,
  raw_response JSONB,
  analyzed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- HOA managers and board contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  management_company TEXT,
  contact_name TEXT,
  contact_title TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'web_scrape', 'clay')),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Computed lead scores
CREATE TABLE lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  tier TEXT NOT NULL CHECK (tier IN ('immediate', 'nurture', 'monitor', 'disqualified')),
  score_breakdown JSONB,
  manual_override BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  scored_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Outreach tracking
CREATE TABLE outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  template TEXT,
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'opened', 'clicked', 'replied', 'bounced')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  resend_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pipeline stage tracking
CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('scraped', 'analyzed', 'scored', 'enriched', 'outreach_sent', 'responded', 'meeting', 'closed')),
  entered_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

-- Scrape job tracking
CREATE TABLE scrape_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL CHECK (job_type IN ('buildings', 'reviews')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  search_terms TEXT[],
  regions TEXT[],
  properties_found INTEGER,
  reviews_scraped INTEGER,
  error_message TEXT,
  outscraper_request_id TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scoring configuration (single row)
CREATE TABLE scoring_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weights JSONB NOT NULL DEFAULT '{
    "units_50_200": 25,
    "units_200_350": 15,
    "vacation_rentals": 20,
    "parking_complaints": 20,
    "security_patrol": 15,
    "pass_price_40_plus": 10,
    "google_parking_mentions": 10
  }',
  tier_thresholds JSONB NOT NULL DEFAULT '{
    "immediate": 80,
    "nurture": 60,
    "monitor": 40
  }',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_source ON properties(source);
CREATE INDEX idx_reviews_property ON reviews(property_id);
CREATE INDEX idx_analyses_property_type ON analyses(property_id, analysis_type);
CREATE INDEX idx_lead_scores_tier ON lead_scores(tier);
CREATE INDEX idx_lead_scores_score ON lead_scores(score DESC);
CREATE INDEX idx_pipeline_property ON pipeline_stages(property_id);
CREATE INDEX idx_outreach_status ON outreach(status);

-- Insert default scoring config
INSERT INTO scoring_config (weights, tier_thresholds) VALUES (
  '{"units_50_200": 25, "units_200_350": 15, "vacation_rentals": 20, "parking_complaints": 20, "security_patrol": 15, "pass_price_40_plus": 10, "google_parking_mentions": 10}',
  '{"immediate": 80, "nurture": 60, "monitor": 40}'
);
