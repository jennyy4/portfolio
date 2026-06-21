// Como el <script> se carga con "defer" (ver index.html), el HTML ya está
// completo cuando esto se ejecuta. Aun así dejamos DOMContentLoaded por
// seguridad: nunca está de más.
document.addEventListener("DOMContentLoaded", () => {
  const hero = document.querySelector(".hero");
  const wrap = document.getElementById("text3dWrap");
  const text3d = document.getElementById("text3d");
  const textHit = document.getElementById("textHit");

  // Si falta cualquiera de estos elementos en el HTML, paramos aquí con un
  // aviso claro en consola en lugar de romper todo el script en cascada
  // (que es lo que estaba pasando antes: un elemento null hacía fallar
  // addEventListener/style/getBoundingClientRect y el resto del archivo
  // nunca llegaba a ejecutarse).
  if (!hero || !wrap || !text3d || !textHit) {
    console.error(
      "[text3d] Falta algún elemento en el HTML. Revisa que existan los IDs: " +
      "text3dWrap, text3d, textHit, y la clase .hero."
    );
    return;
  }

  const WORD = "FRASE";

  // Capa de relleno: el texto sólido y nítido
  const fill = document.createElement("div");
  fill.className = "layer fill";
  fill.textContent = WORD;
  text3d.appendChild(fill);

  // Capa borrosa: duplicado del texto, se ve únicamente fuera del círculo
  // de la "lupa de nitidez" que sigue al cursor (ver más abajo). En reposo
  // permanece invisible (--lens-blur-opacity: 0).
  const blurred = document.createElement("div");
  blurred.className = "layer blurred";
  blurred.textContent = WORD;
  text3d.appendChild(blurred);

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

        // radio de la "lupa de nitidez", proporcional a la altura real del
        // texto ya escalado, para que se vea coherente en cualquier tamaño
        // de pantalla
        const renderedHeight = naturalHeight * scale;
        spotCore = renderedHeight * 0.55;
        spotFeather = renderedHeight * 0.5;
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

  const MAX_ROTATE      = 7;     // grados de rotación Z máxima (pivota en el punto de presión)
  const MAX_TILT        = 12;    // grados de inclinación 3D máxima (volumen)
  const MAX_SKEW        = 8;     // grados de skew horizontal máximo según velocidad
  const MAX_MOVE_X      = 20;    // px de desplazamiento horizontal máximo
  const MAX_MOVE_Y      = 12;    // px de desplazamiento vertical máximo
  const MAX_SCALE_DELTA = 0.03;  // variación de escala máxima por velocidad
  const MAX_BLUR        = 4.5;   // px de motion blur máximo (del bloque entero, al moverse rápido)
  const SPEED_CLAMP     = 3.2;   // px/ms tope para no disparar los valores
  const VIBE_AMOUNT     = 1.4;   // px de micro-vibración orgánica máxima

  // El giro y la inclinación ya no dependen de "en qué lado del bloque
  // está el cursor respecto al centro" (eso ahora lo cubre la traslación),
  // sino de la VELOCIDAD del cursor: como --origin-x/--origin-y ancla el
  // pivote justo en el punto donde está el ratón (ver más abajo), girar
  // según el movimiento reciente da la sensación de estar empujando/
  // presionando esa zona exacta, como si fuese un material con cierta
  // resistencia.
  const TILT_VEL_FACTOR = 7;     // grados de inclinación por cada px/ms de velocidad
  const ROT_VEL_FACTOR  = 4.5;   // grados de rotación Z por cada px/ms de velocidad

  // ---------- "Lupa de nitidez" que sigue al cursor ----------
  const LENS_POS_EASE        = 0.22;  // suavizado de la posición de la lupa (rápido, debe sentirse precisa)
  const LENS_STRENGTH_EASE   = 0.085; // suavizado de la apertura/cierre del círculo (efecto "iris")
  const MAX_LENS_BLUR_OPACITY = 0.92; // opacidad máxima de la capa borrosa fuera de la lupa
  const GRAIN_OPACITY_REST    = 0.55; // opacidad del grano en reposo (igual que el diseño original)
  const GRAIN_OPACITY_ACTIVE  = 0.85; // opacidad del grano reforzada mientras la lupa está activa

  let spotCore = 90;     // radio (px) de la zona nítida a fuerza máxima de lupa; lo recalcula fitText()
  let spotFeather = 70;  // ancho (px) del difuminado del borde de la lupa; lo recalcula fitText()

  let lensX = 50, lensY = 50;             // posición actual de la lupa (%), suavizada
  let lensTargetX = 50, lensTargetY = 50; // posición objetivo de la lupa (%), según el cursor
  let lensStrength = 0;                   // 0 = lupa cerrada (reposo), 1 = lupa totalmente abierta
  let lensTargetStrength = 0;

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

    // Posición del cursor respecto a la capa de relleno (#fill), en
    // porcentaje de su propio recuadro. Esto alimenta tanto el centro de
    // la "lupa de nitidez" como el pivote del giro (--origin-x/--origin-y):
    // ambos deben apuntar exactamente a donde está el ratón sobre el texto.
    const fillRect = fill.getBoundingClientRect();
    if (fillRect.width > 0 && fillRect.height > 0) {
      lensTargetX = ((e.clientX - fillRect.left) / fillRect.width) * 100;
      lensTargetY = ((e.clientY - fillRect.top) / fillRect.height) * 100;
    }

    if (isOverText) {
      // El bloque pivota justo en el punto del cursor (ver --origin-x/-y
      // en animate()), así que el giro y la inclinación ya no dependen de
      // la posición respecto al centro, sino de la velocidad reciente:
      // así se siente como si esa zona concreta estuviera siendo
      // empujada/presionada en la dirección en que se mueve el ratón.
      targetTiltY = clamp(velX * TILT_VEL_FACTOR, -MAX_TILT, MAX_TILT);
      targetTiltX = clamp(-velY * TILT_VEL_FACTOR, -MAX_TILT, MAX_TILT);
      targetRot = clamp(velX * ROT_VEL_FACTOR, -MAX_ROTATE, MAX_ROTATE);

      // skew horizontal: el "empujón" lateral, proporcional a la velocidad en X
      targetSkew = clamp(velX * 7, -MAX_SKEW, MAX_SKEW);

      // desplazamiento: el bloque se deja arrastrar un poco hacia el cursor
      targetTX = offsetX * MAX_MOVE_X;
      targetTY = offsetY * MAX_MOVE_Y;

      // escala ligera y blur, ambos en función de la velocidad (no de la posición)
      targetScale = 1 + Math.min(speed * 0.016, MAX_SCALE_DELTA);
      targetBlur = Math.min(speed * 2.2, MAX_BLUR);

      // abre la lupa de nitidez mientras el cursor está sobre el texto
      lensTargetStrength = 1;
    }

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
  }

  function handleLeaveText() {
    isOverText = false;

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

    // cierra la lupa de nitidez (vuelve a verse todo nítido, como en reposo)
    lensTargetStrength = 0;
  }

  // El movimiento del cursor se escucha en todo el hero para detectar
  // cuándo entra/sale del texto, pero el texto solo reacciona con fuerza
  // cuando isOverText es true.
  hero.addEventListener("mousemove", handleMove);
  textHit.addEventListener("mouseenter", handleEnterText);
  textHit.addEventListener("mouseleave", handleLeaveText);

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

    // ---------- Lupa de nitidez + pivote en el punto de presión ----------
    lensX = lerp(lensX, lensTargetX, LENS_POS_EASE);
    lensY = lerp(lensY, lensTargetY, LENS_POS_EASE);
    lensStrength = lerp(lensStrength, lensTargetStrength, LENS_STRENGTH_EASE);

    // radio de la zona nítida y de su difuminado, creciendo desde 0 (lupa
    // cerrada, todo nítido) hasta el tamaño completo (lupa abierta)
    const holeRadius = lensStrength * spotCore;
    const featherWidth = lensStrength * spotFeather;
    const blurOpacity = lensStrength * MAX_LENS_BLUR_OPACITY;
    const grainOpacity = lerp(GRAIN_OPACITY_REST, GRAIN_OPACITY_ACTIVE, lensStrength);

    // el pivote del giro viaja del centro (reposo) hacia el cursor a medida
    // que la lupa se abre, y vuelve solo al centro cuando se cierra
    const originX = lerp(50, lensX, lensStrength);
    const originY = lerp(50, lensY, lensStrength);

    text3d.style.setProperty("--lens-x", `${lensX.toFixed(2)}%`);
    text3d.style.setProperty("--lens-y", `${lensY.toFixed(2)}%`);
    text3d.style.setProperty("--lens-hole", `${holeRadius.toFixed(1)}px`);
    text3d.style.setProperty("--lens-feather", `${featherWidth.toFixed(1)}px`);
    text3d.style.setProperty("--lens-blur-opacity", blurOpacity.toFixed(3));
    text3d.style.setProperty("--lens-grain-opacity", grainOpacity.toFixed(3));
    text3d.style.setProperty("--origin-x", `${originX.toFixed(2)}%`);
    text3d.style.setProperty("--origin-y", `${originY.toFixed(2)}%`);

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
});
