# 01 — Architecture Law

Architecture is not a suggestion. It is a contract. Every file, function, and dependency is either in compliance or introducing entropy. Your job is to enforce the contract before entropy compounds.

This reference governs: where code lives, how layers relate, what patterns to follow, and how to detect and resolve architectural drift before it ships.

---

## Table of Contents

1. [The Constitutional Principle](#the-constitutional-principle)
2. [Universal Layer Model](#universal-layer-model)
3. [Pre-Code Placement Checklist](#pre-code-placement-checklist)
4. [Naming Conventions by Language](#naming-conventions-by-language)
5. [Separation of Concerns](#separation-of-concerns)
6. [Dependency Rules](#dependency-rules)
7. [Common Architecture Templates](#common-architecture-templates)
8. [Architectural Drift Detection](#architectural-drift-detection)
9. [Breaking Change Protocol](#breaking-change-protocol)
10. [Architecture Documentation Standards](#architecture-documentation-standards)

---

## The Constitutional Principle

A codebase without enforced architecture is a codebase that will eventually collapse under its own weight. Previous developers always leave landmines — inconsistencies that seem harmless until the third engineer touches them. Your role is to be the engineer who refuses to add to that entropy.

Treat the architecture document like constitutional law:
- It defines what is and isn't permitted
- Changes require deliberate process, not convenience
- When reality conflicts with the document, the document wins until explicitly updated
- "It works" is not sufficient justification for a placement decision

When no architecture document exists: **create one before writing a single line of feature code.** The cost of 30 minutes of architecture design is paid back in the first week.

---

## Universal Layer Model

Every codebase — regardless of language, framework, or size — has these conceptual layers. The names change. The layers don't.

```
┌─────────────────────────────────────┐
│         INTERFACE LAYER             │  Controllers, routes, API handlers,
│  (receives and validates input)     │  CLI entry points, event listeners
├─────────────────────────────────────┤
│         SERVICE LAYER               │  Business logic, use cases,
│  (orchestrates business logic)      │  domain operations
├─────────────────────────────────────┤
│         DATA LAYER                  │  Repositories, database queries,
│  (reads and writes persistent data) │  ORM models, cache operations
├─────────────────────────────────────┤
│         INTEGRATION LAYER           │  Third-party API clients, webhooks,
│  (talks to external systems)        │  external service adapters
├─────────────────────────────────────┤
│         SHARED LAYER                │  Types, constants, utilities,
│  (used by all layers above)         │  error classes, validators
└─────────────────────────────────────┘
```

**Critical rules:**
- Layers only call downward — Interface calls Service calls Data. Never reverse.
- Shared layer has zero dependencies on the layers above it.
- Integration layer is isolated — external API details never leak into Service logic.
- Business logic NEVER lives in the Interface layer. If a controller has a for-loop doing domain work, it's wrong.

---

## Pre-Code Placement Checklist

Answer every question before writing the first line. State answers aloud.

```
1. LAYER IDENTIFICATION
   Q: Which layer does this belong to?
   Q: Is this business logic, persistence, interface handling, or integration?
   → If unclear: describe what the code does in one sentence. The verb reveals the layer.
     "Validates input and calls the service" → Interface layer
     "Calculates the discount based on user tier" → Service layer
     "Queries the database for orders" → Data layer
     "Calls the Stripe API" → Integration layer

2. DIRECTORY PLACEMENT
   Q: Which directory in the architecture does this live in?
   Q: Is there an existing file this should extend vs. a new file?
   → Prefer extending over creating. Creating new files when a logical home exists = drift.

3. DEPENDENCY MAPPING
   Q: What does this import from? Are all imports within permitted layer boundaries?
   Q: What will import from this? Do those consumers exist yet?
   → Draw the import graph before writing. If it's complicated, simplify the design.

4. PATTERN RECOGNITION
   Q: Does a similar pattern already exist in this codebase?
   Q: Can I follow that pattern, or is there a legitimate reason to deviate?
   → Deviation requires explicit justification. "I prefer this way" is not justification.

5. CONFLICT DETECTION
   Q: Does this request conflict with the architecture?
   Q: Does it introduce a circular dependency?
   Q: Does it break the layer separation rules?
   → If YES to any: STOP. Resolve before proceeding.
```

---

## Naming Conventions by Language

### TypeScript / JavaScript
```
Functions:          camelCase          getUserById(), calculateDiscount()
Classes:            PascalCase         UserService, OrderRepository
Interfaces/Types:   PascalCase         UserResponse, CreateOrderDTO
Files:              kebab-case         user-service.ts, order-repository.ts
Constants:          SCREAMING_SNAKE    MAX_RETRY_COUNT, DEFAULT_TIMEOUT_MS
React Components:   PascalCase         UserProfile.tsx, OrderCard.tsx
CSS classes:        kebab-case         user-profile-card, order-summary
Test files:         [name].test.ts     user-service.test.ts
```

### Python
```
Functions/Methods:  snake_case         get_user_by_id(), calculate_discount()
Classes:            PascalCase         UserService, OrderRepository
Constants:          SCREAMING_SNAKE    MAX_RETRY_COUNT, DEFAULT_TIMEOUT
Modules/Files:      snake_case         user_service.py, order_repository.py
Type aliases:       PascalCase         UserId, OrderStatus
Test files:         test_[name].py     test_user_service.py
Private:            _prefix            _internal_helper(), _cache
```

### Go
```
Functions (exported):   PascalCase      GetUserByID(), CalculateDiscount()
Functions (internal):   camelCase       getUserByID(), calculateDiscount()
Interfaces:             PascalCase      UserRepository, OrderService
Structs:                PascalCase      User, OrderItem
Files:                  snake_case      user_service.go, order_repository.go
Constants:              PascalCase      MaxRetryCount, DefaultTimeout
Packages:               lowercase       userservice, orderrepo (no underscores)
Test files:             [name]_test.go  user_service_test.go
```

### General Rules (any language)
- Names must reveal intent — `d` is not a variable name, `daysSinceLastLogin` is
- Avoid: `temp`, `data`, `result`, `obj`, `stuff`, `thing` without meaningful context
- Boolean names: use `is`, `has`, `can`, `should` — `isActive`, `hasPermission`
- Collection names: plural — `users`, `orderItems`, `errorMessages`
- Functions: verb + noun — `fetchUser`, `validateEmail`, `buildQuery`

---

## Separation of Concerns

### What belongs where — decision table

| Code does this | Belongs in |
|----------------|-----------|
| Parse HTTP request, validate input shape | Interface/Controller |
| Authenticate/authorize a request | Middleware |
| Orchestrate multiple services to fulfill a use case | Service |
| Apply business rules (discount, eligibility, pricing) | Service/Domain |
| Read from or write to a database | Repository/Data |
| Call an external API | Integration/Adapter |
| Map between external format and internal format | Integration/DTO |
| Define a data shape or contract | Types/Models |
| Calculate something reusable across domains | Shared/Utils |
| Manage configuration | Config |
| Handle and format errors | Error classes + Middleware |

### Red flags — code in the wrong place

```
❌ Controller has if/else business logic → move to service
❌ Service has raw SQL queries → move to repository
❌ Repository has business rules → move to service
❌ Service directly calls external HTTP → move to integration layer
❌ Type definition imports from service → circular dependency
❌ Utility function imports from the service it's used in → coupling
❌ Two services import from each other → redesign interface
```

---

## Dependency Rules

### The Dependency Direction Law
```
Interface → Service → Data → Shared
              ↓
         Integration → Shared

Arrows = "may import from"
NO reverse arrows. EVER.
```

### Package installation rules
Before adding any dependency:
1. **Does a lighter alternative exist?** (e.g., `date-fns` vs `moment`, `zod` vs `joi`)
2. **What is the maintenance status?** (Last commit, open issues, weekly downloads)
3. **What is the bundle/binary size impact?**
4. **Can this be implemented in <50 lines without the dependency?**
5. **State the justification in the PR/commit message**

Rule: If you can implement it simply in-house, do it. Dependencies are liabilities that must earn their place.

---

## Common Architecture Templates

### REST API (any language)

```
project/
├── src/
│   ├── api/               # Routes + controllers (Interface layer)
│   │   ├── routes/        # Route definitions
│   │   ├── controllers/   # Request handlers
│   │   └── middleware/    # Auth, validation, logging, error handling
│   ├── services/          # Business logic (Service layer)
│   ├── repositories/      # Data access (Data layer)
│   ├── integrations/      # External API clients (Integration layer)
│   ├── models/            # Data models / ORM definitions
│   ├── types/             # TypeScript interfaces, Python dataclasses, Go structs
│   ├── utils/             # Pure functions, shared helpers
│   ├── config/            # Environment config, constants
│   └── errors/            # Custom error classes
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/               # Build, deploy, seed, migration scripts
└── infrastructure/        # Docker, K8s, Terraform
```

### Frontend SPA (React/Vue/Svelte)

```
src/
├── pages/             # Route-level components (one per page/view)
├── components/        # Reusable UI components
│   ├── common/        # Truly generic (Button, Modal, Input)
│   └── features/      # Feature-specific components
├── hooks/             # Custom React hooks
├── services/          # API client functions
├── stores/            # State management (Redux, Zustand, Pinia)
├── types/             # TypeScript interfaces
├── utils/             # Pure helper functions
├── constants/         # App-wide constants
└── assets/            # Static files
```

### Serverless / Lambda

```
functions/
├── [function-name]/
│   ├── handler.ts         # Lambda entry point — thin, delegates to service
│   ├── service.ts         # Business logic
│   ├── types.ts           # Function-specific types
│   └── handler.test.ts
├── shared/
│   ├── middleware/        # Shared Lambda middleware (auth, logging)
│   ├── utils/             # Shared utilities
│   └── types/             # Shared types
└── infrastructure/        # CDK/Terraform/Serverless Framework
```

### CLI Tool

```
src/
├── commands/          # One file per CLI command
├── services/          # Business logic called by commands
├── utils/             # Shared helpers
├── types/             # Type definitions
└── index.ts           # Entry point + command registration
```

### Worker / Background Job System

```
src/
├── jobs/              # Job handler definitions
├── queues/            # Queue setup and connection
├── services/          # Business logic executed by jobs
├── processors/        # Queue processors
├── types/             # Job payload types (Zod-validated)
└── index.ts           # Worker entry point
```

---

## Architectural Drift Detection

These are warning signs that entropy has entered the codebase. Identify and document when found — don't silently fix outside request scope.

### Code smells that signal architectural violation

```
LAYER VIOLATIONS:
- HTTP status codes referenced outside of controllers
- Raw database queries in service files
- Business logic in test setup files
- API response formatting in service returns

COUPLING VIOLATIONS:
- Two modules that must always be changed together
- A utility that imports from a domain service
- Test files that test implementation details, not behavior
- Config values hardcoded in service logic

SIZE VIOLATIONS:
- Any file over 400 lines (usually multiple concerns collapsed)
- Functions over 40 lines (usually doing multiple things)
- Classes with more than 10 public methods (usually two classes merged)

NAMING VIOLATIONS:
- Files named "helpers", "utils", "misc", "common" without a specific domain
- Functions named "handle", "process", "do" without qualification
- God objects: UserManager, DataProcessor, SystemController
```

### How to report drift without going out of scope

When you encounter drift while working on something else:
```
📍 DRIFT NOTED (not fixing now — out of scope)
Location: [filepath:line]
Issue: [what's wrong]
Severity: LOW / MEDIUM / HIGH
Fix when: [natural opportunity — e.g., "next time this file is touched"]
```

---

## Breaking Change Protocol

Before implementing any change that affects existing interfaces, run this protocol:

```
⚠️ BREAKING CHANGE DETECTED

What changes: [specific interface, type, or behavior]
Current: [what it is now]
Proposed: [what it will become]

Consumers affected:
  - [file/module 1]: [how it breaks]
  - [file/module 2]: [how it breaks]

Migration path:
  1. [step]
  2. [step]

Rollback plan: [how to undo if migration fails]

Can this be made backwards-compatible? [YES with adapter → prefer / NO → document why]

→ Proceeding? Awaiting confirmation.
```

---

## Architecture Documentation Standards

Every project must maintain an `ARCHITECTURE.md` at the root. Minimum required sections:

```markdown
# Architecture

## System Overview
[One paragraph: what this system does and why it exists]

## Directory Structure
[Annotated tree of the codebase]

## Layer Definitions
[What each layer does and what belongs there]

## Data Flow
[How a request/event moves through the system end-to-end]

## Key Design Decisions
[ADRs — Architecture Decision Records. One per major decision.]
### ADR-001: [Decision Title]
**Date:** [date]
**Status:** Accepted
**Context:** [why this decision was needed]
**Decision:** [what was decided]
**Consequences:** [trade-offs accepted]

## External Dependencies
[Third-party services, APIs, and why we chose them]

## Environment Variables
[All required env vars with descriptions — no values]
```

Update this document every time the architecture changes. It is the source of truth, not the code.
