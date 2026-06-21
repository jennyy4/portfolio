document.addEventListener("DOMContentLoaded", () => {
  const hero = document.querySelector(".hero");
  const wrap = document.getElementById("textWrap");
  const sharpText = document.getElementById("sharpText");

  // Fade-in al cargar la página
  requestAnimationFrame(() => {
    wrap.classList.add("visible");
  });

  // ---------- Parámetros del área nítida (círculo) ----------
  const maxRadius = 160; // px de radio del área que se ve nítida
  const ease = 0.15;     // suavizado (lerp): más bajo = más inercia

  let targetX = 0;
  let targetY = 0;
  let targetRadius = 0;

  let currentX = 0;
  let currentY = 0;
  let currentRadius = 0;

  function handleMove(e) {
    const rect = wrap.getBoundingClientRect();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
    targetRadius = maxRadius;
  }

  function handleLeave() {
    targetRadius = 0;
  }

  hero.addEventListener("mousemove", handleMove);
  hero.addEventListener("mouseleave", handleLeave);

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function animate() {
    currentX = lerp(currentX, targetX, ease);
    currentY = lerp(currentY, targetY, ease);
    currentRadius = lerp(currentRadius, targetRadius, ease);

    sharpText.style.setProperty("--mx", `${currentX.toFixed(1)}px`);
    sharpText.style.setProperty("--my", `${currentY.toFixed(1)}px`);
    sharpText.style.setProperty("--radius", `${currentRadius.toFixed(1)}px`);

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
});
