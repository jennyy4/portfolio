document.addEventListener("DOMContentLoaded", () => {
  const text = document.getElementById("mainText");
  const turb = document.getElementById("turb");
  const dispMap = document.getElementById("dispMap");
  const blur = document.querySelector("#grainFilter feGaussianBlur");

  // Fade-in al cargar la página
  requestAnimationFrame(() => {
    text.classList.add("visible");
  });

  // ---------- Animación continua tipo "respiración" del grano/blur ----------
  let t = 0;

  function loop() {
    t += 0.015;

    // El desplazamiento (warp) oscila suavemente
    const scale = 8 + Math.sin(t) * 6;          // entre ~2 y ~14
    dispMap.setAttribute("scale", scale.toFixed(2));

    // La frecuencia del ruido también varía un poco para que no se vea estático
    const freq = 0.01 + (Math.sin(t * 0.7) + 1) * 0.004;
    turb.setAttribute("baseFrequency", freq.toFixed(4));

    // El desenfoque de los bordes también respira ligeramente
    const blurAmount = 0.6 + (Math.sin(t * 0.9) + 1) * 0.5; // entre ~0.6 y ~1.6
    blur.setAttribute("stdDeviation", blurAmount.toFixed(2));

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
