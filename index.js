document.addEventListener("DOMContentLoaded", () => {
  const hero = document.querySelector(".hero");
  const wrap = document.getElementById("text3dWrap");
  const text3d = document.getElementById("text3d");

  const WORD = "FRASE";

  // ---------- Construcción de las capas de profundidad ----------
  // Cuantas más capas, más "cuerpo"/volumen se percibe en el texto.
  const DEPTH_LAYERS = 18;
  const MAX_Z = 110; // distancia total (px) entre la capa frontal y la más trasera
  const MAX_BLUR = 1.4; // difuminado máximo (px) en la capa más trasera

  const FRONT_COLOR = [221, 60, 15];   // #dd3c0f
  const BACK_COLOR  = [74, 24, 12];    // tono oscuro para dar sombra/volumen

  function mixColor(c1, c2, t) {
    return c1.map((v, i) => Math.round(v + (c2[i] - v) * t));
  }

  // Generamos primero las capas traseras (de más lejana a más cercana)
  for (let i = DEPTH_LAYERS; i >= 1; i--) {
    const layer = document.createElement("div");
    layer.className = "layer depth";
    layer.textContent = WORD;

    const t = i / DEPTH_LAYERS; // 1 = más lejos, 0 = pegada a la frontal
    const z = -((i / DEPTH_LAYERS) * MAX_Z);
    const [r, g, b] = mixColor(FRONT_COLOR, BACK_COLOR, t * 0.85);

    layer.style.setProperty("--z", `${z}px`);
    layer.style.setProperty("--depth-color", `rgb(${r}, ${g}, ${b})`);
    layer.style.setProperty("--lx", "0px");
    layer.style.setProperty("--ly", "0px");
    layer.style.setProperty("--blur", `${(t * MAX_BLUR).toFixed(2)}px`);
    layer.style.setProperty("--depth-opacity", `${(1 - t * 0.12).toFixed(2)}`);
    layer.dataset.depthIndex = i;

    text3d.appendChild(layer);
  }

  // Capa frontal: la cara nítida y sólida del logo
  const front = document.createElement("div");
  front.className = "layer front";
  front.textContent = WORD;
  front.style.setProperty("--z", "0px");
  front.style.setProperty("--lx", "0px");
  front.style.setProperty("--ly", "0px");
  text3d.appendChild(front);

  const allLayers = text3d.querySelectorAll(".layer");

  // ---------- Ajuste de tamaño: la palabra ocupa casi todo el ancho ----------
  // En lugar de fijar el font-size, escalamos todo el grupo 3D (--fit-scale).
  // Así la profundidad (Z) crece proporcionalmente al tamaño del logo.
  const FILL_RATIO = 0.92; // % del ancho del hero que debe ocupar la palabra

  function fitText() {
    text3d.style.setProperty("--fit-scale", "1");
    // Forzamos el cálculo en el frame siguiente para medir el ancho real sin escalar
    requestAnimationFrame(() => {
      const naturalWidth = front.getBoundingClientRect().width;
      const targetWidth = wrap.clientWidth * FILL_RATIO;
      if (naturalWidth > 0) {
        const scale = targetWidth / naturalWidth;
        text3d.style.setProperty("--fit-scale", scale.toFixed(4));
      }
    });
  }

  fitText();

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(fitText, 120);
  });

  // Mostrar con fade-in al cargar
  requestAnimationFrame(() => {
    wrap.classList.add("visible");
  });

  // ---------- Reacción al cursor ----------
  const maxRotate = 14;     // grados máximos de inclinación 3D
  const maxParallax = 26;   // px máximos de desplazamiento de las capas traseras
  const ease = 0.07;        // suavizado (lerp) -> inercia del movimiento

  let targetRX = 0;
  let targetRY = 0;
  let targetOffsetX = 0;
  let targetOffsetY = 0;

  let currentRX = 0;
  let currentRY = 0;
  let currentOffsetX = 0;
  let currentOffsetY = 0;

  function handleMove(e) {
    const rect = wrap.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const offsetX = (e.clientX - centerX) / (rect.width / 2);
    const offsetY = (e.clientY - centerY) / (rect.height / 2);

    const clampedX = Math.max(-1.3, Math.min(1.3, offsetX));
    const clampedY = Math.max(-1.3, Math.min(1.3, offsetY));

    // Si el cursor está a la izquierda, el volumen responde hacia ese lado, etc.
    targetRY = clampedX * maxRotate;
    targetRX = -clampedY * maxRotate;

    targetOffsetX = clampedX;
    targetOffsetY = clampedY;
  }

  function resetTarget() {
    targetRX = 0;
    targetRY = 0;
    targetOffsetX = 0;
    targetOffsetY = 0;
  }

  hero.addEventListener("mousemove", handleMove);
  hero.addEventListener("mouseleave", resetTarget);

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function animate() {
    currentRX = lerp(currentRX, targetRX, ease);
    currentRY = lerp(currentRY, targetRY, ease);
    currentOffsetX = lerp(currentOffsetX, targetOffsetX, ease);
    currentOffsetY = lerp(currentOffsetY, targetOffsetY, ease);

    text3d.style.setProperty("--rx", `${currentRX.toFixed(2)}deg`);
    text3d.style.setProperty("--ry", `${currentRY.toFixed(2)}deg`);

    // Cada capa trasera se desplaza proporcionalmente a su profundidad,
    // generando la sensación real de volumen al mover el cursor.
    allLayers.forEach((layer) => {
      const depthIndex = Number(layer.dataset.depthIndex || 0);
      const depthFactor = depthIndex / DEPTH_LAYERS; // 0 (frontal) a 1 (más trasera)

      const lx = currentOffsetX * maxParallax * depthFactor;
      const ly = currentOffsetY * maxParallax * depthFactor;

      layer.style.setProperty("--lx", `${lx.toFixed(2)}px`);
      layer.style.setProperty("--ly", `${ly.toFixed(2)}px`);
    });

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
});
