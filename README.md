# Sheep Herding Simulation

A lightweight browser simulation of sheep on a mountainside being herded into a sheep pen.

### Scene

-  Valley and a hill
-  Pen with a dor open

### Game Engine
 - Rendering is isometric.
 - Debug mode to draw the grid on the scene

### Collision engine
 - Sheep should not be able to be in the same place at same time, collision of sheep
 - Shepard should have same collision rules as sheep

### Implementation
 - Javascript 

### non-functional
 - print build time at top in debug mode 

## Run

Open `index.html` in your browser.

If you prefer a local server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Controls

- Move your pointer/finger on the canvas to move the shepherd.
- Push sheep uphill and guide them into the fenced pen in the upper-right.
- Press `G` near the orange gate to close/open it.
