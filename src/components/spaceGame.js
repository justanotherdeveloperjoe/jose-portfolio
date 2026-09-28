export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 420;

// Original pixel patterns; each character represents one square of the sprite.
export const SPRITES = {
  ship: ['00000100000', '00001110000', '00001110000', '00111111100', '01111111110', '11111111111', '11000100011'],
  scout: ['001000100', '000101000', '001111100', '011010110', '111111111', '101000101', '001000100'],
  scoutStep: ['001000100', '000101000', '001111100', '011010110', '111111111', '001000100', '010000010'],
  visitor: ['000111000', '001111100', '011010110', '111111111', '110111011', '100000001', '010000010'],
  visitorStep: ['000111000', '001111100', '011010110', '111111111', '110111011', '010000010', '100000001'],
};

function makeFleet() {
  return Array.from({ length: 21 }, (_, i) => ({ x: 185 + (i % 7) * 50, y: 55 + Math.floor(i / 7) * 43, w: 27, h: 21, row: Math.floor(i / 7), alive: true }));
}

export function createGame() {
  return {
    player: { x: GAME_WIDTH / 2 - 11, y: 376, w: 22, h: 14 },
    enemies: makeFleet(), shots: [], enemyShots: [],
    score: 0, lives: 3, wave: 1, state: 'playing', time: 0,
    direction: 1, cooldown: 0, enemyCooldown: 1.4, invulnerable: 0, nextWave: 0,
  };
}

export function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function stepGame(game, input, delta, random = Math.random) {
  if (game.state !== 'playing') return;
  const dt = Math.min(Math.max(delta, 0), .04);
  game.time += dt;
  game.cooldown -= dt;
  game.invulnerable = Math.max(0, game.invulnerable - dt);
  game.player.x = Math.max(16, Math.min(GAME_WIDTH - game.player.w - 16, game.player.x + ((input.right ? 1 : 0) - (input.left ? 1 : 0)) * 310 * dt));
  if (input.fire && game.cooldown <= 0 && !game.nextWave) {
    game.shots.push({ x: game.player.x + 10, y: game.player.y - 9, w: 3, h: 9 });
    game.cooldown = .23;
  }
  if (game.nextWave) {
    game.nextWave -= dt;
    if (game.nextWave <= 0) {
      game.wave++;
      game.enemies = makeFleet();
      game.direction = 1;
      game.enemyCooldown = 1.4;
      game.nextWave = 0;
    }
    return;
  }
  const living = game.enemies.filter(enemy => enemy.alive);
  const speed = Math.min(65, 19 + game.wave * 6 + (21 - living.length) * 1.6);
  let dx = game.direction * speed * dt;
  const turn = living.some(enemy => enemy.x + dx < 20 || enemy.x + enemy.w + dx > GAME_WIDTH - 20);
  if (turn) { game.direction *= -1; dx = game.direction * speed * dt; }
  living.forEach(enemy => { enemy.x += dx; if (turn) enemy.y += 15; });
  game.enemyCooldown -= dt;
  if (game.enemyCooldown <= 0 && living.length) {
    const enemy = living[Math.min(living.length - 1, Math.floor(random() * living.length))];
    game.enemyShots.push({ x: enemy.x + 12, y: enemy.y + enemy.h, w: 4, h: 10 });
    game.enemyCooldown = Math.max(.45, 1.35 - game.wave * .08);
  }
  game.shots.forEach(shot => {
    shot.y -= 470 * dt;
    const target = game.enemies.find(enemy => enemy.alive && overlaps(shot, enemy));
    if (target) { target.alive = false; shot.y = -100; game.score += (3 - target.row) * 10; }
  });
  game.enemyShots.forEach(shot => {
    shot.y += Math.min(255, 145 + game.wave * 9) * dt;
    if (!game.invulnerable && overlaps(shot, game.player)) {
      game.lives--; game.invulnerable = 1.25; shot.y = GAME_HEIGHT + 100;
    }
  });
  game.shots = game.shots.filter(shot => shot.y > -12);
  game.enemyShots = game.enemyShots.filter(shot => shot.y < GAME_HEIGHT + 12);
  if (game.lives <= 0 || game.enemies.some(enemy => enemy.alive && enemy.y + enemy.h >= game.player.y)) {
    game.state = 'over';
  } else if (game.enemies.every(enemy => !enemy.alive)) {
    game.nextWave = 1.2;
    game.shots = []; game.enemyShots = [];
  }
}

export function drawSprite(context, pattern, x, y, scale, color) {
  context.fillStyle = color;
  pattern.forEach((line, row) => [...line].forEach((pixel, col) => {
    if (pixel === '1') context.fillRect(Math.round(x + col * scale), Math.round(y + row * scale), scale, scale);
  }));
}

export function drawGame(context, game, reducedMotion = false) {
  context.fillStyle = '#171e18';
  context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  context.fillStyle = '#4c5a42';
  for (let i = 0; i < 45; i++) context.fillRect((i * 137 + 31) % GAME_WIDTH, (i * 79 + 19) % 355, i % 4 ? 1 : 2, i % 4 ? 1 : 2);
  context.strokeStyle = '#566447'; context.lineWidth = 1;
  context.beginPath(); context.moveTo(16, 400); context.lineTo(GAME_WIDTH - 16, 400); context.stroke();
  const alternate = !reducedMotion && Math.floor(game.time * 2) % 2;
  game.enemies.forEach(enemy => {
    if (!enemy.alive) return;
    const type = enemy.row === 0 ? 'visitor' : 'scout';
    drawSprite(context, SPRITES[type + (alternate ? 'Step' : '')], enemy.x, enemy.y, 3, ['#d5f77a', '#e9e5d7', '#c0cda8'][enemy.row]);
  });
  drawSprite(context, SPRITES.ship, game.player.x, game.player.y, 2, game.invulnerable ? '#7c8c66' : '#d5f77a');
  context.fillStyle = '#d5f77a'; game.shots.forEach(shot => context.fillRect(shot.x, shot.y, shot.w, shot.h));
  context.fillStyle = '#eeb18a'; game.enemyShots.forEach(shot => context.fillRect(shot.x, shot.y, shot.w, shot.h));
  if (game.nextWave) {
    context.fillStyle = '#e9e5d7'; context.font = '16px monospace'; context.textAlign = 'center';
    context.fillText(`WAVE ${game.wave} CLEAR`, GAME_WIDTH / 2, 215);
  }
}
