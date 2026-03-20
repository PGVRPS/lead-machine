# VRPS AI Lead Machine — User Guide

## What Is This?

The VRPS AI Lead Machine is an automated sales pipeline that finds condo associations along the Gulf Coast that are likely candidates for VRPS parking modernization. It searches Google Maps for condo properties, reads their Google reviews, uses AI to detect parking problems, and scores each property as a potential VRPS customer.

---

## Getting Started

### Running the App Locally

1. Navigate to the `lead-machine` folder
2. Run `npm run dev`
3. Open `http://localhost:3001` in your browser
4. You'll land on the Dashboard

### First Time Setup

If the Dashboard shows "No properties scraped yet," head to the **Scrape** page to run your first pipeline.

---

## Pages

### Dashboard

The Dashboard is your pipeline overview. It shows:

- **Total Properties** — How many condo buildings are in the database
- **Hot Leads** — Properties scoring 80+ (ready for immediate outreach)
- **Nurture** — Properties scoring 60-79 (worth following up on)
- **Monitor** — Properties scoring 40-59 (watch for changes)
- **Outreach Sent / Opened / Replied** — Email campaign stats (when outreach is enabled)
- **Score Distribution** — Bar chart showing how many leads fall into each score range
- **Leads by Region** — Breakdown of properties by city
- **Top Leads** — Quick list of highest-scoring properties with links to their detail pages

---

### Scrape Pipeline

This is where you search for new properties and run the full analysis pipeline.

#### Configuration Options

- **Target Regions** — Click to toggle which Gulf Coast cities to search. Blue = selected.
- **Search Terms** — The Google Maps search queries used to find condos. Blue = selected.
- **Reviews per property** — How many Google reviews to pull for each property (50, 100, or 200). More reviews = better AI analysis but higher Outscraper cost.
- **Properties to analyze (AI)** — How many of the top properties (by review count) to run through Claude AI analysis. Each property costs a small amount in Anthropic API usage.

#### Cost Estimate

The bottom of the configuration shows the estimated Outscraper cost based on your selections. A typical run (1 region, 3 terms, top 5 analyzed) costs about $1-3.

#### Running the Pipeline

Click **Run Pipeline** to start. The pipeline runs 4 steps:

1. **Search** — Finds condo properties on Google Maps
2. **Reviews** — Pulls Google reviews for the top properties
3. **AI Analysis** — Claude analyzes reviews for parking complaints, estimates unit counts, and detects vacation rental activity
4. **Score** — Computes the VRPS Lead Score for each analyzed property

A progress bar and status message show which step is running. The full pipeline typically takes 2-5 minutes depending on how many regions and properties you selected.

#### Results

When complete, you'll see a summary showing properties found, reviews fetched, properties analyzed, and how many scored as hot leads or nurture. Below that is a table of all scraped leads with their scores.

---

### Leads

The Leads page shows every property in your database in a sortable, filterable table.

#### Columns

| Column | What It Shows |
|--------|--------------|
| **Property** | Condo name + Google rating (stars) |
| **City** | Location (city, state) |
| **Units** | AI-estimated number of condo units |
| **Score** | VRPS Lead Score (0-100) with tier badge |
| **Management** | HOA management company (if known) |
| **Rentals** | Whether vacation rentals are detected (Yes/No) |
| **Reviews** | Number of Google reviews |
| **Stage** | Pipeline stage (scraped, analyzed, scored, etc.) |

#### Filtering

- **Search bar** — Search by property name, city, or management company
- **Tier filter** — Show only Immediate, Nurture, Monitor, or Disqualified leads
- **City filter** — Filter to a specific Gulf Coast city

#### Sorting

Click any column header to sort. Click again to reverse the sort direction. The blue arrow shows the active sort column.

---

### Lead Detail

Click any property name in the Leads table to see its full detail page.

#### Sections

**Header** — Property name, address, Google rating, review count, website link, phone number, and current VRPS score with tier badge.

**AI Analysis Panel** — If the property has reviews in the database, you can click "Run Analysis" to have Claude AI analyze them on-demand. This runs three analyses in parallel:

- **Parking Analysis** — Severity score (0-10), number of parking mentions, whether parking issues exist, and a summary of the parking situation
- **Unit Estimation** — Estimated number of condo units with confidence level and evidence
- **Vacation Rentals** — Whether the property allows short-term rentals, with detected platforms (Airbnb, VRBO, etc.)

**Score Breakdown** — Shows how many points each factor contributed to the VRPS score. The bar width represents the point value.

**Analysis Summary** — Quick view of estimated units, vacation rental status, parking score, and security patrol detection.

**Contact Info** — Management company name, contact person, email, and verification status.

**Parking Complaints Detected** — Individual review excerpts flagged by the AI, each with a severity rating (1-10) and category (not enough spaces, towing, confusion, etc.). Color-coded: red = severe (8+), amber = moderate (5-7), gray = minor.

**Reviews** — The actual Google review text stored for this property.

---

### Reports

The Reports page is a printable/shareable summary of your lead pipeline.

- **Summary cards** — Total properties, hot leads count, nurture leads count, average score
- **Immediate Outreach table** — All properties scoring 80+ (your weekly hit list)
- **Nurture Sequence table** — Properties scoring 60-79 (follow-up candidates)
- **Monitor table** — Properties scoring 40-59 (watch list)

---

### Market Map

An interactive map of the Gulf Coast showing all properties as colored pins.

#### Pin Colors

| Color | Meaning |
|-------|---------|
| Red | Immediate lead (score 80+) |
| Amber | Nurture lead (score 60-79) |
| Gray | Monitor (score 40-59) |
| Light gray | Unscored or disqualified |

Pin size also indicates score — larger pins = higher scores.

#### Interaction

- **Zoom** — Scroll or use +/- buttons
- **Pan** — Click and drag
- **Click a pin** — Opens a popup with the property's score, rating, estimated units, parking score, and a link to the full lead detail page
- **Legend** — Top-left corner explains the color coding

#### Stats Bar

Below the map, four cards show: Total Properties, With Coordinates, Scored, and Hot Leads.

---

### Import

Upload CSV files to add properties to the database manually.

1. Drag and drop a CSV file (or click Browse Files)
2. The system auto-detects columns and maps them to database fields
3. Review the column mapping and adjust if needed
4. Preview the first 5 rows to verify
5. Click Import Properties

Only the "name" column is required. The system will skip duplicate properties (matched by name + city).

---

### Settings

#### Scoring Weights

Adjust how much each factor contributes to the VRPS Lead Score using the sliders:

| Factor | Default Points | What It Means |
|--------|---------------|---------------|
| **50-200 Units** | +25 | Property has 50-200 estimated condo units (ideal VRPS size) |
| **200-350 Units** | +15 | Property has 200-350 units (larger, still good) |
| **Vacation Rentals Allowed** | +20 | Property allows Airbnb/VRBO (high guest turnover = more parking need) |
| **Parking Complaints (7+ severity)** | +20 | AI detected significant parking problems in reviews |
| **Security Patrol Mentioned** | +15 | Reviews mention security checking parking (existing enforcement = budget exists) |
| **Pass Price $40+** | +10 | Current parking pass costs $40+ (willingness to pay) |
| **Google Review Parking Mentions** | +10 | Number of reviews that mention parking at all |

The **max total** shown at the top tells you the maximum possible score given current weights.

#### Tier Thresholds

Set the score cutoffs for each lead tier:
- **Immediate** (default 80) — Direct outreach
- **Nurture** (default 60) — Follow-up sequence
- **Monitor** (default 40) — Watch for changes

#### Target Regions

Add or remove the geographic regions the system searches. Type a new region (e.g. "Hilton Head, SC") in the text field and click **Add** or press Enter. Click the **X** on any region to remove it. The system comes pre-loaded with 7 Gulf Coast cities but you can customize this to any location. Click **Save** at the top to persist changes — these regions will then appear as toggle options on the Scrape page.

#### Search Terms

Add or remove the Google Maps search queries used to find condo properties. Type a new term (e.g. "beach resort") and click **Add** or press Enter. Click the **X** on any term to remove it. Click **Save** to persist. Different terms surface different property types — "condominium association" finds HOA-managed buildings while "condo resort" finds vacation-oriented ones.

---

### Outreach (Future)

Email campaign management. When enabled, this page will allow you to:
- Compose outreach emails using templates
- Send personalized emails to property managers
- Track opens, clicks, and replies
- View outreach history per property

---

## Understanding the Metrics

### VRPS Lead Score (0-100)

The VRPS Lead Score is a composite number that predicts how likely a condo property is to benefit from VRPS parking modernization. Higher = better lead.

The score is built from multiple signals:
- **Does the property have parking problems?** (parking complaint severity from AI)
- **Is it the right size?** (50-350 units is the sweet spot)
- **Do they have vacation rentals?** (high guest turnover creates more parking demand)
- **Is there existing enforcement?** (means they already spend money on parking)
- **Are guests complaining publicly?** (creates urgency for the management company)

### Lead Tiers

| Tier | Score | What to Do |
|------|-------|-----------|
| **Immediate** | 80-100 | These properties have strong parking pain signals, are the right size, and have vacation rentals. Reach out this week. |
| **Nurture** | 60-79 | Good candidates but missing one or two signals. Add to a follow-up email sequence. |
| **Monitor** | 40-59 | Some potential but not urgent. Re-analyze quarterly as new reviews come in. |
| **Disqualified** | 0-39 | Low parking complaints, wrong size, or no vacation rentals. Not a fit right now. |

### Parking Severity Score (0-10)

The AI reads Google reviews and scores how severe the parking situation is:

| Score | Meaning |
|-------|---------|
| **0** | No parking mentions at all |
| **1-3** | Minor mentions, generally positive or neutral about parking |
| **4-6** | Some complaints but not a major issue — occasional inconvenience |
| **7-8** | Significant parking problems across multiple reviews and categories |
| **9-10** | Severe, pervasive parking issues — towing, pass abuse, guest confusion, security conflicts |

Properties scoring 7+ are flagged as having genuine parking pain that VRPS can solve.

### Parking Complaint Categories

The AI categorizes each parking complaint it finds:

| Category | What It Means |
|----------|--------------|
| **Not Enough Spaces** | Guests can't find parking, overflow lot needed, street parking required |
| **Parking Passes** | Paper pass system is confusing, passes displayed incorrectly, pass distribution problems |
| **Towing** | Vehicles being towed, aggressive enforcement, guests towed by mistake |
| **Confusion** | Guests don't know where to park, unclear signage, wrong lot confusion |
| **Security Ticketing** | Security patrol issuing tickets or warnings, early morning checks |
| **Unauthorized Parking** | Non-guests parking in the lot, pass sharing, visitors without passes |
| **Pass Cost** | Complaints about daily/weekly parking fees being too expensive |

### Unit Count Confidence

The AI estimates unit counts with a confidence level:

| Level | Meaning |
|-------|---------|
| **High** | Strong evidence from building name, public records, or specific floor/unit mentions in reviews |
| **Medium** | Reasonable estimate based on property type, review volume, and location patterns |
| **Low** | Limited information available — rough estimate based on property category |

### Vacation Rental Detection

The AI looks for evidence of short-term rental activity:
- Direct mentions of Airbnb, VRBO, Booking.com
- "Rented" or "booked" language in reviews
- Check-in/check-out procedures described
- Rental management company references
- "Owner" vs "guest/renter" distinctions

Properties with active vacation rentals are high-value VRPS leads because guest turnover creates constant parking demand.

---

## Tips for Best Results

1. **Start with one region** to test, then expand. Orange Beach and Panama City Beach typically have the most condo density.

2. **Analyze more than 5 properties** per region. Set "Properties to analyze" to 10 or 20 to cast a wider net. The AI cost is minimal (~$0.01-0.03 per property).

3. **Pull 200 reviews** instead of 100 for the most accurate parking analysis. More review data = better AI insights.

4. **Re-run regions periodically**. New reviews come in constantly. A property that scored low 3 months ago might have new parking complaints.

5. **Check the parking complaints section** on lead detail pages. The specific review excerpts tell you exactly what problems exist — use these in your outreach messaging.

6. **Use all 6 search terms**. Different terms surface different types of properties. "Condominium association" finds HOA-managed buildings while "condo resort" finds vacation-oriented ones.

7. **The Market Map is your territory view**. Use it to identify geographic clusters where multiple properties have parking issues — that's where you can pitch "we already work with properties nearby."
