/*
    Script for building content on the product list page.
*/
import * as productdata from "./productdata.js";
import * as db from "./database.js";
import * as productList from "./productlist.js";
const productCardTemplate = document.querySelector("#product-card-template");
if (productCardTemplate) {
  showProductList(".product-list");
}

// Fetch list of products in the specified category and display them on the page.
async function showProductList(targetSelector) {
  const outBox = document.querySelector(targetSelector);
  const template = document.querySelector("#product-card-template");

  const products = await db.getWishlist();
  const wishlistProducts = await productdata.getProductsById(products);
  if (template) {
    if (wishlistProducts.length > 0) {
      outBox.innerHTML = "";
    }

    for (const product of wishlistProducts) {
      console.log("product: ", product);
      const card = template.content.firstElementChild.cloneNode(true);
      const image = card.querySelector("img");
      const label = card.querySelector("h3");
      const desc = card.querySelector("div");
      const links = card.querySelectorAll("a");

      card.id = `productid-${product.productid}`;
      image.src = product.image[0];
      label.innerText = product.name;
      desc.innerText = productList.getTruncatedString(product.description, 250);
      links.forEach((link) => {
        if (!link.href.includes("productcart.html")) {
          link.href = `productinfo.html?product=${product.productid}`;
        }
      });
      outBox.appendChild(card);
    }
  }
}
