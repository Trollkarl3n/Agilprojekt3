import * as productdata from "./productdata.js";
import * as db from "./database.js";

const productInfoBox = document.querySelector(".productinfo-page");

if (productInfoBox) {
  loadProductData().then((product) => {
    // Hide slideshow arrows if there is only one image...
    const imageCount = document.querySelectorAll(".product-image img").length;
    const nextButton = document.querySelector(".next");
    const prevButton = document.querySelector(".prev");

    if (imageCount < 2) {
      nextButton.classList.add("hide");
      prevButton.classList.add("hide");
    } else {
      nextButton.classList.remove("hide");
      prevButton.classList.remove("hide");
    }
  });
}

async function loadProductData() {
  const productId = Number(
    new URLSearchParams(window.location.search).get("product")
  );
  console.log("Display product ID", productId);

  if (productId && productId > 0) {
    const product = await productdata.getProduct(productId);

    if (product) {
      console.log("Showing product info", product);

      // Product elements
      const productName = document.querySelector(".product-name");
      const productDesc = document.querySelector(".product-desc");
      const productPrice = document.querySelector(".product-price");
      const productImage = document.querySelector(".product-image");
      const productElement = document.querySelector(".productinfo-page");
      const productStock = document.querySelector(".product-stock");

      // Setting product details on the page
      productName.innerText = product.name;
      productDesc.innerText = product.description;
      productPrice.innerText = product.price;
      productElement.id = `productid-${productId}`;
      productStock.lastElementChild.innerText = `I Lager (${product.amount})`;

      let currentImageIndex = 0;

      // Clear current images
      productImage.innerHTML = "";

      // Create the main (focused) image container
      const mainImage = document.createElement("img");
      mainImage.src = product.image[0];
      mainImage.classList.add("focused"); // Set the first image as focused
      productImage.appendChild(mainImage);

      // Create a container for the thumbnails
      const thumbnailsContainer = document.createElement("div");
      thumbnailsContainer.classList.add("thumbnails");

      // Create and add thumbnails
      product.image.forEach((image, index) => {
        const imgElement = document.createElement("img");
        imgElement.src = image;
        imgElement.classList.add("thumbnail");

        // Mark the first thumbnail as selected
        if (index === 0) {
          imgElement.classList.add("selected");
        }

        imgElement.addEventListener("click", () => {
          currentImageIndex = index;
          mainImage.src = product.image[currentImageIndex]; // Update the main image
          updateThumbnailSelection(currentImageIndex); // Update thumbnail selection
        });

        thumbnailsContainer.appendChild(imgElement);
      });

      // Append the thumbnails container under the main image
      productImage.appendChild(thumbnailsContainer);

      // Function to update the selected thumbnail
      function updateThumbnailSelection(index) {
        const thumbnails = thumbnailsContainer.querySelectorAll("img");
        thumbnails.forEach((thumbnail, i) => {
          if (i === index) {
            thumbnail.classList.add("selected");
          } else {
            thumbnail.classList.remove("selected");
          }
        });
      }

      // Function to update which image is focused for next/prev buttons
      function setFocusImage(index) {
        mainImage.src = product.image[index]; // Update main image
        updateThumbnailSelection(index); // Update selected thumbnail
      }

      // Next/Previous button handlers
      const nextButton = document.querySelector(".next");
      const prevButton = document.querySelector(".prev");

      nextButton.addEventListener("click", () => {
        currentImageIndex = (currentImageIndex + 1) % product.image.length;
        setFocusImage(currentImageIndex);
      });

      prevButton.addEventListener("click", () => {
        currentImageIndex = (currentImageIndex - 1 + product.image.length) % product.image.length;
        setFocusImage(currentImageIndex);
      });

      return product;
    }
  }
}

const buyButton = document.querySelector(".product-buy");
buyButton.addEventListener("click", async (event) => {
  try {
    const product = await loadProductData();
    if (product) {
      db.addToCart(product.productid, 1);
      console.log("added to cart");
    } else {
      console.log("Error adding product data");
    }
  } catch (error) {
    console.log("Error loading product data", error);
  }
});

const wishlistButton = document.querySelector(".product-wishlist");
wishlistButton.addEventListener("click", async (event) => {
  try {
    const product = await loadProductData();
    const checkWishlist = await db.getWishlist();
    const wishlistIdArray = checkWishlist.map((product) => product.productid);

    if (!wishlistIdArray.includes(product.productid)) {
      db.addToWishlist(product.productid);
      console.log("added to wishlist");
      alert("Product added to wishlist");
    } else {
      console.log("Error adding product data");
      alert("Product already in wishlist");
    }
  } catch (error) {
    console.log("Error loading product data", error);
  }
});

db.getShoppingCart().then((list) => console.log(list));

