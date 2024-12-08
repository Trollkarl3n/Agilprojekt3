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
      const productPrice = document.querySelector(".product-price span"); // Ensure you select the span for the price
      const productImage = document.querySelector(".product-image");
      const productElement = document.querySelector(".productinfo-page");
      const productStock = document.querySelector(".product-stock span"); // Select the span for stock info

      // Setting product details on the page
      productName.innerText = product.name;
      productDesc.innerText = product.description;
      productPrice.innerText = `${product.price} kr`; // Update price with currency
      productElement.id = `productid-${productId}`;
      productStock.innerText = `I Lager (${product.amount})`; // Update stock level

      // Check for low stock
      if (product.amount < 10) {
        productStock.classList.add("low-stock");
        // Optional: Add a low stock warning message here
        productStock.innerText += " - Low Stock!";
      }

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
    } else {
      console.log("Product not found");
    }
  }
}

const buyButton = document.querySelector(".product-buy");
buyButton.addEventListener("click", async (event) => {
  try {
    const product = await loadProductData();
    if (product && product.amount > 0) { // Check if there's stock available
      await db.addToCart(product.productid, 1);
      console.log("added to cart");
      // Update stock level after adding to cart
      product.amount -= 1;
      document.querySelector(".product-stock span").innerText = `I Lager (${product.amount})`;
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
      await db.addToWishlist(product.productid);
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

// Example to check the shopping cart contents
db.getShoppingCart().then((list) => console.log(list));

// Add this function to fetch and display low stock products
async function fetchAndDisplayLowStockProducts() {
  try {
    const lowStockProducts = await db.getLowStockProducts(); // Fetch low stock products from your database
    displayLowStockProducts(lowStockProducts);
  } catch (error) {
    console.error("Error fetching low stock products:", error);
  }
}

function displayLowStockProducts(lowStockProducts) {
  const container = document.getElementById("low-stock-products"); // Ensure this ID matches your HTML
  if (container) {
    container.innerHTML = ""; // Clear previous content
    if (lowStockProducts.length === 0) {
      container.innerHTML = "No low stock products available.";
      return;
    }
    
    lowStockProducts.forEach(product => {
      const productElement = document.createElement("div");
      productElement.innerHTML = `${product.name} - ${product.stock} units left`;
      container.appendChild(productElement);
    });
  } else {
    console.error("Container for low stock products not found!");
  }
}

// Call this function after the DOM is ready
document.addEventListener("DOMContentLoaded", fetchAndDisplayLowStockProducts);
