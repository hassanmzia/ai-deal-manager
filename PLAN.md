# AI Deal Manager — Implementation Plan

## Enterprise Autonomous Agentic Deal Management Platform

**For:** AI Consulting Company
**Stack:** Django + PostgreSQL | Node.js + React/TypeScript | LangGraph/LangChain | MCP + A2A | RAG + RL
**Infrastructure:** Docker Compose (multi-host, no port conflicts)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Docker Compose & Infrastructure](#2-docker-compose--infrastructure)
3. [Phase 1 — Foundation & Auth](#3-phase-1--foundation--auth)
4. [Phase 2 — Opportunity Intelligence](#4-phase-2--opportunity-intelligence)
5. [Phase 3 — Deal Pipeline & Workflow](#5-phase-3--deal-pipeline--workflow)
6. [Phase 4 — RFP Workspace & Compliance](#6-phase-4--rfp-workspace--compliance)
6A. [Phase 4A — Company AI Strategy Agent](#6a-phase-4a--company-ai-strategy-agent) **(NEW)**
7. [Phase 5 — Past Performance Vault](#7-phase-5--past-performance-vault)
8. [Phase 6 — Proposal Authoring Studio](#8-phase-6--proposal-authoring-studio) (includes **Fully Autonomous AI Solutions Architect** + **Multimodal Knowledge Vault**)
9. [Phase 7 — Pricing & Staffing Engine](#9-phase-7--pricing--staffing-engine)
10. [Phase 8 — Contract Management](#10-phase-8--contract-management)
11. [Phase 9 — AI Agent Orchestration](#11-phase-9--ai-agent-orchestration)
12. [Phase 10 — Learning & Optimization](#12-phase-10--learning--optimization)
13. [Data Model](#13-data-model)
14. [File/Folder Structure](#14-filefolder-structure)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        NGINX Reverse Proxy (:80/:443)               │
├──────────────┬───────────────┬────────────────┬──────────────────────┤
│  React/TS    │  Django API   │  Node.js       │  AI Orchestrator     │
│  Frontend    │  (Core BizAPI)│  (Realtime/WS) │  (LangGraph)         │
│  :3000       │  :8001        │  :8002         │  :8003               │
├──────────────┴───────────────┴────────────────┴──────────────────────┤
│                        Internal Docker Network                       │
├──────────┬──────────┬───────────┬──────────┬─────────┬──────────────┤
│ Postgres │  Redis   │  MinIO    │ pgvector │ Celery  │  Langfuse    │
│  :5432   │  :6379   │  :9000   │ (in PG)  │ Workers │  :8004       │
└──────────┴──────────┴───────────┴──────────┴─────────┴──────────────┘
```

### Key Design Decisions

- **Django** = system of record (auth, RBAC, workflow state machine, audit, all CRUD)
- **Node.js** = real-time collaboration (WebSocket for live proposal editing, notifications)
- **React/TypeScript** = SPA frontend with AI Workbench on every entity
- **LangGraph** = multi-agent orchestration with HITL gates
- **MCP** = tool servers (each integration is a separate MCP server)
- **A2A** = agent-to-agent protocol for inter-agent communication
- **RAG** = pgvector in PostgreSQL for vector search (past performance, proposals, knowledge)
- **Celery + Redis** = async task queue (opportunity scanning, document processing, AI jobs)
- **MinIO** = S3-compatible object storage for attachments & generated documents
- **Langfuse** = LLM observability (prompt traces, cost, evals)

---

## 2. Docker Compose & Infrastructure

### 2.1 Services

| Service | Internal Port | External (via Nginx) | Image/Build |
|---------|--------------|---------------------|-------------|
| `nginx` | 80, 443 | 80, 443 | nginx:alpine |
| `frontend` | 3000 | /app/* → 3000 | Node 20 (build) |
| `django-api` | 8001 | /api/* → 8001 | Python 3.12 |
| `node-realtime` | 8002 | /ws/* → 8002 | Node 20 |
| `ai-orchestrator` | 8003 | /ai/* → 8003 | Python 3.12 |
| `postgres` | 5432 | internal only | postgres:16 + pgvector |
| `redis` | 6379 | internal only | redis:7-alpine |
| `minio` | 9000/9001 | internal only | minio/minio |
| `celery-worker` | — | — | Same as django |
| `celery-beat` | — | — | Same as django |
| `langfuse` | 8004 | /langfuse/* → 8004 | langfuse/langfuse |

### 2.2 Files to Create

```
docker-compose.yml          # All services
docker-compose.override.yml # Dev overrides (volumes, debug)
.env.example                # All env vars template
nginx/nginx.conf            # Reverse proxy config
nginx/ssl/                  # SSL certs (gitignored)
```

### 2.3 Network Strategy

- Single Docker bridge network: `dealmanager-net`
- All inter-service communication via service names (e.g., `postgres:5432`)
- Only nginx exposes ports 80/443 to host
- Dev mode: optionally expose frontend:3000 for HMR

---

## 3. Phase 1 — Foundation & Auth

### 3.1 Django Backend Setup

```
backend/
├── manage.py
├── requirements.txt
├── Dockerfile
├── config/
│   ├── settings/
│   │   ├── base.py          # Common settings
│   │   ├── development.py   # Dev overrides
│   │   └── production.py    # Prod overrides
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── accounts/            # Auth, RBAC, MFA, profiles
│   ├── core/                # Shared models, utils, audit
│   ├── opportunities/       # Opportunity intelligence
│   ├── deals/               # Deal pipeline & workflow
│   ├── rfp/                 # RFP workspace & compliance
│   ├── past_performance/    # Past performance vault
│   ├── proposals/           # Proposal authoring
│   ├── pricing/             # Pricing & staffing
│   ├── contracts/           # Contract management
│   ├── communications/      # Email & narrative drafting
│   ├── policies/            # AI policy & goal settings
│   └── analytics/           # Dashboards & reporting
```

### 3.2 Authentication & Authorization

- **Django Auth** activated with session-based auth + JWT tokens for API
- **django-rest-framework** with token auth + session auth
- **django-allauth** for optional SSO (SAML/OIDC) readiness
- **django-otp** + **django-two-factor-auth** for optional TOTP MFA

### 3.3 RBAC Roles

| Role | Description | Key Permissions |
|------|-------------|----------------|
| `admin` | Platform administrator | Full access, user management, system config |
| `executive` | C-suite / leadership | View all, approve major decisions, dashboards |
| `capture_manager` | Opportunity & deal owner | Manage opportunities, deals, bid/no-bid |
| `proposal_manager` | Proposal lifecycle owner | Manage proposals, reviews, submissions |
| `pricing_manager` | Pricing authority | Rate cards, scenarios, pricing approval |
| `writer` | Proposal/content author | Edit proposal sections, past perf narratives |
| `reviewer` | Pink/Red team reviewer | Review & comment, approve/reject sections |
| `contracts_manager` | Contract lifecycle owner | Contract templates, clause library, redlines |
| `viewer` | Read-only stakeholder | View dashboards, pipeline, reports |

### 3.4 User Profile Features

- Profile picture upload (to MinIO)
- Change password (with strength validation)
- Edit profile information (name, title, department, skills)
- MFA enable/disable (per user)
- Activity log (recent actions)
- Notification preferences

### 3.5 Audit System

- **Immutable audit log** table: `who`, `what`, `when`, `entity_type`, `entity_id`, `old_value`, `new_value`, `ip_address`
- **AI audit log**: `agent_name`, `prompt`, `tool_calls`, `retrieved_sources`, `output`, `approval_status`, `cost`, `latency`
- Django signals for automatic change tracking

### 3.6 React Frontend Setup

```
frontend/
├── package.json
├── tsconfig.json
├── Dockerfile
├── src/
│   ├── app/                 # Next.js app router (or CRA routes)
│   ├── components/
│   │   ├── ui/              # Reusable UI (shadcn/ui or MUI)
│   │   ├── layout/          # Shell, sidebar, topbar
│   │   ├── auth/            # Login, MFA, profile
│   │   ├── dashboard/       # Executive dashboards
│   │   ├── opportunities/   # Opportunity cards, scoring
│   │   ├── deals/           # Pipeline board (Kanban)
│   │   ├── rfp/             # RFP workspace
│   │   ├── proposals/       # Proposal editor
│   │   ├── pricing/         # Pricing scenarios
│   │   ├── contracts/       # Contract workspace
│   │   ├── ai-workbench/    # AI chat + actions panel
│   │   └── settings/        # Policy, goals, admin
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API client (axios/fetch)
│   ├── store/               # State management (Zustand or Redux)
│   ├── types/               # TypeScript interfaces
│   └── utils/               # Helpers
```

### 3.7 Node.js Realtime Service

```
realtime/
├── package.json
├── tsconfig.json
├── Dockerfile
├── src/
│   ├── server.ts            # Express + Socket.IO
│   ├── handlers/
│   │   ├── notifications.ts # Push notifications
│   │   ├── collaboration.ts # Live proposal editing
│   │   └── ai-stream.ts    # Stream AI responses
│   └── middleware/
│       └── auth.ts          # JWT verification
```

---

## 4. Phase 2 — Opportunity Intelligence

### 4.1 Data Sources & Connectors

| Source | Method | Frequency |
|--------|--------|-----------|
| **SAM.gov** | Official API (api.sam.gov) | Every 4 hours |
| **instantmarkets.com** | API or ToS-compliant scraping | Daily |
| **Oak Ridge National Lab** | Procurement page monitor | Daily |
| **Brookhaven National Lab** | Procurement page monitor | Daily |
| **Kansas City Security Complex** | Procurement page monitor | Daily |
| **Sandia National Lab** | Procurement page monitor | Daily |
| **Oregon National Lab (PNNL?)** | Procurement page monitor | Daily |
| **USASpending/FPDS** | API (historical context) | Weekly |

### 4.2 SAM.gov Integration (Primary)

```python
# apps/opportunities/services/samgov_client.py
class SAMGovClient:
    """
    Official SAM.gov API integration
    - Search opportunities by NAICS, PSC, set-aside, keyword
    - Fetch full opportunity details + attachments
    - Track amendments and updates
    - Extract Q&A / clarification responses
    """
    BASE_URL = "https://api.sam.gov/opportunities/v2"

    def search_opportunities(self, filters: dict) -> list[Opportunity]
    def get_opportunity_detail(self, notice_id: str) -> OpportunityDetail
    def get_attachments(self, resource_links: list) -> list[Attachment]
    def check_amendments(self, notice_id: str) -> list[Amendment]
```

### 4.3 Opportunity Normalization Pipeline

```
Raw Source Data → Normalize → Deduplicate → Enrich → Score → Rank → Publish Top 10
```

Each step is a Celery task:

1. **Ingest**: Pull from each source, store raw JSON
2. **Normalize**: Map to unified `Opportunity` schema (title, agency, NAICS, PSC, set-aside, deadline, description, attachments, value_estimate)
3. **Deduplicate**: Match by notice_id + source; merge updates
4. **Enrich**: Add agency history, incumbent info, NAICS mapping, keyword extraction
5. **Score**: ML-based fit scoring (see §4.4)
6. **Rank**: Sort by composite score, select Top 10
7. **Publish**: Create daily digest, push notifications, update dashboard

### 4.4 ML Fit Scoring Engine

**Phase 1 (Rule-based + Embedding Similarity):**
```
Score = w1*NAICS_match + w2*PSC_match + w3*keyword_overlap
      + w4*capability_similarity + w5*past_performance_relevance
      + w6*value_fit + w7*deadline_feasibility + w8*set_aside_match
      - w9*competition_intensity - w10*risk_factors
```

**Phase 2 (ML model, once labeled data exists):**
- Features: all above + agency history, win/loss record, team availability
- Model: LightGBM or XGBoost (binary classifier: bid/no-bid → probability)
- Labels: historical bid/no-bid decisions + outcomes (win/loss)
- Explainability: SHAP values → "why this score"

**Phase 3 (RL refinement):**
- Contextual bandit: each day select Top 10 from Top 30 candidates
- Reward: +1 if bid, +5 if won, -1 if bid and lost, 0 if no-bid
- Policy: Thompson Sampling or LinUCB for exploration/exploitation

### 4.5 Company Profile & Capability Statement

```python
# apps/opportunities/models.py
class CompanyProfile(models.Model):
    name = models.CharField(max_length=255)
    uei_number = models.CharField(max_length=12)       # SAM.gov UEI
    cage_code = models.CharField(max_length=5)          # CAGE code
    naics_codes = models.JSONField(default=list)        # Primary NAICS
    psc_codes = models.JSONField(default=list)          # Product/Service codes
    set_aside_categories = models.JSONField(default=list)  # 8a, SDVOSB, etc.
    capability_statement = models.TextField()            # Full text
    capability_embedding = VectorField(dimensions=1536)  # For similarity
    core_competencies = models.JSONField(default=list)
    past_performance_summary = models.TextField()
    key_personnel = models.JSONField(default=list)
    certifications = models.JSONField(default=list)
    clearance_levels = models.JSONField(default=list)
    contract_vehicles = models.JSONField(default=list)   # GSA, SEWP, etc.
```

---

## 5. Phase 3 — Deal Pipeline & Workflow

### 5.1 Pipeline Stages (Standard Federal Capture)

```
┌─────────┐   ┌──────────┐   ┌──────────┐   ┌─────────────┐   ┌──────────┐
│ INTAKE  │→  │ QUALIFY  │→  │ BID/NO   │→  │ CAPTURE    │→  │ PROPOSAL │
│         │   │          │   │ BID (H)  │   │ PLAN       │   │ DEV      │
└─────────┘   └──────────┘   └──────────┘   └─────────────┘   └──────────┘
                                                                     │
┌─────────┐   ┌──────────┐   ┌──────────┐   ┌─────────────┐         │
│ POST    │←  │ SUBMIT   │←  │ FINAL    │←  │ RED TEAM   │←  ───────┘
│ SUBMIT  │   │ (H)      │   │ REVIEW(H)│   │ REVIEW (H) │
└─────────┘   └──────────┘   └──────────┘   └─────────────┘
     │
┌─────────┐   ┌──────────┐   ┌──────────┐
│ AWARD   │→  │ CONTRACT │→  │ DELIVERY │
│ PENDING │   │ SETUP(H) │   │          │
└─────────┘   └──────────┘   └──────────┘

(H) = Human-in-the-Loop approval gate
```

### 5.2 Deal Model

```python
class Deal(models.Model):
    STAGES = [
        ('intake', 'Intake'),
        ('qualify', 'Qualify'),
        ('bid_no_bid', 'Bid/No-Bid Decision'),
        ('capture_plan', 'Capture Planning'),
        ('proposal_dev', 'Proposal Development'),
        ('red_team', 'Red Team Review'),
        ('final_review', 'Final Review'),
        ('submit', 'Submission'),
        ('post_submit', 'Post-Submission'),
        ('award_pending', 'Award Pending'),
        ('contract_setup', 'Contract Setup'),
        ('delivery', 'Delivery/Execution'),
        ('closed_won', 'Closed - Won'),
        ('closed_lost', 'Closed - Lost'),
        ('no_bid', 'No-Bid'),
    ]

    opportunity = models.ForeignKey(Opportunity, on_delete=models.CASCADE)
    stage = models.CharField(max_length=30, choices=STAGES, default='intake')
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    team = models.ManyToManyField(User, related_name='deal_team')
    priority = models.IntegerField(choices=[(1,'Critical'),(2,'High'),(3,'Medium'),(4,'Low')])
    estimated_value = models.DecimalField(max_digits=15, decimal_places=2, null=True)
    win_probability = models.FloatField(default=0.0)
    fit_score = models.FloatField(default=0.0)
    ai_recommendation = models.TextField(blank=True)
    due_date = models.DateTimeField(null=True)

    # Stage transition tracking
    stage_entered_at = models.DateTimeField(auto_now=True)
    stage_history = models.JSONField(default=list)
```

### 5.3 Workflow Engine

```python
class WorkflowEngine:
    """
    State machine for deal stage transitions.
    Enforces HITL approval gates and prerequisite checks.
    """
    HITL_GATES = {'bid_no_bid', 'final_review', 'submit', 'contract_setup'}

    PREREQUISITES = {
        'bid_no_bid': ['fit_score_computed', 'qualification_checklist_complete'],
        'proposal_dev': ['bid_approved', 'capture_plan_exists'],
        'red_team': ['proposal_draft_complete'],
        'final_review': ['red_team_complete', 'pricing_approved'],
        'submit': ['final_review_approved', 'submission_checklist_complete'],
        'contract_setup': ['award_received'],
    }

    def transition(self, deal, target_stage, user, approval=None):
        """Validate prerequisites, enforce HITL, log transition"""
```

### 5.4 Task & Checklist System

- Auto-generated tasks per stage (templated checklists)
- Assignable to team members
- SLA timers with escalation
- AI can auto-complete certain tasks (document generation, analysis)

### 5.5 Approval System

```python
class Approval(models.Model):
    TYPES = [
        ('bid_no_bid', 'Bid/No-Bid Decision'),
        ('pricing', 'Pricing Approval'),
        ('proposal_final', 'Final Proposal Approval'),
        ('submission', 'Submission Authorization'),
        ('contract_terms', 'Contract Terms Approval'),
    ]

    deal = models.ForeignKey(Deal, on_delete=models.CASCADE)
    approval_type = models.CharField(max_length=30, choices=TYPES)
    requested_by = models.ForeignKey(User, related_name='approvals_requested')
    requested_from = models.ForeignKey(User, related_name='approvals_pending')
    status = models.CharField(choices=[('pending','Pending'),('approved','Approved'),('rejected','Rejected')])
    ai_recommendation = models.TextField(blank=True)
    ai_confidence = models.FloatField(null=True)
    decision_rationale = models.TextField(blank=True)
    decided_at = models.DateTimeField(null=True)
```

---

## 6. Phase 4 — RFP Workspace & Compliance

### 6.1 RFP Document Ingestion

- Upload RFP documents (PDF, DOCX, Excel)
- AI-powered extraction:
  - Requirements (shall/must statements)
  - Evaluation criteria & weights
  - Deliverables & CDRLs
  - Page limits & formatting rules
  - Submission instructions
  - Key dates (Q&A deadline, proposal due, etc.)
  - Required forms & certifications

### 6.2 Compliance Matrix Generator

```python
class ComplianceMatrixItem(models.Model):
    rfp_document = models.ForeignKey(RFPDocument, on_delete=models.CASCADE)
    requirement_id = models.CharField(max_length=50)    # e.g., "L.3.2.1"
    requirement_text = models.TextField()
    section_reference = models.CharField(max_length=100)  # Section L/M ref
    requirement_type = models.CharField(choices=[
        ('mandatory', 'Mandatory'),
        ('desirable', 'Desirable'),
        ('informational', 'Informational'),
    ])
    evaluation_weight = models.FloatField(null=True)

    # Response tracking
    proposal_section = models.CharField(max_length=100, blank=True)
    response_owner = models.ForeignKey(User, null=True)
    response_status = models.CharField(choices=[
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('drafted', 'Drafted'),
        ('reviewed', 'Reviewed'),
        ('final', 'Final'),
    ])
    ai_draft_response = models.TextField(blank=True)
    human_final_response = models.TextField(blank=True)
    compliance_status = models.CharField(choices=[
        ('compliant', 'Compliant'),
        ('partial', 'Partially Compliant'),
        ('non_compliant', 'Non-Compliant'),
        ('not_assessed', 'Not Assessed'),
    ])
    evidence_references = models.JSONField(default=list)
```

### 6.3 Amendment & Change Tracker

- Detect new amendments/modifications from SAM.gov
- Diff against previous version
- Highlight changed requirements
- Auto-update compliance matrix
- Trigger re-review if material changes found (HITL gate)

---

## 6A. Phase 4A — Company AI Strategy Agent

> **Purpose:** A strategic intelligence layer that sits ABOVE the deal pipeline. It maintains your company's evolving strategy, influences every bid/no-bid decision, balances the portfolio, and ensures the entire platform optimizes toward your business goals — not just individual deal fit.

### 6A.1 Strategic Knowledge Base

```python
class CompanyStrategy(models.Model):
    """Living strategic plan maintained by strategy agent + leadership"""
    version = models.IntegerField()
    effective_date = models.DateField()

    # Strategic positioning
    mission_statement = models.TextField()
    vision_3_year = models.TextField()
    target_revenue = models.DecimalField(max_digits=15, decimal_places=2)
    target_win_rate = models.FloatField()
    target_margin = models.FloatField()

    # Market focus
    target_agencies = models.JSONField(default=list)        # ["DoD", "DHS", "DOE", "HHS"]
    target_domains = models.JSONField(default=list)         # ["AI/ML", "Cloud", "Cyber", "Data"]
    target_naics_codes = models.JSONField(default=list)
    growth_markets = models.JSONField(default=list)         # Markets to BREAK INTO
    mature_markets = models.JSONField(default=list)         # Markets to DEFEND
    exit_markets = models.JSONField(default=list)           # Markets to phase out

    # Competitive strategy
    differentiators = models.JSONField(default=list)        # Key competitive advantages
    win_themes = models.JSONField(default=list)             # Reusable win themes
    pricing_philosophy = models.TextField()                 # Aggressive, value-based, etc.
    teaming_strategy = models.TextField()                   # Prime vs sub, preferred partners

    # Capacity constraints
    max_concurrent_proposals = models.IntegerField(default=5)
    available_key_personnel = models.JSONField(default=list)
    clearance_capacity = models.JSONField(default=dict)     # TS/SCI slots, Secret, etc.

    # Embedding for semantic matching
    strategy_embedding = VectorField(dimensions=1536)

class StrategicGoal(models.Model):
    """Quantified strategic objectives that drive agent behavior"""
    strategy = models.ForeignKey(CompanyStrategy, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    category = models.CharField(choices=[
        ('revenue', 'Revenue Growth'),
        ('market_entry', 'New Market Entry'),
        ('market_share', 'Market Share Defense'),
        ('capability', 'Capability Building'),
        ('relationship', 'Client Relationship'),
        ('portfolio', 'Portfolio Balance'),
        ('profitability', 'Profitability'),
    ])
    metric = models.CharField(max_length=100)
    current_value = models.FloatField()
    target_value = models.FloatField()
    deadline = models.DateField()
    weight = models.FloatField(default=1.0)    # Priority among goals
    status = models.CharField(choices=[('on_track','On Track'),('at_risk','At Risk'),('behind','Behind')])

class PortfolioSnapshot(models.Model):
    """Periodic snapshot of pipeline portfolio health"""
    snapshot_date = models.DateField()
    active_deals = models.IntegerField()
    total_pipeline_value = models.DecimalField(max_digits=15, decimal_places=2)
    weighted_pipeline = models.DecimalField(max_digits=15, decimal_places=2)
    deals_by_agency = models.JSONField()
    deals_by_domain = models.JSONField()
    deals_by_stage = models.JSONField()
    deals_by_size = models.JSONField()
    capacity_utilization = models.FloatField()     # % of available team engaged
    concentration_risk = models.JSONField()         # Over-reliance on single client/domain
    strategic_alignment_score = models.FloatField() # Overall portfolio-strategy fit
    ai_recommendations = models.JSONField()         # Strategy agent's recommended actions
```

### 6A.2 Strategy Agent Capabilities

```python
class StrategyAgent:
    """
    Company AI Strategy Agent — the strategic brain of the platform.
    Influences EVERY bid decision and shapes the entire pipeline.
    """

    # ── Strategic Scoring (runs on every opportunity) ──────────────
    def compute_strategic_score(self, opportunity, strategy) -> StrategicScore:
        """
        Score an opportunity against the company strategy.
        This score ADDS to the technical fit score to create
        a composite 'pursue score'.

        Factors:
        - Agency alignment (is this a target agency?)
        - Domain alignment (does this grow a target capability?)
        - Growth market bonus (extra weight for break-in markets)
        - Portfolio balance (do we need more deals in this area?)
        - Revenue target contribution (deal size vs remaining target)
        - Capacity fit (do we have people for this?)
        - Strategic relationship value (gateway deal for bigger wins?)
        - Competitive positioning (can we differentiate here?)
        """

    # ── Bid/No-Bid Influence ───────────────────────────────────────
    def generate_bid_recommendation(self, deal, strategy) -> BidRecommendation:
        """
        Generates a strategic bid/no-bid recommendation
        that's presented alongside the fit score at the HITL gate.

        Returns:
        - recommendation: BID / NO-BID / CONDITIONAL_BID
        - strategic_rationale: "This deal opens DoD AI market..."
        - opportunity_cost: "Bidding this blocks 2 other pursuits..."
        - portfolio_impact: "Improves agency diversification by 15%..."
        - resource_impact: "Requires 3 key personnel for 4 months..."
        - risk_assessment: strategic risks of bidding / not bidding
        """

    # ── Portfolio Optimization ─────────────────────────────────────
    def analyze_portfolio(self, all_active_deals, strategy) -> PortfolioAnalysis:
        """
        Weekly analysis of the entire pipeline against strategy.

        Outputs:
        - Portfolio balance scorecard (by agency, domain, size, stage)
        - Concentration risk warnings
        - Gap analysis (target areas with no active pursuits)
        - Capacity forecast (team utilization by month)
        - Revenue projection vs target
        - Recommended actions (pursue more in X, deprioritize Y)
        """

    # ── Win Theme Generation ───────────────────────────────────────
    def generate_win_themes(self, deal, strategy) -> list[WinTheme]:
        """
        Generate deal-specific win themes aligned with company strategy.
        These flow into proposal writing and pricing positioning.
        """

    # ── Competitive Intelligence ───────────────────────────────────
    def assess_competitive_landscape(self, opportunity) -> CompetitiveAssessment:
        """
        Analyze likely competitors, incumbent advantages,
        and recommend positioning strategy.
        Uses historical data from won/lost deals + public info.
        """

    # ── Strategy Evolution ─────────────────────────────────────────
    def recommend_strategy_updates(self, outcomes, portfolio) -> list[StrategyUpdate]:
        """
        Based on win/loss patterns, market trends, and portfolio
        performance, recommend updates to the company strategy.
        Presented to executives at HITL gate (quarterly review).
        """
```

### 6A.3 Strategy Agent Integration Points

```
Every Bid/No-Bid Gate:
  ┌─────────────────────┐
  │ Technical Fit Score  │ ← Opportunity Scout
  │ Strategic Score      │ ← Strategy Agent
  │ Composite Score      │ ← Weighted combination
  │ Bid Recommendation   │ ← Strategy Agent
  │ Portfolio Impact     │ ← Strategy Agent
  │ Resource Availability│ ← Strategy Agent
  └──────────┬──────────┘
             │
        [HITL GATE]
        Human decides
             │
  ┌──────────┴──────────┐
  │ Decision + rationale │
  │ → feeds back to      │
  │   strategy learning  │
  └─────────────────────┘

Weekly Portfolio Review (automated):
  Strategy Agent → Portfolio Analysis → Dashboard
  → Alerts if portfolio drifts from strategy
  → Recommends opportunity hunting priorities

Quarterly Strategy Review (HITL):
  Strategy Agent → Strategy Update Recommendations
  → Executive review + approval
  → Updated strategy → influences all future scoring
```

### 6A.4 LangGraph Strategy Graph

```python
class StrategyGraphState(TypedDict):
    opportunity: dict
    company_strategy: dict
    active_portfolio: list
    team_capacity: dict
    historical_outcomes: list
    strategic_score: float
    bid_recommendation: dict
    win_themes: list
    competitive_assessment: dict

strategy_graph = StateGraph(StrategyGraphState)
strategy_graph.add_node("load_strategy", load_current_strategy)
strategy_graph.add_node("assess_alignment", assess_strategic_alignment)
strategy_graph.add_node("analyze_portfolio_impact", analyze_portfolio_impact)
strategy_graph.add_node("check_capacity", check_resource_capacity)
strategy_graph.add_node("assess_competition", assess_competitive_landscape)
strategy_graph.add_node("generate_recommendation", generate_bid_recommendation)
strategy_graph.add_node("generate_win_themes", generate_win_themes)

strategy_graph.add_edge("load_strategy", "assess_alignment")
strategy_graph.add_edge("assess_alignment", "analyze_portfolio_impact")
strategy_graph.add_edge("analyze_portfolio_impact", "check_capacity")
strategy_graph.add_edge("check_capacity", "assess_competition")
strategy_graph.add_edge("assess_competition", "generate_recommendation")
strategy_graph.add_edge("generate_recommendation", "generate_win_themes")
strategy_graph.add_edge("generate_win_themes", END)
```

---

## 7. Phase 5 — Past Performance Vault

### 7.1 Past Performance Data Model

```python
class PastPerformance(models.Model):
    project_name = models.CharField(max_length=255)
    contract_number = models.CharField(max_length=100)
    client_agency = models.CharField(max_length=255)
    client_poc = models.JSONField(default=dict)  # name, title, phone, email
    period_of_performance = models.JSONField()     # start, end
    contract_value = models.DecimalField(max_digits=15, decimal_places=2)
    contract_type = models.CharField(max_length=50)  # FFP, T&M, CPFF, etc.

    # Categorization for matching
    naics_codes = models.JSONField(default=list)
    psc_codes = models.JSONField(default=list)
    technology_areas = models.JSONField(default=list)  # AI/ML, Cloud, Cyber, etc.
    domains = models.JSONField(default=list)            # Healthcare, Defense, etc.

    # Performance metrics
    schedule_rating = models.CharField(max_length=20)   # Exceptional, Very Good, etc.
    cost_rating = models.CharField(max_length=20)
    quality_rating = models.CharField(max_length=20)
    management_rating = models.CharField(max_length=20)

    # Narrative (for proposal reuse)
    description = models.TextField()
    relevance_narrative = models.TextField()
    key_accomplishments = models.JSONField(default=list)
    lessons_learned = models.JSONField(default=list)

    # Vector embedding for RAG retrieval
    embedding = VectorField(dimensions=1536)
```

### 7.2 RAG-Powered Past Performance Matching

- When an opportunity is qualified, the AI:
  1. Embeds the RFP requirements
  2. Searches past performance vault by vector similarity
  3. Ranks by relevance + recency + rating quality
  4. Generates justification narratives
  5. Auto-populates past performance volume draft

---

## 8. Phase 6 — Proposal Authoring Studio

### 8.1 Professional Proposal Templates

| Volume | Sections |
|--------|----------|
| **Volume I: Technical** | Executive Summary, Understanding of Requirements, Technical Approach, AI/ML Solution Architecture, Innovation, Risk Mitigation |
| **Volume II: Management** | Management Approach, Organizational Chart, Key Personnel, Staffing Plan, Quality Assurance, Transition Plan |
| **Volume III: Past Performance** | Relevant Experience (3-5 projects), Performance Metrics, Client References |
| **Volume IV: Pricing** | Price Summary, Basis of Estimate, Rate Schedule, Cost Narrative |
| **Volume V: Administrative** | Compliance Matrix, Certifications, Required Forms, Representations |

### 8.2 AI Section Generation

For each section, the AI:
1. Reads RFP requirements (from compliance matrix)
2. Retrieves relevant past performance & knowledge (RAG)
3. Applies company capability statement context
4. Generates section draft with proper formatting
5. Includes win themes & discriminators
6. Flags areas needing human input
7. Generates architectural diagrams descriptions (for solution sections)

### 8.3 Fully Autonomous AI Solutions Architect

> **This is the crown jewel of the platform.** A multimodal, RAG-powered, fully autonomous Solutions Architect agent that can produce complete, professional, real-world technical solutions for any proposal or RFP. It uses YOUR knowledge base — your reference architectures, best practices, technical documents, images, diagrams, and design patterns — combined with generative AI to produce proposal-ready technical volumes.

#### 8.3.1 Multimodal Knowledge Vault

The SA agent is powered by a comprehensive knowledge vault that you populate with everything your solutions team knows:

```python
class KnowledgeVault(models.Model):
    """
    Central multimodal knowledge repository.
    Upload EVERYTHING: reference architectures, whitepapers, technical docs,
    architecture diagrams (images), design patterns, best practices,
    framework comparisons, security standards, compliance guides, etc.
    """
    title = models.CharField(max_length=500)
    category = models.CharField(choices=[
        ('reference_architecture', 'Reference Architecture'),
        ('design_pattern', 'Design Pattern'),
        ('best_practice', 'Best Practice / Standard'),
        ('technical_whitepaper', 'Technical Whitepaper'),
        ('framework_guide', 'Framework / Library Guide'),
        ('architecture_diagram', 'Architecture Diagram (Image)'),
        ('solution_template', 'Solution Template'),
        ('security_standard', 'Security Standard / Framework'),
        ('compliance_guide', 'Compliance / Regulatory Guide'),
        ('case_study', 'Case Study / Lessons Learned'),
        ('technology_comparison', 'Technology Comparison'),
        ('infrastructure_pattern', 'Infrastructure / Cloud Pattern'),
        ('ai_ml_pattern', 'AI/ML Architecture Pattern'),
        ('agentic_pattern', 'Agentic AI Design Pattern'),
        ('integration_pattern', 'Integration / API Pattern'),
        ('data_architecture', 'Data Architecture Pattern'),
        ('devops_pattern', 'DevOps / CI-CD Pattern'),
        ('pricing_reference', 'Pricing / Estimation Reference'),
        ('proposal_example', 'Past Winning Proposal Section'),
        ('other', 'Other Knowledge Document'),
    ])

    # Content — supports multimodal
    content_type = models.CharField(choices=[
        ('document', 'Document (PDF/DOCX/MD)'),
        ('image', 'Image (PNG/JPG/SVG/Visio)'),
        ('diagram', 'Architecture Diagram'),
        ('spreadsheet', 'Spreadsheet (Excel/CSV)'),
        ('presentation', 'Presentation (PPTX)'),
        ('code', 'Code Sample / Repository'),
        ('url', 'External URL / Reference'),
    ])
    file = models.FileField(upload_to='knowledge_vault/', null=True)
    raw_text = models.TextField(blank=True)                 # Extracted text
    image_description = models.TextField(blank=True)        # AI-generated description of images/diagrams

    # Metadata
    technology_tags = models.JSONField(default=list)        # ["LangGraph", "Kubernetes", "RAG"]
    domain_tags = models.JSONField(default=list)            # ["Healthcare", "Defense", "Finance"]
    applicable_naics = models.JSONField(default=list)
    author = models.CharField(max_length=255, blank=True)
    source = models.CharField(max_length=500, blank=True)
    date_created = models.DateField(null=True)
    quality_score = models.FloatField(default=0.0)          # Usage-weighted quality
    usage_count = models.IntegerField(default=0)            # How often retrieved

    # Vector embeddings (multiple per document for chunked retrieval)
    # Stored in KnowledgeChunk model below

class KnowledgeChunk(models.Model):
    """
    Chunked + embedded pieces of knowledge vault items.
    Supports text AND image embeddings for multimodal RAG.
    """
    vault_item = models.ForeignKey(KnowledgeVault, on_delete=models.CASCADE, related_name='chunks')
    chunk_index = models.IntegerField()
    chunk_type = models.CharField(choices=[
        ('text', 'Text Chunk'),
        ('image', 'Image / Diagram'),
        ('table', 'Table / Structured Data'),
        ('code', 'Code Block'),
    ])
    content = models.TextField()                            # Text content or image description
    image_file = models.FileField(null=True, blank=True)    # Original image if chunk_type=image
    embedding = VectorField(dimensions=1536)                # Text embedding (OpenAI/Anthropic)
    image_embedding = VectorField(dimensions=512, null=True) # CLIP embedding for images
    metadata = models.JSONField(default=dict)               # Section headers, page numbers, etc.
```

#### 8.3.2 Solutioning Frameworks Library

The SA agent uses established architecture frameworks and solutioning methodologies:

```python
SOLUTIONING_FRAMEWORKS = {
    # ── Enterprise Architecture Frameworks ─────────────────
    "togaf": {
        "name": "TOGAF Architecture Development Method",
        "phases": ["Architecture Vision", "Business Architecture",
                   "Information Systems Architecture", "Technology Architecture",
                   "Opportunities & Solutions", "Migration Planning"],
        "artifacts": ["Architecture Building Blocks", "Solution Building Blocks",
                      "Architecture Roadmap", "Transition Architectures"],
    },
    "zachman": {
        "name": "Zachman Framework",
        "dimensions": ["What (Data)", "How (Function)", "Where (Network)",
                       "Who (People)", "When (Time)", "Why (Motivation)"],
        "perspectives": ["Executive", "Business Mgmt", "Architect",
                         "Engineer", "Technician", "Enterprise"],
    },

    # ── Solution Architecture Patterns ─────────────────────
    "c4_model": {
        "name": "C4 Model (Context, Container, Component, Code)",
        "levels": [
            "L1: System Context — shows system boundaries + external actors",
            "L2: Container — shows major deployable units (APIs, DBs, UIs)",
            "L3: Component — shows internal structure of each container",
            "L4: Code — class/module level (only for critical sections)",
        ],
    },
    "arc42": {
        "name": "arc42 Architecture Documentation",
        "sections": ["Introduction & Goals", "Constraints", "Context & Scope",
                     "Solution Strategy", "Building Block View", "Runtime View",
                     "Deployment View", "Crosscutting Concepts", "Architecture Decisions",
                     "Quality Requirements", "Risks & Technical Debt"],
    },

    # ── Cloud Well-Architected Frameworks ──────────────────
    "aws_well_architected": {
        "pillars": ["Operational Excellence", "Security", "Reliability",
                    "Performance Efficiency", "Cost Optimization", "Sustainability"],
    },
    "azure_well_architected": {
        "pillars": ["Reliability", "Security", "Cost Optimization",
                    "Operational Excellence", "Performance Efficiency"],
    },

    # ── AI/ML Specific Patterns ────────────────────────────
    "ml_ops": {
        "name": "MLOps Maturity Model",
        "levels": ["L0: No MLOps", "L1: DevOps only", "L2: ML Training Pipeline",
                   "L3: ML Deployment Pipeline", "L4: Full MLOps Automation"],
        "components": ["Data Pipeline", "Feature Store", "Model Training",
                       "Model Registry", "Model Serving", "Monitoring", "Retraining"],
    },
    "agentic_ai_patterns": {
        "name": "Agentic AI Architecture Patterns",
        "patterns": [
            "Single Agent + Tools (ReAct)",
            "Multi-Agent Orchestration (LangGraph)",
            "Hierarchical Agent Teams (Supervisor + Workers)",
            "Agent-to-Agent Protocol (A2A)",
            "Human-in-the-Loop Interrupts",
            "Reflection / Self-Critique Loops",
            "Planning Agent (Plan-and-Execute)",
            "RAG Agent (Retrieve-Augment-Generate)",
            "Code Generation Agent",
            "Multi-Modal Agent (Vision + Text + Code)",
            "Tool-Use Agent (MCP Servers)",
            "Memory-Augmented Agent (Short + Long Term)",
        ],
    },
    "rag_patterns": {
        "name": "RAG Architecture Patterns",
        "patterns": [
            "Naive RAG (embed → retrieve → generate)",
            "Advanced RAG (query rewriting, HyDE, reranking)",
            "Modular RAG (plug-and-play components)",
            "Graph RAG (knowledge graph + vector search)",
            "Agentic RAG (agent decides when/what to retrieve)",
            "Multi-Modal RAG (text + image + table retrieval)",
            "Corrective RAG (CRAG — self-correcting retrieval)",
            "Self-RAG (retrieval-augmented with self-reflection)",
        ],
    },

    # ── Integration Patterns ───────────────────────────────
    "integration_patterns": {
        "patterns": ["API Gateway", "Event-Driven (Pub/Sub)", "CQRS",
                     "Saga Pattern", "Circuit Breaker", "Sidecar",
                     "Service Mesh", "BFF (Backend for Frontend)"],
    },

    # ── Security Frameworks ────────────────────────────────
    "security_frameworks": {
        "patterns": ["Zero Trust Architecture", "NIST 800-53",
                     "FedRAMP", "FISMA", "CMMC", "SOC 2",
                     "Defense in Depth", "Least Privilege"],
    },
}
```

#### 8.3.3 Solution Architect Agent — Full Design

```python
class SolutionArchitectAgent:
    """
    FULLY AUTONOMOUS AI Solutions Architect.

    Given an RFP/opportunity, this agent produces a COMPLETE technical solution
    including architecture, diagrams, technology recommendations, integration
    design, security approach, staffing, and risk mitigation — all drawn from
    YOUR multimodal knowledge vault + generative AI.

    This is NOT a summarizer. It is a real solution architect that:
    1. Analyzes requirements deeply (functional, non-functional, constraints)
    2. Retrieves relevant knowledge (reference architectures, patterns, past solutions)
    3. Synthesizes a novel solution tailored to the specific RFP
    4. Generates actual architecture diagrams (using Mermaid/D2/PlantUML + images)
    5. Produces full technical volume sections ready for proposal insertion
    """

    # ── Phase 1: Requirement Deep Dive ─────────────────────
    def analyze_requirements(self, rfp_requirements, compliance_matrix) -> RequirementAnalysis:
        """
        Deep analysis of ALL RFP requirements:
        - Functional requirements (what the system must do)
        - Non-functional requirements (performance, scalability, availability, security)
        - Technical constraints (language, platform, certifications, clearances)
        - Integration requirements (existing systems, APIs, data sources)
        - Data requirements (volumes, sensitivity, retention)
        - AI/ML specific requirements (model accuracy, explainability, bias)
        - Compliance requirements (FedRAMP, FISMA, 508, NIST, CMMC)
        - Delivery constraints (timeline, phasing, milestones)

        Outputs a structured RequirementAnalysis with:
        - Categorized requirements
        - Complexity assessment per area
        - Risk flags (conflicting requirements, impossible constraints)
        - Key design decisions that need to be made
        """

    # ── Phase 2: Knowledge Retrieval (Multimodal RAG) ──────
    def retrieve_relevant_knowledge(self, requirement_analysis) -> KnowledgeBundle:
        """
        Multimodal RAG retrieval from your Knowledge Vault:

        1. Text retrieval:
           - Query: each requirement cluster → vector search → top-k chunks
           - Reranking: cross-encoder reranking for precision
           - Sources: reference architectures, best practices, past solutions

        2. Image/Diagram retrieval:
           - Query: requirement descriptions → CLIP embeddings → similar diagrams
           - Returns: relevant architecture diagrams, infrastructure patterns
           - AI describes each image for context injection

        3. Code/Template retrieval:
           - Query: technology stack requirements → matching code samples
           - Returns: implementation patterns, config templates

        4. Past Solution retrieval:
           - Query: similar past winning proposals' technical sections
           - Returns: proven solution approaches from your vault

        Returns KnowledgeBundle with all retrieved artifacts organized by topic.
        """

    # ── Phase 3: Solution Synthesis ────────────────────────
    def synthesize_solution(self, requirements, knowledge, strategy_context) -> TechnicalSolution:
        """
        The core solutioning engine. Uses retrieved knowledge + generative AI
        to produce a NOVEL, TAILORED solution.

        Uses selected solutioning frameworks (C4, TOGAF, arc42, etc.) based
        on the RFP's expectations and evaluation criteria.

        Generates:
        1. Solution Overview & Vision
        2. Architecture Approach (which framework, which patterns)
        3. System Context (C4 L1 — external actors, system boundaries)
        4. Container Architecture (C4 L2 — services, databases, APIs)
        5. Component Design (C4 L3 — internal structure of key containers)
        6. Technology Stack Selection (with justification per choice)
        7. Data Architecture (data flow, storage, ETL, analytics)
        8. AI/ML Architecture (if applicable — models, training, serving)
        9. Agentic Architecture (if applicable — agents, tools, orchestration)
        10. Integration Architecture (APIs, events, external systems)
        11. Security Architecture (Zero Trust, encryption, IAM, compliance)
        12. Infrastructure & Deployment (cloud, containers, CI/CD)
        13. Scalability & Performance Design
        14. Disaster Recovery & Business Continuity
        15. Migration & Transition Plan (if replacing existing system)
        16. Innovation Elements (differentiators, novel approaches)
        17. Risk Register with Mitigations
        """

    # ── Phase 4: Diagram Generation ────────────────────────
    def generate_diagrams(self, solution) -> list[ArchitectureDiagram]:
        """
        Generates ACTUAL architecture diagrams — not just descriptions.

        Methods (in priority order):
        1. Mermaid.js diagrams (rendered to SVG/PNG)
           - System context, container, sequence, flowcharts
        2. D2 diagrams (for more complex architectural views)
           - Infrastructure, network, deployment views
        3. PlantUML (for UML-specific needs)
           - Component, class, activity, state diagrams
        4. AI Image Generation (for custom visuals)
           - Generates prompt → renders via image model
           - For high-level conceptual diagrams
        5. Template-based (from Knowledge Vault)
           - Retrieves similar diagrams from vault
           - Modifies/annotates for current solution

        Standard diagram set per proposal:
        ┌─────────────────────────────────────────────────────────┐
        │ 1.  Solution Overview Diagram (conceptual)             │
        │ 2.  System Context Diagram (C4 L1)                     │
        │ 3.  Container Architecture Diagram (C4 L2)             │
        │ 4.  Component Diagrams (C4 L3, for 2-3 key services)   │
        │ 5.  Data Flow Diagram                                  │
        │ 6.  AI/ML Pipeline Architecture (if applicable)        │
        │ 7.  Agentic System Architecture (if applicable)        │
        │ 8.  Security Architecture Diagram                      │
        │ 9.  Infrastructure / Deployment Diagram                │
        │ 10. Integration / API Architecture Diagram             │
        │ 11. Network Topology Diagram                           │
        │ 12. CI/CD Pipeline Diagram                             │
        │ 13. Disaster Recovery Architecture                     │
        │ 14. Migration/Transition Roadmap                       │
        └─────────────────────────────────────────────────────────┘
        """

    # ── Phase 5: Technical Volume Generation ───────────────
    def generate_technical_volume(self, solution, diagrams, rfp_format) -> TechnicalVolume:
        """
        Produces the COMPLETE Technical Volume (Volume I) for the proposal.

        Adapts to RFP-specified format (Section L/M instructions) while
        ensuring every requirement is addressed.

        Each section includes:
        - Professional narrative (proposal-ready language)
        - Relevant diagrams (embedded in correct locations)
        - Requirement traceability (maps to compliance matrix)
        - Win themes woven throughout
        - Discriminators highlighted
        - Past performance references where relevant

        Sections generated:
        1.  Executive Technical Summary
        2.  Understanding of Requirements (paraphrased, shows deep understanding)
        3.  Technical Approach & Methodology
        4.  System Architecture & Design
        5.  AI/ML Solution (models, training, inference, monitoring)
        6.  Agentic AI Design (agents, orchestration, HITL, safety)
        7.  Data Management & Analytics
        8.  Integration Strategy
        9.  Security & Compliance Approach
        10. Infrastructure & Cloud Strategy
        11. DevOps & Continuous Delivery
        12. Scalability & Performance Engineering
        13. Innovation & Emerging Technology
        14. Risk Identification & Mitigation
        15. Technology Roadmap & Future Enhancements
        """

    # ── Phase 6: Solution Validation ───────────────────────
    def validate_solution(self, solution, requirements) -> ValidationReport:
        """
        Self-critique loop: validates the generated solution against:
        1. Every RFP requirement (are they all addressed?)
        2. Evaluation criteria (are high-weight items emphasized?)
        3. Technical feasibility (are the claims realistic?)
        4. Consistency (do diagrams match narrative?)
        5. Compliance (does it meet all regulatory requirements?)
        6. Competitiveness (does it include strong differentiators?)
        7. Cost alignment (can this be built within budget?)

        Returns ValidationReport with issues + auto-fixes.
        """
```

#### 8.3.4 Solution Architect LangGraph

```python
class SolutionArchitectState(TypedDict):
    rfp_requirements: list
    compliance_matrix: list
    company_strategy: dict
    knowledge_bundle: dict          # Retrieved from multimodal RAG
    requirement_analysis: dict
    selected_frameworks: list       # Which solutioning frameworks to use
    technical_solution: dict
    diagrams: list                  # Generated architecture diagrams
    technical_volume: dict          # Full proposal-ready volume
    validation_report: dict
    iteration_count: int            # For self-critique loops

sa_graph = StateGraph(SolutionArchitectState)

# Main flow
sa_graph.add_node("analyze_requirements", deep_requirement_analysis)
sa_graph.add_node("select_frameworks", select_solutioning_frameworks)
sa_graph.add_node("retrieve_knowledge", multimodal_rag_retrieval)
sa_graph.add_node("synthesize_solution", synthesize_technical_solution)
sa_graph.add_node("generate_diagrams", generate_architecture_diagrams)
sa_graph.add_node("generate_volume", generate_technical_volume)
sa_graph.add_node("validate", validate_and_critique)
sa_graph.add_node("refine", refine_solution)          # If validation finds issues
sa_graph.add_node("human_review", interrupt_for_review)  # HITL gate

# Edges
sa_graph.add_edge("analyze_requirements", "select_frameworks")
sa_graph.add_edge("select_frameworks", "retrieve_knowledge")
sa_graph.add_edge("retrieve_knowledge", "synthesize_solution")
sa_graph.add_edge("synthesize_solution", "generate_diagrams")
sa_graph.add_edge("generate_diagrams", "generate_volume")
sa_graph.add_edge("generate_volume", "validate")

# Conditional: if validation passes → human review; if fails → refine → re-validate
sa_graph.add_conditional_edges("validate", route_validation)
sa_graph.add_edge("refine", "generate_diagrams")  # Re-generate after refinement
sa_graph.add_edge("human_review", END)
```

#### 8.3.5 MCP Tool Servers for Solution Architect

```python
# New MCP servers specifically for the SA agent

# ── Knowledge Vault Search ─────────────────────────────────
@knowledge_server.tool("search_reference_architectures")
async def search_architectures(query: str, technology_tags: list[str],
                               domain: str, top_k: int = 10):
    """Search knowledge vault for relevant reference architectures"""

@knowledge_server.tool("search_diagrams")
async def search_diagrams(query: str, diagram_type: str, top_k: int = 5):
    """Search knowledge vault for relevant architecture diagrams (multimodal)"""

@knowledge_server.tool("search_best_practices")
async def search_practices(technology: str, context: str, top_k: int = 10):
    """Search for best practices and design patterns"""

@knowledge_server.tool("search_past_solutions")
async def search_past_solutions(requirement_summary: str, domain: str, top_k: int = 5):
    """Search past winning proposal technical sections"""

# ── Diagram Generation ─────────────────────────────────────
@diagram_server.tool("generate_mermaid_diagram")
async def gen_mermaid(diagram_type: str, components: dict, title: str) -> str:
    """Generate Mermaid.js diagram code and render to SVG/PNG"""

@diagram_server.tool("generate_d2_diagram")
async def gen_d2(diagram_spec: dict, title: str) -> str:
    """Generate D2 diagram code and render to SVG/PNG"""

@diagram_server.tool("generate_plantuml_diagram")
async def gen_plantuml(uml_type: str, spec: dict) -> str:
    """Generate PlantUML diagram and render"""

@diagram_server.tool("annotate_existing_diagram")
async def annotate(source_image_path: str, annotations: list[dict]) -> str:
    """Take an existing diagram from vault and add annotations/modifications"""

# ── Technical Writing ──────────────────────────────────────
@writing_server.tool("generate_section_with_traceability")
async def gen_section(section_name: str, content_outline: dict,
                      mapped_requirements: list[str], win_themes: list[str]):
    """Generate a proposal section with requirement traceability matrix"""

@writing_server.tool("embed_diagrams_in_docx")
async def embed_diagrams(docx_template: str, diagram_placements: list[dict]):
    """Insert generated diagrams into DOCX template at specified locations"""
```

#### 8.3.6 What YOU Upload to the Knowledge Vault

To make the SA agent truly autonomous and expert-level, you populate the Knowledge Vault with:

```
YOUR KNOWLEDGE BASE (upload all of this):
├── Reference Architectures/
│   ├── AI/ML platform architecture (your standard design)
│   ├── Agentic AI system architecture
│   ├── RAG system architecture
│   ├── Data lake/mesh architecture
│   ├── Cloud-native microservices architecture
│   ├── Zero Trust security architecture
│   ├── MLOps pipeline architecture
│   └── ... any architecture you've designed or follow
│
├── Design Patterns/
│   ├── Agentic AI patterns (LangGraph, CrewAI, AutoGen patterns)
│   ├── RAG patterns (naive, advanced, modular, graph, agentic)
│   ├── MCP tool server patterns
│   ├── A2A agent communication patterns
│   ├── HITL interrupt patterns
│   ├── Microservices patterns
│   ├── Event-driven patterns
│   └── ... all patterns you use
│
├── Best Practices/
│   ├── Your company's engineering standards
│   ├── Code review guidelines
│   ├── Security best practices
│   ├── Performance optimization guides
│   ├── Testing strategies
│   └── ... your internal standards
│
├── Architecture Diagrams (IMAGES)/
│   ├── Past solution architecture diagrams (.png, .jpg, .svg, .vsdx)
│   ├── Network topology diagrams
│   ├── Data flow diagrams
│   ├── Infrastructure diagrams
│   └── ... ALL your visual architecture assets
│
├── Technical Documents/
│   ├── Whitepapers you've written
│   ├── Technical reports
│   ├── Framework evaluations
│   ├── Technology comparison matrices
│   └── ... all technical writing
│
├── Past Winning Proposals/
│   ├── Technical volumes from won proposals (redacted if needed)
│   ├── Management approach sections
│   ├── Staffing plans
│   └── ... proven proposal content
│
├── Compliance & Standards/
│   ├── NIST 800-53 control mappings
│   ├── FedRAMP requirements
│   ├── CMMC compliance guides
│   ├── Section 508 accessibility
│   └── ... regulatory knowledge
│
└── Innovation & Research/
    ├── Emerging technology assessments
    ├── AI safety and ethics frameworks
    ├── Industry trend analyses
    └── ... forward-looking material
```

### 8.4 Review Workflow

```
Writer → Pink Team → Update → Red Team → Update → Gold Team → Final → Submit
```

| Review | Purpose | Participants |
|--------|---------|-------------|
| **Pink Team** | Completeness & compliance check | Internal team |
| **Red Team** | Evaluate as if you're the government evaluator | Senior reviewers |
| **Gold Team** | Executive final review + pricing approval | Leadership |

Each review produces:
- Scored evaluation (mimics government scoring)
- Comments per section
- Must-fix items
- AI auto-incorporates feedback (with human approval)

---

## 9. Phase 7 — Pricing & Staffing Engine

### 9.1 Rate Card Management

```python
class RateCard(models.Model):
    labor_category = models.CharField(max_length=255)   # e.g., "Senior AI Engineer"
    gsa_equivalent = models.CharField(max_length=255, blank=True)
    base_rate = models.DecimalField(max_digits=10, decimal_places=2)
    overhead_rate = models.FloatField()      # OH%
    gna_rate = models.FloatField()           # G&A%
    fringe_rate = models.FloatField()        # Fringe%
    profit_rate = models.FloatField()        # Fee%
    fully_loaded_rate = models.DecimalField(max_digits=10, decimal_places=2)
    effective_date = models.DateField()
    contract_vehicle = models.CharField(max_length=100, blank=True)
```

### 9.2 Pricing Scenario Engine

```python
class PricingScenario(models.Model):
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)    # "Aggressive", "Moderate", "Conservative"

    # Staffing mix
    labor_mix = models.JSONField()   # [{category, hours, rate, total}, ...]

    # Cost elements
    direct_labor = models.DecimalField(max_digits=15, decimal_places=2)
    other_direct_costs = models.DecimalField(max_digits=15, decimal_places=2)
    subcontractor_costs = models.DecimalField(max_digits=15, decimal_places=2)
    travel = models.DecimalField(max_digits=15, decimal_places=2)
    overhead = models.DecimalField(max_digits=15, decimal_places=2)
    gna = models.DecimalField(max_digits=15, decimal_places=2)
    profit = models.DecimalField(max_digits=15, decimal_places=2)
    total_price = models.DecimalField(max_digits=15, decimal_places=2)

    # AI analysis
    win_probability_estimate = models.FloatField()
    margin_estimate = models.FloatField()
    risk_assessment = models.TextField()
    ai_recommendation = models.TextField()

    is_selected = models.BooleanField(default=False)
    approved_by = models.ForeignKey(User, null=True)
    approved_at = models.DateTimeField(null=True)
```

### 9.3 Price-to-Win Analysis

- AI generates 3-7 pricing scenarios
- For each: estimates P(win) vs margin tradeoff
- Presents sensitivity analysis to pricing manager
- **HITL required**: human selects final pricing scenario
- Historical price data improves estimates over time

---

## 10. Phase 8 — Contract Management

### 10.1 Contract Templates

- Master Service Agreement (MSA)
- Statement of Work (SOW)
- Task Order
- Modification
- Non-Disclosure Agreement (NDA)
- Teaming Agreement
- Subcontractor Agreement

### 10.2 Clause Library

```python
class ContractClause(models.Model):
    title = models.CharField(max_length=255)
    clause_number = models.CharField(max_length=50)   # FAR/DFARS reference
    category = models.CharField(max_length=50)         # IP, liability, termination, etc.
    text = models.TextField()
    risk_level = models.CharField(choices=[('low','Low'),('medium','Medium'),('high','High')])
    ai_risk_notes = models.TextField(blank=True)
    requires_review = models.BooleanField(default=False)
    standard_response = models.TextField(blank=True)   # Pre-approved language
```

### 10.3 Contract Workspace

- AI drafts contract from template + deal specifics
- Clause risk scanner highlights dangerous terms
- Redline tracking with version history
- **HITL required** for all contract approvals
- Integration with e-signature (future: DocuSign API)

---

## 11. Phase 9 — AI Agent Orchestration (LangGraph + MCP + A2A)

### 11.1 Agent Architecture

```
ai_orchestrator/
├── Dockerfile
├── requirements.txt
├── src/
│   ├── main.py                    # FastAPI app for AI endpoints
│   │   ├── agents/
│   │   │   ├── orchestrator.py        # Master agent (LangGraph graph)
│   │   │   ├── strategy_agent.py      # Company AI Strategy Agent (NEW)
│   │   │   ├── opportunity_scout.py   # Scans & scores opportunities
│   │   │   ├── rfp_parser.py          # Extracts RFP requirements
│   │   │   ├── compliance_agent.py    # Builds compliance matrix
│   │   │   ├── past_perf_agent.py     # RAG retrieval of past performance
│   │   │   ├── solution_architect.py  # FULL Autonomous SA Agent (UPGRADED)
│   │   │   ├── proposal_writer.py     # Section-by-section authoring
│   │   │   ├── pricing_agent.py       # Scenario generation & analysis
│   │   │   ├── qa_agent.py            # Quality & consistency checker
│   │   │   ├── submission_agent.py    # Package & checklist builder
│   │   │   ├── contract_agent.py      # Contract drafting & risk scan
│   │   │   ├── communication_agent.py # Emails, Q&A, narratives
│   │   │   └── learning_agent.py      # Policy updates from outcomes
│   │   ├── mcp_servers/
│   │   │   ├── samgov_tools.py        # SAM.gov API tools
│   │   │   ├── document_tools.py      # PDF/DOCX parse, chunk, embed
│   │   │   ├── vector_search.py       # pgvector RAG search (text)
│   │   │   ├── knowledge_vault_tools.py # Multimodal knowledge vault search (NEW)
│   │   │   ├── diagram_tools.py       # Mermaid/D2/PlantUML generation (NEW)
│   │   │   ├── image_search_tools.py  # CLIP-based image/diagram search (NEW)
│   │   │   ├── template_render.py     # DOCX/PDF generation
│   │   │   ├── email_tools.py         # Email drafting & sending
│   │   │   ├── workflow_tools.py      # Stage transitions & tasks
│   │   │   └── pricing_tools.py       # Rate card & scenario calc
│   │   ├── graphs/
│   │   │   ├── daily_scan_graph.py    # Daily opportunity pipeline
│   │   │   ├── strategy_graph.py      # Strategic scoring & portfolio analysis (NEW)
│   │   │   ├── solution_arch_graph.py # Full SA agent pipeline (NEW)
│   │   │   ├── proposal_graph.py      # Full proposal generation flow
│   │   │   ├── pricing_graph.py       # Pricing analysis flow
│   │   │   └── contract_graph.py      # Contract generation flow
│   ├── rag/
│   │   ├── embeddings.py          # Embedding generation
│   │   ├── retriever.py           # Vector search + reranking
│   │   └── chunker.py             # Document chunking strategies
│   └── learning/
│       ├── reward_tracker.py      # Outcome tracking
│       ├── policy_updater.py      # Weight/threshold adjustment
│       └── bandit.py              # Contextual bandit for ranking
```

### 11.2 LangGraph Orchestration Pattern

```python
# Example: Daily Opportunity Scan Graph
from langgraph.graph import StateGraph, END

class OpportunityScanState(TypedDict):
    raw_opportunities: list
    normalized: list
    scored: list
    top_10: list
    notifications_sent: bool

graph = StateGraph(OpportunityScanState)
graph.add_node("fetch_samgov", fetch_samgov_opportunities)
graph.add_node("fetch_labs", fetch_lab_opportunities)
graph.add_node("normalize", normalize_opportunities)
graph.add_node("score", score_and_rank)
graph.add_node("publish", publish_top_10)

graph.add_edge("fetch_samgov", "normalize")
graph.add_edge("fetch_labs", "normalize")
graph.add_edge("normalize", "score")
graph.add_edge("score", "publish")
graph.add_edge("publish", END)
```

### 11.3 HITL Integration in LangGraph

```python
# Human-in-the-loop gates using LangGraph interrupts
from langgraph.checkpoint.postgres import PostgresSaver

graph.add_node("generate_proposal", generate_proposal_draft)
graph.add_node("human_review", interrupt_for_review)  # Pauses here
graph.add_node("incorporate_feedback", incorporate_feedback)
graph.add_node("finalize", finalize_proposal)

# After generate_proposal, always go to human_review
graph.add_edge("generate_proposal", "human_review")
# After human approval, proceed; after rejection, loop back
graph.add_conditional_edges("human_review", route_approval)
```

### 11.4 A2A (Agent-to-Agent) Events

```python
# Structured events for inter-agent communication
EVENTS = {
    # ── Opportunity & Strategy Events ──────────────────────
    "OpportunityIngested":      {"source": "opportunity_scout", "data": "raw opportunity"},
    "OpportunityScored":        {"source": "opportunity_scout", "data": "scored opportunity"},
    "StrategicScoreComputed":   {"source": "strategy_agent", "data": "strategic alignment score + rationale"},
    "BidRecommendationReady":   {"source": "strategy_agent", "data": "bid/no-bid recommendation"},
    "PortfolioAnalysisReady":   {"source": "strategy_agent", "data": "portfolio health report"},
    "WinThemesGenerated":       {"source": "strategy_agent", "data": "deal-specific win themes"},
    "CompetitiveAssessmentDone": {"source": "strategy_agent", "data": "competitive landscape"},

    # ── RFP & Compliance Events ────────────────────────────
    "RFPParsed":                {"source": "rfp_parser", "data": "extracted requirements"},
    "ComplianceMatrixReady":    {"source": "compliance_agent", "data": "matrix items"},
    "PastPerfMatched":          {"source": "past_perf_agent", "data": "matched projects"},

    # ── Solution Architect Events (NEW) ────────────────────
    "RequirementsAnalyzed":     {"source": "solution_architect", "data": "deep requirement analysis"},
    "KnowledgeRetrieved":       {"source": "solution_architect", "data": "multimodal knowledge bundle"},
    "SolutionSynthesized":      {"source": "solution_architect", "data": "complete technical solution"},
    "DiagramsGenerated":        {"source": "solution_architect", "data": "architecture diagrams (14+)"},
    "TechnicalVolumeReady":     {"source": "solution_architect", "data": "full Volume I draft"},
    "SolutionValidated":        {"source": "solution_architect", "data": "validation report"},

    # ── Proposal & Review Events ───────────────────────────
    "SectionDrafted":           {"source": "proposal_writer", "data": "section content"},
    "PricingReady":             {"source": "pricing_agent", "data": "scenarios"},
    "QAComplete":               {"source": "qa_agent", "data": "issues found"},

    # ── Approval & Submission Events ───────────────────────
    "ApprovalRequested":        {"source": "any agent", "data": "approval request"},
    "ApprovalGranted":          {"source": "human", "data": "decision + feedback"},
    "SubmissionPackaged":       {"source": "submission_agent", "data": "package ready"},
    "OutcomeRecorded":          {"source": "learning_agent", "data": "win/loss + metrics"},
    "StrategyUpdateRecommended": {"source": "learning_agent", "data": "strategy evolution suggestions"},
}
```

### 11.5 MCP Server Pattern

```python
# Each MCP server exposes tools for agents
# Example: SAM.gov MCP Server
from mcp import Server

samgov_server = Server("samgov-tools")

@samgov_server.tool("search_opportunities")
async def search(naics: list[str], keywords: list[str], posted_from: str):
    """Search SAM.gov for matching opportunities"""
    ...

@samgov_server.tool("get_opportunity_details")
async def get_details(notice_id: str):
    """Get full details + attachments for a SAM.gov opportunity"""
    ...

@samgov_server.tool("check_amendments")
async def check_amendments(notice_id: str):
    """Check for new amendments on an opportunity"""
    ...
```

---

## 12. Phase 10 — Learning & Optimization

### 12.1 Feedback Loops

| Signal | Source | Updates |
|--------|--------|---------|
| Bid/No-Bid decisions | Human manager | Scoring model weights |
| Proposal review scores | Pink/Red team | Writing quality model |
| Win/Loss outcomes | Contract awards | All models |
| Price vs award price | FPDS data | Pricing model |
| Time-to-submit | System metrics | Process efficiency |
| Client feedback | CRM/communications | Relationship model |

### 12.2 Policy & Goal Manager

```python
class AIPolicy(models.Model):
    """Governs what the AI can do autonomously vs requiring approval"""
    name = models.CharField(max_length=100)
    description = models.TextField()
    category = models.CharField(choices=[
        ('opportunity', 'Opportunity Scoring'),
        ('proposal', 'Proposal Generation'),
        ('pricing', 'Pricing Decisions'),
        ('submission', 'Submission Actions'),
        ('contract', 'Contract Actions'),
        ('communication', 'External Communications'),
    ])
    autonomous_allowed = models.BooleanField(default=False)
    hitl_required = models.BooleanField(default=True)
    confidence_threshold = models.FloatField(default=0.8)  # Auto-approve above this
    constraints = models.JSONField(default=dict)

class GoalSetting(models.Model):
    """Business goals that drive AI optimization"""
    name = models.CharField(max_length=100)
    metric = models.CharField(max_length=100)     # win_rate, margin, time_to_submit
    target_value = models.FloatField()
    weight = models.FloatField(default=1.0)        # Priority among goals
    direction = models.CharField(choices=[('maximize','Maximize'),('minimize','Minimize')])
```

### 12.3 Reinforcement Learning Strategy

**Safe RL approach (recommendations, not autonomous actions):**

1. **Offline RL**: Train on historical data (bid decisions, outcomes, pricing)
2. **Contextual Bandits**: For ranking and recommendation optimization
3. **Reward Engineering**:
   - `+10` for contract win
   - `+5` for shortlisted
   - `+1` for good review scores
   - `-1` for compliance defects
   - `-5` for missed deadlines
   - `-3` for significantly over/under priced
4. **Human-gated**: RL suggests, human decides; outcome updates policy

---

## 13. Data Model (Complete Entity List)

### Core System
- `User`, `Role`, `Permission`, `Organization`, `Team`
- `UserProfile` (picture, MFA, skills, clearances)
- `AuditLog`, `AITraceLog`
- `Notification`, `NotificationPreference`

### Company Strategy (NEW)
- `CompanyStrategy` (living strategic plan — markets, goals, capacity, differentiators)
- `StrategicGoal` (quantified objectives with targets and deadlines)
- `PortfolioSnapshot` (periodic pipeline health vs strategy)
- `CompetitiveIntelligence` (competitor profiles, win/loss patterns)

### Opportunity Intelligence
- `OpportunitySource` (SAM.gov, labs, etc.)
- `Opportunity` (normalized, with embeddings)
- `OpportunityScore` (fit score + factors + explanation)
- `StrategicScore` (strategy alignment score per opportunity) (NEW)
- `CompanyProfile` (UEI, CAGE, capabilities, embeddings)
- `DailyDigest` (Top 10 daily report)

### Deal Pipeline
- `Deal` (stage, owner, team, timeline)
- `DealStageHistory` (transition log)
- `Task`, `TaskTemplate`, `Checklist`
- `Approval` (type, status, rationale)
- `Comment`, `Activity`

### RFP Workspace
- `RFPDocument` (uploaded files + extracted data)
- `RFPRequirement` (extracted shall/must statements)
- `ComplianceMatrixItem` (requirement → response mapping)
- `Amendment` (version diffs)

### Past Performance
- `PastPerformance` (project + metrics + narrative + embedding)
- `PastPerformanceMatch` (opportunity → past perf relevance)

### Knowledge Vault (NEW — Multimodal RAG)
- `KnowledgeVault` (reference architectures, diagrams, patterns, best practices, images, docs)
- `KnowledgeChunk` (chunked + embedded pieces — text, image, table, code)
- `SolutioningFramework` (TOGAF, C4, arc42, well-architected, agentic patterns, RAG patterns)

### Solution Architect Outputs (NEW)
- `TechnicalSolution` (full synthesized solution per deal)
- `ArchitectureDiagram` (generated Mermaid/D2/PlantUML diagrams + rendered images)
- `RequirementAnalysis` (deep RFP requirement analysis)
- `SolutionValidationReport` (self-critique validation results)

### Proposals
- `Proposal` (deal → proposal, with version history)
- `ProposalTemplate` (volume/section structure)
- `ProposalSection` (per-section content + status)
- `ReviewCycle` (pink/red/gold team)
- `ReviewComment` (per-section feedback)

### Pricing
- `RateCard` (labor categories + rates)
- `PricingScenario` (staffing mix + costs + analysis)
- `PricingApproval` (HITL gate)

### Contracts
- `Contract` (deal → contract, with status)
- `ContractTemplate` (MSA, SOW, etc.)
- `ContractClause` (library + risk levels)
- `ContractVersion` (redline history)

### Communications
- `EmailDraft` (AI-generated, human-approved)
- `ClarificationQuestion` (Q&A submissions)
- `ClientInteraction` (log of all communications)

### AI System
- `AIPolicy` (autonomy rules)
- `GoalSetting` (business objectives)
- `LearningOutcome` (bid results → model updates)
- `AgentExecution` (run history + traces)

---

## 14. File/Folder Structure (Complete)

```
ai-deal-manager/
├── docker-compose.yml
├── docker-compose.override.yml
├── .env.example
├── .gitignore
├── README.md
├── PLAN.md
│
├── nginx/
│   ├── nginx.conf
│   └── ssl/                         # gitignored
│
├── backend/                          # Django
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings/
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   └── apps/
│       ├── __init__.py
│       ├── accounts/
│       │   ├── models.py            # User, UserProfile, Role
│       │   ├── serializers.py
│       │   ├── views.py
│       │   ├── urls.py
│       │   ├── permissions.py       # RBAC permission classes
│       │   ├── mfa.py               # MFA setup/verify
│       │   └── admin.py
│       ├── core/
│       │   ├── models.py            # AuditLog, BaseModel
│       │   ├── middleware.py         # Audit middleware
│       │   ├── utils.py
│       │   └── management/commands/ # Custom mgmt commands
│       ├── opportunities/
│       │   ├── models.py            # Opportunity, Score, CompanyProfile
│       │   ├── serializers.py
│       │   ├── views.py
│       │   ├── urls.py
│       │   ├── services/
│       │   │   ├── samgov_client.py
│       │   │   ├── lab_monitors.py
│       │   │   ├── normalizer.py
│       │   │   ├── scorer.py
│       │   │   └── enricher.py
│       │   └── tasks.py             # Celery tasks
│       ├── deals/
│       │   ├── models.py            # Deal, Task, Approval
│       │   ├── serializers.py
│       │   ├── views.py
│       │   ├── urls.py
│       │   ├── workflow.py          # State machine
│       │   └── tasks.py
│       ├── rfp/
│       │   ├── models.py            # RFPDocument, ComplianceMatrix
│       │   ├── serializers.py
│       │   ├── views.py
│       │   ├── urls.py
│       │   ├── services/
│       │   │   ├── parser.py        # Document extraction
│       │   │   └── diff_tracker.py  # Amendment diffs
│       │   └── tasks.py
│       ├── past_performance/
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── views.py
│       │   ├── urls.py
│       │   └── services/
│       │       └── matcher.py       # RAG matching
│       ├── proposals/
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── views.py
│       │   ├── urls.py
│       │   ├── services/
│       │   │   ├── generator.py     # Section generation
│       │   │   └── reviewer.py      # Review workflow
│       │   ├── templates/           # Proposal DOCX templates
│       │   └── tasks.py
│       ├── pricing/
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── views.py
│       │   ├── urls.py
│       │   └── services/
│       │       ├── scenario_engine.py
│       │       └── price_to_win.py
│       ├── contracts/
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── views.py
│       │   ├── urls.py
│       │   └── services/
│       │       ├── generator.py
│       │       └── clause_scanner.py
│       ├── strategy/                     # Company Strategy (NEW)
│       │   ├── models.py            # CompanyStrategy, StrategicGoal, PortfolioSnapshot
│       │   ├── serializers.py
│       │   ├── views.py
│       │   ├── urls.py
│       │   └── services/
│       │       ├── portfolio_analyzer.py   # Pipeline health vs strategy
│       │       └── competitive_intel.py    # Competitor analysis
│       ├── knowledge_vault/              # Multimodal Knowledge Vault (NEW)
│       │   ├── models.py            # KnowledgeVault, KnowledgeChunk
│       │   ├── serializers.py
│       │   ├── views.py
│       │   ├── urls.py
│       │   ├── services/
│       │   │   ├── ingestion.py     # Upload + chunking + embedding pipeline
│       │   │   ├── multimodal_rag.py # Text + image retrieval
│       │   │   └── image_embedder.py # CLIP embeddings for diagrams/images
│       │   └── tasks.py             # Async embedding generation
│       ├── communications/
│       │   ├── models.py
│       │   ├── serializers.py
│       │   ├── views.py
│       │   └── urls.py
│       ├── policies/
│       │   ├── models.py            # AIPolicy, GoalSetting
│       │   ├── serializers.py
│       │   ├── views.py
│       │   └── urls.py
│       └── analytics/
│           ├── models.py
│           ├── serializers.py
│           ├── views.py
│           └── urls.py
│
├── frontend/                         # React + TypeScript
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js               # or vite.config.ts
│   ├── tailwind.config.js
│   ├── public/
│   └── src/
│       ├── app/                     # Pages/routes
│       │   ├── layout.tsx
│       │   ├── page.tsx             # Dashboard
│       │   ├── login/
│       │   ├── opportunities/
│       │   ├── deals/
│       │   ├── rfp/
│       │   ├── proposals/
│       │   ├── pricing/
│       │   ├── contracts/
│       │   ├── past-performance/
│       │   ├── communications/
│       │   ├── knowledge-vault/      # Knowledge Vault management (NEW)
│       │   ├── strategy/             # Company strategy dashboard (NEW)
│       │   ├── analytics/
│       │   ├── settings/
│       │   └── admin/
│       ├── components/
│       │   ├── ui/                  # Button, Card, Table, etc.
│       │   ├── layout/             # Shell, Sidebar, Topbar
│       │   ├── auth/               # LoginForm, MFASetup, Profile
│       │   ├── dashboard/          # KPI cards, charts
│       │   ├── opportunities/      # OpportunityCard, ScoreBreakdown
│       │   ├── deals/              # KanbanBoard, DealDetail
│       │   ├── rfp/                # ComplianceMatrix, RequirementList
│       │   ├── proposals/          # SectionEditor, ReviewPanel
│       │   ├── pricing/            # ScenarioComparison, RateTable
│       │   ├── contracts/          # ClauseLibrary, RedlineViewer
│       │   ├── ai-workbench/       # AIChat, ActionPanel, TraceViewer
│       │   └── settings/           # PolicyManager, GoalSettings
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   ├── useDeals.ts
│       │   ├── useAI.ts
│       │   └── useWebSocket.ts
│       ├── services/
│       │   ├── api.ts              # Axios/fetch client
│       │   ├── auth.ts
│       │   ├── opportunities.ts
│       │   ├── deals.ts
│       │   ├── proposals.ts
│       │   └── ai.ts
│       ├── store/
│       │   ├── index.ts
│       │   ├── authSlice.ts
│       │   └── dealSlice.ts
│       ├── types/
│       │   ├── opportunity.ts
│       │   ├── deal.ts
│       │   ├── proposal.ts
│       │   └── api.ts
│       └── utils/
│
├── realtime/                         # Node.js WebSocket service
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts
│       ├── handlers/
│       │   ├── notifications.ts
│       │   ├── collaboration.ts
│       │   └── ai-stream.ts
│       └── middleware/
│           └── auth.ts
│
├── ai_orchestrator/                  # LangGraph + Agents
│   ├── Dockerfile
│   ├── requirements.txt
│   └── src/
│       ├── main.py                  # FastAPI app
│       ├── agents/                  # All agent implementations
│       ├── mcp_servers/             # MCP tool servers
│       ├── graphs/                  # LangGraph workflow graphs
│       ├── rag/                     # Embedding + retrieval
│       └── learning/                # RL + policy updates
│
└── scripts/
    ├── seed_data.py                 # Initial data seeding
    ├── setup_dev.sh                 # Dev environment setup
    └── run_tests.sh
```

---

## Implementation Sequence (Build Order)

### Sprint 1-2: Foundation (Phase 1)
- [ ] Docker Compose with all services (Postgres, Redis, MinIO, Nginx)
- [ ] Django project setup with split settings
- [ ] Django accounts app (User, Profile, RBAC roles, MFA)
- [ ] Django core app (AuditLog, BaseModel, middleware)
- [ ] DRF setup with authentication (JWT + Session)
- [ ] React frontend scaffolding (Next.js + Tailwind + shadcn/ui)
- [ ] Login, registration, profile management pages
- [ ] App shell (sidebar navigation, topbar, layout)
- [ ] Node.js realtime service skeleton

### Sprint 3-4: Opportunity Intelligence (Phase 2)
- [ ] SAM.gov API client + Celery task for periodic scanning
- [ ] Opportunity model + normalization pipeline
- [ ] Company profile + capability statement management
- [ ] Fit scoring engine (rule-based v1)
- [ ] Daily Top 10 digest generation
- [ ] Frontend: Opportunity list, detail view, score breakdown
- [ ] Lab procurement page monitors (configurable)

### Sprint 5: Company AI Strategy Agent (Phase 4A — NEW)
- [ ] CompanyStrategy, StrategicGoal, PortfolioSnapshot models
- [ ] Strategy agent: strategic scoring of opportunities
- [ ] Strategy agent: bid/no-bid recommendation engine
- [ ] Strategy agent: portfolio analysis & balance scoring
- [ ] Strategy agent: win theme generation
- [ ] Strategy agent: competitive landscape assessment
- [ ] LangGraph strategy_graph.py (full pipeline)
- [ ] Frontend: Strategy dashboard + portfolio health view
- [ ] Frontend: Strategy settings (target agencies, domains, goals)
- [ ] Integration: strategic score injected into bid/no-bid HITL gate

### Sprint 6-7: Deal Pipeline (Phase 3)
- [ ] Deal model + workflow state machine
- [ ] Task & checklist system with templates
- [ ] Approval system with HITL gates (now includes strategic score)
- [ ] Frontend: Kanban pipeline board
- [ ] Frontend: Deal detail page with timeline
- [ ] Notifications (in-app + email) for stage changes

### Sprint 8-9: RFP & Past Performance (Phase 4-5)
- [ ] RFP document upload + AI extraction
- [ ] Compliance matrix generator
- [ ] Amendment diff tracker
- [ ] Past performance vault (CRUD + embeddings)
- [ ] RAG-powered past performance matching
- [ ] Frontend: RFP workspace with compliance matrix
- [ ] Frontend: Past performance library

### Sprint 10: Multimodal Knowledge Vault (NEW)
- [ ] KnowledgeVault + KnowledgeChunk models
- [ ] Upload pipeline: PDF/DOCX/images/presentations → chunk → embed
- [ ] Text embedding pipeline (OpenAI/Anthropic embeddings → pgvector)
- [ ] Image embedding pipeline (CLIP model → image vectors)
- [ ] Multimodal RAG retriever (text + image + table + code search)
- [ ] MCP tools: knowledge_vault_tools.py, image_search_tools.py
- [ ] Frontend: Knowledge Vault management (upload, browse, tag, search)
- [ ] Seed vault with solutioning frameworks library (TOGAF, C4, arc42, etc.)

### Sprint 11-13: Fully Autonomous AI Solutions Architect + Proposal Studio (Phase 6 — MAJOR UPGRADE)
- [ ] Solution Architect Agent: requirement deep-dive analysis
- [ ] Solution Architect Agent: multimodal knowledge retrieval (RAG)
- [ ] Solution Architect Agent: framework selection (C4, TOGAF, arc42, etc.)
- [ ] Solution Architect Agent: solution synthesis engine (15+ architecture areas)
- [ ] Diagram generation: Mermaid.js diagrams → SVG/PNG rendering
- [ ] Diagram generation: D2 diagrams → SVG/PNG rendering
- [ ] Diagram generation: PlantUML diagrams → rendering
- [ ] MCP tools: diagram_tools.py (generate + render + annotate)
- [ ] Solution Architect Agent: full technical volume generation
- [ ] Solution Architect Agent: self-critique validation loop
- [ ] LangGraph solution_arch_graph.py (full autonomous SA pipeline)
- [ ] Proposal templates (5 volumes)
- [ ] AI section generation (LangGraph proposal graph, using SA output)
- [ ] Review workflow (pink/red/gold team)
- [ ] Frontend: Proposal editor with AI workbench + diagram viewer
- [ ] Frontend: Solution Architect workspace (view generated architectures)
- [ ] Frontend: Review interface with comments
- [ ] DOCX export with embedded diagrams + professional formatting

### Sprint 14: Pricing & Contracts (Phase 7-8)
- [ ] Rate card management
- [ ] Pricing scenario engine
- [ ] Price-to-win analysis
- [ ] Contract templates + clause library
- [ ] Contract risk scanner
- [ ] Frontend: Pricing scenario comparison
- [ ] Frontend: Contract workspace

### Sprint 15-16: AI Orchestration & Learning (Phase 9-10)
- [ ] LangGraph multi-agent orchestration (now 14 agents including strategy + SA)
- [ ] MCP tool servers (all integrations, including 3 new SA-specific servers)
- [ ] A2A event system (expanded with strategy + SA events)
- [ ] Communications agent (email, Q&A)
- [ ] Policy & goal settings manager
- [ ] Learning agent (outcome tracking + policy updates + strategy evolution)
- [ ] Submission packaging + audit trail
- [ ] Frontend: AI workbench, policy settings, analytics dashboards

---

## Environment Variables (.env.example)

```
# Django
DJANGO_SECRET_KEY=change-me
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Database
POSTGRES_DB=dealmanager
POSTGRES_USER=dealmanager
POSTGRES_PASSWORD=change-me
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Redis
REDIS_URL=redis://redis:6379/0

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=change-me
MINIO_ENDPOINT=minio:9000

# AI/LLM
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
LLM_PROVIDER=anthropic
LLM_MODEL=claude-sonnet-4-6

# SAM.gov
SAMGOV_API_KEY=your-key

# Langfuse
LANGFUSE_PUBLIC_KEY=pk-...
LANGFUSE_SECRET_KEY=sk-...
LANGFUSE_HOST=http://langfuse:8004

# JWT
JWT_SECRET_KEY=change-me
JWT_EXPIRATION_HOURS=24
```

---

## Success Criteria

1. **Daily Top 10 opportunities** automatically scored (technical fit + strategic alignment)
2. **Company AI Strategy Agent** maintains living strategy, influences every bid decision, balances portfolio
3. **End-to-end pipeline** from opportunity → proposal → submission → contract
4. **Fully Autonomous AI Solutions Architect** produces complete technical solutions with 14+ architecture diagrams from your multimodal knowledge vault
5. **Multimodal Knowledge Vault** stores and retrieves your reference architectures, images, diagrams, documents, patterns, and best practices via RAG
6. **AI generates** compliance matrices, proposal sections, pricing scenarios, contracts — all grounded in YOUR knowledge base
7. **HITL gates** enforce human approval at all critical decisions
8. **Learning loop** improves scoring, writing, pricing, AND evolves company strategy over time
9. **Professional output** (DOCX proposals with embedded architecture diagrams, proper formatting, branding)
10. **Full audit trail** for every action (human and AI)
11. **RBAC** with MFA protecting sensitive operations
12. **Docker Compose** single-command deployment with no port conflicts
13. **Real-time** collaboration and notifications via WebSocket
14. **14 specialized AI agents** (up from 12) orchestrated via LangGraph + MCP + A2A
