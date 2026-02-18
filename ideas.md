# Dream of Sheep Ideas

## Vision
Turn the current herding sandbox into a progression-based game with users, levels, score chasing, and replayable challenge modes.

## Core Game Loop
- Start level with objective (`herd N sheep in T time`).
- Use pressure-and-release movement to control flock behavior.
- Close/open gate strategically.
- Win by meeting level objective.
- Fail by timeout or challenge-specific failure condition.

## Progression
- Level stars based on score/time/efficiency.
- Unlock next levels via star thresholds.
- Track best run per level per player.

## Backend Needs
- User accounts and auth.
- Save progress and best scores.
- Leaderboards per level.
- Versioned level delivery.

### Suggested Backend Stack
- API: Node.js + Fastify.
- DB: Postgres.
- Auth: Clerk/Auth0/Supabase Auth.
- Hosting: Vercel/Render/Fly + managed Postgres.

## Data Model (Starter)
- `users(id, auth_provider_id, name, created_at)`
- `levels(id, slug, mode, seed, config_json, difficulty, version, published, created_at)`
- `runs(id, user_id, level_id, score, time_ms, sheep_saved, created_at)`
- `progress(user_id, level_id, best_score, best_time_ms, stars, updated_at)`

## API (Starter)
- `GET /levels`
- `GET /levels/:id`
- `POST /runs`
- `GET /leaderboard?levelId=...`
- `GET /me/progress`
- `POST /levels/generate` (seeded procedural draft)
- `POST /levels/import` (import curated JSON)

## Level Strategy
Use all three, with clear roles:

1. Curated levels in DB (source of truth for shipped progression)
- Balanced and hand-tuned.
- Versioned/published.

2. Level generator (for replayability)
- Seeded generation for infinite/challenge mode.
- Save strong generated levels into curated pool.

3. Level JSON repo (content workflow)
- Store human-editable level files in git.
- Import script syncs JSON -> DB.
- Enables review/PR workflow for level design.

## Level Config Shape (Draft)
- Map shape/irregular boundary profile.
- Sheep count + sheep trait distribution.
- Pen + gate position.
- Tree/boulder/hazard placement.
- Weather/visibility modifiers.
- Win/fail conditions.
- Scoring rules.

## Challenge/Danger Ideas
- Mud patches (slow movement).
- Brambles/rough ground (scatter/panic modifiers).
- Steep zones (harder uphill control).
- Predator scare events that split flock.
- Fog/night variants reducing visibility.

## Sheep Variety Ideas
- Timid sheep: panic early.
- Stubborn sheep: weaker response to shepherd.
- Leader sheep: local flock influence.
- Tagged sheep: bonus objective targets.

## Immediate Next Milestones
1. Implement level config loader in frontend.
2. Add win/fail UI + post-level score summary.
3. Scaffold backend + Postgres schema.
4. Add run submission + leaderboard endpoint.
5. Add curated level JSON import pipeline.
6. Add seeded generator endpoint for challenge mode.

## Product Modes
- Campaign: curated progression.
- Daily challenge: fixed seed each day.
- Endless challenge: generated seeds, global leaderboard.
