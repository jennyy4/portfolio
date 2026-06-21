document.addEventListener("DOMContentLoaded", () => {
  const hero = document.querySelector(".hero");
  const text = document.getElementById("mainText");

  // Fade-in al cargar la página
  requestAnimationFrame(() => {
    text.classList.add("visible");
  });

  // ---------- Parámetros del efecto hover ----------
  const maxMove = 18;   // px que se desplaza el texto siguiendo al cursor
  const maxBlur = 4;    // px de difuminado máximo en los bordes

  let isHovering = false;

  function handleMove(e) {
    if (!isHovering) return;

    const rect = text.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Distancia normalizada del cursor respecto al centro del texto
    const offsetX = (e.clientX - centerX) / (rect.width / 2);
    const offsetY = (e.clientY - centerY) / (rect.height / 2);

    const moveX = offsetX * maxMove;
    const moveY = offsetY * maxMove;

    text.style.transform = `translate(${moveX}px, ${moveY}px)`;
    text.style.filter = `blur(${maxBlur}px)`;
  }

  text.addEventListener("mouseenter", () => {
    isHovering = true;
    text.style.filter = `blur(${maxBlur}px)`;
  });

  text.addEventListener("mouseleave", () => {
    isHovering = false;
    text.style.transform = "translate(0px, 0px)";
    text.style.filter = "blur(0px)";
  });

  hero.addEventListener("mousemove", handleMove);
});
