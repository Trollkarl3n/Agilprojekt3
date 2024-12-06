/*
    Script for the admin control panel page.
*/
import * as database from "./database.js";
import * as productdata from "./productdata.js";

//////////////////////// ADD CATEGORIES ////////////////////////

const newProductCatList = document.querySelector("#create-product-category");
const newCategoryForm = document.querySelector("#create-category-form");

// Submit handler for New Category form. 
if (newCategoryForm) {
    newCategoryForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);
        const fileReader = new FileReader();
        const formImage = formData.get("category-image");

        // Store the new category in the browser IndexedDB.
        fileReader.addEventListener("load", (event) => {
            let imageBlob = fileReader.result;
            database.addCategory(formData.get("category-name"), imageBlob, formData.get("category-group")).then(() => {
                buildCategoryMenuOptions(newProductCatList);
            }).catch(err => console.error("Error adding category:", err)); // Catch any errors
        });

        if (formImage) {
            fileReader.readAsDataURL(formImage);
        }

        alert("Ny kategori skapad!");
        event.target.reset();
        document.querySelector("#category-preview").innerHTML = "";
    });
}

// Show preview of image selected in New Category form
const categoryImageInput = document.querySelector("#create-category-image");
if (newCategoryForm && categoryImageInput) {
    categoryImageInput.addEventListener("change", (event) => {
        const previewBox = document.querySelector("#category-preview");
        const formData = new FormData(newCategoryForm);

        previewBox.innerHTML = "";
        const previewImage = document.createElement("img");
        previewImage.src = URL.createObjectURL(formData.get("category-image"));
        previewBox.append(previewImage);
    });
}

//////////////////////// ADD PRODUCTS ////////////////////////

// Submit handler for New Product form. 
const newProductForm = document.querySelector("#create-product-form");
if (newProductForm) {
    newProductForm.addEventListener("submit", (event) => {
        event.preventDefault();

        onNewProductSubmit(event.target).then((product) => {
            alert("Ny produkt skapad!");
            event.target.reset();
            document.querySelector("#product-preview").innerHTML = "";
            loadProducts(); // Refresh product dropdown after adding a new product
        }).catch((error) => {
            console.error("Error creating new product!", error);
        });
    });
}

// Show preview of images selected in New Product form
const productImageInputs = [
    document.querySelector("#create-product-image-1"),
    document.querySelector("#create-product-image-2"),
    document.querySelector("#create-product-image-3"),
    document.querySelector("#create-product-image-4"),
    document.querySelector("#create-product-image-5"),
];

const mainImagePreview = document.getElementById("main-image-preview");
const thumbnailPreviews = document.querySelectorAll(".thumbnail");
const mainImageSelect = document.getElementById("main-image-select");

// Add event listeners for image inputs
productImageInputs.forEach((input, index) => {
    input.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                updatePreviews(index, reader.result);
            };
            reader.readAsDataURL(file);
        }
    });
});

// Update thumbnail previews
function updatePreviews(index, imageUrl) {
    thumbnailPreviews[index].src = imageUrl; // Set thumbnail image
    updateMainImagePreview(); // Update main image if the main image is selected
}

// Update main image preview based on selection
function updateMainImagePreview() {
    const selectedIndex = mainImageSelect.selectedIndex; // Get selected index (0-based)
    if (selectedIndex >= 0) {
        mainImagePreview.src = thumbnailPreviews[selectedIndex].src; // Set main image
    }
}

// Add event listeners for selecting main image from dropdown
mainImageSelect.addEventListener("change", () => {
    updateMainImagePreview(); // Update main image whenever selection changes
});

// Build menu options for Category menu in the new Product form.
if (newProductCatList && newProductForm) {
    loadCategories(); // Load categories on form initialization
}

// Load the categories from the database
async function loadCategories() {
    try {
        const categories = await productdata.getCategories(); // Fetch categories from the database
        console.log("Fetched Categories:", categories); // Log fetched categories

        // Populate the create product category dropdown
        newProductCatList.innerHTML = "";
        categories.forEach(category => {
            const option = document.createElement("option");
            option.value = category.categoryid;
            option.innerText = category.name;
            newProductCatList.appendChild(option);
        });

        // Populate the edit product category dropdown
        const editProductCategorySelect = document.querySelector("#edit-product-category");
        editProductCategorySelect.innerHTML = ""; // Clear existing options
        categories.forEach(category => {
            const option = document.createElement("option");
            option.value = category.categoryid;
            option.innerText = category.name;
            editProductCategorySelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading categories:", error);
    }
}

// Load products for editing
async function loadProducts() {
    const editProductSelect = document.querySelector("#edit-product-select");
    try {
        const products = await database.getProducts(); // Fetch products from the database
        console.log("Fetched Products:", products); // Log fetched products

        // Clear existing options
        editProductSelect.innerHTML = "";
        products.forEach(product => {
            const option = document.createElement("option");
            option.value = product.productid; // Use the correct product ID
            option.innerText = product.name; // Display the product name
            editProductSelect.appendChild(option);
        });

        // Load product details into the form when a product is selected
        editProductSelect.addEventListener("change", async (event) => {
            const selectedProductId = event.target.value;
            const selectedProduct = products.find(product => product.productid == selectedProductId);
            if (selectedProduct) {
                fillEditProductForm(selectedProduct);
            } else {
                console.error("Product not found:", selectedProductId);
            }
        });
    } catch (error) {
        console.error("Error loading products:", error);
    }
}

// Fill the edit product form with selected product details
function fillEditProductForm(product) {
    console.log("Filling form with product:", product);
    document.querySelector("#edit-product-name").value = product.name;
    document.querySelector("#edit-product-desc").value = product.description; 
    document.querySelector("#edit-product-price").value = product.price;
    document.querySelector("#edit-product-category").value = product.category;

    // Clear the image previews and set the main image
    document.getElementById("main-image-preview").src = product.image[0] || ""; 
    product.image.forEach((img, index) => {
        const thumbnail = document.querySelector(`#thumbnail-${index + 1}`);
        if (thumbnail) {
            thumbnail.src = img; // Set thumbnail images
        }
    });
}

// Handle submitted New Product form data, store it in the db.
async function onNewProductSubmit(productForm) {
    const images = [];
    const formData = new FormData(productForm);
    const formImages = formData.getAll("product-image");

    // Get and encode selected product images
    for (const formImage of formImages) {
        try {
            const image = await readProductImage(formImage);
            images.push(image);
        } catch (error) {
            console.error("Unable to read file", formImage);
        }
    }

    // Save the product
    const newProduct = await database.addProduct(
        formData.get("product-name"),
        formData.get("product-desc"),
        formData.get("product-price"),
        formData.get("product-category"),
        images
    );

    return newProduct;
}

function readProductImage(formImage) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();

        fileReader.addEventListener("load", (event) => {
            resolve(fileReader.result);
        });

        fileReader.addEventListener("error", (event) => {
            reject("Unable to load file.");
        });

        if (formImage) {
            fileReader.readAsDataURL(formImage);
        }
    });
}

// Load and display submissions
async function loadSubmissions() {
    const db = await openDatabase();
    const transaction = db.transaction("submissions", "readonly");
    const store = transaction.objectStore("submissions");
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            console.log("Fetched submissions:", request.result); // Log fetched data
            resolve(request.result);
        };
        request.onerror = () => reject("Unable to fetch submissions.");
    });
}

async function displaySubmissions() {
    const submissions = await loadSubmissions();
    const submissionsList = document.querySelector("#submissions-list");

    console.log("Displaying submissions:", submissions); // Log submissions being displayed

    submissionsList.innerHTML = "";

    submissions.forEach(submission => {
        const listItem = document.createElement("li");
        listItem.classList.add("submission-item");

        const content = `
            <strong>${submission.name} ${submission.surname}</strong>
            <br>Email: ${submission.email}
            <br>Phone: ${submission.phone}
            <br>Message: ${submission.message}
        `;
        listItem.innerHTML = content;
        submissionsList.appendChild(listItem);
    });
}

// Load and display low stock products
async function loadLowStockProducts() {
    const lowStockProducts = await database.getLowStockProducts(); // Fetch low stock products from the database
    const lowStockList = document.querySelector("#low-stock-list");

    console.log("Fetched low stock products:", lowStockProducts); // Log low stock products

    lowStockList.innerHTML = ""; // Clear existing items

    lowStockProducts.forEach(product => {
        const listItem = document.createElement("li");
        listItem.classList.add("low-stock-item");

        const content = `
            <strong>${product.name}</strong> (Lagernivå: ${product.stock})
        `;
        listItem.innerHTML = content; // Set the inner HTML for the list item
        lowStockList.appendChild(listItem); // Append the list item to the list
    });
}

// Initialize everything
document.addEventListener("DOMContentLoaded", () => {
    loadCategories();
    loadProducts();
    loadLowStockProducts();
    displaySubmissions();
});
