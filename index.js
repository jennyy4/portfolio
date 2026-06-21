document.addEventListener("DOMContentLoaded", () => {
  const hero = document.querySelector(".hero");
  const wrap = document.getElementById("text3dWrap");
  const text3d = document.getElementById("text3d");

  const WORD = "FRASE";

  // Capa de relleno: el texto sólido y nítido
  const fill = document.createElement("div");
  fill.className = "layer fill";
  fill.textContent = WORD;
  text3d.appendChild(fill);

  // Capa de grano: textura tipo spray, encima del relleno
  const grain = document.createElement("div");
  grain.className = "layer grain";
  grain.textContent = WORD;
  text3d.appendChild(grain);

  // ---------- Ajuste de tamaño: la palabra ocupa casi todo el ancho ----------
  const FILL_RATIO = 0.4513;

  function fitText() {
    text3d.style.setProperty("--fit-scale", "1");
    requestAnimationFrame(() => {
      const naturalWidth = fill.getBoundingClientRect().width;
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

  // ---------- Física elástica del bloque de texto ----------
  // El texto se comporta como una masa: el cursor lo empuja (rotación, skew,
  // desplazamiento, escala y blur según la velocidad) y al soltarlo vuelve
  // suavemente a su posición de reposo. Todo se calcula en requestAnimationFrame
  // e interpola (lerp) hacia unos valores objetivo, nunca se aplica directo,
  // para que el movimiento sea fluido y orgánico, no brusco.

  const EASE_ACTIVE = 0.12;   // suavizado mientras el cursor está activo
  const EASE_REST   = 0.055;  // suavizado al volver al reposo (más lento = más orgánico)

  const MAX_ROTATE      = 5;    // grados de rotación máxima según posición del cursor
  const MAX_SKEW        = 9;    // grados de skew horizontal máximo según velocidad
  const MAX_MOVE_X      = 22;   // px de desplazamiento horizontal máximo
  const MAX_MOVE_Y      = 14;   // px de desplazamiento vertical máximo
  const MAX_SCALE_DELTA = 0.035; // variación de escala máxima por velocidad
  const MAX_BLUR        = 5;    // px de motion blur máximo
  const SPEED_CLAMP     = 3.2;  // px/ms tope para no disparar los valores

  let lastClientX = 0;
  let lastClientY = 0;
  let lastTime = performance.now();

  let velX = 0; // velocidad horizontal suavizada (px/ms)
  let velY = 0; // velocidad vertical suavizada (px/ms)

  let isActive = false;
  let idleTimer = null;

  let targetRot = 0;
  let targetSkew = 0;
  let targetTX = 0;
  let targetTY = 0;
  let targetScale = 1;
  let targetBlur = 0;

  let curRot = 0;
  let curSkew = 0;
  let curTX = 0;
  let curTY = 0;
  let curScale = 1;
  let curBlur = 0;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function handleMove(e) {
    const rect = wrap.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // posición del cursor respecto al centro del bloque, normalizada
    const offsetX = clamp((e.clientX - centerX) / (rect.width / 2), -1.4, 1.4);
    const offsetY = clamp((e.clientY - centerY) / (rect.height / 2), -1.4, 1.4);

    // velocidad instantánea del cursor (px/ms), suavizada con su propio lerp
    // para que no salte de golpe entre dos eventos de mousemove
    const now = performance.now();
    const dt = Math.max(now - lastTime, 1);
    const instVX = (e.clientX - lastClientX) / dt;
    const instVY = (e.clientY - lastClientY) / dt;
    velX = lerp(velX, instVX, 0.5);
    velY = lerp(velY, instVY, 0.5);

    const speed = clamp(Math.hypot(velX, velY), 0, SPEED_CLAMP);

    // rotación suave: hacia qué lado está el cursor respecto al centro
    targetRot = offsetX * MAX_ROTATE;

    // skew horizontal: el "empujón" lateral, proporcional a la velocidad en X
    targetSkew = clamp(velX * 7, -MAX_SKEW, MAX_SKEW);

    // desplazamiento: el bloque se deja arrastrar un poco hacia el cursor
    targetTX = offsetX * MAX_MOVE_X;
    targetTY = offsetY * MAX_MOVE_Y;

    // escala ligera y blur, ambos en función de la velocidad (no de la posición)
    targetScale = 1 + Math.min(speed * 0.018, MAX_SCALE_DELTA);
    targetBlur = Math.min(speed * 2.6, MAX_BLUR);

    lastClientX = e.clientX;
    lastClientY = e.clientY;
    lastTime = now;
    isActive = true;

    // si el cursor se queda quieto (sin disparar mousemove) frenamos el
    // "empuje" de velocidad pero mantenemos la inclinación de posición
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      targetSkew = 0;
      targetScale = 1;
      targetBlur = 0;
      velX = 0;
      velY = 0;
    }, 90);
  }

  function handleLeave() {
    isActive = false;
    targetRot = 0;
    targetSkew = 0;
    targetTX = 0;
    targetTY = 0;
    targetScale = 1;
    targetBlur = 0;
    velX = 0;
    velY = 0;
  }

  hero.addEventListener("mousemove", handleMove);
  hero.addEventListener("mouseleave", handleLeave);

  function animate() {
    const e = isActive ? EASE_ACTIVE : EASE_REST;

    curRot = lerp(curRot, targetRot, e);
    curSkew = lerp(curSkew, targetSkew, e);
    curTX = lerp(curTX, targetTX, e);
    curTY = lerp(curTY, targetTY, e);
    curScale = lerp(curScale, targetScale, e);
    curBlur = lerp(curBlur, targetBlur, e);

    text3d.style.setProperty("--rot", `${curRot.toFixed(2)}deg`);
    text3d.style.setProperty("--skew", `${curSkew.toFixed(2)}deg`);
    text3d.style.setProperty("--tx", `${curTX.toFixed(2)}px`);
    text3d.style.setProperty("--ty", `${curTY.toFixed(2)}px`);
    text3d.style.setProperty("--scale-dyn", curScale.toFixed(4));
    text3d.style.setProperty("--blur", `${curBlur.toFixed(2)}px`);

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
});
