# Sheep Herding Simulation

A lightweight browser simulation where you control a shepherd and chase a flock across an isometric mountainside.

## Features

- Large isometric field with a matching terrain background
- Valley + hill terrain shaping sheep movement
- Pen in the upper-right with an interactive orange gate
- Food piles at the back of the pen
- Sheep flocking behavior: flee from shepherd pressure
- Sheep flocking behavior: soft separation (avoid crowding)
- Sheep flocking behavior: alignment and cohesion (move in loose groups)
- Sheep flocking behavior: random scatter targets for playful chasing
- Collision handling: sheep-sheep collision
- Collision handling: shepherd-sheep collision
- Collision handling: fence and world-boundary collision
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
- Press `G` near the gate to open/close it
- Press `D` to toggle debug mode

## Debug Weights YAML

- Export from debug panel: `Export YAML`
- Default preset path loaded on startup (when served): `config/sheep-weights.yml`
