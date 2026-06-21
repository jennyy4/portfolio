document.addEventListener("DOMContentLoaded", () => {
  const hero = document.querySelector(".hero");
  const wrap = document.getElementById("text3dWrap");
  const text3d = document.getElementById("text3d");

  const WORD = "FRASE";

  // Capa de relleno: el texto sólido y nítido (sin capas de halo/sombra)
  const fill = document.createElement("div");
  fill.className = "layer fill";
  fill.textContent = WORD;
  fill.style.setProperty("--z", "0px");
  text3d.appendChild(fill);

  // Capa de grano: textura tipo spray, encima del relleno
  const grain = document.createElement("div");
  grain.className = "layer grain";
  grain.textContent = WORD;
  grain.style.setProperty("--z", "0px");
  text3d.appendChild(grain);

  // ---------- Ajuste de tamaño: la palabra ocupa casi todo el ancho ----------
  const FILL_RATIO = 0.4513; // % del ancho del hero que debe ocupar la palabra (otro 5% más pequeño)

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

  // ---------- Reacción al cursor ----------
  const maxRotate = 14;  // grados máximos de inclinación 3D
  const ease = 0.07;     // suavizado (lerp) -> inercia del movimiento

  let targetRX = 0;
  let targetRY = 0;
  let currentRX = 0;
  let currentRY = 0;

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
  }

  function resetTarget() {
    targetRX = 0;
    targetRY = 0;
  }

  hero.addEventListener("mousemove", handleMove);
  hero.addEventListener("mouseleave", resetTarget);

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function animate() {
    currentRX = lerp(currentRX, targetRX, ease);
    currentRY = lerp(currentRY, targetRY, ease);

    text3d.style.setProperty("--rx", `${currentRX.toFixed(2)}deg`);
    text3d.style.setProperty("--ry", `${currentRY.toFixed(2)}deg`);

    // El parallax de las capas de halo ya ocurre solo: al estar en distinta
    // translateZ dentro de un contenedor con perspective + preserve-3d,
    // rotateX/rotateY las desplaza de forma realista sin cálculos extra.

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
});
