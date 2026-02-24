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
7. [Phase 5 — Past Performance Vault](#7-phase-5--past-performance-vault)
8. [Phase 6 — Proposal Authoring Studio](#8-phase-6--proposal-authoring-studio)
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

### 8.3 Solution Architect Agent

- Reads technical requirements
- Generates AI/ML architecture proposals:
  - System architecture diagrams (described in structured format)
  - Technology stack recommendations
  - Integration approach
  - Security architecture
  - Scalability plan
  - Innovation elements (LLM, agents, RAG, etc.)

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
│   ├── agents/
│   │   ├── orchestrator.py        # Master agent (LangGraph graph)
│   │   ├── opportunity_scout.py   # Scans & scores opportunities
│   │   ├── rfp_parser.py          # Extracts RFP requirements
│   │   ├── compliance_agent.py    # Builds compliance matrix
│   │   ├── past_perf_agent.py     # RAG retrieval of past performance
│   │   ├── solution_architect.py  # Technical solution design
│   │   ├── proposal_writer.py     # Section-by-section authoring
│   │   ├── pricing_agent.py       # Scenario generation & analysis
│   │   ├── qa_agent.py            # Quality & consistency checker
│   │   ├── submission_agent.py    # Package & checklist builder
│   │   ├── contract_agent.py      # Contract drafting & risk scan
│   │   ├── communication_agent.py # Emails, Q&A, narratives
│   │   └── learning_agent.py      # Policy updates from outcomes
│   ├── mcp_servers/
│   │   ├── samgov_tools.py        # SAM.gov API tools
│   │   ├── document_tools.py      # PDF/DOCX parse, chunk, embed
│   │   ├── vector_search.py       # pgvector RAG search
│   │   ├── template_render.py     # DOCX/PDF generation
│   │   ├── email_tools.py         # Email drafting & sending
│   │   ├── workflow_tools.py      # Stage transitions & tasks
│   │   └── pricing_tools.py       # Rate card & scenario calc
│   ├── graphs/
│   │   ├── daily_scan_graph.py    # Daily opportunity pipeline
│   │   ├── proposal_graph.py      # Full proposal generation flow
│   │   ├── pricing_graph.py       # Pricing analysis flow
│   │   └── contract_graph.py      # Contract generation flow
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
    "OpportunityIngested":    {"source": "opportunity_scout", "data": "raw opportunity"},
    "OpportunityScored":      {"source": "opportunity_scout", "data": "scored opportunity"},
    "RFPParsed":              {"source": "rfp_parser", "data": "extracted requirements"},
    "ComplianceMatrixReady":  {"source": "compliance_agent", "data": "matrix items"},
    "PastPerfMatched":        {"source": "past_perf_agent", "data": "matched projects"},
    "SolutionDesigned":       {"source": "solution_architect", "data": "architecture"},
    "SectionDrafted":         {"source": "proposal_writer", "data": "section content"},
    "PricingReady":           {"source": "pricing_agent", "data": "scenarios"},
    "QAComplete":             {"source": "qa_agent", "data": "issues found"},
    "ApprovalRequested":      {"source": "any agent", "data": "approval request"},
    "ApprovalGranted":        {"source": "human", "data": "decision + feedback"},
    "SubmissionPackaged":     {"source": "submission_agent", "data": "package ready"},
    "OutcomeRecorded":        {"source": "learning_agent", "data": "win/loss + metrics"},
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

### Opportunity Intelligence
- `OpportunitySource` (SAM.gov, labs, etc.)
- `Opportunity` (normalized, with embeddings)
- `OpportunityScore` (fit score + factors + explanation)
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

### Sprint 5-6: Deal Pipeline (Phase 3)
- [ ] Deal model + workflow state machine
- [ ] Task & checklist system with templates
- [ ] Approval system with HITL gates
- [ ] Frontend: Kanban pipeline board
- [ ] Frontend: Deal detail page with timeline
- [ ] Notifications (in-app + email) for stage changes

### Sprint 7-8: RFP & Past Performance (Phase 4-5)
- [ ] RFP document upload + AI extraction
- [ ] Compliance matrix generator
- [ ] Amendment diff tracker
- [ ] Past performance vault (CRUD + embeddings)
- [ ] RAG-powered past performance matching
- [ ] Frontend: RFP workspace with compliance matrix
- [ ] Frontend: Past performance library

### Sprint 9-11: Proposal Studio (Phase 6)
- [ ] Proposal templates (5 volumes)
- [ ] AI section generation (LangGraph proposal graph)
- [ ] Solution architect agent
- [ ] Review workflow (pink/red/gold team)
- [ ] Frontend: Proposal editor with AI workbench
- [ ] Frontend: Review interface with comments
- [ ] DOCX export with professional formatting

### Sprint 12-13: Pricing & Contracts (Phase 7-8)
- [ ] Rate card management
- [ ] Pricing scenario engine
- [ ] Price-to-win analysis
- [ ] Contract templates + clause library
- [ ] Contract risk scanner
- [ ] Frontend: Pricing scenario comparison
- [ ] Frontend: Contract workspace

### Sprint 14-15: AI Orchestration & Learning (Phase 9-10)
- [ ] LangGraph multi-agent orchestration
- [ ] MCP tool servers (all integrations)
- [ ] A2A event system
- [ ] Communications agent (email, Q&A)
- [ ] Policy & goal settings manager
- [ ] Learning agent (outcome tracking + policy updates)
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

1. **Daily Top 10 opportunities** automatically scored and presented
2. **End-to-end pipeline** from opportunity → proposal → submission → contract
3. **AI generates** compliance matrices, proposal sections, pricing scenarios, contracts
4. **HITL gates** enforce human approval at all critical decisions
5. **Learning loop** improves scoring, writing, and pricing over time
6. **Professional output** (DOCX proposals with proper formatting, branding)
7. **Full audit trail** for every action (human and AI)
8. **RBAC** with MFA protecting sensitive operations
9. **Docker Compose** single-command deployment with no port conflicts
10. **Real-time** collaboration and notifications via WebSocket
