# Smart Routing Blackout: Build a Live Fallback Visualizer

## Scenario

You've just joined a war room at Yuno. It's 3 AM, and VitaShop, a high-volume health & wellness
e-commerce platform processing $2M daily across Brazil, Mexico, and Colombia, is hemorrhaging
revenue. Their primary payment processor—which normally handles 70% of their transaction
volume—went down 90 minutes ago during peak evening shopping hours in São Paulo.

Yuno's payment orchestration platform kicked in and automatically rerouted transactions to backup
processors using smart routing rules. But VitaShop's ops team is in the dark. They're refreshing
static reports, calling their account manager every 10 minutes, and have no real-time visibility into:

- Which payment methods are being rerouted and where
- How successful the fallback processors are performing compared to the primary
- Whether certain countries or payment methods are experiencing higher failure rates during the incident
- When it's safe to route traffic back to the primary processor

The VitaShop CTO is on the call: "We need to SEE what's happening in real-time. We can't operate
blind during outages. If we had a live dashboard showing routing decisions and performance across
processors, we'd know exactly when to communicate with customers, adjust marketing spend, or
escalate to processor support."

**Your mission**: Build an interactive, real-time payment routing dashboard that VitaShop's ops
team can use during incidents to monitor how Yuno's smart routing is performing across different
processors, payment methods, and countries.

---

## Domain Background: Key Concepts

### Payment Orchestration
When a merchant wants to accept payments, they typically integrate with multiple payment processors
(companies that handle the technical connection to banks and payment networks). Payment orchestration
platforms like Yuno sit in the middle, managing connections to many processors and intelligently
routing each transaction to the best one.

### Smart Routing
Smart routing is the logic that decides which processor should handle each transaction. Rules might consider:
- **Processor availability**: Is the processor online and healthy?
- **Success rates**: Which processor has the highest approval rate for this payment method/country?
- **Cost**: Which processor charges the lowest fees?
- **Fallback rules**: If Processor A fails or is down, try Processor B, then C

### Payment Processors
Third-party services that connect merchants to the payment infrastructure (banks, card networks,
local payment methods). Each has different:
- Authorization rates: % of transactions they successfully approve
- Coverage: which countries and payment methods they support
- Reliability: uptime and response times

### Authorization vs Decline
When a customer tries to pay:
- **Authorization (approved)**: The processor checked with the bank/payment network and approved
  the transaction. Money will be captured.
- **Decline (rejected)**: The processor or bank rejected the transaction (insufficient funds,
  fraud suspicion, technical error, etc.). No money changes hands.
- **Authorization rate**: % of transaction attempts that get approved (e.g., 68% authorization
  rate = 68 out of 100 attempts succeeded)

### Payment Methods
- **Credit/debit cards**: Visa, Mastercard, etc.
- **PIX**: Brazil's instant payment system (bank-to-bank, real-time, 24/7)
- **OXXO**: Mexican cash payment method (customer gets a voucher, pays at OXXO convenience stores)
- **PSE**: Colombia's online bank transfer system

---

## Functional Requirements

### Core Requirement 1: Real-Time Routing Visualization
The dashboard must show, in real-time or near-real-time:
- Current routing status by processor (health status, live auth rate, current volume, vs baseline)
- Timeline of routing changes

**Acceptance criteria**: A user should be able to glance at the dashboard and immediately answer:
"Which processor is currently handling most of our traffic?" and "Is our backup performing better
or worse than our primary normally does?"

### Core Requirement 2: Multi-Dimensional Breakdown
Drill down by:
- **Payment method**: PIX vs credit cards vs OXXO
- **Country/region**: Brazil vs Mexico vs Colombia
- **Time period**: Last 15 minutes, 1 hour, or since incident started

**Acceptance criteria**: A user can identify that "PIX transactions in Brazil via Backup Processor
B have a 15% lower auth rate than PIX normally achieves via Primary Processor A" within 30 seconds.

### Core Requirement 3: Incident Timeline & Key Metrics
- Incident start time and duration
- Overall auth rate since incident vs normal baseline (e.g., "Current: 62% | Normal: 74% | -12pp")
- Total transaction volume processed
- Estimated revenue impact

**Acceptance criteria**: VitaShop's CTO can screenshot this summary and send it to their executive
team with clear numbers on incident impact.

---

## Stretch Goals

- **A. Alert Threshold Visualization**: Color-coded indicators when auth rates drop below thresholds
- **B. Processor Comparison Mode**: Side-by-side comparison of primary vs backup processors
- **C. Export or Share Incident Report**: Download dashboard state as PDF/JSON for post-incident review
- **D. Simulated Real-Time Data Stream**: Fetch new transactions every 2-5 seconds to mimic real-time

---

## Test Data Specification

- At least 1,000 transaction records spanning a 3-hour incident window
- Three processors:
  - **Processor A (Primary)**: Healthy first 30 min, then goes DOWN
  - **Processor B (Backup)**: Spikes to ~50% of traffic after rerouting (62% auth rate)
  - **Processor C (Backup)**: Handles ~20% of traffic after rerouting
- Three countries: Brazil (~50%), Mexico (~30%), Colombia (~20%)
- Four payment methods: credit card, debit card, PIX (Brazil only), OXXO (Mexico only)
- Authorization outcomes: Mix of approved/declined, with decline rates increasing during incident
- Baseline metrics: Pre-incident 24-hour data for "normal" vs "incident" comparison

---

## Acceptance Criteria Summary

- ✅ User can load dashboard and immediately see which processors are handling traffic
- ✅ Dashboard clearly shows live auth rates and health status for each processor
- ✅ Users can filter/drill down by payment method, country, and time period
- ✅ Summary section displays total incident impact (duration, auth rate drop, declined count)
- ✅ Interface is responsive and usable without a tutorial
- ✅ Dashboard is visually polished enough to show to a client during a live incident

---

## Evaluation Criteria

| Criteria | Points |
|----------|--------|
| Core Requirement 1 - Real-time routing visualization | 25pts |
| Core Requirement 2 - Multi-dimensional breakdown | 25pts |
| Core Requirement 3 - Incident summary | 20pts |
| User experience and visual design | 15pts |
| Interactivity and performance | 10pts |
| Stretch goals and innovation | 5pts |
| **Total** | **100pts** |

---

## Deliverables

1. Working web-based dashboard (with instructions to run it locally or hosted URL)
2. Screenshot or screen recording demonstrating core features
3. Brief written explanation (200-400 words) of design decisions
4. The test dataset used (or script/prompt to generate it)
5. README with setup instructions and completed features list
