document.addEventListener("DOMContentLoaded", () => {
  const hero = document.querySelector(".hero");
  const text = document.getElementById("mainText");

  // Fade-in al cargar la página
  requestAnimationFrame(() => {
    text.classList.add("visible");
  });

  // ---------- Parámetros del efecto 3D ----------
  const maxRotate = 14;     // grados máximos de inclinación (rotateX / rotateY)
  const idleBlur = 6;       // px de blur en estado de reposo
  const activeBlur = 0;     // px de blur cuando el cursor está cerca/encima
  const ease = 0.08;        // suavizado (lerp) -> más bajo = más inercia

  // Valores objetivo (a donde queremos llegar)
  let targetRX = 0;
  let targetRY = 0;
  let targetBlur = idleBlur;

  // Valores actuales (los que realmente se aplican, suavizados)
  let currentRX = 0;
  let currentRY = 0;
  let currentBlur = idleBlur;

  function handleMove(e) {
    const rect = text.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Posición del cursor normalizada respecto al centro del texto (-1 a 1)
    const offsetX = (e.clientX - centerX) / (rect.width / 2);
    const offsetY = (e.clientY - centerY) / (rect.height / 2);

    // Limitamos el rango para que no se vuelva loco fuera del texto
    const clampedX = Math.max(-1.4, Math.min(1.4, offsetX));
    const clampedY = Math.max(-1.4, Math.min(1.4, offsetY));

    // El eje Y del cursor controla rotateX (inclinación vertical) e inversa
    targetRY = clampedX * maxRotate;
    targetRX = -clampedY * maxRotate;

    // Cuanto más cerca del centro, más enfocado (menos blur)
    const distance = Math.min(1, Math.sqrt(clampedX * clampedX + clampedY * clampedY));
    targetBlur = idleBlur * distance + activeBlur * (1 - distance);
  }

  function resetTarget() {
    targetRX = 0;
    targetRY = 0;
    targetBlur = idleBlur;
  }

  hero.addEventListener("mousemove", handleMove);
  hero.addEventListener("mouseleave", resetTarget);

  // ---------- Bucle de animación con interpolación (lerp) ----------
  function lerp(start, end, t) {
    return start + (end - start) * t;
  }

  function animate() {
    currentRX = lerp(currentRX, targetRX, ease);
    currentRY = lerp(currentRY, targetRY, ease);
    currentBlur = lerp(currentBlur, targetBlur, ease);

    text.style.setProperty("--rx", `${currentRX.toFixed(2)}deg`);
    text.style.setProperty("--ry", `${currentRY.toFixed(2)}deg`);
    text.style.setProperty("--blur", `${currentBlur.toFixed(2)}px`);

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
});
