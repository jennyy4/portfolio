document.addEventListener("DOMContentLoaded", () => {
  const text = document.getElementById("mainText");
  const dispMap = document.getElementById("dispMap");
  const turb = document.getElementById("turb");

  // Mostramos el texto (dispara la transición de opacidad)
  requestAnimationFrame(() => {
    text.classList.add("visible");
  });

  // Parámetros de la animación del "grano -> nitidez"
  const duration = 1400; // ms
  const startScale = 90;
  const endScale = 0;

  const startFreq = 0.9;
  const endFreq = 0.01;

  const startTime = performance.now();

  function animateGrain(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);

    // easing tipo "easeOutCubic" para que se asiente con suavidad
    const eased = 1 - Math.pow(1 - t, 3);

    const currentScale = startScale + (endScale - startScale) * eased;
    const currentFreq = startFreq + (endFreq - startFreq) * eased;

    dispMap.setAttribute("scale", currentScale);
    turb.setAttribute("baseFrequency", currentFreq.toFixed(4));

    if (t < 1) {
      requestAnimationFrame(animateGrain);
    } else {
      // al terminar, quitamos el filtro para no penalizar rendimiento
      text.style.filter = "none";
    }
  }

  requestAnimationFrame(animateGrain);
});
