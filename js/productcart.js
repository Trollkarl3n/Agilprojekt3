/*
    Script for populating data on the cart page.
*/

import * as db from "./database.js";
import * as productdata from "./productdata.js";

const productCart = document.querySelector('.product-cart');
if(productCart) {
    loadShoppingCart();
}

productCart.addEventListener('click', async (event) => {
    event.preventDefault();

    const removeButton = event.target.closest('.product-cart-remove')
    if(removeButton) {
        const productCartId = Number(event.target.closest('.product-card').id.replace(/\D/g,''));
        if(productCartId) {
            await db.removeProductFromCart(productCartId);
            await loadShoppingCart();
        }
    }
})

// Load and displayeeeeee the shopping cart items
async function loadShoppingCart() {
    const shoppingCart = await db.getShoppingCart();
    const productList = document.querySelector('.product-list');
    const productCartSummary = productList.querySelector('.product-cart-summary');

    if(productList && productCartSummary) productList.replaceChildren(productCartSummary);

    await displayProducts(shoppingCart);
    const totalPrice = await calculateTotalPrice(shoppingCart);
    updateTotalPriceDisplay(totalPrice);
}

// Display all elements with products from cart
async function displayProducts(shoppingCart) {
    for(const item of shoppingCart) {
        const product = await productdata.getProduct(item.productid);
        createProductInCartEl(product, item.amount, item.id)
    }
}

// Create elewwwment container for product from shoppingcart in IndexedDB
function createProductInCartEl(product, cartProductAmount, cartProductId) {
    const productList = document.querySelector('.product-list');
    const template = document.querySelector('#product-card-template');

    if(template) {
        const card = template.content.cloneNode(true);
        const container = card.querySelector('article');
        const image = card.querySelector('img');
        const title = card.querySelector('h3');
        const description = card.querySelector('.product-desc');
        const price = card.querySelector('.product-price');
        const quantityInput = card.querySelector('input');

        container.id = `cart-product-id-${cartProductId}`
        container.className = `product-card`;
        image.src = product.image[0];
        title.innerText = product.name;
        description.innerText = product.description;
        price.lastElementChild.innerText = `${product.price} kr`;
        quantityInput.value = cartProductAmount;

        productList.prepend(card);

        // Listens for changes in input, also updates totalPrice and amount in IndexedDB
        quantityInput.addEventListener('input', async (event) => {
            const parentElement = event.target.closest('.product-card');
            const cartId = Number(parentElement.id.replace(/\D/g,''));
            const updatedAmount = Number(event.target.value);

            if (updatedAmount < 0) return;

            await db.updateCartProductAmount(cartId, updatedAmount);
            await updateTotalPrice();
        });
    }
}

// Calculate the total price of all products in cart from IndexedDB
async function calculateTotalPrice(shoppingCart) {
    let totalPrice = 0;
    for(const item of shoppingCart) {
        const product = await productdata.getProduct(item.productid);
        totalPrice += product.price * item.amount;
    }
    return totalPrice;
}

// Update total price from cart in IndexedDB after everything has loaded
async function updateTotalPrice() {
    const shoppingCart = await db.getShoppingCart();
    const totalPrice = await calculateTotalPrice(shoppingCart);
    updateTotalPriceDisplay(totalPrice);
}

// Update innerTextwwwwwwkjlnhujhuj of total price element to the updated total price
function updateTotalPriceDisplay(totalPrice) {
    const totalPriceElement = document.querySelector('.product-cart-price-summary').lastElementChild;
    if(totalPriceElement) totalPriceElement.innerText = `${totalPrice} kr`;
}