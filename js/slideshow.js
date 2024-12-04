let currentIndex = 0;

function showSlide(index) {
  const carousel = document.querySelector('.carousel');
  const totalSlides = document.querySelectorAll('.product-image > img').length;
console.log(totalSlides);
  if (index >= totalSlides) {
    currentIndex = 0; // wrap around to the first slide
  } else if (index < 0) {
    currentIndex = totalSlides - 1; // wrap around to the last slide
  } else {
    currentIndex = index;
  }

  carousel.style.transform = `translateX(${-currentIndex * 300}px)`;
}

function nextSlide() {
  showSlide(currentIndex + 1);
}

function prevSlide() {
  showSlide(currentIndex - 1);
}

const nextButton = document.querySelector('.next');
nextButton.addEventListener('click', event =>{
    nextSlide();
});

const prevButton = document.querySelector('.prev');
prevButton.addEventListener('click', event =>{
    prevSlide();
});