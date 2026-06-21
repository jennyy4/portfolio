document.addEventListener("DOMContentLoaded", () => {
  const hero = document.querySelector(".hero");
  const wrap = document.getElementById("textWrap");
  const sharpText = document.getElementById("sharpText");

  // Fade-in al cargar la página
  requestAnimationFrame(() => {
    wrap.classList.add("visible");
  });

  // ---------- Parámetros del área nítida (círculo) ----------
  const radius = 160; // px de radio del área que se ve nítida

  function updatePosition(e) {
    const rect = wrap.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    sharpText.style.setProperty("--mx", `${x}px`);
    sharpText.style.setProperty("--my", `${y}px`);
  }

  // En cuanto el cursor entra, el círculo nítido aparece de inmediato
  hero.addEventListener("mouseenter", (e) => {
    updatePosition(e);
    sharpText.style.setProperty("--radius", `${radius}px`);
  });

  // Mientras se mueve, el círculo sigue al cursor sin retraso
  hero.addEventListener("mousemove", updatePosition);

  // Al salir, deja de verse nítido
  hero.addEventListener("mouseleave", () => {
    sharpText.style.setProperty("--radius", "0px");
  });
});
