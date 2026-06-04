(() => {
  const canvas = document.getElementById("world");
  const ctx = canvas.getContext("2d");
  const sheepCountEl = document.getElementById("sheepCount");
  const gateStatusEl = document.getElementById("gateStatus");
  const sprintStatusEl = document.getElementById("sprintStatus");
  const sprintBarEl = document.getElementById("sprintBar");
  const sheepRosterEl = document.getElementById("sheepRoster");
  const pauseBtnEl = document.getElementById("pauseBtn");
  const buildStampEl = document.getElementById("buildStamp");
  const debugPanelEl = document.getElementById("debugPanel");
  const weightControlsEl = document.getElementById("weightControls");
  const exportYamlBtn = document.getElementById("exportYaml");

  const world = {
    width: 42,
    height: 30,
    tileW: 54,
    tileH: 28,
    elevationScale: 16,
  };
  const terrainAnchors = {
    hillX: world.width - 6,
    hillY: 5.2,
    valleyX: world.width * 0.27,
    valleyY: world.height * 0.8,
  };
  const backgroundPad = 8;

  const camera = {
    x: 0,
    y: 0,
  };
  const fixedViewScale = 0.62;
  let viewScale = fixedViewScale;

  const pointer = {
    active: false,
    sprintHeld: false,
    worldX: world.width * 0.3,
    worldY: world.height * 0.7,
  };

  const pen = {
    x1: 33,
    y1: 3,
    x2: 40,
    y2: 11,
    doorY: 6.2,
    doorSize: 1.5,
  };
  const gate = {
    closed: false,
    interactRadius: 1.2,
  };
  const foodPiles = [
    { x: 38, y: 4.1, amount: 1 },
    { x: 37, y: 5.3, amount: 1 },
    { x: 39, y: 5.1, amount: 1 },
    { x: 36.2, y: 4.4, amount: 1 },
  ];
  const treeSeeds = [
    { x: 3.2, y: 5.4, size: 1.1 },
    { x: 5.7, y: 3.8, size: 1.2 },
    { x: 8.9, y: 4.6, size: 1.05 },
    { x: 11.4, y: 6.2, size: 1.15 },
    { x: 2.8, y: 11.1, size: 1.2 },
    { x: 6.3, y: 12.7, size: 1.1 },
    { x: 10.1, y: 13.5, size: 1.25 },
    { x: 36.2, y: 20.4, size: 1.25 },
    { x: 39, y: 22.1, size: 1.2 },
    { x: 33.7, y: 23.8, size: 1.15 },
    { x: 30.4, y: 24.6, size: 1.05 },
    { x: 24.6, y: 19.2, size: 1.1 },
    { x: 26.9, y: 15.4, size: 1.05 },
    { x: 22.2, y: 6.4, size: 1.15 },
    { x: 13.8, y: 3.6, size: 1.1 },
    { x: 16.2, y: 5.1, size: 1.25 },
    { x: 18.7, y: 4.2, size: 1.05 },
    { x: 14.1, y: 10.2, size: 1.2 },
    { x: 17.5, y: 12.1, size: 1.1 },
    { x: 20.3, y: 14.4, size: 1.15 },
    { x: 9.7, y: 18.1, size: 1.25 },
    { x: 12.9, y: 20.3, size: 1.1 },
    { x: 15.6, y: 22.5, size: 1.05 },
    { x: 19.4, y: 24.1, size: 1.2 },
    { x: 24.1, y: 24.8, size: 1.15 },
    { x: 27.7, y: 21.7, size: 1.1 },
    { x: 31.4, y: 19.3, size: 1.2 },
    { x: 34.6, y: 17.8, size: 1.05 },
    { x: 6.1, y: 22.2, size: 1.2 },
    { x: 4.3, y: 18.9, size: 1.05 },
    { x: 2.6, y: 15.8, size: 1.15 },
  ];
  const edgeTreeRows = [2.2, 4.6, 7.1, 9.8, 12.4, 15.2, 18.3, 21.1, 24.2, 27.0];
  const edgeTrees = edgeTreeRows.flatMap((y, i) => {
    const row = getRowBounds(y);
    const left = {
      x: row.minX + 0.55 + (i % 2) * 0.28,
      y,
      size: 1.05 + ((i * 0.17) % 0.35),
    };
    const rightSideBlockedByPen = y > pen.y1 - 0.7 && y < pen.y2 + 0.7;
    if (rightSideBlockedByPen) {
      return [left];
    }
    const right = {
      x: row.maxX - 0.6 - ((i + 1) % 2) * 0.25,
      y: y + ((i % 3) - 1) * 0.18,
      size: 1.08 + ((i * 0.13) % 0.42),
    };
    return [left, right];
  });
  const treeTypes = ["round", "pine", "bushy", "lean"];
  const trees = treeSeeds.concat(edgeTrees).map((t, i) => {
    const jitter = 0.8 + (Math.sin(i * 2.17) + 1) * 0.2;
    return {
      x: t.x,
      y: t.y,
      size: Number((Math.max(1.6, t.size * jitter * 2)).toFixed(2)),
      type: treeTypes[i % treeTypes.length],
    };
  });
  const boulders = [
    { x: 7.4, y: 8.1, size: 1.9 },
    { x: 12.2, y: 16.8, size: 2.2 },
    { x: 20.8, y: 11.9, size: 1.8 },
    { x: 25.4, y: 22.3, size: 2.4 },
    { x: 31.8, y: 14.6, size: 2.1 },
    { x: 35.2, y: 25.1, size: 1.9 },
    { x: 15.7, y: 25.6, size: 2.3 },
  ];
  const staticObstacles = trees
    .map((t) => ({ x: t.x, y: t.y, radius: Math.max(0.45, t.size * 0.34) }))
    .concat(boulders.map((b) => ({ x: b.x, y: b.y, radius: Math.max(0.7, b.size * 0.52) })));

  const shepherd = {
    x: world.width * 0.25,
    y: world.height * 0.72,
    radius: 0.34,
    speed: 6.6,
    heading: 0,
    sprintMultiplier: 1.26,
    sprintEnergy: 1,
    sprintDrainRate: 0.95,
    sprintRegenRate: 0.34,
    sprinting: false,
  };

  const SHEEP_TOTAL = 18;
  const sheepNames = [
    "Mabel", "Poppy", "Hazel", "Mochi", "Daisy", "Bramble",
    "Juniper", "Nettle", "Biscuit", "Clover", "Maple", "Willow",
    "Pebble", "Skipper", "Fern", "Toffee", "Sage", "Luna",
    "Tilly", "Milo", "Dot", "Wren", "Roo", "Patches",
  ];
  const sheep = [];
  for (let i = 0; i < SHEEP_TOTAL; i += 1) {
    sheep.push({
      x: 6 + Math.random() * 11,
      y: 16 + Math.random() * 9,
      vx: 0,
      vy: 0,
      radius: 0.31,
      wanderAngle: Math.random() * Math.PI * 2,
      panic: 0,
      heading: Math.random() * Math.PI * 2,
      scatterX: 0,
      scatterY: 0,
      scatterTimer: 0,
      name: sheepNames[i] || `Sheep ${String(i + 1).padStart(2, "0")}`,
    });
  }

  const penFenceSegments = [
    [pen.x1, pen.y1, pen.x2, pen.y1],
    [pen.x2, pen.y1, pen.x2, pen.y2],
    [pen.x1, pen.y2, pen.x2, pen.y2],
    [pen.x1, pen.y1, pen.x1, pen.doorY],
    [pen.x1, pen.doorY + pen.doorSize, pen.x1, pen.y2],
  ];

  let debugGrid = false;
  let paused = false;
  const pauseFont = "Rubik";
  let rosterUpdateTimer = 0;
  let lastT = performance.now();
  const buildTime = new Date().toLocaleString();
  const weightDefs = [
    { key: "speedBase", label: "Speed Base", min: 0.2, max: 2.5, step: 0.01 },
    { key: "panicSpeedBoost", label: "Panic Speed Boost", min: 0, max: 4, step: 0.01 },
    { key: "downhillBase", label: "Downhill Base", min: 0, max: 1.5, step: 0.01 },
    { key: "downhillPanicDecay", label: "Downhill Panic Decay", min: 0, max: 1.5, step: 0.01 },
    { key: "penBase", label: "Pen Base", min: 0, max: 1.5, step: 0.01 },
    { key: "penPanicBoost", label: "Pen Panic Boost", min: 0, max: 2, step: 0.01 },
    { key: "wanderBase", label: "Wander Base", min: 0, max: 1.2, step: 0.01 },
    { key: "wanderPanicDecay", label: "Wander Panic Decay", min: 0, max: 1.2, step: 0.01 },
    { key: "fearWeight", label: "Fear Weight", min: 0, max: 3, step: 0.01 },
  ];
  const behaviorWeights = {
    speedBase: 1.05,
    panicSpeedBoost: 1.7,
    downhillBase: 0.48,
    downhillPanicDecay: 0.65,
    penBase: 0.2,
    penPanicBoost: 0.82,
    wanderBase: 0.4,
    wanderPanicDecay: 0.2,
    fearWeight: 1.65,
  };
  const trailResolution = 5;
  const trailGridWidth = world.width * trailResolution;
  const trailGridHeight = world.height * trailResolution;
  const trailWear = new Float32Array(trailGridWidth * trailGridHeight);

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function length(x, y) {
    return Math.hypot(x, y);
  }

  function normalize(x, y) {
    const l = length(x, y);
    if (!l) {
      return [0, 0];
    }
    return [x / l, y / l];
  }

  function trailIndex(tx, ty) {
    return ty * trailGridWidth + tx;
  }

  function sampleTrailWear(x, y) {
    const gx = clamp(Math.floor(x * trailResolution), 0, trailGridWidth - 1);
    const gy = clamp(Math.floor(y * trailResolution), 0, trailGridHeight - 1);
    return trailWear[trailIndex(gx, gy)];
  }

  function stampTrailWear(x, y, amount) {
    const cx = clamp(Math.floor(x * trailResolution), 0, trailGridWidth - 1);
    const cy = clamp(Math.floor(y * trailResolution), 0, trailGridHeight - 1);
    const radius = 2;
    for (let oy = -radius; oy <= radius; oy += 1) {
      for (let ox = -radius; ox <= radius; ox += 1) {
        const nx = cx + ox;
        const ny = cy + oy;
        if (nx < 0 || ny < 0 || nx >= trailGridWidth || ny >= trailGridHeight) {
          continue;
        }
        const d = Math.hypot(ox, oy);
        if (d > radius + 0.01) {
          continue;
        }
        const falloff = 1 - d / (radius + 0.01);
        const nIdx = trailIndex(nx, ny);
        trailWear[nIdx] = clamp(trailWear[nIdx] + amount * (0.35 + falloff * 0.65), 0, 1);
      }
    }
  }

  function getRowBounds(y) {
    const t = clamp(y / Math.max(1, world.height - 1), 0, 1);
    const leftInset = 1.8 + Math.sin(t * 3.8 + 0.6) * 1.05 + (1 - t) * 2.2;
    const rightInset = 0.7 + Math.sin(t * 4.4 + 1.8) * 0.35 + t * 1.6;
    const minX = clamp(leftInset, 0.5, world.width - 7);
    const maxX = clamp(world.width - rightInset, minX + 6.5, world.width - 0.5);
    return { minX, maxX };
  }

  function isInPlayableArea(x, y, margin = 0) {
    if (y < margin || y > world.height - margin) {
      return false;
    }
    const bounds = getRowBounds(clamp(y, 0, world.height));
    return x >= bounds.minX + margin && x <= bounds.maxX - margin;
  }

  function wrapAngle(a) {
    let out = a;
    while (out > Math.PI) {
      out -= Math.PI * 2;
    }
    while (out < -Math.PI) {
      out += Math.PI * 2;
    }
    return out;
  }

  function turnToward(current, target, maxStep) {
    const delta = wrapAngle(target - current);
    if (Math.abs(delta) <= maxStep) {
      return target;
    }
    return current + Math.sign(delta) * maxStep;
  }

  function terrainHeight(x, y) {
    const hillDx = x - terrainAnchors.hillX;
    const hillDy = y - terrainAnchors.hillY;
    const hill = Math.exp(-(hillDx * hillDx + hillDy * hillDy) / 90) * 4.6;

    const valleyDx = x - terrainAnchors.valleyX;
    const valleyDy = y - terrainAnchors.valleyY;
    const valley = Math.exp(-(valleyDx * valleyDx + valleyDy * valleyDy) / 70) * 2.4;

    const ripple = Math.sin((x + y) * 0.6) * 0.16;
    return hill - valley + ripple;
  }

  function worldToScreen(x, y, z = 0) {
    const tileW = world.tileW * viewScale;
    const tileH = world.tileH * viewScale;
    const elev = world.elevationScale * viewScale;
    return {
      x: camera.x + (x - y) * (tileW / 2),
      y: camera.y + (x + y) * (tileH / 2) - z * elev,
    };
  }

  function screenToWorld(x, y) {
    const tileW = world.tileW * viewScale;
    const tileH = world.tileH * viewScale;
    const dx = x - camera.x;
    const dy = y - camera.y;
    const wx = (dx / (tileW / 2) + dy / (tileH / 2)) * 0.5;
    const wy = (dy / (tileH / 2) - dx / (tileW / 2)) * 0.5;
    return { x: wx, y: wy };
  }

  function getTerrainZRange() {
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (let y = 0; y <= world.height; y += 1) {
      for (let x = 0; x <= world.width; x += 1) {
        const z = terrainHeight(x, y);
        if (z < minZ) {
          minZ = z;
        }
        if (z > maxZ) {
          maxZ = z;
        }
      }
    }
    return { minZ, maxZ };
  }

  function resize() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { minZ, maxZ } = getTerrainZRange();
    viewScale = fixedViewScale;

    const tileW = world.tileW * viewScale;
    const tileH = world.tileH * viewScale;
    const elev = world.elevationScale * viewScale;
    const minXNoCamera = -world.height * (tileW / 2);
    const maxXNoCamera = world.width * (tileW / 2);
    const minYNoCamera = -maxZ * elev;
    const maxYNoCamera = (world.width + world.height) * (tileH / 2) - minZ * elev;

    camera.x = (rect.width - (maxXNoCamera - minXNoCamera)) * 0.5 - minXNoCamera;
    camera.y = (rect.height - (maxYNoCamera - minYNoCamera)) * 0.5 - minYNoCamera;
  }

  function segmentPush(entity, x1, y1, x2, y2) {
    const vx = x2 - x1;
    const vy = y2 - y1;
    const wx = entity.x - x1;
    const wy = entity.y - y1;
    const c1 = wx * vx + wy * vy;
    const c2 = vx * vx + vy * vy;
    const t = c2 ? clamp(c1 / c2, 0, 1) : 0;
    const cx = x1 + vx * t;
    const cy = y1 + vy * t;
    const dx = entity.x - cx;
    const dy = entity.y - cy;
    const dist = Math.hypot(dx, dy);
    const minDist = entity.radius + 0.03;

    if (dist > 0 && dist < minDist) {
      const push = (minDist - dist) * 1.02;
      entity.x += (dx / dist) * push;
      entity.y += (dy / dist) * push;
    } else if (dist === 0) {
      entity.x += 0.01;
      entity.y += 0.01;
    }
  }

  function enforceWorldBounds(entity) {
    entity.y = clamp(entity.y, entity.radius, world.height - entity.radius);
    const row = getRowBounds(entity.y);
    const minX = row.minX + entity.radius;
    const maxX = row.maxX - entity.radius;
    if (maxX <= minX) {
      entity.x = (minX + maxX) * 0.5;
      return;
    }
    entity.x = clamp(entity.x, minX, maxX);
  }

  function collideFences(entity) {
    for (const [x1, y1, x2, y2] of getCollisionFenceSegments()) {
      segmentPush(entity, x1, y1, x2, y2);
    }
  }

  function getCollisionFenceSegments() {
    if (!gate.closed) {
      return penFenceSegments;
    }
    return penFenceSegments.concat([[pen.x1, pen.doorY, pen.x1, pen.doorY + pen.doorSize]]);
  }

  function getGateMidpoint() {
    return {
      x: pen.x1,
      y: pen.doorY + pen.doorSize * 0.5,
    };
  }

  function isShepherdNearGate() {
    const mid = getGateMidpoint();
    return Math.hypot(shepherd.x - mid.x, shepherd.y - mid.y) <= gate.interactRadius;
  }

  function syncGateStatus() {
    if (!gateStatusEl) {
      return;
    }
    const near = isShepherdNearGate();
    const interactHint = near ? " (press G)" : "";
    gateStatusEl.textContent = `Gate: ${gate.closed ? "Closed" : "Open"}${interactHint}`;
  }

  function syncSprintHud() {
    if (!sprintStatusEl || !sprintBarEl) {
      return;
    }
    const ratio = clamp(shepherd.sprintEnergy, 0, 1);
    sprintBarEl.style.width = `${(ratio * 100).toFixed(1)}%`;
    sprintStatusEl.textContent = shepherd.sprinting
      ? `Power: ${(ratio * 100).toFixed(0)}% (sprinting)`
      : `Power: ${(ratio * 100).toFixed(0)}%`;
  }

  function getSheepMood(s) {
    if (isInPen(s)) {
      return { label: "happy/eating", cls: "is-eating", icon: "*" };
    }
    if (s.panic > 0.66) {
      return { label: "panicked", cls: "is-panicked", icon: "!!" };
    }
    if (s.panic > 0.32) {
      return { label: "nervous", cls: "is-nervous", icon: "~" };
    }
    if (Math.hypot(s.vx, s.vy) < 0.42) {
      return { label: "calm", cls: "is-calm", icon: "-" };
    }
    return { label: "roaming", cls: "is-roaming", icon: ">" };
  }

  function syncSheepRoster() {
    if (!sheepRosterEl) {
      return;
    }
    const fragment = document.createDocumentFragment();
    for (const s of sheep) {
      const mood = getSheepMood(s);
      const item = document.createElement("li");
      const name = document.createElement("span");
      const icon = document.createElement("span");
      const moodTag = document.createElement("span");
      item.className = `sheep-row ${mood.cls}`;
      name.className = "sheep-name";
      icon.className = "sheep-icon";
      icon.textContent = mood.icon;
      name.textContent = s.name;
      moodTag.className = `sheep-mood ${mood.cls}`;
      moodTag.textContent = mood.label;
      name.prepend(icon);
      item.appendChild(name);
      item.appendChild(moodTag);
      fragment.appendChild(item);
    }
    sheepRosterEl.replaceChildren(fragment);
  }

  function syncPauseButton() {
    if (!pauseBtnEl) {
      return;
    }
    pauseBtnEl.textContent = paused ? "Resume" : "Pause";
  }

  function togglePause() {
    paused = !paused;
    syncPauseButton();
  }

  function separateEntities(a, b, extra = 0.02) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy);
    const target = a.radius + b.radius + extra;

    if (!dist || dist >= target) {
      return;
    }

    const nx = dx / dist;
    const ny = dy / dist;
    const push = (target - dist) * 0.5;
    a.x -= nx * push;
    a.y -= ny * push;
    b.x += nx * push;
    b.y += ny * push;
  }

  function collideStaticObstacles(entity) {
    for (const obstacle of staticObstacles) {
      const dx = entity.x - obstacle.x;
      const dy = entity.y - obstacle.y;
      const dist = Math.hypot(dx, dy);
      const minDist = entity.radius + obstacle.radius;
      if (dist <= 0.0001) {
        entity.x += 0.01;
        entity.y += 0.01;
        continue;
      }
      if (dist < minDist) {
        const push = minDist - dist;
        entity.x += (dx / dist) * push;
        entity.y += (dy / dist) * push;
      }
    }
  }

  function isInPen(entity) {
    return (
      entity.x > pen.x1 + 0.25 &&
      entity.x < pen.x2 - 0.25 &&
      entity.y > pen.y1 + 0.25 &&
      entity.y < pen.y2 - 0.25
    );
  }

  function update(dt) {
    for (let i = 0; i < trailWear.length; i += 1) {
      trailWear[i] = Math.max(0, trailWear[i] - dt * 0.01);
    }

    const sprintRequested = pointer.sprintHeld;
    if (sprintRequested && shepherd.sprintEnergy > 0.001) {
      shepherd.sprinting = true;
      shepherd.sprintEnergy = Math.max(0, shepherd.sprintEnergy - shepherd.sprintDrainRate * dt);
    } else {
      shepherd.sprinting = false;
      shepherd.sprintEnergy = Math.min(1, shepherd.sprintEnergy + shepherd.sprintRegenRate * dt);
    }

    const toTargetX = pointer.worldX - shepherd.x;
    const toTargetY = pointer.worldY - shepherd.y;
    const distToTarget = Math.hypot(toTargetX, toTargetY);

    if (pointer.active && distToTarget > 0.02) {
      const sprintBoost = shepherd.sprinting ? shepherd.sprintMultiplier : 1;
      const step = Math.min(distToTarget, shepherd.speed * sprintBoost * dt);
      const moveX = (toTargetX / distToTarget) * step;
      const moveY = (toTargetY / distToTarget) * step;
      shepherd.x += (toTargetX / distToTarget) * step;
      shepherd.y += (toTargetY / distToTarget) * step;
      const screenDirX = moveX - moveY;
      const screenDirY = moveX + moveY;
      if (Math.hypot(screenDirX, screenDirY) > 0.001) {
        shepherd.heading = turnToward(
          shepherd.heading,
          Math.atan2(screenDirY, screenDirX),
          8 * dt
        );
      }
    }

    for (let i = 0; i < sheep.length; i += 1) {
      const s = sheep[i];
      const inPenNow = isInPen(s);
      s.wanderAngle += (Math.random() - 0.5) * 0.95;

      const [wanderX, wanderY] = [Math.cos(s.wanderAngle), Math.sin(s.wanderAngle)];
      const peakDx = s.x - terrainAnchors.hillX;
      const peakDy = s.y - terrainAnchors.hillY;
      const [downhillX, downhillY] = normalize(peakDx, peakDy);

      const fromShepherdX = s.x - shepherd.x;
      const fromShepherdY = s.y - shepherd.y;
      const shepherdDist = Math.hypot(fromShepherdX, fromShepherdY);
      const fearRadius = 5.4;
      let fearX = 0;
      let fearY = 0;

      if (!inPenNow && shepherdDist < fearRadius) {
        const panic = (fearRadius - shepherdDist) / fearRadius;
        s.panic = panic;
        fearX = (fromShepherdX / Math.max(0.001, shepherdDist)) * panic;
        fearY = (fromShepherdY / Math.max(0.001, shepherdDist)) * panic;
      } else {
        s.panic *= inPenNow ? 0.82 : 0.94;
      }

      s.scatterTimer -= dt;
      if (
        s.scatterTimer <= 0 ||
        Math.hypot(s.scatterX - s.x, s.scatterY - s.y) < 0.9
      ) {
        const roamRange = 7 + Math.random() * 5;
        const roamAngle = Math.random() * Math.PI * 2;
        s.scatterX = clamp(s.x + Math.cos(roamAngle) * roamRange, 1, world.width - 1);
        s.scatterY = clamp(s.y + Math.sin(roamAngle) * roamRange, 1, world.height - 1);
        s.scatterTimer = 1.8 + Math.random() * 2.7;
      }
      const [scatterX, scatterY] = normalize(s.scatterX - s.x, s.scatterY - s.y);
      let nearestFood = foodPiles[0];
      let nearestFoodDist = Infinity;
      for (const pile of foodPiles) {
        const dx = pile.x - s.x;
        const dy = pile.y - s.y;
        const d = Math.hypot(dx, dy);
        if (d < nearestFoodDist) {
          nearestFoodDist = d;
          nearestFood = pile;
        }
      }
      const foodBiasX = nearestFood.x - s.x;
      const foodBiasY = nearestFood.y - s.y;
      const [foodX, foodY] = normalize(foodBiasX, foodBiasY);
      let separateX = 0;
      let separateY = 0;
      let alignX = 0;
      let alignY = 0;
      let centerX = 0;
      let centerY = 0;
      let flockCount = 0;
      const desiredGap = s.radius * 2.2;
      const neighborRadius = desiredGap * 1.8;
      const flockRadius = 4.2;
      for (let j = 0; j < sheep.length; j += 1) {
        if (j === i) {
          continue;
        }
        const other = sheep[j];
        const dx = s.x - other.x;
        const dy = s.y - other.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= 0.0001 || dist > neighborRadius) {
          if (dist > flockRadius) {
            continue;
          }
        }
        if (dist <= flockRadius) {
          centerX += other.x;
          centerY += other.y;
          alignX += other.vx;
          alignY += other.vy;
          flockCount += 1;
        }
        if (dist > neighborRadius || dist <= 0.0001) {
          continue;
        }
        const closeness = clamp((neighborRadius - dist) / neighborRadius, 0, 1);
        const pressure = closeness * closeness;
        separateX += (dx / dist) * pressure;
        separateY += (dy / dist) * pressure;
      }
      const [sepX, sepY] = normalize(separateX, separateY);
      let cohX = 0;
      let cohY = 0;
      let aliX = 0;
      let aliY = 0;
      if (flockCount > 0) {
        const avgX = centerX / flockCount;
        const avgY = centerY / flockCount;
        [cohX, cohY] = normalize(avgX - s.x, avgY - s.y);
        [aliX, aliY] = normalize(alignX / flockCount, alignY / flockCount);
      }

      const speed = (behaviorWeights.speedBase + s.panic * behaviorWeights.panicSpeedBoost) * (inPenNow ? 0.58 : 1);
      const downhillWeight = Math.max(
        0,
        behaviorWeights.downhillBase * (1 - s.panic * behaviorWeights.downhillPanicDecay)
      );
      const wanderWeight = Math.max(0, behaviorWeights.wanderBase - s.panic * behaviorWeights.wanderPanicDecay);
      const fearWeight = behaviorWeights.fearWeight;
      const separationWeight = 0.9 + s.panic * 0.25;
      const scatterWeight = Math.max(0.08, 0.34 - s.panic * 0.22);
      const fearDrive = fearWeight * (1.25 + s.panic * 1.15);
      const cohesionWeight = Math.max(0.05, 0.32 - s.panic * 0.18);
      const alignmentWeight = Math.max(0.04, 0.28 - s.panic * 0.16);
      const foodWeightBase = inPenNow ? 1.35 : 0;
      const foodWeight = foodWeightBase * clamp((8 - nearestFoodDist) / 8, 0, 1);

      s.vx = (
        wanderX * wanderWeight +
        scatterX * scatterWeight +
        downhillX * downhillWeight +
        fearX * fearDrive +
        cohX * cohesionWeight +
        aliX * alignmentWeight +
        sepX * separationWeight +
        foodX * foodWeight
      ) * speed;
      s.vy = (
        wanderY * wanderWeight +
        scatterY * scatterWeight +
        downhillY * downhillWeight +
        fearY * fearDrive +
        cohY * cohesionWeight +
        aliY * alignmentWeight +
        sepY * separationWeight +
        foodY * foodWeight
      ) * speed;

      s.x += s.vx * dt;
      s.y += s.vy * dt;

      const screenDirX = s.vx - s.vy;
      const screenDirY = s.vx + s.vy;
      const screenSpeed = Math.hypot(screenDirX, screenDirY);
      if (screenSpeed > 0.02) {
        const targetHeading = Math.atan2(screenDirY, screenDirX);
        const maxTurnRate = 2.6 + s.panic * 1.4;
        s.heading = turnToward(s.heading, targetHeading, maxTurnRate * dt);
      }
    }

    for (let n = 0; n < 3; n += 1) {
      for (let i = 0; i < sheep.length; i += 1) {
        collideFences(sheep[i]);
        collideStaticObstacles(sheep[i]);
        enforceWorldBounds(sheep[i]);
      }

      for (let i = 0; i < sheep.length; i += 1) {
        for (let j = i + 1; j < sheep.length; j += 1) {
          separateEntities(sheep[i], sheep[j]);
        }
      }

      for (let i = 0; i < sheep.length; i += 1) {
        separateEntities(shepherd, sheep[i], 0.03);
      }

      collideFences(shepherd);
      collideStaticObstacles(shepherd);
      enforceWorldBounds(shepherd);
    }

    for (let i = 0; i < sheep.length; i += 1) {
      const s = sheep[i];
      if (isInPlayableArea(s.x, s.y)) {
        const effort = Math.hypot(s.vx, s.vy);
        stampTrailWear(s.x, s.y, dt * (0.22 + effort * 0.11));
      }
    }

    const penned = sheep.filter(isInPen).length;
    sheepCountEl.textContent = `Sheep: ${penned}/${SHEEP_TOTAL}`;
    syncGateStatus();
    syncSprintHud();
    rosterUpdateTimer -= dt;
    if (rosterUpdateTimer <= 0) {
      syncSheepRoster();
      rosterUpdateTimer = 0.22;
    }
  }

  function drawTile(x, y, backdrop = false) {
    const z00 = terrainHeight(x, y) + (backdrop ? backdropLift(x, y) : 0);
    const z10 = terrainHeight(x + 1, y) + (backdrop ? backdropLift(x + 1, y) : 0);
    const z11 = terrainHeight(x + 1, y + 1) + (backdrop ? backdropLift(x + 1, y + 1) : 0);
    const z01 = terrainHeight(x, y + 1) + (backdrop ? backdropLift(x, y + 1) : 0);

    const p0 = worldToScreen(x, y, z00);
    const p1 = worldToScreen(x + 1, y, z10);
    const p2 = worldToScreen(x + 1, y + 1, z11);
    const p3 = worldToScreen(x, y + 1, z01);

    const avg = (z00 + z10 + z11 + z01) * 0.25;
    const tone = clamp((avg + 1.2) / 5, 0, 1);
    let hue = backdrop ? 103 - tone * 10 : 98 - tone * 18;
    let sat = backdrop ? 12 + tone * 12 : 22 + tone * 24;
    let lit = backdrop ? 46 + tone * 12 : 40 + tone * 14;
    const alpha = backdrop ? 0.72 : 1;

    if (!backdrop) {
      const wear = sampleTrailWear(x + 0.5, y + 0.5);
      if (wear > 0) {
        if (wear < 0.55) {
          hue -= wear * 10;
          sat += wear * 5;
          lit -= wear * 13;
        } else {
          const k = (wear - 0.55) / 0.45;
          hue = hue * (1 - k) + 31 * k;
          sat = sat * (1 - k) + 34 * k;
          lit = lit * (1 - k) + 28 * k;
        }
      }
    }

    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.fillStyle = `hsl(${hue} ${sat}% ${lit}% / ${alpha})`;
    ctx.fill();

    if (debugGrid && !backdrop) {
      ctx.strokeStyle = "rgba(15, 30, 14, 0.28)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function backdropLift(x, y) {
    const ox = x < 0 ? -x : x > world.width ? x - world.width : 0;
    const oy = y < 0 ? -y : y > world.height ? y - world.height : 0;
    const edgeDist = Math.hypot(ox, oy);
    const topBias = clamp((-y + 2) / (backgroundPad + 2), 0, 1);
    const leftBias = clamp((-x + 2) / (backgroundPad + 2), 0, 1);
    return edgeDist * 0.16 + topBias * 2.4 + leftBias * 1.1;
  }

  function drawMountainSilhouette(width, height) {
    const yBase = height * 0.42;
    const ridgeA = [
      [0, yBase + 46],
      [width * 0.08, yBase + 10],
      [width * 0.15, yBase - 22],
      [width * 0.24, yBase + 2],
      [width * 0.34, yBase - 36],
      [width * 0.43, yBase + 8],
      [width * 0.55, yBase - 28],
      [width * 0.66, yBase + 3],
      [width * 0.79, yBase - 32],
      [width * 0.9, yBase + 12],
      [width, yBase + 26],
      [width, height],
      [0, height],
    ];
    const ridgeB = [
      [0, yBase + 70],
      [width * 0.12, yBase + 38],
      [width * 0.21, yBase + 58],
      [width * 0.33, yBase + 30],
      [width * 0.47, yBase + 62],
      [width * 0.61, yBase + 34],
      [width * 0.75, yBase + 64],
      [width * 0.89, yBase + 42],
      [width, yBase + 58],
      [width, height],
      [0, height],
    ];

    const bgGrad = ctx.createLinearGradient(0, yBase - 50, 0, height);
    bgGrad.addColorStop(0, "rgba(66, 88, 99, 0.5)");
    bgGrad.addColorStop(1, "rgba(56, 79, 66, 0.68)");
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.moveTo(ridgeA[0][0], ridgeA[0][1]);
    for (let i = 1; i < ridgeA.length; i += 1) {
      ctx.lineTo(ridgeA[i][0], ridgeA[i][1]);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(43, 63, 50, 0.45)";
    ctx.beginPath();
    ctx.moveTo(ridgeB[0][0], ridgeB[0][1]);
    for (let i = 1; i < ridgeB.length; i += 1) {
      ctx.lineTo(ridgeB[i][0], ridgeB[i][1]);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawFence() {
    ctx.strokeStyle = "#806037";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";

    for (const [x1, y1, x2, y2] of penFenceSegments) {
      const p1 = worldToScreen(x1, y1, terrainHeight(x1, y1) + 0.1);
      const p2 = worldToScreen(x2, y2, terrainHeight(x2, y2) + 0.1);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      const posts = Math.max(2, Math.ceil(Math.hypot(x2 - x1, y2 - y1) * 1.8));
      for (let i = 0; i <= posts; i += 1) {
        const t = i / posts;
        const wx = x1 + (x2 - x1) * t;
        const wy = y1 + (y2 - y1) * t;
        const top = worldToScreen(wx, wy, terrainHeight(wx, wy) + 0.6);
        const bot = worldToScreen(wx, wy, terrainHeight(wx, wy) - 0.2);
        ctx.beginPath();
        ctx.moveTo(top.x, top.y);
        ctx.lineTo(bot.x, bot.y);
        ctx.stroke();
      }
    }

    const gateTop = worldToScreen(pen.x1, pen.doorY, terrainHeight(pen.x1, pen.doorY) + 0.25);
    const gateBottom = worldToScreen(
      pen.x1,
      pen.doorY + pen.doorSize,
      terrainHeight(pen.x1, pen.doorY + pen.doorSize) + 0.25
    );
    const openTip = worldToScreen(
      pen.x1 - 0.9,
      pen.doorY + pen.doorSize * 0.56,
      terrainHeight(pen.x1 - 0.9, pen.doorY + pen.doorSize * 0.56) + 0.25
    );

    ctx.strokeStyle = "#e17a22";
    ctx.fillStyle = "#e17a22";
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.beginPath();
    if (gate.closed) {
      ctx.moveTo(gateTop.x, gateTop.y);
      ctx.lineTo(gateBottom.x, gateBottom.y);
    } else {
      ctx.moveTo(gateBottom.x, gateBottom.y);
      ctx.lineTo(openTip.x, openTip.y);
    }
    ctx.stroke();

    const slats = 4;
    for (let i = 1; i < slats; i += 1) {
      const t = i / slats;
      const sx = gate.closed
        ? gateTop.x + (gateBottom.x - gateTop.x) * t
        : gateBottom.x + (openTip.x - gateBottom.x) * t;
      const sy = gate.closed
        ? gateTop.y + (gateBottom.y - gateTop.y) * t
        : gateBottom.y + (openTip.y - gateBottom.y) * t;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawFoodPiles() {
    for (const pile of foodPiles) {
      const z = terrainHeight(pile.x, pile.y);
      const p = worldToScreen(pile.x, pile.y, z + 0.2);

      ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 7, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#d8b663";
      ctx.beginPath();
      ctx.ellipse(p.x - 4, p.y + 1, 5.5, 3.5, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(p.x + 1, p.y - 1, 5.8, 3.6, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(p.x + 5, p.y + 1, 5.2, 3.4, 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawTree(tree) {
    const z = terrainHeight(tree.x, tree.y);
    const p = worldToScreen(tree.x, tree.y, z + 0.1);
    const s = tree.size;

    ctx.fillStyle = "rgba(0, 0, 0, 0.13)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 8 * s, 12 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    if (tree.type === "pine") {
      ctx.fillStyle = "#69492f";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 2.2 * s, 3.2 * s, 9.2 * s, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#2f6438";
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 28 * s);
      ctx.lineTo(p.x - 10.5 * s, p.y - 10 * s);
      ctx.lineTo(p.x + 10.5 * s, p.y - 10 * s);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#3a7744";
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 22 * s);
      ctx.lineTo(p.x - 12 * s, p.y - 1 * s);
      ctx.lineTo(p.x + 12 * s, p.y - 1 * s);
      ctx.closePath();
      ctx.fill();
    } else if (tree.type === "lean") {
      ctx.fillStyle = "#6a482e";
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(-0.18);
      ctx.beginPath();
      ctx.ellipse(0, 2.2 * s, 3.8 * s, 10.8 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "#2f6038";
      ctx.beginPath();
      ctx.arc(p.x + 4 * s, p.y - 17 * s, 11 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3e7948";
      ctx.beginPath();
      ctx.arc(p.x - 4 * s, p.y - 12 * s, 8.5 * s, 0, Math.PI * 2);
      ctx.fill();
    } else if (tree.type === "bushy") {
      ctx.fillStyle = "#6f4c30";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 3 * s, 4.8 * s, 8.2 * s, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#3f7e49";
      ctx.beginPath();
      ctx.arc(p.x - 9 * s, p.y - 10 * s, 9 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x + 10 * s, p.y - 10 * s, 9 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2f693a";
      ctx.beginPath();
      ctx.arc(p.x, p.y - 16 * s, 11.8 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x + 1 * s, p.y - 4 * s, 8.2 * s, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#6b4a2d";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 1 * s, 4.2 * s, 8.5 * s, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#315f34";
      ctx.beginPath();
      ctx.arc(p.x, p.y - 16 * s, 13 * s, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#3f7642";
      ctx.beginPath();
      ctx.arc(p.x - 8 * s, p.y - 12 * s, 9 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x + 9 * s, p.y - 11 * s, 8.5 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x + 2 * s, p.y - 21 * s, 8 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBoulder(b) {
    const z = terrainHeight(b.x, b.y);
    const p = worldToScreen(b.x, b.y, z + 0.08);
    const s = b.size;

    ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 7 * s, 12 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#8d8f86";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - 1 * s, 9.5 * s, 7 * s, -0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#767a72";
    ctx.beginPath();
    ctx.ellipse(p.x - 5.2 * s, p.y - 0.8 * s, 4.2 * s, 3.4 * s, 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(p.x + 4.8 * s, p.y - 2.6 * s, 3.8 * s, 2.9 * s, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(248, 250, 244, 0.34)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(p.x - 1.8 * s, p.y - 4.6 * s, 3.6 * s, Math.PI * 1.12, Math.PI * 1.95);
    ctx.stroke();
  }

  function drawTrailOverlay() {
    const step = 1 / trailResolution;
    for (let gy = 0; gy < trailGridHeight; gy += 1) {
      for (let gx = 0; gx < trailGridWidth; gx += 1) {
        const wear = trailWear[trailIndex(gx, gy)];
        if (wear < 0.08) {
          continue;
        }
        const wx = (gx + 0.5) * step;
        const wy = (gy + 0.5) * step;
        if (!isInPlayableArea(wx, wy)) {
          continue;
        }
        const z = terrainHeight(wx, wy) + 0.02;
        const p = worldToScreen(wx, wy, z);
        const tone = clamp((wear - 0.08) / 0.92, 0, 1);
        const hue = 110 * (1 - tone) + 29 * tone;
        const sat = 34 * (1 - tone) + 41 * tone;
        const lit = 34 * (1 - tone) + 25 * tone;
        const alpha = 0.08 + tone * 0.24;
        ctx.fillStyle = `hsla(${hue} ${sat}% ${lit}% / ${alpha})`;
        ctx.beginPath();
        ctx.ellipse(
          p.x,
          p.y,
          Math.max(0.6, 1.7 * viewScale),
          Math.max(0.4, 0.9 * viewScale),
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }
  }

  function drawSheepEntity(s) {
    const z = terrainHeight(s.x, s.y);
    const p = worldToScreen(s.x, s.y, z + 0.55);
    const gaitSpeed = Math.hypot(s.vx, s.vy);
    const gaitPhase = performance.now() * 0.013 * (0.35 + gaitSpeed * 1.7);
    const gaitAmp = clamp(gaitSpeed * 0.95, 0.6, 2.2);

    ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 10, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#393939";
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    const legLiftA = Math.sin(gaitPhase) * gaitAmp;
    const legLiftB = Math.sin(gaitPhase + Math.PI) * gaitAmp;
    const legs = [
      { x: p.x - 6.5, lift: legLiftA },
      { x: p.x - 2.2, lift: legLiftB },
      { x: p.x + 2.4, lift: legLiftA },
      { x: p.x + 6.4, lift: legLiftB },
    ];
    for (const leg of legs) {
      ctx.beginPath();
      ctx.moveTo(leg.x, p.y + 4.8 + Math.max(0, leg.lift * 0.2));
      ctx.lineTo(leg.x, p.y + 11.2 - leg.lift * 0.35);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(s.heading);

    ctx.fillStyle = "#f5f5f3";
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#444";
    ctx.beginPath();
    ctx.arc(9, 1, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawShepherd() {
    const z = terrainHeight(shepherd.x, shepherd.y);
    const p = worldToScreen(shepherd.x, shepherd.y, z + 0.5);
    const faceX = Math.cos(shepherd.heading);
    const faceY = Math.sin(shepherd.heading) * 0.35;
    const faceLen = Math.hypot(faceX, faceY) || 1;
    const nx = faceX / faceLen;
    const ny = faceY / faceLen;
    const sideAmount = Math.abs(nx);
    const frontAmount = 1 - sideAmount;
    const bodyW = 8.5 + sideAmount * 5.5;
    const bodyH = 7 + frontAmount * 2.4;
    const legSpread = 4.2 + sideAmount * 5.8;
    const headX = p.x + nx * 10;
    const headY = p.y - 2 + ny * 7;
    const tailX = p.x - nx * (8 + sideAmount * 5);
    const tailY = p.y - 2 - ny * (6 + frontAmount * 3);

    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 10, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#2b1b12";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    const legs = [-legSpread, -legSpread * 0.35, legSpread * 0.35, legSpread];
    for (const x of legs) {
      ctx.beginPath();
      ctx.moveTo(p.x + x, p.y + 4);
      ctx.lineTo(p.x + x - nx * 1.2, p.y + 11);
      ctx.stroke();
    }

    ctx.strokeStyle = "#6b3f22";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.quadraticCurveTo(tailX - nx * 6, tailY - 9, tailX - nx * 3, tailY - 16);
    ctx.stroke();

    ctx.fillStyle = "#6b4328";
    ctx.beginPath();
    ctx.ellipse(p.x - nx * 2, p.y, bodyW, bodyH, -0.12 * sideAmount, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#4c2d1c";
    ctx.beginPath();
    ctx.ellipse(headX, headY, 7, 5.6, 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#2f1d13";
    ctx.beginPath();
    ctx.ellipse(headX - 4.6, headY + 2, 2.7, 6.4, 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headX + 3.8, headY + 2.2, 2.6, 6.1, -0.16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1b100b";
    ctx.beginPath();
    ctx.arc(headX + nx * 5, headY + ny * 2, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  function render() {
    const { width, height } = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);
    drawMountainSilhouette(width, height);

    for (let y = -backgroundPad; y < world.height + backgroundPad; y += 1) {
      for (let x = -backgroundPad; x < world.width + backgroundPad; x += 1) {
        const inPlayable = isInPlayableArea(x + 0.5, y + 0.5);
        drawTile(x, y, !inPlayable);
      }
    }
    drawTrailOverlay();

    drawFence();
    drawFoodPiles();

    const drawables = trees
      .map((t) => ({ type: "tree", obj: t, sort: t.x + t.y }))
      .concat(
        boulders.map((b) => ({ type: "boulder", obj: b, sort: b.x + b.y }))
      )
      .concat(
        sheep
      .map((s) => ({ type: "sheep", obj: s, sort: s.x + s.y }))
      .concat([{ type: "shepherd", obj: shepherd, sort: shepherd.x + shepherd.y }])
      )
      .sort((a, b) => a.sort - b.sort);

    for (const item of drawables) {
      if (item.type === "tree") {
        drawTree(item.obj);
      } else if (item.type === "boulder") {
        drawBoulder(item.obj);
      } else if (item.type === "sheep") {
        drawSheepEntity(item.obj);
      } else {
        drawShepherd();
      }
    }

    if (debugGrid) {
      ctx.fillStyle = "rgba(8, 28, 17, 0.75)";
      ctx.font = '700 12px "Manrope", sans-serif';
      ctx.fillText("Debug grid: on (press D)", 14, 20);
      ctx.fillText(`Build: ${buildTime}`, 14, 38);
    }

    if (paused) {
      const t = performance.now() * 0.001;
      const pulse = (Math.sin(t * 2.4) + 1) * 0.5;

      ctx.fillStyle = "rgba(8, 19, 11, 0.32)";
      ctx.fillRect(0, 0, width, height);

      const cardW = Math.min(width * 0.6, 560);
      const cardH = 186;
      const cardX = width * 0.5 - cardW * 0.5;
      const cardY = height * 0.5 - cardH * 0.5 - 8;
      const radius = 18;

      ctx.fillStyle = "rgba(250, 255, 252, 0.13)";
      ctx.strokeStyle = "rgba(240, 255, 246, 0.32)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, radius);
      ctx.fill();
      ctx.stroke();

      const label = "PAUSED";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const grad = ctx.createLinearGradient(0, cardY + 26, 0, cardY + 124);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(1, "#f5dba0");

      ctx.shadowColor = "rgba(12, 32, 18, 0.38)";
      ctx.shadowBlur = 16 + pulse * 8;
      ctx.shadowOffsetY = 5;
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(41, 28, 10, 0.42)";
      const titleSize = Math.max(54, Math.min(88, Math.floor(width * 0.08)));
      ctx.font = `900 ${Math.floor(titleSize * (0.98 + pulse * 0.03))}px "${pauseFont}", sans-serif`;
      ctx.strokeText(label, width * 0.5, height * 0.5 - 12);
      ctx.fillStyle = grad;
      ctx.fillText(label, width * 0.5, height * 0.5 - 12);

      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      ctx.textAlign = "start";
      ctx.textBaseline = "alphabetic";
    }
  }

  function frame(now) {
    const dt = clamp((now - lastT) / 1000, 0.001, 0.033);
    lastT = now;
    if (!paused) {
      update(dt);
    }
    render();
    requestAnimationFrame(frame);
  }

  function setPointerFromEvent(ev) {
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const worldPos = screenToWorld(x, y);
    pointer.worldY = clamp(worldPos.y, 0, world.height);
    const row = getRowBounds(pointer.worldY);
    pointer.worldX = clamp(worldPos.x, row.minX, row.maxX);
  }

  function formatWeightValue(value) {
    return Number(value).toFixed(2);
  }

  function syncWeightControls() {
    for (const def of weightDefs) {
      const input = document.getElementById(`weight-${def.key}`);
      const output = document.getElementById(`weight-${def.key}-value`);
      if (!input || !output) {
        continue;
      }
      input.value = String(behaviorWeights[def.key]);
      output.textContent = formatWeightValue(behaviorWeights[def.key]);
    }
  }

  function buildDebugControls() {
    const fragment = document.createDocumentFragment();
    for (const def of weightDefs) {
      const row = document.createElement("div");
      row.className = "weight-control";

      const label = document.createElement("label");
      label.setAttribute("for", `weight-${def.key}`);
      label.textContent = def.label;

      const output = document.createElement("output");
      output.id = `weight-${def.key}-value`;
      output.textContent = formatWeightValue(behaviorWeights[def.key]);

      const input = document.createElement("input");
      input.id = `weight-${def.key}`;
      input.type = "range";
      input.min = String(def.min);
      input.max = String(def.max);
      input.step = String(def.step);
      input.value = String(behaviorWeights[def.key]);
      input.addEventListener("input", () => {
        const next = Number(input.value);
        behaviorWeights[def.key] = next;
        output.textContent = formatWeightValue(next);
      });

      row.appendChild(label);
      row.appendChild(output);
      row.appendChild(input);
      fragment.appendChild(row);
    }
    weightControlsEl.replaceChildren(fragment);
  }

  function weightsToYaml() {
    const stamp = new Date().toISOString();
    const lines = ["build_time: " + JSON.stringify(buildTime), `exported_at: ${stamp}`, "weights:"];
    for (const def of weightDefs) {
      lines.push(`  ${def.key}: ${Number(behaviorWeights[def.key]).toFixed(3)}`);
    }
    return `${lines.join("\n")}\n`;
  }

  function applyWeightMap(nextWeights) {
    for (const def of weightDefs) {
      const raw = nextWeights[def.key];
      if (raw === undefined || raw === null) {
        continue;
      }
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) {
        continue;
      }
      behaviorWeights[def.key] = clamp(parsed, def.min, def.max);
    }
    syncWeightControls();
  }

  function parseWeightsYaml(yamlText) {
    const normalized = yamlText.includes("\\n") ? yamlText.replace(/\\n/g, "\n") : yamlText;
    const out = {};
    const lines = normalized.split(/\r?\n/);
    let inWeights = false;
    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }
      if (/^weights:\s*$/.test(line.trim())) {
        inWeights = true;
        continue;
      }
      if (!inWeights) {
        continue;
      }
      const match = line.match(/^\s{2}([A-Za-z][A-Za-z0-9_]*)\s*:\s*([-+]?\d*\.?\d+)\s*$/);
      if (match) {
        out[match[1]] = Number(match[2]);
      }
    }
    return out;
  }

  async function loadWeightsFromServer() {
    try {
      const resp = await fetch("config/sheep-weights.yml", { cache: "no-store" });
      if (!resp.ok) {
        return;
      }
      const yaml = await resp.text();
      const parsed = parseWeightsYaml(yaml);
      applyWeightMap(parsed);
    } catch (_err) {
      // Local file may not exist or fetch may fail outside a local server.
    }
  }

  function downloadWeightsYaml() {
    const blob = new Blob([weightsToYaml()], { type: "text/yaml;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "sheep-weights.yml";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }

  canvas.addEventListener("pointerdown", (ev) => {
    if (paused) {
      return;
    }
    pointer.active = true;
    pointer.sprintHeld = true;
    canvas.setPointerCapture(ev.pointerId);
    setPointerFromEvent(ev);
  });

  canvas.addEventListener("pointermove", (ev) => {
    if (!pointer.active && ev.pointerType !== "mouse") {
      return;
    }
    setPointerFromEvent(ev);
    if (ev.pointerType === "mouse") {
      pointer.active = true;
    }
  });

  canvas.addEventListener("pointerup", (ev) => {
    pointer.active = ev.pointerType === "mouse";
    pointer.sprintHeld = false;
    if (canvas.hasPointerCapture(ev.pointerId)) {
      canvas.releasePointerCapture(ev.pointerId);
    }
  });

  canvas.addEventListener("pointerleave", () => {
    pointer.active = false;
    pointer.sprintHeld = false;
  });

  window.addEventListener("keydown", (ev) => {
    const key = ev.key.toLowerCase();
    if (key === "d") {
      debugGrid = !debugGrid;
      syncDebugBuildStamp();
    } else if (key === "g" && isShepherdNearGate()) {
      gate.closed = !gate.closed;
      syncGateStatus();
    } else if (key === "p") {
      togglePause();
    }
  });

  pauseBtnEl.addEventListener("click", () => {
    togglePause();
  });

  exportYamlBtn.addEventListener("click", downloadWeightsYaml);

  window.addEventListener("resize", resize);

  buildStampEl.textContent = "";
  buildDebugControls();
  syncWeightControls();
  syncSheepRoster();
  resize();
  requestAnimationFrame(frame);
  loadWeightsFromServer();
  syncGateStatus();
  syncPauseButton();

  function syncDebugBuildStamp() {
    buildStampEl.textContent = debugGrid ? `build ${buildTime}` : "";
    debugPanelEl.classList.toggle("is-visible", debugGrid);
  }

  syncDebugBuildStamp();
})();
