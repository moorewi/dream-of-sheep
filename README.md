# Sheep Herding Simulation

A lightweight browser simulation where you control a shepherd and chase a flock across an isometric mountainside.

## Features

- Responsive isometric world that fits the window
- Irregular playable field shape (not a rectangle)
- Blue-sky backdrop with layered mountain silhouettes
- Valley + hill terrain shaping sheep movement
- Decorative trees around the landscape
- Pen in the upper-right with an interactive orange gate
- Food piles at the back of the pen
- Sheep AI behavior: flee from shepherd pressure
- Sheep AI behavior: soft separation (avoid crowding)
- Sheep AI behavior: alignment and cohesion (run in loose flock groups)
- Sheep AI behavior: random scatter targets to keep chases dynamic
- Collision handling: sheep-sheep collision
- Collision handling: shepherd-sheep collision
- Collision handling: fence and irregular boundary collision
- Shepherd facing direction and sprint burst on click/tap
- Pause mode with custom paused overlay styling
- Debug tools: grid toggle
- Debug tools: build timestamp display
- Debug tools: live weight sliders
- Debug tools: YAML export/import preset flow

## Implementation

- Vanilla JavaScript + HTML Canvas

## Run

Open `index.html` directly, or run a local server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Controls

- Move pointer/finger on the canvas to move the shepherd
- Click/tap to trigger a short sprint burst
- Press `G` near the gate to open/close it
- Press `P` or click `Pause` to pause/resume
- Press `D` to toggle debug mode

## Debug Weights YAML

- Export from debug panel: `Export YAML`
- Default preset path loaded on startup (when served): `config/sheep-weights.yml`
