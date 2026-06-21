document.addEventListener("DOMContentLoaded", () => {
  const text = document.getElementById("mainText");
  const dispMap = document.getElementById("dispMap");
  const turb = document.getElementById("turb");

  // Mostramos el texto al cargar la página (fade-in simple)
  requestAnimationFrame(() => {
    text.classList.add("visible");
  });

  // ---------- Parámetros de la distorsión ----------
  const maxScale = 60;       // intensidad máxima del "warp" al pasar el cursor
  const baseFreq = 0.02;     // frecuencia base del ruido (textura del warp)

  let currentScale = 0;
  let targetScale = 0;
  let seed = 1;
  let rafId = null;

  function render() {
    // Suavizado hacia el valor objetivo (easing tipo "lerp")
    currentScale += (targetScale - currentScale) * 0.12;

    dispMap.setAttribute("scale", currentScale.toFixed(2));
    turb.setAttribute("baseFrequency", baseFreq);

    // El seed va cambiando para que el ruido "viva" mientras el cursor está encima
    seed += 0.6;
    turb.setAttribute("seed", seed.toFixed(1));

    // Si ya casi no hay distorsión y no se busca ninguna, paramos el bucle
    if (Math.abs(targetScale - currentScale) > 0.1 || targetScale > 0) {
      rafId = requestAnimationFrame(render);
    } else {
      currentScale = 0;
      dispMap.setAttribute("scale", 0);
      rafId = null;
    }
  }

  function startRender() {
    if (!rafId) {
      rafId = requestAnimationFrame(render);
    }
  }

  text.addEventListener("mouseenter", () => {
    targetScale = maxScale;
    startRender();
  });

  text.addEventListener("mouseleave", () => {
    targetScale = 0;
    startRender();
  });
});
