# VRPS AI Lead Machine — Technical Documentation

## Overview

The VRPS AI Lead Machine is a full-stack sales pipeline application that automatically identifies Gulf Coast condo associations likely to need parking modernization. It scrapes Google Maps for condo properties, pulls real Google reviews, uses AI to analyze parking complaints, estimates unit counts, detects vacation rental activity, and scores each property as a qualified VRPS lead.

---

## Architecture

```
Outscraper API          Anthropic Claude API         Resend (Phase 4)
     |                        |                           |
     v                        v                           v
[ Next.js App Router — API Routes ]
     |
     v
[ Supabase Postgres Database ]
     |
     v
[ Next.js Server Components — Dashboard UI ]
     |
     v
[ Mapbox GL JS — Interactive Market Map ]
```

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js (App Router) | 16.2.0 | Full-stack React framework with server components + API routes |
| **Language** | TypeScript | 5.9.3 | Type-safe development |
| **UI Library** | React | 19.2.3 | Component-based UI |
| **Styling** | Tailwind CSS | v4 | Utility-first CSS framework |
| **Icons** | Lucide React | 0.577+ | Icon library |
| **Database** | Supabase (Postgres) | Cloud | Persistent storage for properties, reviews, analyses, scores |
| **AI Analysis** | Anthropic Claude API | claude-sonnet-4-20250514 | Parking detection, unit estimation, rental detection |
| **AI SDK** | @anthropic-ai/sdk | Latest | TypeScript SDK for Claude API |
| **Scraping** | Outscraper | Latest | Google Maps search + Google Reviews extraction |
| **Maps** | Mapbox GL JS | Latest | Interactive Gulf Coast property map |
| **Charts** | Custom (Tailwind) | — | Score distribution bars, region breakdown |
| **Auth** | Supabase Auth | Built-in | Admin authentication (planned) |
| **Build Tool** | Turbopack | Built-in | Next.js bundler |
| **Linting** | ESLint | 9 | Code quality |
| **Package Manager** | npm | 10.x | Dependency management |

---

## Database Schema (Supabase/Postgres)

### Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `properties` | Scraped condo buildings from Google Maps | name, address, city, state, lat/lng, google_rating, review_count, website, phone, google_place_id |
| `reviews` | Raw Google review text per property | property_id, review_text, reviewer_name, rating, review_date |
| `analyses` | AI analysis results (versioned per type) | property_id, analysis_type (parking/units/rentals), parking_score, estimated_units, has_vacation_rentals |
| `lead_scores` | Computed VRPS lead scores | property_id, score (0-100), tier (immediate/nurture/monitor/disqualified), score_breakdown |
| `contacts` | HOA managers and board members | property_id, management_company, contact_name, email, phone |
| `outreach` | Email campaign tracking | property_id, contact_id, status (draft/sent/opened/clicked/replied/bounced) |
| `pipeline_stages` | Stage progression history | property_id, stage (scraped/analyzed/scored/enriched/outreach_sent/responded/meeting/closed) |
| `scrape_jobs` | Scrape job tracking and history | job_type, status, regions, properties_found, reviews_scraped |
| `scoring_config` | Configurable scoring weights and tier thresholds | weights (JSONB), tier_thresholds (JSONB) |

### Indexes

- `idx_properties_city` — Fast city-based filtering
- `idx_properties_source` — Filter by data source
- `idx_reviews_property` — Join reviews to properties
- `idx_analyses_property_type` — Composite index for latest analysis lookup
- `idx_lead_scores_tier` — Filter leads by tier
- `idx_lead_scores_score` — Sort by score descending
- `idx_pipeline_property` — Pipeline stage history per property
- `idx_outreach_status` — Filter outreach by status

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/scrape/pipeline` | POST | Full pipeline: scrape buildings → pull reviews → AI analysis → score |
| `/api/scrape/pipeline` | GET | Check pipeline status (polling endpoint) |
| `/api/scrape/buildings` | POST | Scrape Google Maps for condo buildings |
| `/api/scrape/reviews` | POST | Pull Google reviews for specific properties |
| `/api/analyze` | POST | Run all 3 AI analyses (parking + units + rentals) in parallel |
| `/api/analyze/parking` | POST | AI parking complaint detection |
| `/api/analyze/units` | POST | AI unit count estimation |
| `/api/analyze/rentals` | POST | AI vacation rental detection |
| `/api/leads` | GET | Fetch all leads with details from Supabase |

---

## AI Analysis Prompts

### Parking Complaint Detection
- **Input**: Up to 200 Google review texts per property
- **Output**: Severity score (0-10), categorized complaints (parking_passes, not_enough_spaces, confusion, towing, security_ticketing, unauthorized_parking, pass_cost), review excerpts with per-complaint severity
- **Model**: claude-sonnet-4-20250514
- **Scoring**: 7+ severity = hot VRPS lead

### Unit Count Estimation
- **Input**: Property name, address, city, state, review count, sample reviews
- **Output**: Estimated unit count, confidence level (high/medium/low), evidence text, in-target-range flag (50-350 units)
- **Model**: claude-sonnet-4-20250514

### Vacation Rental Detection
- **Input**: Property name, city, state, up to 30 reviews
- **Output**: Has vacation rentals (boolean), confidence level, evidence text, detected platforms (airbnb, vrbo, etc.)
- **Model**: claude-sonnet-4-20250514

---

## VRPS Lead Scoring Engine

### Scoring Formula

| Factor | Points |
|--------|--------|
| 50-200 estimated units | +25 |
| 200-350 estimated units | +15 |
| Vacation rentals allowed | +20 |
| Parking complaints (7+ severity) | +20 |
| Security patrol mentioned | +15 |
| Pass price $40+ | +10 |
| Google review parking mentions | +10 |

### Tier Thresholds

| Score Range | Tier | Action |
|-------------|------|--------|
| 80-100 | Immediate | Direct outreach |
| 60-79 | Nurture | Follow-up sequence |
| 40-59 | Monitor | Watch for changes |
| 0-39 | Disqualified | Low priority |

Weights and thresholds are configurable from the Settings page and stored in the `scoring_config` database table.

---

## Pipeline Flow

```
1. SCRAPE BUILDINGS
   Outscraper Google Maps Search API
   → 7 Gulf Coast regions × 6 search terms
   → Deduplicate by Google Place ID
   → Upsert to Supabase `properties` table

2. SCRAPE REVIEWS
   Outscraper Google Reviews API
   → Top N properties by review count
   → Up to 200 reviews per property
   → Insert to Supabase `reviews` table

3. AI ANALYSIS
   Anthropic Claude API (3 prompts in parallel per property)
   → Parking complaint detection
   → Unit count estimation
   → Vacation rental detection
   → Insert to Supabase `analyses` table

4. SCORING
   VRPS scoring engine
   → Apply configurable weights
   → Assign tier (immediate/nurture/monitor/disqualified)
   → Upsert to Supabase `lead_scores` table

5. PIPELINE TRACKING
   → Each step logs to `pipeline_stages` table
   → Status polling via GET /api/scrape/pipeline
```

---

## Dashboard Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/dashboard` | Pipeline stats, score distribution chart, region breakdown, top leads |
| Scrape | `/dashboard/scrape` | Configure and run scrape pipeline with live progress tracking |
| Leads | `/dashboard/leads` | Sortable/filterable table of all properties with scores |
| Lead Detail | `/dashboard/leads/[id]` | Full property view: score breakdown, AI analysis, reviews, contacts, outreach history |
| Reports | `/dashboard/reports` | Lead report grouped by tier (immediate, nurture, monitor) |
| Market Map | `/dashboard/map` | Interactive Mapbox map with color-coded property pins |
| Outreach | `/dashboard/outreach` | Email campaign management and tracking (Phase 4) |
| Import | `/dashboard/import` | CSV drag-drop upload with column auto-mapping |
| Settings | `/dashboard/settings` | Scoring weight sliders, tier thresholds, regions, search terms, API key status |

---

## Target Regions

| Region | State |
|--------|-------|
| Gulf Shores | Alabama |
| Orange Beach | Alabama |
| Pensacola Beach | Florida |
| Destin | Florida |
| Miramar Beach | Florida |
| Fort Walton Beach | Florida |
| Panama City Beach | Florida |

---

## Environment Variables

| Variable | Required | Phase | Purpose |
|----------|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | 1 | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | 1 | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | 1 | Supabase service role key (server-side only) |
| `ANTHROPIC_API_KEY` | Yes | 2 | Claude API key for AI analysis |
| `OUTSCRAPER_API_KEY` | Yes | 3 | Outscraper API key for Google Maps/Reviews scraping |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Yes | 5 | Mapbox public token for interactive map |
| `RESEND_API_KEY` | No | 4 | Resend API key for email outreach (future) |
| `CRON_SECRET` | No | — | Vercel cron job authentication (future) |

---

## Project Structure

```
lead-machine/
├── src/
│   ├── app/
│   │   ├── layout.tsx                      # Root layout
│   │   ├── page.tsx                        # Redirect to /dashboard
│   │   ├── globals.css                     # Global styles + Tailwind
│   │   ├── dashboard/
│   │   │   ├── layout.tsx                  # Sidebar layout
│   │   │   ├── page.tsx                    # Pipeline overview
│   │   │   ├── scrape/page.tsx             # Scrape pipeline UI
│   │   │   ├── leads/page.tsx              # Leads table
│   │   │   ├── leads/[id]/page.tsx         # Lead detail
│   │   │   ├── reports/page.tsx            # Lead report
│   │   │   ├── map/page.tsx                # Market map
│   │   │   ├── outreach/page.tsx           # Outreach management
│   │   │   ├── import/page.tsx             # CSV import
│   │   │   └── settings/page.tsx           # Configuration
│   │   └── api/
│   │       ├── analyze/                    # AI analysis endpoints
│   │       ├── scrape/                     # Scraping endpoints
│   │       └── leads/                      # Lead data endpoint
│   ├── components/
│   │   ├── layout/Sidebar.tsx              # Navigation sidebar
│   │   ├── leads/                          # Lead table, score badge, analysis panel
│   │   ├── dashboard/                      # Pipeline stats, charts
│   │   └── map/MarketMap.tsx               # Mapbox map component
│   ├── lib/
│   │   ├── ai/                             # Anthropic client + prompts
│   │   ├── scraper/outscraper.ts           # Outscraper SDK wrapper
│   │   ├── scoring/                        # Lead score calculator + config
│   │   ├── supabase/                       # Database client + queries
│   │   ├── store.ts                        # In-memory pipeline status
│   │   └── mock/data.ts                    # Mock data (development)
│   └── types/database.ts                   # TypeScript type definitions
├── supabase/
│   └── migrations/001_initial_schema.sql   # Database schema
├── package.json
├── tsconfig.json
├── next.config.ts
└── TECHNICAL.md                            # This file
```

---

## External Services & Costs

| Service | Purpose | Estimated Cost |
|---------|---------|---------------|
| **Outscraper** | Google Maps search + review scraping | ~$2-3 per 1,000 reviews (pay-as-you-go) |
| **Anthropic** | Claude AI analysis of reviews | ~$0.01-0.03 per property analysis |
| **Supabase** | Postgres database + auth | Free tier (500MB, 50K rows) |
| **Mapbox** | Interactive map rendering | Free tier (50K map loads/month) |
| **Vercel** | Hosting + deployment | Free tier (hobby) or Pro ($20/mo) |

Typical full pipeline run (1 region, 3 search terms, top 5 analyzed): **~$2-3 total**
