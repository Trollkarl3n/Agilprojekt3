import * as productdata from "./productdata.js";

let debounceTimer = null;

const productSearchForm = document.querySelector("#product-search-form");
const searchTextField = document.querySelector("#product-search-text");

// Prevent the page from reloading if the form is submitted.
if (productSearchForm) {
    productSearchForm.addEventListener("submit", (event) => {
        event.preventDefault();
    });
}

// Perform search after 0.5 sec of no user input.
if (searchTextField) {
    searchTextField.addEventListener("input", (event) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(searchWhileTyping, 500);
    });

}

// Update search results as the user is typing
async function searchWhileTyping() {
    const resultsBox = document.querySelector("#product-search-result");
    const pageContent = document.querySelector("#main-content");
    const closeButton = document.querySelector("#search-close-button");
    const searchContainer = document.querySelector("#search-container");

    resultsBox.innerHTML = "";

    if (pageContent) {
        pageContent.style.display = "";
        closeButton.style.display = "none";
        searchContainer.style.display = "none";
    }

    if (searchTextField.value.length) {
        const searchResult = await productdata.searchProducts(searchTextField.value);

        if (searchResult.length) {
            for (const product of searchResult) {
                resultsBox.appendChild(createProductCard(product));
            }

            if (pageContent) {
                pageContent.style.display = "none";
                closeButton.style.display = "flex";
                searchContainer.style.display = "block";
            }

        }
        else {
            console.log("no result!");
            resultsBox.innerHTML = `<div class="search-product-noresult">Inga produkter matchar din sökning.</div>`;
        }
    }

    if (closeButton) {
        closeButton.addEventListener("click", (event) => {
            resultsBox.innerHTML = "";
            closeButton.style.display = "none";
            pageContent.style.display = "";
            searchContainer.style.display = "none";
        });
    }
}

// Build and return a product card for the specified product object.
function createProductCard(product) {
    const template = document.querySelector("#product-search-result-template");
    const card = template.content.firstElementChild.cloneNode(true);
    card.querySelector(".search-product-name").innerText = product.name;
    card.querySelector(".search-product-desc").innerText = product.description;
    card.querySelector(".search-product-link").href = `productinfo.html?product=${product.productid}`;
    card.querySelector(".search-product-image").src = product.image[0];
    card.setAttribute("data-productid", product.productid);
    return card;
}
