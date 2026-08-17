# Backend Project Roadmap
### Stack: Node.js + Express + PostgreSQL + Prisma ORM + Socket.io + AI Recommendations

This document explains, step by step, how to plan, build, structure, secure, test, containerize, and deploy a production-grade backend from scratch — no code, just the reasoning and the order of operations. It's written so you can follow it as you learn, in the order you'll actually need the knowledge.

---

## 1. Project Planning (Before Writing Any Code)

Before touching the editor, define the project on paper:

- **Purpose & scope** — an e-commerce-style backend: users browse products, add to cart, checkout, and get personalized recommendations, with real-time stock protection so two people can't buy the last unit of something at the same time.
- **User roles** — admin (manages products/orders), regular user (buys), possibly guest (browses only).
- **Core features**:
  - Auth (register/login/roles)
  - Product catalog with categories
  - Cart & checkout
  - Orders & payments
  - **Real-time stock locking via Socket.io**
  - **AI-powered product recommendations**
  - Reviews & ratings
  - Notifications
- **API consumers** — a frontend web/mobile app that will consume this API and also listen to real-time socket events.

This is a genuinely large project. That's the point — it forces you to learn auth, relational DB design, real-time systems, and applied AI, which is exactly what makes a backend developer stand out.

---

## 2. High-Level Architecture

A clean backend is built in **layers**, each with one responsibility:

1. **Routes layer** — defines URL endpoints and HTTP methods only. No logic here.
2. **Controller layer** — receives the request, calls the right service, sends the response. No business logic here either.
3. **Service layer** — contains the actual business logic (e.g. "can this user cancel this order?", "reserve this stock").
4. **Data access layer (Prisma)** — talks to the database. Services call this, never the database directly from controllers.
5. **Middleware layer** — cross-cutting concerns: authentication checks, error handling, logging, validation.
6. **Real-time layer (Socket.io)** — a parallel channel alongside HTTP, for pushing live updates to connected clients.
7. **AI/recommendation layer** — a separate service responsible for generating and serving personalized suggestions, decoupled from the core order logic.

This separation means you can change the database, swap the framework, or plug in a different AI model later without rewriting unrelated code — which is exactly how real companies structure large systems.

---

## 3. Advanced Feature #1 — Real-Time Stock Locking with Socket.io

### The problem
Two users click "Buy Now" on the last unit of a product at nearly the same moment. Without protection, both requests can pass a "is it in stock?" check before either one finishes, and you oversell the product. This is a classic **race condition**.

### The concept, not the code

**A. Database-level protection (the actual fix)**
The real guarantee against overselling doesn't come from Socket.io — it comes from the database:
- When a checkout starts, the order-creation logic must check and decrement stock in a single atomic database operation (a transaction with row-level locking), not as two separate "read stock, then write stock" steps.
- This ensures that even if two requests arrive at the exact same millisecond, PostgreSQL serializes them — the second request only proceeds after the first has committed, and by then it sees the updated (possibly zero) stock.
- A common pattern is a **stock reservation**: when a user starts checkout, you create a short-lived "reservation" row for that quantity, which temporarily reduces "available" stock without finalizing the order. If the user doesn't complete payment within a few minutes, the reservation expires and stock is released.

**B. Socket.io's actual job: real-time visibility, not the lock itself**
Socket.io's role is to make this instantly *visible* to everyone else looking at the product, without them refreshing the page:
- When stock changes (someone buys, a reservation is made, a reservation expires), the server emits an event to everyone currently viewing that product's page.
- Connected clients update their UI instantly — "Only 1 left" turns into "Out of stock" in real time for every other shopper looking at it.
- If a user is mid-checkout and someone else beats them to the last unit, the server can emit a direct event to that specific user's socket connection telling them checkout failed due to stock, instead of them finding out only after submitting.
- This turns a silent failure into an immediate, informative experience — which is the actual product value Socket.io adds here.

**In short: PostgreSQL transactions prevent overselling. Socket.io prevents confusion and gives a real-time experience around it.** Both are needed; they solve different problems.

### Where Socket.io fits architecturally
- It runs alongside your Express HTTP server, sharing the same underlying server.
- Clients connect once (e.g. when opening a product page or their cart) and stay connected.
- You organize clients into "rooms" — e.g. one room per product — so stock updates only broadcast to people actually viewing that product, not every connected user.
- Socket events you'll design: stock updated, reservation expired, order confirmed, checkout failed due to stock, and later, live notifications.

---

## 4. Advanced Feature #2 — AI-Powered Recommendations

### The goal
When a user browses or logs in, show them products they're actually likely to want — not just a static "featured products" list.

### The concept, not the code

**A. Data collection first**
Recommendations are only as good as the behavioral data feeding them. You need to track:
- Product views (which user viewed which product, and when)
- Cart additions
- Purchases (the strongest signal)
- Ratings/reviews
- Search queries

This means designing tables specifically to capture this activity as it happens — not something you can bolt on later without redesigning your schema.

**B. Approaches to generating recommendations (from simple to advanced)**
1. **Rule-based** — "customers who bought X also bought Y" using simple co-occurrence counts from order history. Good starting point, no ML needed.
2. **Collaborative filtering** — find users with similar purchase/view patterns to the current user, and recommend what similar users liked. This is classic recommendation-engine logic.
3. **Content-based filtering** — recommend products similar in attributes (category, tags, price range) to what the user has already engaged with.
4. **Embedding-based / LLM-assisted** — convert product descriptions and user behavior into vector embeddings, and find the "closest" products in that vector space. This is the modern approach and pairs well with a vector-capable database extension.
5. **Hybrid** — combine multiple signals with weights, which is what most real production systems do.

**C. Where the computation happens**
- **Real-time (on request)** — compute recommendations when the user asks for them, using pre-aggregated data so it's fast.
- **Batch/precomputed (background job)** — periodically (e.g. nightly) recompute recommendations for all users and store the results, so serving them is just a fast database read. This is usually the better approach at scale, and it's a great excuse to learn background job scheduling.

**D. Serving recommendations**
A dedicated endpoint (e.g. "recommended for you") reads precomputed suggestions for the logged-in user, falling back to popular/trending products for new users with no history yet (the "cold start" problem — a concept worth understanding deeply, it comes up in every real recommendation system).

---

## 5. Database Design — Every Table, Explained

This is the full schema for the "superpowered" version of the project. Each table is described with its purpose and key attributes (conceptually — you'll define exact types in Prisma once you get there).

### Core Identity
**`User`**
- `id`, `name`, `email` (unique), `password_hash`, `role` (user/admin), `phone`, `is_active`, `created_at`, `updated_at`
- Purpose: authentication and identity for everyone using the system.

**`Profile`** *(one-to-one with User)*
- `user_id`, `avatar_url`, `bio`, `address`, `date_of_birth`
- Purpose: separates rarely-needed profile data from the core auth table, keeping `User` lean.

**`RefreshToken`**
- `id`, `user_id`, `token_hash`, `expires_at`, `created_at`, `revoked`
- Purpose: supports secure, long-lived login sessions without storing raw tokens.

### Catalog
**`Category`**
- `id`, `name`, `slug`, `parent_id` (nullable, self-referencing for subcategories), `created_at`
- Purpose: organizes products; the self-reference allows nested categories (e.g. Electronics → Phones → Smartphones).

**`Product`**
- `id`, `name`, `description`, `price`, `sku`, `stock_quantity`, `category_id`, `status` (active/draft/archived), `created_at`, `updated_at`
- Purpose: the core sellable item.

**`ProductImage`**
- `id`, `product_id`, `url`, `is_primary`, `sort_order`
- Purpose: products need multiple images; a separate table avoids messy array fields.

### Shopping & Orders
**`Cart`**
- `id`, `user_id`, `status` (active/converted/abandoned), `created_at`
- Purpose: represents a user's in-progress selection before checkout.

**`CartItem`**
- `id`, `cart_id`, `product_id`, `quantity`, `added_at`
- Purpose: line items inside a cart.

**`StockReservation`** *(supports the Socket.io feature)*
- `id`, `product_id`, `user_id`, `quantity`, `status` (pending/confirmed/expired), `expires_at`, `created_at`
- Purpose: temporarily holds stock during checkout so it can't be double-sold, and gets released if checkout isn't completed in time.

**`Order`**
- `id`, `user_id`, `status` (pending/paid/shipped/delivered/cancelled), `total_amount`, `shipping_address`, `created_at`, `updated_at`
- Purpose: a finalized purchase.

**`OrderItem`**
- `id`, `order_id`, `product_id`, `quantity`, `price_at_purchase`
- Purpose: line items inside an order. Storing `price_at_purchase` separately from the live product price matters — product prices change over time, but past orders must keep their original price.

**`Payment`**
- `id`, `order_id`, `amount`, `provider` (e.g. Stripe), `transaction_id`, `status` (pending/success/failed/refunded), `created_at`
- Purpose: tracks the financial transaction tied to an order, separate from order fulfillment status.

### Engagement & AI Data
**`Review`**
- `id`, `user_id`, `product_id`, `rating` (1–5), `comment`, `created_at`
- Purpose: user feedback; also a useful signal for recommendations.

**`Wishlist`**
- `id`, `user_id`, `product_id`, `added_at`
- Purpose: saved-for-later items; another behavioral signal.

**`ProductView`** *(critical for AI recommendations)*
- `id`, `user_id` (nullable, for guests), `product_id`, `viewed_at`, `session_id`
- Purpose: raw behavioral log — every time a user looks at a product. This table grows large fast, and is the foundation for content-based and collaborative recommendations.

**`UserRecommendation`** *(precomputed AI output)*
- `id`, `user_id`, `product_id`, `score`, `reason` (e.g. "similar to items you viewed"), `generated_at`
- Purpose: stores the output of your recommendation job so serving it to the user is just a fast, indexed read — not a live computation on every request.

### System
**`Notification`**
- `id`, `user_id`, `type` (order_update/stock_alert/promo), `message`, `is_read`, `created_at`
- Purpose: in-app alerts, some of which will be pushed live via Socket.io.

**`AuditLog`**
- `id`, `user_id`, `action`, `entity_type`, `entity_id`, `metadata`, `created_at`
- Purpose: records who did what and when — essential for admin accountability and debugging in any serious system.

### Key Relationships Summary
- One `User` → many `Orders`, `Reviews`, `ProductViews`, `Notifications`
- One `Category` → many `Products`; a `Category` can have a parent `Category`
- One `Product` → many `ProductImages`, `Reviews`, `CartItems`, `OrderItems`, `ProductViews`
- One `Order` → many `OrderItems`; one `Order` → one `Payment`
- One `Cart` → many `CartItems`

Designing this fully before writing a single migration is what separates a maintainable project from one you'll need to rebuild halfway through.

---

## 6. Folder Structure (Explained)

```
project-root/
│
├── prisma/
│   ├── schema.prisma          → single source of truth for the DB structure above
│   ├── migrations/            → auto-generated, versioned DB change history
│   └── seed                   → script to populate initial data (categories, admin user, sample products)
│
├── src/
│   ├── config/                → environment/config loading (DB URL, JWT secret, Socket.io options, AI service keys)
│   ├── routes/                → maps URLs to controllers, grouped by resource (auth, products, orders, recommendations)
│   ├── controllers/           → handles req/res, calls services, no business logic
│   ├── services/               → business logic: order creation, stock reservation logic, recommendation generation
│   ├── repositories/          → wraps Prisma calls per entity, keeping raw queries out of services
│   ├── middlewares/           → auth checks, error handling, request validation, rate limiting
│   ├── validators/            → schema-based input validation rules per endpoint
│   ├── sockets/               → Socket.io connection handling, room management, event emitters/listeners
│   ├── ai/                    → recommendation logic: data aggregation, scoring, the recommendation job itself
│   ├── jobs/                  → scheduled/background tasks: expiring stock reservations, nightly recommendation recompute, cleanup
│   ├── utils/                 → small reusable helpers (formatting, token generation)
│   ├── errors/                → custom error classes for consistent error handling
│   ├── app.js                 → Express app setup, middleware registration
│   └── server.js              → starts the HTTP server AND attaches Socket.io to it
│
├── tests/
│   ├── unit/                  → tests for individual services/utils in isolation
│   └── integration/           → tests that hit real routes (and simulate concurrent checkout requests!)
│
├── logs/
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml          → orchestrates app + PostgreSQL + Redis (useful for sockets/jobs at scale)
├── package.json
└── README.md
```

**Why a dedicated `sockets/` folder?** Real-time logic has a different lifecycle than HTTP routes (persistent connections, rooms, broadcast logic) and deserves its own home rather than being scattered inside controllers.

**Why a dedicated `ai/` folder?** Keeps recommendation logic swappable — you can start with simple rule-based logic and later upgrade to embeddings without touching the rest of the app, because everything else just calls "give me recommendations for this user."

**Why `jobs/`?** Both the stock-reservation expiry and the recommendation recompute are background processes, not things triggered by a single HTTP request — they belong together, run on a schedule.

---

## 7. Build Order — From Scratch to a Working, Advanced API

This is deliberately ordered so each stage only requires what you've already learned:

1. **Initialize the project** — package manager, Express, Prisma, core dependencies.
2. **Environment configuration** — centralize secrets/settings, never hardcoded.
3. **Design and migrate the full database schema** from Section 5 — get this right early, since real-time and AI features both depend on it.
4. **Build the base Express app** — minimal server with a health-check route.
5. **Authentication** — registration, login, password hashing, tokens, protected-route middleware.
6. **Core CRUD resources** — Categories, Products, one vertical slice (route → controller → service → Prisma → validation → tests) at a time.
7. **Cart & checkout logic**, including the `StockReservation` table's read/write logic and the atomic stock-decrement transaction — this is where you actually solve the race condition at the database level.
8. **Integrate Socket.io** — connect it to the same server, implement rooms per product, and emit events on stock changes and reservation expiry. This is where the real-time layer becomes visible to users.
9. **Orders & Payments** — finalize checkout, integrate a payment provider, update order status.
10. **Behavioral tracking** — start logging `ProductView` and cart/wishlist activity; this data needs to exist before recommendations can be built.
11. **Build the recommendation system** — start with simple rule-based "frequently bought together" logic, get it working end-to-end, then layer in collaborative or embedding-based scoring as you learn more.
12. **Background jobs** — schedule reservation expiry and recommendation recomputation.
13. **Notifications**, tying together order events and real-time push via Socket.io.
14. **Authorization, validation, centralized error handling, and logging** — apply consistently across everything built so far.
15. **Testing** — including simulating two simultaneous checkout requests to prove your race-condition protection actually works.
16. **API documentation** for every endpoint and socket event.

---

## 8. Security Practices to Apply Throughout

- Hash passwords, never store them in plain text.
- Use short-lived access tokens plus refresh tokens for authentication.
- Authenticate Socket.io connections too — don't let anonymous sockets join private rooms or receive another user's notifications.
- Validate and sanitize all incoming data, including data arriving through socket events, not just HTTP.
- Apply rate limiting on sensitive endpoints (login, password reset, checkout attempts).
- Set secure HTTP headers.
- Keep secrets (including AI provider API keys) out of source control — only in environment variables.
- Apply least privilege on database users and API keys.
- Log security-relevant events without logging sensitive data itself.

---

## 9. Testing Strategy

- **Unit tests** — services and utility functions in isolation, mocking the database.
- **Integration tests** — real (test) database, real routes, full request/response cycle.
- **Concurrency tests** — deliberately fire two simultaneous "buy last item" requests in a test and assert only one succeeds. This is the test that actually proves your race-condition fix works, and it's a great thing to be able to describe in an interview.
- **Socket tests** — verify the right events are emitted to the right rooms when stock changes.
- **Recommendation tests** — verify the scoring/ranking logic produces sensible output given known sample behavior data.
- **Test database** — separate from dev/production, reset between runs.

---

## 10. Dockerization

### 10.1 The Dockerfile — What It Represents
1. **Base image** — a lightweight Node.js runtime.
2. **Dependency installation** — copy `package.json` first, install, so Docker caches this layer.
3. **Copy application code**.
4. **Build step** — if compiling (TypeScript), run it here.
5. **Multi-stage build** — one stage installs/builds, a second smaller final stage runs only the compiled output and production dependencies.
6. **Runtime command** — starts `server.js`, which boots both Express and Socket.io together.

### 10.2 docker-compose — Orchestrating Multiple Services
- **app service** — built from your Dockerfile, exposing both the HTTP port and the Socket.io connection (they share the same port).
- **db service** — official PostgreSQL image with a persistent volume.
- **redis service** *(recommended once you scale)* — Socket.io needs a shared adapter (like Redis) once you run more than one instance of your app, so all instances can broadcast events to all connected clients regardless of which instance they're connected to. Worth introducing early even in development, so you're not surprised later.
- **Networking** — compose creates a private network so services reach each other by name.
- **Environment variables** — passed per service, secrets never baked into the image.
- **Volumes** — for database persistence, and optionally live-reload in development.

### 10.3 Dev vs. Production Containers
- **Development** — mounted code for live reload, dev dependencies included, debugging ports exposed.
- **Production** — lean image, production dependencies only, runs as a non-root user.

### 10.4 Running Migrations and Jobs in Docker
- Run Prisma migrations as a controlled step before the app starts (not silently on every boot).
- Background jobs (reservation expiry, recommendation recompute) can run inside the same app container on a schedule, or as a separate "worker" service in docker-compose if they become heavy — separating web traffic handling from background processing is a common scaling pattern worth knowing.

---

## 11. CI/CD and Deployment

### 11.1 Continuous Integration (CI)
On every push/PR:
1. Install dependencies
2. Run linting
3. Run unit, integration, and concurrency tests against a temporary test database
4. Build the Docker image to confirm it builds successfully

### 11.2 Continuous Deployment (CD)
Once CI passes on the main branch:
1. Build and tag the production image
2. Push it to a container registry
3. Deploy to your hosting environment
4. Run pending database migrations
5. Health-check before routing traffic to the new version

### 11.3 Hosting Considerations Specific to This Project
- **Socket.io + multiple instances**: if you scale to more than one app instance, you need "sticky sessions" (so a client stays connected to the same instance) or the Redis adapter mentioned above so events broadcast correctly across instances. This is a real, common gotcha worth understanding before you hit it in production.
- **Managed PostgreSQL** — recommended over self-hosting the database (e.g. AWS RDS, Supabase, Railway Postgres) for automated backups and easier scaling.
- **Background jobs at scale** — consider a dedicated worker process/container separate from your web-facing instances once recommendation recomputation or reservation cleanup becomes resource-intensive.

### 11.4 Environment Management
Maintain development, staging, and production environments, each with its own database, secrets, and — importantly — its own AI provider API keys if you use an external AI service.

### 11.5 Post-Deployment Concerns
- **Monitoring** — uptime, response times, error rates, and socket connection counts.
- **Centralized logging** — aggregate logs across containers.
- **Backups** — automated, regularly tested database backups.
- **Scaling** — vertical first, then horizontal (with the Socket.io scaling considerations above), with the database usually becoming the bottleneck first.
- **Zero-downtime deploys** — roll out gradually so active socket connections and in-progress checkouts aren't abruptly dropped.

---

## 12. Summary — The Full Journey

1. Plan entities, roles, and features — including the real-time and AI requirements from day one
2. Design the full database schema from Section 5
3. Set up the layered folder structure, including `sockets/` and `ai/`
4. Build the skeleton app and connect the database
5. Implement auth, then build core resources one vertical slice at a time
6. Build cart/checkout with atomic stock transactions — the actual race-condition fix
7. Integrate Socket.io for real-time visibility into stock changes
8. Add behavioral tracking, then build the recommendation system, starting simple
9. Add background jobs, notifications, security, validation, and logging
10. Write tests, including concurrency and socket tests
11. Document the API and socket events
12. Containerize with Docker (including Redis for Socket.io scaling)
13. Set up CI/CD
14. Choose hosting aware of Socket.io's multi-instance considerations
15. Monitor, back up, and scale after launch

This is a genuinely senior-level backend project once complete — the combination of correct concurrency handling and a working recommendation pipeline is exactly what shows up in system design interviews at larger companies. Take it one vertical slice at a time and it stays manageable.
