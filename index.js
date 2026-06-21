const title = document.querySelector(".hero-title");

const text = title.textContent.trim();
title.innerHTML = "";

text.split("").forEach((letter, index) => {
  const span = document.createElement("span");
  span.classList.add("char");
  span.textContent = letter;
  span.dataset.char = letter;
  span.style.setProperty("--i", index);
  title.appendChild(span);
});

const chars = title.querySelectorAll(".char");

title.addEventListener("mousemove", (event) => {
  chars.forEach((char) => {
    const rect = char.getBoundingClientRect();

    const charX = rect.left + rect.width / 2;
    const charY = rect.top + rect.height / 2;

    const distanceX = event.clientX - charX;
    const distanceY = event.clientY - charY;

    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    const maxDistance = 260;

    const strength = Math.max(0, 1 - distance / maxDistance);

    const moveX = distanceX * 0.055 * strength;
    const moveY = distanceY * 0.04 * strength;

    const rotateY = distanceX * 0.045 * strength;
    const rotateX = -distanceY * 0.045 * strength;

    const depth = 80 * strength;
    const skew = distanceX * 0.018 * strength;

    const shadowX = -distanceX * 0.035 * strength + 8;
    const shadowY = -distanceY * 0.035 * strength + 8;

    char.style.setProperty("--mx", moveX.toFixed(2));
    char.style.setProperty("--my", moveY.toFixed(2));
    char.style.setProperty("--rx", rotateX.toFixed(2));
    char.style.setProperty("--ry", rotateY.toFixed(2));
    char.style.setProperty("--depth", depth.toFixed(2));
    char.style.setProperty("--skew", skew.toFixed(2));
    char.style.setProperty("--shadow-x", shadowX.toFixed(2));
    char.style.setProperty("--shadow-y", shadowY.toFixed(2));
  });
});

title.addEventListener("mouseleave", () => {
  chars.forEach((char) => {
    char.style.setProperty("--mx", 0);
    char.style.setProperty("--my", 0);
    char.style.setProperty("--rx", 0);
    char.style.setProperty("--ry", 0);
    char.style.setProperty("--depth", 0);
    char.style.setProperty("--skew", 0);
    char.style.setProperty("--shadow-x", 8);
    char.style.setProperty("--shadow-y", 8);
  });
});
