const text = document.querySelector(".frase-text");
const cursorImage = document.querySelector(".cursor-image");

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

let currentX = mouseX;
let currentY = mouseY;

let lastX = mouseX;
let lastY = mouseY;

let speed = 0;
let targetSpeed = 0;

window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;

  const dx = mouseX - lastX;
  const dy = mouseY - lastY;

  targetSpeed = Math.sqrt(dx * dx + dy * dy);

  lastX = mouseX;
  lastY = mouseY;

  if (cursorImage) {
    cursorImage.style.opacity = "1";
  }
});

window.addEventListener("mouseleave", () => {
  if (cursorImage) {
    cursorImage.style.opacity = "0";
  }
});

function animate() {
  currentX += (mouseX - currentX) * 0.12;
  currentY += (mouseY - currentY) * 0.12;

  speed += (targetSpeed - speed) * 0.15;
  targetSpeed *= 0.9;

  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  const distanceX = (currentX - centerX) / centerX;
  const distanceY = (currentY - centerY) / centerY;

  const rotate = distanceX * 4;
  const skew = distanceX * 7;
  const tx = distanceX * 18;
  const ty = distanceY * 10;

  const blur = Math.min(speed * 0.045, 7);
  const scaleX = 1 + Math.min(speed * 0.0009, 0.035);
  const scaleY = 1 - Math.min(speed * 0.0005, 0.025);

  text.style.setProperty("--rotate", `${rotate}deg`);
  text.style.setProperty("--skew", `${skew}deg`);
  text.style.setProperty("--tx", `${tx}px`);
  text.style.setProperty("--ty", `${ty}px`);
  text.style.setProperty("--blur", `${blur}px`);
  text.style.setProperty("--scaleX", scaleX);
  text.style.setProperty("--scaleY", scaleY);

  if (cursorImage) {
    cursorImage.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
  }

  requestAnimationFrame(animate);
}

animate();
