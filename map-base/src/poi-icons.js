// Off-screen canvas icon generators for MapLibre symbol layers.
// Renders crisp circular badge icons with category-specific glyphs.

function createBadgeImageData(bgColor, drawGlyph) {
  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Outer soft halo / border
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 22, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fill();

  // Vibrant circular background
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 20, 0, Math.PI * 2);
  ctx.fillStyle = bgColor;
  ctx.fill();

  // Subtle inner border
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.stroke();

  // Draw glyph in crisp white
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  drawGlyph(ctx, size / 2, size / 2);
  return ctx.getImageData(0, 0, size, size);
}

function drawShop(ctx, cx, cy) {
  // Shopping bag
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(cx - 7, cy - 3, 14, 13, 2);
  else ctx.rect(cx - 7, cy - 3, 14, 13);
  ctx.fill();

  // Bag handle
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(cx, cy - 3, 4.5, Math.PI, 0, false);
  ctx.stroke();

  // Cutout center
  ctx.fillStyle = '#9c27b0';
  ctx.beginPath();
  ctx.arc(cx, cy + 2, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawFood(ctx, cx, cy) {
  // Food bowl & chopsticks/steam
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy + 2, 7, 0, Math.PI);
  ctx.fill();

  // Bowl base
  ctx.fillRect(cx - 3, cy + 8, 6, 2);

  // Steam waves
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(cx - 3.5, cy - 1); ctx.quadraticCurveTo(cx - 5, cy - 4, cx - 3.5, cy - 7);
  ctx.moveTo(cx, cy - 1); ctx.quadraticCurveTo(cx - 1.5, cy - 4, cx, cy - 7);
  ctx.moveTo(cx + 3.5, cy - 1); ctx.quadraticCurveTo(cx + 2, cy - 4, cx + 3.5, cy - 7);
  ctx.stroke();
}

function drawPark(ctx, cx, cy) {
  // Park evergreen tree
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 8);
  ctx.lineTo(cx + 7, cy);
  ctx.lineTo(cx + 4, cy);
  ctx.lineTo(cx + 8, cy + 6);
  ctx.lineTo(cx - 8, cy + 6);
  ctx.lineTo(cx - 4, cy);
  ctx.lineTo(cx - 7, cy);
  ctx.closePath();
  ctx.fill();

  // Tree trunk
  ctx.fillRect(cx - 1.5, cy + 6, 3, 4);
}

function drawHospital(ctx, cx, cy) {
  // Medical cross
  ctx.fillStyle = '#ffffff';
  const w = 4.5, h = 14;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(cx - w / 2, cy - h / 2, w, h, 1.5);
    ctx.roundRect(cx - h / 2, cy - w / 2, h, w, 1.5);
  } else {
    ctx.rect(cx - w / 2, cy - h / 2, w, h);
    ctx.rect(cx - h / 2, cy - w / 2, h, w);
  }
  ctx.fill();
}

function drawBuilding(ctx, cx, cy) {
  // High-rise commercial building
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(cx - 6, cy - 8, 12, 17, 1);
  else ctx.rect(cx - 6, cy - 8, 12, 17);
  ctx.fill();

  // Windows
  ctx.fillStyle = '#1976d2';
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 2; c++) {
      ctx.fillRect(cx - 4 + c * 5, cy - 5 + r * 4, 3, 2.5);
    }
  }

  // Entrance door
  ctx.fillRect(cx - 1.5, cy + 5, 3, 4);
}

export function registerPoiIcons(map) {
  const badgeDefs = [
    { id: 'poi-shop', color: '#9c27b0', draw: drawShop },
    { id: 'poi-food', color: '#ea580c', draw: drawFood },
    { id: 'poi-park', color: '#16a34a', draw: drawPark },
    { id: 'poi-hospital', color: '#dc2626', draw: drawHospital },
    { id: 'poi-building', color: '#2563eb', draw: drawBuilding }
  ];

  for (const { id, color, draw } of badgeDefs) {
    if (!map.hasImage(id)) {
      const imgData = createBadgeImageData(color, draw);
      if (imgData) {
        map.addImage(id, imgData, { pixelRatio: 2 });
      }
    }
  }
}
