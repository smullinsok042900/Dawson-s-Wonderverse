function render(t) {
  if (player.inside) { renderHouse(t); return; } // inside a walk-in house (49h_houses.js)
  bgCtx.setTransform(scale * BG_RES, 0, 0, scale * BG_RES, 0, 0);
  withCtx(bgCtx, () => background(t));
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(bgCanvas, 0, 0, canvas.width, canvas.height);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ground(t);
  ctx.save(); ctx.translate(-camera, -camY);
  drawUnderground(t); drawPetMaker(t); drawBuilder(t); drawSky(t);
  if (camY < 70 && !player.under) floorReflection(t);
  ceilingTube(t, false); hangingStars(t);
  glassTube(3118, 128, 446, '#b58cff', t); glassTube(5458, 160, 446, '#ff8fd0', t);
  if (cull(365, 260)) drawBallPitBack();
  weaveDecor(t);
  playStructure(t); paintWall(t); drawEasel(1, t); drawEasel(2, t); drawRoutes(t); drawMarble(t); drawBigBack(t); drawBuildingDoors(t); drawPortalDoors(t); drawNest(t); drawHatches(t); drawWaiting(t);
  bubbleMachine(t); powerCable(t); wonderEngine(t); magnetMachine(t); launchPad(t);
  ferrisWheel(t); coasterTrack(t);
  decorLights(t);
  const rideType = player.ride && player.ride.type;
  if (rideType !== 'coaster' && cull(4870, 520)) coasterTrain(t);
  drawCarousel(t, rideType === 'carousel' ? player.ride.i : -1, () => drawPlayer(t));
  if (world.needPaintT > 0 && cull(2790, 80)) { ctx.globalAlpha = Math.min(1, world.needPaintT); paintDropIcon(LAYOUT.engine.funnel[0], 92); ctx.globalAlpha = 1; }
  secretStars(t);
  balls.forEach(b => { if (cull(b.x, 40)) drawBall(b); });
  world.bubbles.forEach(b => { if (!b.ride && cull(b.x, 40)) drawBubble(b); });
  if (rideType !== 'carousel') drawPlayer(t);
  // things that sit IN FRONT of the creature (so it is inside the ride / the pit)
  if (rideType === 'coaster') coasterTrain(t);
  if (rideType === 'wheel') { const W = LAYOUT.wheel, a = world.wheelAngle + player.ride.i * Math.PI / 5, x = W.cx + Math.cos(a) * W.r, y = W.cy + Math.sin(a) * W.r; rounded(x - 26, y + 24, 52, 1, 10, '#dfe7ff'); }
  drawBigFront(t); drawPetFollower(t); drawBalloon(t); drawDoorBubble(t);
  world.bubbles.forEach(b => { if (b.ride && cull(b.x, 80)) drawBubble(b); });
  if (cull(365, 260)) drawBallPitFront();
  drawPitHelpers(t);
  if (window.__DDW_MULTIPLAYER && typeof window.__DDW_MULTIPLAYER.renderRemotePlayers === 'function') {
    window.__DDW_MULTIPLAYER.renderRemotePlayers();
  }
  drawParticles();
  if (started) drawHintHand(t);
  ctx.restore();
  foreground(t); drawMotes(t);
  // warm key light from the upper left, cool shade toward the lower right (soft-light colour grade)
  if (world.doorFlash > 0) { world.doorFlash -= 1 / 60; ctx.fillStyle = `rgba(255,250,235,${world.doorFlash * 1.6})`; ctx.fillRect(0, 0, vw, VH); } // door transition flash
  ctx.save(); ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = grad(0, 0, vw * .6, VH, [[0, 'rgba(255,236,200,.5)'], [.55, 'rgba(128,128,128,0)'], [1, 'rgba(70,20,110,.32)']]); ctx.fillRect(0, 0, vw, VH);
  ctx.restore();
}