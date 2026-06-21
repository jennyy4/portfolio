document.addEventListener("DOMContentLoaded", () => {
  const hero = document.querySelector(".hero");
  const wrap = document.getElementById("text3dWrap");
  const text3d = document.getElementById("text3d");
  const textHit = document.getElementById("textHit");
  const cursorImg = document.getElementById("cursorImg");

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
  const HIT_PADDING = 1.12; // margen extra sobre el texto para que el hover sea más cómodo

  function fitText() {
    text3d.style.setProperty("--fit-scale", "1");
    requestAnimationFrame(() => {
      const box = fill.getBoundingClientRect();
      const naturalWidth = box.width;
      const naturalHeight = box.height;
      const targetWidth = wrap.clientWidth * FILL_RATIO;
      if (naturalWidth > 0) {
        const scale = targetWidth / naturalWidth;
        text3d.style.setProperty("--fit-scale", scale.toFixed(4));

        // el área de hover real (#textHit) se dimensiona al tamaño final
        // del texto ya escalado, porque .text3d-wrap colapsa su altura al
        // tener solo hijos position:absolute y no sirve para detectar hover
        textHit.style.width = `${(naturalWidth * scale * HIT_PADDING).toFixed(1)}px`;
        textHit.style.height = `${(naturalHeight * scale * HIT_PADDING).toFixed(1)}px`;
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
  // El texto solo reacciona cuando el cursor está ENCIMA de él (no en toda
  // la pantalla). Se comporta como una masa con volumen: el cursor lo empuja
  // (tilt 3D, rotación, skew, desplazamiento, escala y blur según la
  // velocidad) y al soltarlo vuelve suavemente a su posición de reposo, con
  // una pequeña vibración orgánica de fondo mientras está activo. Todo se
  // calcula en requestAnimationFrame e interpola (lerp) hacia unos valores
  // objetivo, nunca se aplica directo, para que el movimiento sea fluido.

  const EASE_ACTIVE = 0.14;   // suavizado mientras el cursor está activo
  const EASE_REST   = 0.055;  // suavizado al volver al reposo (más lento = más orgánico)

  const MAX_ROTATE      = 6;     // grados de rotación Z máxima según posición del cursor
  const MAX_TILT        = 10;    // grados de inclinación 3D máxima (volumen)
  const MAX_SKEW        = 8;     // grados de skew horizontal máximo según velocidad
  const MAX_MOVE_X      = 20;    // px de desplazamiento horizontal máximo
  const MAX_MOVE_Y      = 12;    // px de desplazamiento vertical máximo
  const MAX_SCALE_DELTA = 0.03;  // variación de escala máxima por velocidad
  const MAX_BLUR        = 4.5;   // px de motion blur máximo
  const SPEED_CLAMP     = 3.2;   // px/ms tope para no disparar los valores
  const VIBE_AMOUNT     = 1.4;   // px de micro-vibración orgánica máxima

  let lastClientX = 0;
  let lastClientY = 0;
  let lastTime = performance.now();

  let velX = 0; // velocidad horizontal suavizada (px/ms)
  let velY = 0; // velocidad vertical suavizada (px/ms)

  let isOverText = false; // el cursor está dentro del área del texto
  let isActive = false;   // hay movimiento reciente (para elegir el ease)
  let idleTimer = null;

  let targetRot = 0;
  let targetTiltX = 0;
  let targetTiltY = 0;
  let targetSkew = 0;
  let targetTX = 0;
  let targetTY = 0;
  let targetScale = 1;
  let targetBlur = 0;

  let curRot = 0;
  let curTiltX = 0;
  let curTiltY = 0;
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
    const rect = textHit.getBoundingClientRect();
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

    if (isOverText) {
      // rotación Z + inclinación 3D: hacia qué lado está el cursor
      targetRot = offsetX * MAX_ROTATE;
      targetTiltX = -offsetY * MAX_TILT; // arriba/abajo -> inclina el "volumen"
      targetTiltY = offsetX * MAX_TILT;  // izquierda/derecha

      // skew horizontal: el "empujón" lateral, proporcional a la velocidad en X
      targetSkew = clamp(velX * 7, -MAX_SKEW, MAX_SKEW);

      // desplazamiento: el bloque se deja arrastrar un poco hacia el cursor
      targetTX = offsetX * MAX_MOVE_X;
      targetTY = offsetY * MAX_MOVE_Y;

      // escala ligera y blur, ambos en función de la velocidad (no de la posición)
      targetScale = 1 + Math.min(speed * 0.016, MAX_SCALE_DELTA);
      targetBlur = Math.min(speed * 2.2, MAX_BLUR);
    }

    // ---------- Imagen que sigue al cursor ----------
    cursorImg.style.setProperty("--cx", `${e.clientX}px`);
    cursorImg.style.setProperty("--cy", `${e.clientY}px`);

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

  function handleEnterText() {
    isOverText = true;
    cursorImg.classList.add("visible");
    cursorImg.style.setProperty("--cursor-scale", "1");
  }

  function handleLeaveText() {
    isOverText = false;
    cursorImg.classList.remove("visible");
    cursorImg.style.setProperty("--cursor-scale", "0.85");

    targetRot = 0;
    targetTiltX = 0;
    targetTiltY = 0;
    targetSkew = 0;
    targetTX = 0;
    targetTY = 0;
    targetScale = 1;
    targetBlur = 0;
    velX = 0;
    velY = 0;
  }

  // El movimiento del cursor se escucha en todo el hero (para que la imagen
  // pueda seguirlo y para detectar cuándo entra/sale del texto), pero el
  // texto solo reacciona con fuerza cuando isOverText es true.
  hero.addEventListener("mousemove", handleMove);
  textHit.addEventListener("mouseenter", handleEnterText);
  textHit.addEventListener("mouseleave", handleLeaveText);
  hero.addEventListener("mouseleave", () => {
    cursorImg.classList.remove("visible");
  });

  function animate() {
    const e = isActive ? EASE_ACTIVE : EASE_REST;

    curRot = lerp(curRot, targetRot, e);
    curTiltX = lerp(curTiltX, targetTiltX, e);
    curTiltY = lerp(curTiltY, targetTiltY, e);
    curSkew = lerp(curSkew, targetSkew, e);
    curTX = lerp(curTX, targetTX, e);
    curTY = lerp(curTY, targetTY, e);
    curScale = lerp(curScale, targetScale, e);
    curBlur = lerp(curBlur, targetBlur, e);

    // micro-vibración orgánica: solo mientras el cursor está activo sobre el
    // texto, una oscilación suave de baja amplitud que da sensación de "vivo"
    // sin afectar la legibilidad
    let vibeX = 0;
    let vibeY = 0;
    if (isOverText) {
      const t = performance.now() * 0.018;
      const speedFactor = clamp(Math.hypot(velX, velY) / SPEED_CLAMP, 0, 1);
      vibeX = Math.sin(t) * VIBE_AMOUNT * speedFactor;
      vibeY = Math.cos(t * 1.3) * VIBE_AMOUNT * 0.6 * speedFactor;
    }

    text3d.style.setProperty("--rot", `${curRot.toFixed(2)}deg`);
    text3d.style.setProperty("--tilt-x", `${curTiltX.toFixed(2)}deg`);
    text3d.style.setProperty("--tilt-y", `${curTiltY.toFixed(2)}deg`);
    text3d.style.setProperty("--skew", `${curSkew.toFixed(2)}deg`);
    text3d.style.setProperty("--tx", `${(curTX + vibeX).toFixed(2)}px`);
    text3d.style.setProperty("--ty", `${(curTY + vibeY).toFixed(2)}px`);
    text3d.style.setProperty("--scale-dyn", curScale.toFixed(4));
    text3d.style.setProperty("--blur", `${curBlur.toFixed(2)}px`);

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
});
