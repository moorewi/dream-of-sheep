(() => {
  const canvas = document.getElementById("world");
  const ctx = canvas.getContext("2d");
  const sheepCountEl = document.getElementById("sheepCount");
  const gateStatusEl = document.getElementById("gateStatus");
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
  let viewScale = 1;

  const pointer = {
    active: false,
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
  const trees = [
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

  const shepherd = {
    x: world.width * 0.25,
    y: world.height * 0.72,
    radius: 0.34,
    speed: 6.6,
    heading: 0,
  };

  const SHEEP_TOTAL = 18;
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

    const margin = 24;
    const { minZ, maxZ } = getTerrainZRange();
    const isoWidth = (world.width + world.height) * (world.tileW / 2);
    const isoHeight = (world.width + world.height) * (world.tileH / 2) + (maxZ - minZ) * world.elevationScale;
    const fitW = Math.max(0.2, (rect.width - margin * 2) / isoWidth);
    const fitH = Math.max(0.2, (rect.height - margin * 2) / isoHeight);
    viewScale = Math.min(fitW, fitH);

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
    entity.x = clamp(entity.x, entity.radius, world.width - entity.radius);
    entity.y = clamp(entity.y, entity.radius, world.height - entity.radius);
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

  function isInPen(entity) {
    return (
      entity.x > pen.x1 + 0.25 &&
      entity.x < pen.x2 - 0.25 &&
      entity.y > pen.y1 + 0.25 &&
      entity.y < pen.y2 - 0.25
    );
  }

  function update(dt) {
    const toTargetX = pointer.worldX - shepherd.x;
    const toTargetY = pointer.worldY - shepherd.y;
    const distToTarget = Math.hypot(toTargetX, toTargetY);

    if (pointer.active && distToTarget > 0.02) {
      const step = Math.min(distToTarget, shepherd.speed * dt);
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

      if (shepherdDist < fearRadius) {
        const panic = (fearRadius - shepherdDist) / fearRadius;
        s.panic = panic;
        fearX = (fromShepherdX / Math.max(0.001, shepherdDist)) * panic;
        fearY = (fromShepherdY / Math.max(0.001, shepherdDist)) * panic;
      } else {
        s.panic *= 0.94;
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

      const speed = behaviorWeights.speedBase + s.panic * behaviorWeights.panicSpeedBoost;
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
      const inPen = isInPen(s);
      const foodWeightBase = inPen ? 0.9 : 0;
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
      enforceWorldBounds(shepherd);
    }

    const penned = sheep.filter(isInPen).length;
    sheepCountEl.textContent = `Sheep: ${penned}/${SHEEP_TOTAL}`;
    syncGateStatus();
  }

  function drawTile(x, y, backdrop = false) {
    const z00 = terrainHeight(x, y);
    const z10 = terrainHeight(x + 1, y);
    const z11 = terrainHeight(x + 1, y + 1);
    const z01 = terrainHeight(x, y + 1);

    const p0 = worldToScreen(x, y, z00);
    const p1 = worldToScreen(x + 1, y, z10);
    const p2 = worldToScreen(x + 1, y + 1, z11);
    const p3 = worldToScreen(x, y + 1, z01);

    const avg = (z00 + z10 + z11 + z01) * 0.25;
    const tone = clamp((avg + 1.2) / 5, 0, 1);
    const hue = backdrop ? 103 - tone * 10 : 98 - tone * 18;
    const sat = backdrop ? 12 + tone * 12 : 22 + tone * 24;
    const lit = backdrop ? 46 + tone * 12 : 40 + tone * 14;
    const alpha = backdrop ? 0.72 : 1;

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

  function drawSheepEntity(s) {
    const z = terrainHeight(s.x, s.y);
    const p = worldToScreen(s.x, s.y, z + 0.55);

    ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 10, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();

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

    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 9, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(shepherd.heading);

    ctx.fillStyle = "#4a2d1d";
    ctx.beginPath();
    ctx.ellipse(-2, 0, 13, 7.5, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f2d28d";
    ctx.beginPath();
    ctx.arc(9, -1, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function render() {
    const { width, height } = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);

    for (let y = -backgroundPad; y < world.height + backgroundPad; y += 1) {
      for (let x = -backgroundPad; x < world.width + backgroundPad; x += 1) {
        const inPlayable = x >= 0 && x < world.width && y >= 0 && y < world.height;
        drawTile(x, y, !inPlayable);
      }
    }

    drawFence();
    drawFoodPiles();

    const drawables = trees
      .map((t) => ({ type: "tree", obj: t, sort: t.x + t.y }))
      .concat(
        sheep
      .map((s) => ({ type: "sheep", obj: s, sort: s.x + s.y }))
      .concat([{ type: "shepherd", obj: shepherd, sort: shepherd.x + shepherd.y }])
      )
      .sort((a, b) => a.sort - b.sort);

    for (const item of drawables) {
      if (item.type === "tree") {
        drawTree(item.obj);
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
  }

  function frame(now) {
    const dt = clamp((now - lastT) / 1000, 0.001, 0.033);
    lastT = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  function setPointerFromEvent(ev) {
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const worldPos = screenToWorld(x, y);
    pointer.worldX = clamp(worldPos.x, 0, world.width);
    pointer.worldY = clamp(worldPos.y, 0, world.height);
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
    pointer.active = true;
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
    if (canvas.hasPointerCapture(ev.pointerId)) {
      canvas.releasePointerCapture(ev.pointerId);
    }
  });

  canvas.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  window.addEventListener("keydown", (ev) => {
    const key = ev.key.toLowerCase();
    if (key === "d") {
      debugGrid = !debugGrid;
      syncDebugBuildStamp();
    } else if (key === "g" && isShepherdNearGate()) {
      gate.closed = !gate.closed;
      syncGateStatus();
    }
  });

  exportYamlBtn.addEventListener("click", downloadWeightsYaml);

  window.addEventListener("resize", resize);

  buildStampEl.textContent = "";
  buildDebugControls();
  syncWeightControls();
  resize();
  requestAnimationFrame(frame);
  loadWeightsFromServer();
  syncGateStatus();

  function syncDebugBuildStamp() {
    buildStampEl.textContent = debugGrid ? `build ${buildTime}` : "";
    debugPanelEl.classList.toggle("is-visible", debugGrid);
  }

  syncDebugBuildStamp();
})();
