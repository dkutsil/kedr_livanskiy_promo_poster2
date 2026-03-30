let img;
let photos = [];
let currentPhotoIndex = 0;

// =========================
// POSTER
// =========================
const W = 580;
const H = 760;
const SCALE = 1.1;

const TOP_H = 360;
const PHOTO_Y = TOP_H;
const PHOTO_H = H - PHOTO_Y;

// более блеклая, пыльная палитра
const BG_PALETTE = [
  "#C96A6C",
  "#C97AA8",
  "#6FA3C9",
  "#6FC9A2",
  "#C9C36F",
  "#C99A6F"
];

const DATE_TXT = "12 March";
const CITY_TXT = "Tbilisi";
const TITLE_TXT = "Kedr Livanskiy";
const LEFT_TAG_TXT = "Live";
const RIGHT_TAG_TXT = "20:00";
const LINEUP = ["Misha Tune", "Lilo Carminis", "Polo"];

// =========================
// TYPO
// =========================
const TEXT_COLOR = "#FFFFFF";
const M_LEFT = 38;
const M_RIGHT = 38;
const M_TOP = 56;

// =========================
// FRACTAL STATE
// =========================
let fractalType = 0;

let xOffset = 0;
let yOffset = 0;
let xScale = 1;
let yScale = 1;

let heightmap;
let colorray = [];
const COLORRAY_LEN = 2048;

let gFractal;

let currentBgHex = BG_PALETTE[0];
let currentBgRGB = [201, 106, 108];
let posterIndex = 1;

let animPhase = 0;

// плотность и анимация
const PASSES_PER_FRAME = 3;
const BOOTSTRAP_FRAMES = 12;
const FADE_ALPHA = 28;

// =========================
// PRELOAD
// =========================
function preload() {
  photos[0] = loadImage("kedr_photo1.jpg");
  photos[1] = loadImage("kedr_photo2.jpg");
  photos[2] = loadImage("kedr_photo3.jpg");
  photos[3] = loadImage("kedr_photo4.jpg");
  photos[4] = loadImage("kedr_photo5.jpg");

  img = photos[0];
}

// =========================
// SETUP
// =========================
function setup() {
  createCanvas(W * SCALE, H * SCALE);
  pixelDensity(1);
  noSmooth();
  textFont("Helvetica");
  document.oncontextmenu = () => false;

  gFractal = createGraphics(W, TOP_H);
  gFractal.pixelDensity(1);
  gFractal.noSmooth();

  initFractalArea();
  generatePoster();
}

// =========================
// DRAW
// =========================
function draw() {
  updateFractalAnimation();

  background("#d9d9d9");

  push();
  translate((width - W) / 2, 16);
  drawPoster();
  pop();
}

// =========================
// INPUT
// =========================
function mousePressed() {
  const x0 = (width - W) / 2;
  const y0 = 16;

  const inside =
    mouseX >= x0 &&
    mouseX <= x0 + W &&
    mouseY >= y0 &&
    mouseY <= y0 + H;

  if (!inside) return false;

  if (mouseButton === LEFT) {
    changeBottomPhoto();
    generatePoster();
  } else if (mouseButton === RIGHT) {
    saveCanvas(`poster_${nf(posterIndex, 3)}`, "png");
  }

  return false;
}

function changeBottomPhoto() {
  if (photos.length <= 1) return;

  currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
  img = photos[currentPhotoIndex];
}

// =========================
// POSTER GENERATION
// =========================
function generatePoster() {
  currentBgHex = random(BG_PALETTE);
  currentBgRGB = desaturateColor(hexToRgb(currentBgHex), 0.22);

  fractalType = floor(random(21));
  animPhase = random(1000);

  clearHeightmap();
  changeColorsLikeOriginal();
  clearFractalLayer();

  for (let i = 0; i < BOOTSTRAP_FRAMES; i++) {
    animateFractalStep(false);
  }

  posterIndex++;
}

// =========================
// DRAW POSTER
// =========================
function drawPoster() {
  noStroke();

  fill(255);
  rect(0, 0, W, H);

  fill(currentBgRGB[0], currentBgRGB[1], currentBgRGB[2]);
  rect(0, 0, W, TOP_H);

  image(gFractal, 0, 0);

  drawPhotoCover(img, 0, PHOTO_Y, W, PHOTO_H);
  drawTypography();
}

function drawTypography() {
  fill(TEXT_COLOR);
  noStroke();
  textFont("Helvetica");

  textStyle(BOLD);
  textSize(28);
  textAlign(LEFT, BASELINE);
  text(DATE_TXT, M_LEFT, M_TOP);

  textAlign(RIGHT, BASELINE);
  text(CITY_TXT, W - M_RIGHT, M_TOP);

  const titleSize = fitTitleSize(TITLE_TXT, W - M_LEFT - M_RIGHT, 72, 40);
  textStyle(BOLD);
  textSize(titleSize);
  textAlign(LEFT, BASELINE);
  text(TITLE_TXT, M_LEFT, 170);

  textStyle(NORMAL);
  textSize(18);
  textAlign(LEFT, BASELINE);
  text(LEFT_TAG_TXT, M_LEFT, 245);

  textAlign(RIGHT, BASELINE);
  text(RIGHT_TAG_TXT, W - 188, 245);

  textAlign(LEFT, BASELINE);
  textSize(16);
  text(LINEUP[0], M_LEFT, 297);
  text(LINEUP[1], M_LEFT, 323);
  text(LINEUP[2], M_LEFT, 349);
}

// =========================
// TYPO HELPERS
// =========================
function fitTitleSize(txt, maxWidth, startSize, minSize) {
  textFont("Helvetica");
  textStyle(BOLD);

  for (let s = startSize; s >= minSize; s--) {
    textSize(s);
    if (textWidth(txt) <= maxWidth) return s;
  }
  return minSize;
}

// =========================
// PHOTO
// =========================
function drawPhotoCover(im, x, y, w, h) {
  if (!im) return;

  const ir = im.width / im.height;
  const rr = w / h;

  let dw, dh;
  if (ir > rr) {
    dh = h;
    dw = h * ir;
  } else {
    dw = w;
    dh = w / ir;
  }

  const cx = x + w / 2;
  const cy = y + h / 2;

  push();
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(x, y, w, h);
  drawingContext.clip();

  imageMode(CENTER);
  image(im, cx, cy, dw, dh);

  drawingContext.restore();
  pop();
}

// =========================
// FRACTAL AREA
// =========================
function initFractalArea() {
  const xSize = 7;
  const ySize = (xSize * TOP_H) / W;

  xOffset = -xSize / 2;
  yOffset = -ySize / 2;
  xScale = W / xSize;
  yScale = TOP_H / ySize;

  heightmap = new Float64Array(W * TOP_H);
  clearHeightmap();
}

function clearHeightmap() {
  for (let i = 0; i < heightmap.length; i++) {
    heightmap[i] = 1;
  }
}

function clearFractalLayer() {
  gFractal.clear();
  gFractal.noStroke();
  gFractal.fill(currentBgRGB[0], currentBgRGB[1], currentBgRGB[2], 255);
  gFractal.rect(0, 0, W, TOP_H);
}

// =========================
// COLOR HELPERS
// =========================
function clamp255(v) {
  v = Math.round(v);
  if (v < 0) return 0;
  if (v > 255) return 255;
  return v;
}

function hexToRgb(hex) {
  const s = hex.replace("#", "");
  return [
    parseInt(s.substring(0, 2), 16),
    parseInt(s.substring(2, 4), 16),
    parseInt(s.substring(4, 6), 16)
  ];
}

function desaturateColor([r, g, b], amount = 0.5) {
  const gray = (r + g + b) / 3;
  return [
    r + (gray - r) * amount,
    g + (gray - g) * amount,
    b + (gray - b) * amount
  ];
}

function softenColor([r, g, b], amount = 0.18) {
  return [
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount
  ];
}

function muteColor([r, g, b], desatAmount = 0.55, softenAmount = 0.12) {
  let c = desaturateColor([r, g, b], desatAmount);
  c = softenColor(c, softenAmount);
  return c;
}

// =========================
// ORIGINAL-LIKE COLOR SYSTEM
// =========================
function changeColorsLikeOriginal() {
  let r = random(60, 220);
  let g = random(60, 220);
  let b = random(60, 220);

  let vr = 0;
  let vg = 0;
  let vb = 0;

  colorray = new Array(COLORRAY_LEN);

  for (let i = COLORRAY_LEN - 1; i >= 0; i--) {
    const col = muteColor([r, g, b], 0.62, 0.08);

    colorray[i] = [
      clamp255(col[0]),
      clamp255(col[1]),
      clamp255(col[2])
    ];

    vr += randomGaussian() * 0.02;
    vg += randomGaussian() * 0.02;
    vb += randomGaussian() * 0.02;

    r += vr;
    g += vg;
    b += vb;

    if ((r < 20 && vr < 0) || (r > 235 && vr > 0)) vr = -vr;
    if ((g < 20 && vg < 0) || (g > 235 && vg > 0)) vg = -vg;
    if ((b < 20 && vb < 0) || (b > 235 && vb > 0)) vb = -vb;
  }
}

// =========================
// ANIMATION
// =========================
function updateFractalAnimation() {
  animateFractalStep(true);
  animPhase += 0.006;
}

function animateFractalStep(withFade = true) {
  const xSize = 7 + sin(animPhase * 0.8) * 0.18;
  const ySize = (xSize * TOP_H) / W;

  xOffset = -xSize / 2 + cos(animPhase * 0.63) * 0.08;
  yOffset = -ySize / 2 + sin(animPhase * 0.71) * 0.05;
  xScale = W / xSize;
  yScale = TOP_H / ySize;

  for (let k = 0; k < PASSES_PER_FRAME; k++) {
    runFractal(fractalType, animPhase + k * 0.013);
  }

  if (withFade) {
    gFractal.noStroke();
    gFractal.fill(currentBgRGB[0], currentBgRGB[1], currentBgRGB[2], FADE_ALPHA);
    gFractal.rect(0, 0, W, TOP_H);
  }

  renderHeightmapToGraphics();
}

function renderHeightmapToGraphics() {
  gFractal.loadPixels();

  const nPix = W * TOP_H;
  for (let i = 0; i < nPix; i++) {
    let idx = Math.floor(Math.log(heightmap[i]) * 64);

    if (!isFinite(idx)) idx = 0;
    if (idx < 0) idx = 0;
    if (idx >= COLORRAY_LEN) idx = COLORRAY_LEN - 1;

    const c = colorray[idx];
    const p = i * 4;

    gFractal.pixels[p + 0] = c[0];
    gFractal.pixels[p + 1] = c[1];
    gFractal.pixels[p + 2] = c[2];
    gFractal.pixels[p + 3] = 255;
  }

  gFractal.updatePixels();
}

// =========================
// FRACTAL DISPATCH
// =========================
function runFractal(type, phase) {
  if (type === 0) fractal0(phase);
  else if (type === 1) fractal1(phase);
  else if (type === 2) fractal2(phase);
  else if (type === 3) fractal3(phase);
  else if (type === 4) fractal4(phase);
  else if (type === 5) fractal5(phase);
  else if (type === 6) fractal6(phase);
  else if (type === 7) fractal7(phase);
  else if (type === 8) fractal8(phase);
  else if (type === 9) fractal9(phase);
  else if (type === 10) fractal10(phase);
  else if (type === 11) fractal11(phase);
  else if (type === 12) fractal12(phase);
  else if (type === 13) fractal13(phase);
  else if (type === 14) fractal14(phase);
  else if (type === 15) fractal15(phase);
  else if (type === 16) fractal16(phase);
  else if (type === 17) fractal17(phase);
  else if (type === 18) fractal18(phase);
  else if (type === 19) fractal19(phase);
  else if (type === 20) fractal20(phase);
}

function idxXY(x, y) {
  return x + y * W;
}

function addPointToHeightmap(a, b) {
  const x = Math.floor((b - xOffset) * xScale);
  const y = Math.floor((a - yOffset) * yScale);

  if (x > -1 && x < W && y > -1 && y < TOP_H) {
    heightmap[idxXY(x, y)]++;
    return true;
  }
  return false;
}

function phaseNoise(phase, amp = 0.02) {
  return sin(phase * 1.7) * amp + cos(phase * 0.91) * amp * 0.6;
}

// =========================
// FRACTALS
// =========================
function fractal0(phase) {
  const p = phaseNoise(phase, 0.03);
  for (let n = 0; n < 340; n++) {
    const ia = randomGaussian() + p;
    const ib = randomGaussian() - p;
    let a = ia, b = ib;

    for (let i = 0; i < 320; i++) {
      const ta = sin(a * a + b * b) + ia;
      b = sin(a + p) + sin(b - p);
      a = ta;
      if (!addPointToHeightmap(a, b)) break;
    }
  }
}

function fractal1(phase) {
  const p = phaseNoise(phase, 0.028);
  for (let n = 0; n < 340; n++) {
    const ia = randomGaussian();
    const ib = randomGaussian() + p;
    let a = ia, b = ib;

    for (let i = 0; i < 320; i++) {
      const ta = sin(a * a - b * b) + ia;
      b = sin(a) + cos(b + p);
      a = ta;
      if (!addPointToHeightmap(a, b)) break;
    }
  }
}

function fractal2(phase) {
  const p = phaseNoise(phase, 0.028);
  for (let n = 0; n < 340; n++) {
    const ia = randomGaussian();
    const ib = randomGaussian();
    let a = ia, b = ib;

    for (let i = 0; i < 320; i++) {
      const ta = cos(a * a + b * b + p) + ia;
      b = sin(a - p) + sin(b);
      a = ta;
      if (!addPointToHeightmap(a, b)) break;
    }
  }
}

function fractal3(phase) {
  const p = phaseNoise(phase, 0.028);
  for (let n = 0; n < 340; n++) {
    const ia = randomGaussian();
    const ib = randomGaussian();
    let a = ia, b = ib;

    for (let i = 0; i < 320; i++) {
      const ta = sin(a * a + b * b) + ia;
      b = cos(a + p) + sin(b);
      a = ta;
      if (!addPointToHeightmap(a, b)) break;
    }
  }
}

function fractal4(phase) {
  const p = phaseNoise(phase, 0.028);
  for (let n = 0; n < 340; n++) {
    const ia = randomGaussian();
    const ib = randomGaussian();
    let a = ia, b = ib;

    for (let i = 0; i < 320; i++) {
      const ta = sin(a * a - b * b) + ia;
      b = cos(a) + cos(b + p);
      a = ta;
      if (!addPointToHeightmap(a, b)) break;
    }
  }
}

function fractal5(phase) {
  const p = phaseNoise(phase, 0.028);
  for (let n = 0; n < 340; n++) {
    const ia = randomGaussian();
    const ib = randomGaussian();
    let a = ia, b = ib;

    for (let i = 0; i < 320; i++) {
      const ta = cos(a * a - b * b) + ia;
      b = sin(a + p) + cos(b);
      a = ta;
      if (!addPointToHeightmap(a, b)) break;
    }
  }
}

function fractal6(phase) {
  const p = phaseNoise(phase, 0.026);
  for (let n = 0; n < 340; n++) {
    const ia = randomGaussian();
    const ib = randomGaussian();
    let a = ia, b = ib;

    for (let i = 0; i < 320; i++) {
      const ta = sin(a * a + b * b) + ia;
      b = abs(cos(a + p)) + abs(sin(b));
      a = ta;
      if (!addPointToHeightmap(a, b)) break;
    }
  }
}

function fractal7(phase) {
  const p = phaseNoise(phase, 0.026);
  for (let n = 0; n < 340; n++) {
    const ia = randomGaussian();
    const ib = randomGaussian();
    let a = ia, b = ib;

    for (let i = 0; i < 320; i++) {
      const ta = cos(a * a + b * b) + ia;
      b = abs(sin(a)) + abs(cos(b + p));
      a = ta;
      if (!addPointToHeightmap(a, b)) break;
    }
  }
}

function fractal8(phase) {
  const p = phaseNoise(phase, 0.02);
  for (let n = 0; n < 340; n++) {
    const ia = randomGaussian();
    const ib = randomGaussian();
    let a = ia, b = ib;

    for (let i = 0; i < 320; i++) {
      const ta = sin(a + p) + ia;
      b = sin(b - p) + ib;
      a = ta;
      if (!addPointToHeightmap(a, b)) break;
    }
  }
}

function fractal9(phase) {
  const p = phaseNoise(phase, 0.02);
  for (let n = 0; n < 340; n++) {
    const ia = randomGaussian();
    const ib = randomGaussian();
    let a = ia, b = ib;

    for (let i = 0; i < 320; i++) {
      const ta = sin(a) + ia;
      b = cos(b + p) + ib;
      a = ta;
      if (!addPointToHeightmap(a, b)) break;
    }
  }
}

function fractal10(phase) {
  const p = phaseNoise(phase, 0.02);
  for (let n = 0; n < 340; n++) {
    const ia = randomGaussian();
    const ib = randomGaussian();
    let a = ia, b = ib;

    for (let i = 0; i < 320; i++) {
      const ta = cos(a + p) + ia;
      b = sin(b) + ib;
      a = ta;
      if (!addPointToHeightmap(a, b)) break;
    }
  }
}

function fractal11(phase) {
  const p = phaseNoise(phase, 0.02);
  for (let n = 0; n < 340; n++) {
    const ia = randomGaussian();
    const ib = randomGaussian();
    let a = ia, b = ib;

    for (let i = 0; i < 320; i++) {
      const ta = cos(a) + ia;
      b = cos(b + p) + ib;
      a = ta;
      if (!addPointToHeightmap(a, b)) break;
    }
  }
}

function fractal12(phase) {
  const p = phaseNoise(phase, 0.018);
  for (let n = 0; n < 340; n++) {
    const ia = randomGaussian();
    const ib = randomGaussian();
    let a = ia, b = ib;

    for (let i = 0; i < 320; i++) {
      const ta = sin(a) + ia;
      b = abs(sin(b + p)) + ib;
      a = ta;
      if (!addPointToHeightmap(a, b)) break;
    }
  }
}

function fractal13(phase) {
  const p = phaseNoise(phase, 0.018);
  for (let n = 0; n < 340; n++) {
    const ia = randomGaussian();
    const ib = randomGaussian();
    let a = ia, b = ib;

    for (let i = 0; i < 320; i++) {
      const ta = cos(a + p) + ia;
      b = abs(cos(b)) + ib;
      a = ta;
      if (!addPointToHeightmap(a, b)) break;
    }
  }
}

function fractal14(phase) {
  const p = phaseNoise(phase, 0.022);
  for (let n = 0; n < 340; n++) {
    const ia = randomGaussian();
    const ib = randomGaussian();
    let a = ia, b = ib;

    for (let i = 0; i < 320; i++) {
      const ta = sin(a * a + b * b) + ia;
      b = abs(a + p);
      a = ta;
      if (!addPointToHeightmap(a, b)) break;
    }
  }
}

function fractal15(phase) {
  const p = phaseNoise(phase, 0.022);
  for (let n = 0; n < 340; n++) {
    const ia = randomGaussian();
    const ib = randomGaussian();
    let a = ia, b = ib;

    for (let i = 0; i < 320; i++) {
      const ta = cos(a * a + b * b) + ia;
      b = abs(a - p);
      a = ta;
      if (!addPointToHeightmap(a, b)) break;
    }
  }
}

function fractal16(phase) {
  const p = phaseNoise(phase, 0.022);
  for (let n = 0; n < 340; n++) {
    const ia = randomGaussian();
    const ib = randomGaussian();
    let a = ia, b = ib;

    for (let i = 0; i < 320; i++) {
      const ta = sin(a * a - b * b) + ia;
      b = abs(a + p);
      a = ta;
      if (!addPointToHeightmap(a, b)) break;
    }
  }
}

function fractal17(phase) {
  const p = phaseNoise(phase, 0.022);
  for (let n = 0; n < 340; n++) {
    const ia = randomGaussian();
    const ib = randomGaussian();
    let a = ia, b = ib;

    for (let i = 0; i < 320; i++) {
      const ta = cos(a * a - b * b) + ia;
      b = abs(a - p);
      a = ta;
      if (!addPointToHeightmap(a, b)) break;
    }
  }
}

function fractal18(phase) {
  const p = phaseNoise(phase, 0.012);
  for (let n = 0; n < 340; n++) {
    const ia = randomGaussian();
    const ib = randomGaussian();
    let a = ia, b = ib;

    for (let i = 0; i < 320; i++) {
      const ta = tan(a + p) + ia;
      b = abs(b) + ib;
      a = ta;
      if (!addPointToHeightmap(a, b)) break;
    }
  }
}

function fractal19(phase) {
  const p = phaseNoise(phase, 0.012);
  for (let n = 0; n < 340; n++) {
    const ia = randomGaussian();
    const ib = randomGaussian();
    let a = ia, b = ib;

    for (let i = 0; i < 320; i++) {
      const ta = abs(a) + ia;
      b = tan(b + p) + ib;
      a = ta;
      if (!addPointToHeightmap(a, b)) break;
    }
  }
}

function fractal20(phase) {
  const p = phaseNoise(phase, 0.01);
  for (let n = 0; n < 340; n++) {
    const ia = randomGaussian();
    const ib = randomGaussian();
    let a = ia, b = ib;

    for (let i = 0; i < 320; i++) {
      const sb = sin(b + p);
      const safeSb = abs(sb) < 0.0001 ? 0.0001 : sb;
      const ta = sin(a) / safeSb;
      b = abs(a);
      a = ta;
      if (!addPointToHeightmap(a, b)) break;
    }
  }
}