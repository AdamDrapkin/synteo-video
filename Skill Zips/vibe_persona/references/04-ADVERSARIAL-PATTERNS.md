# 04 — Adversarial Patterns

Seven techniques for catching failure modes before production does. These aren't prompts to recite — they're mental models to apply at specific moments during a build. The engineers who contributed these use them as reflexes, not checklists.

The core mindset shift: treat the code you just wrote as an adversary. Your job is to break it before it ships.

---

## Table of Contents

1. [When to Apply Adversarial Patterns](#when-to-apply)
2. [Pattern 1: Chain-of-Doubt](#pattern-1-chain-of-doubt)
3. [Pattern 2: Failure Audit](#pattern-2-failure-audit)
4. [Pattern 3: Anti-Expert Review](#pattern-3-anti-expert-review)
5. [Pattern 4: Edge Case Stress Test](#pattern-4-edge-case-stress-test)
6. [Pattern 5: Constraint Flip](#pattern-5-constraint-flip)
7. [Pattern 6: Role Collision](#pattern-6-role-collision)
8. [Pattern 7: Silent Assumption Extractor](#pattern-7-silent-assumption-extractor)
9. [Combining Patterns](#combining-patterns)
10. [Common Failure Taxonomies](#common-failure-taxonomies)
11. [Code Review Checklist](#code-review-checklist)

---

## When to Apply

Don't run every pattern on every task. Apply the right pattern at the right moment.

| Moment | Apply This Pattern |
|--------|------------------|
| About to make an architecture decision | 5 (Constraint Flip) + 7 (Silent Assumption Extractor) |
| Just wrote a complex algorithm | 1 (Chain-of-Doubt) + 4 (Edge Case Stress Test) |
| Code is about to go to production | 2 (Failure Audit) + 4 (Edge Case Stress Test) |
| Reviewing someone else's code | 3 (Anti-Expert) + 6 (Role Collision) |
| Debugging a failure that makes no sense | 7 (Silent Assumption Extractor) |
| Designing an API or interface | 4 (Edge Case Stress Test) + 6 (Role Collision) |
| Making a trade-off decision | 5 (Constraint Flip) + 6 (Role Collision) |

---

## Pattern 1: Chain-of-Doubt

**When:** After writing any non-trivial logic. Prevents committing to a wrong reasoning path.

**What it does:** Forces the code to question itself at each reasoning step instead of building confidently on a potentially wrong foundation.

**How to apply:**

Walk through the logic step by step. After each step, ask: "Could this step be wrong? If yes, what would break downstream?"

```
CHAIN-OF-DOUBT: [function/algorithm name]

Step 1: [what this step does]
→ Could this be wrong? [assessment]
→ If wrong, downstream impact: [what breaks]

Step 2: [what this step does]
→ Could this be wrong? [assessment]
→ If wrong, downstream impact: [what breaks]

Step 3: [what this step does]
→ Could this be wrong? [assessment]
→ If wrong, downstream impact: [what breaks]

Weakest link: Step [N] — [why it's the most uncertain]
Mitigation: [how to make it more robust or add a check]
```

**Real examples of what this catches:**
- An assumption that a list is always sorted when it might not be
- An off-by-one in a pagination calculation that only manifests at the last page
- A datetime comparison that works in UTC but breaks when the client is in another timezone
- A null check that passes in tests but hits a real null in production data

---

## Pattern 2: Failure Audit

**When:** Before shipping any feature. After completing a sprint. Before marking a PR ready for review.

**What it does:** Forces explicit enumeration of every assumption that could be wrong, with a confidence rating. Surfaces the implicit bets you've made.

**How to apply:**

Complete the implementation, then list every assumption made during the build. Rate each 1-10 on confidence. Items rated <7 get a mitigation plan.

```
FAILURE AUDIT: [feature/component name]

Assumptions Made:
1. [assumption] — Confidence: [1-10] — Risk if wrong: [impact]
2. [assumption] — Confidence: [1-10] — Risk if wrong: [impact]
3. [assumption] — Confidence: [1-10] — Risk if wrong: [impact]
...

Low-confidence items (< 7) requiring action:
- [assumption N]: [specific mitigation or verification step]

Known unknowns (things I don't know that I don't know):
[reflect on what domain knowledge gaps might exist]

Ship/don't ship recommendation: [with reasoning]
```

**Common categories of low-confidence assumptions:**
- External API behavior under edge cases
- Database query performance at 10x current data volume
- Concurrent access patterns not covered in tests
- Error behavior of third-party libraries
- User behavior assumptions (will users always provide valid input?)

---

## Pattern 3: Anti-Expert Review

**When:** Reviewing completed work. Architecture decisions. Code reviews. Before presenting an approach.

**What it does:** Forces you to argue against your own work from the perspective of the most skeptical, experienced engineer on the team. Gets the model to break its own reasoning.

**How to apply:**

After completing work, adopt the perspective of a skeptical senior engineer trying to find reasons this is wrong or insufficient. What would they say?

```
ANTI-EXPERT REVIEW: [what's being reviewed]

The skeptic would say:

1. "[Direct criticism #1]"
   Validity: [is this a real concern or nitpicking?]
   Response: [how to address it, or why it's acceptable]

2. "[Direct criticism #2]"
   Validity: [assessment]
   Response: [address or accept]

3. "[Direct criticism #3]"
   Validity: [assessment]
   Response: [address or accept]

Criticisms I can't fully defend against:
[list items where the skeptic is right and the code needs to change]

Net verdict: [what changes based on this review]
```

**What the skeptic typically challenges:**
- "This will break at scale" — what does 10x volume do to this?
- "This has a race condition" — what if two requests hit this simultaneously?
- "This leaks implementation details" — is this interface too tightly coupled?
- "This is untestable" — can you actually write a unit test for this in isolation?
- "This has no rollback" — what happens if this needs to be undone in production?

---

## Pattern 4: Edge Case Stress Test

**When:** Any function that accepts inputs. Any API endpoint. Any data transformation.

**What it does:** Forces systematic enumeration of inputs that break the code. Finds the failure modes that tests don't cover because nobody thought to write them.

**How to apply:**

Generate 10 inputs designed to break the function. For each, trace exactly what happens and where it fails.

```
EDGE CASE STRESS TEST: [function/endpoint name]

Input signature: [parameters and types]

Stress inputs:
1. [input]: expected behavior vs actual behavior → [PASS/FAIL/EXCEPTION]
2. [input]: expected vs actual → [result]
3. [input]: expected vs actual → [result]
4. [input]: expected vs actual → [result]
5. [input]: expected vs actual → [result]
6. [input]: expected vs actual → [result]
7. [input]: expected vs actual → [result]
8. [input]: expected vs actual → [result]
9. [input]: expected vs actual → [result]
10. [input]: expected vs actual → [result]

Failures found: [list]
Required fixes: [list]
Tests to add: [list]
```

**Standard edge case categories to always include:**

```
NUMERIC INPUTS:
- Zero
- Negative values
- Maximum safe integer
- Float when integer expected
- NaN / Infinity

STRING INPUTS:
- Empty string ""
- Single character
- Very long string (10,000 chars)
- Unicode/emoji (💥 breaks lots of substr operations)
- SQL injection attempt: '; DROP TABLE users; --
- XSS attempt: <script>alert('xss')</script>
- Null bytes: \x00
- Newlines in unexpected places: "value\ninjected"

COLLECTION INPUTS:
- Empty array/list []
- Single element [x]
- Duplicate elements [x, x, x]
- Very large collection (10,000 items)
- Collection with null element [x, null, y]
- Nested beyond expected depth

NULL / UNDEFINED / MISSING:
- null where object expected
- undefined (JavaScript)
- None (Python)
- Missing required field in object
- Extra unexpected fields in object

CONCURRENT / TIMING:
- Same operation triggered twice simultaneously
- Operation during ongoing database transaction
- Timeout at each network call
- Operation on deleted/stale resource

TYPE CONFUSION:
- String "1" where number 1 expected
- Number 0 where boolean false might be expected
- Array where single value expected
- Object where string expected
```

---

## Pattern 5: Constraint Flip

**When:** Architecture decisions. Technology choices. API design. Database schema decisions.

**What it does:** Forces evaluation of the second-best approach. The "obvious" solution is often the one that breaks at scale. The constraint flip reveals the trade-offs hidden in the obvious choice.

**How to apply:**

Identify the obvious solution. Then solve the problem with the constraint that you cannot use that solution. What's the second-best approach? What does that reveal about the trade-offs in the original?

```
CONSTRAINT FLIP: [decision being made]

Obvious solution: [what it is]
Why it's obvious: [what makes it the default choice]
What it optimizes for: [what it's good at]
What it sacrifices: [what it's bad at or ignores]

Constraint: You cannot use the obvious solution.
Second-best approach: [what you'd do instead]
What it reveals about the obvious solution: [trade-offs now visible]

Decision: [which to choose given this analysis]
Rationale: [specific to the constraints of this project]
```

**Examples of what this uncovers:**

- REST API is obvious → GraphQL constraint reveals that the REST design was going to require 12 endpoints for what could be 1 query
- PostgreSQL is obvious → MongoDB constraint reveals that the schema is actually flexible and relational joins are minimal → maybe MongoDB is right after all
- Microservices is obvious → monolith constraint reveals the team is 2 people and the overhead isn't justified
- Synchronous HTTP is obvious → async queue constraint reveals that the operation should actually be async because it takes 10 seconds

---

## Pattern 6: Role Collision

**When:** Making trade-off decisions. API design. Feature scope decisions. Architecture choices with competing concerns.

**What it does:** Generates two opposing perspectives simultaneously. The disagreement between them contains the actual design insight.

**How to apply:**

Answer the question from two opposing roles simultaneously. Show where they agree and where they conflict. The conflict is the information.

```
ROLE COLLISION: [decision or design question]

SENIOR SYSTEMS ENGINEER says:
[technical perspective — performance, scalability, correctness, maintainability]

SKEPTICAL PRODUCT MANAGER says:
[user/business perspective — simplicity, time to ship, user experience, cost]

WHERE THEY AGREE:
[points of consensus — these are the safe choices]

WHERE THEY DISAGREE:
[specific points of conflict — this is the real trade-off]

The insight from the disagreement:
[what the collision reveals that neither perspective alone would surface]

Resolution: [how to balance the tension for this specific context]
```

**Common role pairings for different decisions:**
- Systems engineer + PM: build vs buy, complexity vs speed
- Security engineer + UX designer: protection vs friction
- Backend engineer + mobile developer: API design conflicts
- Current requirements + 2-year scale estimate: premature optimization vs tech debt
- Strict type safety + developer experience: correctness vs ergonomics

---

## Pattern 7: Silent Assumption Extractor

**When:** Before any architecture review. Before answering a complex technical question. When debugging a mysterious failure. When a previous approach failed and you don't know why.

**What it does:** Surfaces the implicit assumptions baked into the question itself — before you answer it. The assumption list is often more valuable than the answer.

**How to apply:**

Before answering or building, list every implicit assumption in the question/request. Then answer. The assumptions revealed often change or redirect the answer.

```
SILENT ASSUMPTION EXTRACTOR: [question or request]

Implicit assumptions in this question:
1. [assumption] — validity: [is this actually true?]
2. [assumption] — validity: [is this actually true?]
3. [assumption] — validity: [is this actually true?]
4. [assumption] — validity: [is this actually true?]
5. [assumption] — validity: [is this actually true?]

Assumptions that change the answer if false:
- If [assumption N] is false: [how the answer changes]

Now answering with these assumptions surfaced:
[answer]

What to verify before proceeding: [list of assumptions to confirm]
```

**Examples of hidden assumptions in common requests:**

"Build a user authentication system"
- Assumes: users have email addresses, passwords are the right mechanism (vs SSO), registration is open (vs invite-only), session-based (vs JWT), user table doesn't already exist

"Optimize this database query"
- Assumes: the query is actually the bottleneck, the current indexes are known, the data volume and query frequency are known, the query correctness is verified

"Add caching to this endpoint"
- Assumes: the endpoint is actually slow, the data is safe to cache (idempotent), cache invalidation strategy is defined, cache infrastructure exists

---

## Combining Patterns

For high-stakes architecture decisions, combine multiple patterns:

### Pre-Architecture Decision Protocol
```
1. Pattern 7: Extract silent assumptions from the requirements
2. Pattern 5: Flip the constraint — what's the non-obvious approach?
3. Pattern 6: Collide the engineer and PM perspectives
4. Document the decision with all three analyses as justification
```

### Pre-Shipping Checklist
```
1. Pattern 2: Failure audit — enumerate and rate all assumptions
2. Pattern 4: Edge case stress test — 10 inputs that should break it
3. Pattern 1: Chain-of-doubt — walk each step and question it
4. Pattern 3: Anti-expert — steelman the skeptic's objections
```

### Debugging Unknown Failures
```
1. Pattern 7: What assumptions are baked into the debugging approach itself?
2. Pattern 1: Chain-of-doubt on the suspected failure path
3. Pattern 4: What inputs could have caused this specific failure?
```

---

## Common Failure Taxonomies

Reference library of failure categories. When diagnosing bugs or reviewing code, check against these.

### Distributed Systems Failures
```
- Split brain: two nodes believe they are the leader
- Network partition tolerance assumptions: assumes network is reliable
- Clock drift: two services compare timestamps without accounting for skew
- Thundering herd: cache expiry triggers simultaneous recomputation by many clients
- Cascading failure: service A's failure overloads service B then C
- Backpressure ignored: producer faster than consumer, queue grows unbounded
```

### Data Integrity Failures
```
- Lost update: read-modify-write without transaction → second writer overwrites first
- Dirty read: reading data from a transaction not yet committed
- Phantom read: second query returns different rows than first within same transaction
- Double processing: retry logic processes the same event twice
- Partial write: failure mid-operation leaves data in invalid state
```

### Async / Concurrency Failures
```
- Race condition: outcome depends on thread/process scheduling
- Deadlock: two processes each waiting for the other
- Livelock: both processes keep changing state in response to each other
- Starvation: one process never gets CPU time
- Memory leak: references kept alive past their useful life
```

### Security Failures
```
- IDOR: Insecure Direct Object Reference — user can access other users' data by changing ID
- SSRF: Server-Side Request Forgery — user controls what URL the server fetches
- Mass assignment: user sets fields they shouldn't (is_admin: true)
- JWT none algorithm: tokens accepted without signature verification
- Timing attack: different response times reveal valid vs invalid credentials
```

### Performance Failures
```
- N+1 query: one query per item in a list instead of one query for all
- Missing index: full table scan on filtered column
- Synchronous operation in async context: blocks event loop
- Large response payload: no pagination, returns millions of rows
- Memory leak in long-running process
```

---

## Code Review Checklist

Apply this when reviewing any code — yours or someone else's.

```
ARCHITECTURE
□ Is this code in the right layer?
□ Does it follow the naming conventions?
□ Does it introduce new dependencies that aren't justified?
□ Does it create circular dependencies?
□ Is there an existing pattern it should follow?

LOGIC
□ Are there obvious edge cases unhandled?
□ Is there any logic that could produce incorrect results on valid inputs?
□ Are comparisons using the right equality operator (==/===, is/==)?
□ Are numeric operations safe from overflow/underflow?
□ Are string operations safe with unicode/special characters?

ERROR HANDLING
□ Are all error cases handled?
□ Are errors typed and meaningful?
□ Do errors propagate correctly or get swallowed?
□ Does partial failure leave system in valid state?

SECURITY
□ Is user input validated before use?
□ Is user input escaped before rendering?
□ Are authorization checks present?
□ Are any secrets visible in code or logs?

TESTS
□ Do tests cover the happy path?
□ Do tests cover the error paths?
□ Do tests cover the edge cases identified above?
□ Are tests testing behavior or implementation?

PERFORMANCE
□ Are there any obvious N+1 patterns?
□ Is pagination present on any endpoint returning variable-size data?
□ Are any expensive operations happening synchronously when they could be async?

OBSERVABILITY
□ Are key operations logged with enough context?
□ Are errors logged with actionable information?
□ Could this code fail silently in a way that would be hard to detect?
```
