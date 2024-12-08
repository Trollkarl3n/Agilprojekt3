/*
    Script for the admin control panel page.
*/
import * as database from "./database.js"; // Ensure that this path is correct
import * as productdata from "./productdata.js"; // Ensure that this path is correct
import { countAllProducts } from './productdata.js';  // Adjust the path if needed

// Function to update the product count on the admin page
async function updateProductCount() {
    try {
        const productCount = await countAllProducts();
        const productCountElement = document.getElementById('product-count');
        productCountElement.textContent = productCount;
    } catch (error) {
        console.error('Error fetching product count:', error);
    }
}

// Call the updateProductCount function when the page loads
document.addEventListener('DOMContentLoaded', updateProductCount);

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
            database.addCategory(formData.get("category-name"), imageBlob, formData.get("category-group"))
                .then(() => {
                    buildCategoryMenuOptions(newProductCatList);
                })
                .catch(err => console.error("Error adding category:", err));
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
const newProductForm = document.querySelector("#create-product-form");
if (newProductForm) {
    newProductForm.addEventListener("submit", (event) => {
        event.preventDefault();

        onNewProductSubmit(event.target)
            .then((product) => {
                alert("Ny produkt skapad!");
                event.target.reset();
                document.querySelector("#product-preview").innerHTML = "";
                loadProducts(); // Refresh product dropdown after adding a new product
            })
            .catch((error) => {
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
    if (input) { // Ensure the input exists
        input.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    updatePreviews(index, reader.result);
                };
                reader.readAsDataURL(file);
            } else {
                console.error(`Image input for index ${index} not found.`);
            }
        });
    } else {
        console.error(`Image input for index ${index} not found.`);
    }
});

// Update thumbnail previews
function updatePreviews(index, imageUrl) {
    if (thumbnailPreviews[index]) { // Check if thumbnail exists
        thumbnailPreviews[index].src = imageUrl; // Set thumbnail image
        updateMainImagePreview(); // Update main image if the main image is selected
    }
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
        console.log("Fetched Categories:", categories);

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
        if (editProductCategorySelect) {
            editProductCategorySelect.innerHTML = ""; // Clear existing options
            categories.forEach(category => {
                const option = document.createElement("option");
                option.value = category.categoryid;
                option.innerText = category.name;
                editProductCategorySelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Error loading categories:", error);
    }
}

// Load products for editing
async function loadProducts() {
    const editProductSelect = document.querySelector("#edit-product-select");
    try {
        const products = await database.getProducts(); // Fetch products from the database
        console.log("Fetched Products:", products);

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
    document.querySelector("#edit-product-stock").value = product.stock; // Set stock level

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

    // Get stock level from the form
    const stockLevel = formData.get("product-stock");

    // Get and encode selected product images
    for (const formImage of formImages) {
        try {
            const image = await readProductImage(formImage);
            images.push(image);
        } catch (error) {
            console.error("Unable to read file", formImage);
        }
    }

    // Save the product with stock level
    const newProduct = await database.addProduct(
        formData.get("product-name"),
        formData.get("product-desc"),
        formData.get("product-price"),
        formData.get("product-category"),
        images,
        stockLevel // Include stock level
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
            reject(new Error("Error reading image file."));
        });

        fileReader.readAsDataURL(formImage);
    });
}

//////////////////////// EDIT PRODUCTS ////////////////////////
const editProductForm = document.querySelector("#edit-product-form");
if (editProductForm) {
    editProductForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const selectedProductId = document.querySelector("#edit-product-select").value;
        const updatedProduct = {
            name: document.querySelector("#edit-product-name").value,
            description: document.querySelector("#edit-product-desc").value,
            price: parseFloat(document.querySelector("#edit-product-price").value),
            category: document.querySelector("#edit-product-category").value,
            stock: parseInt(document.querySelector("#edit-product-stock").value), // Capture stock level
        };

        try {
            await database.updateProduct(selectedProductId, updatedProduct);
            alert("Produkt uppdaterad!");
            loadProducts(); // Refresh products after editing
        } catch (error) {
            console.error("Error updating product:", error);
        }
    });
}

//////////////////////// DELETE PRODUCTS ////////////////////////
const deleteProductForm = document.querySelector("#delete-product-form");
if (deleteProductForm) {
    deleteProductForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const selectedProductId = document.querySelector("#delete-product-select").value;

        if (confirm("Är du säker på att du vill ta bort denna produkt?")) {
            try {
                await database.deleteProduct(selectedProductId);
                alert("Produkt borttagen!");
                loadProducts(); // Refresh product dropdown after deletion
            } catch (error) {
                console.error("Error deleting product:", error);
            }
        }
    });
}
