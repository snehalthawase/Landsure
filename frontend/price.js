window.addEventListener("scroll", function() {
  const header = document.querySelector(".header");
  const hero = document.querySelector(".hero-section");
  if (window.scrollY > hero.offsetHeight) {
    header.classList.add("fixed");
    hero.classList.add("has-header-fixed");
  } else {
    header.classList.remove("fixed");
    hero.classList.remove("has-header-fixed");
  }
});