/*
    Fake categories and products database.
    Hardcoded base values, and user additions read from browser IndexedDB. 
*/
import * as database from "./database.js";

////////// LIST OF CATEGORY GROUPS
const groupList = [
  { name: "clothes", label: "Kläder" },
  { name: "skate", label: "Skate" },
];

////////// DEFAULT LIST OF PRODUCT CATEGORIES
const categoryList = [
  {
    categoryid: 1,
    name: "Jackor",
    image: "",
    group: "clothes",
  },
  {
    categoryid: 2,
    name: "Hooodies",
    image: "",
    group: "clothes",
  },
  {
    categoryid: 3,
    name: "T-shirts",
    image: "",
    group: "clothes",
  },
];

////////// DEFAULT PRODUCT LIST
const productList = [
  {
    productid: 1,
    category: "1",
    name: "Jeans jacka",
    date: "2024-12-04 ",
    price: "400",
    description: "BingoBongoBangoBungo",
    amount: 5, 
    image: [
      "images/MoclerSeacondHandJacket.webp",
      "images/Streetware Jacket.webp",
      "images/MoclerSeacondHandJacket.webp",
    ],
  },
  {
    productid: 2,
    category: "1",
    name: "Annan jacka",
    date: "2024-12-04",
    price: "600",
    description: "BingoBongoBango",
    amount: 6, 
    image: [
      "images/Streetware Jacket.webp",
      "images/MoclerSeacondHandJacket.webp",
    ],
  },
  {
    productid: 3,
    category: "1",
    name: "Läderjacka",
    date: "2024-12-04",
    price: "550",
    description: "BingoBongo",
    amount: 1,
    image: [
      "images/Streetware Jacket.webp",
      "images/MoclerSeacondHandJacket.webp",
      "images/Streetware Jacket.webp",
      "images/MoclerSeacondHandJacket.webp",
      "images/Streetware Jacket.webp"
    ],
  },
  {
    productid: 4,
    category: "1",
    name: "Annan jacka",
    date: "2024-12-04",
    price: "600",
    description: "Bingo",
    amount: 2,
    image: [
      "images/Streetware Jacket.webp",
      "images/MoclerSeacondHandJacket.webp",
    ],
  },
];

/*
    FUNCTIONS FOR GETTING PRODUCT/CATEGORY DATA 
*/

// Retrieve list of valid category groups.
export function getGroups() {
  return [...groupList];
}

// Retrieve array of all product categories (both default and admin-added)
export async function getCategories(filterGroup = null) {
  const newCategories = await database.getCategories();

  // Get the next free ID to use for admin-added categories
  let nextId = 0;
  categoryList.forEach((category) => {
    if (category.categoryid > nextId) {
      nextId = category.categoryid;
    }
  });

  // Assign IDs to admin-added categories
  newCategories.forEach((category, idx, arr) => {
    arr[idx].categoryid = ++nextId;
  });

  // Merge default and admin-added category lists
  const categories = [...categoryList, ...newCategories];

  // Set default/placeholder image if a category lacks a button image
  categories.forEach((category, idx, arr) => {
    if (!category.image.length) {
      arr[idx].image = "./images/image-placeholder.jpg";
    }
  });

  // Apply group filter if set.
  if (filterGroup !== null) {
    return categories.filter((category) => category.group == filterGroup);
  }
  return categories;
}

// Retrieve array of all products (both default and admin-added).
// If filterCategory is set, only products belonging to that category is included.
export async function getProducts(filterCategory = null) {
  const newProducts = await database.getProducts();

  // Get the next free ID to use for admin-added products
  let nextId = 0;
  productList.forEach((product) => {
    if (product.productid > nextId) {
      nextId = product.productid;
    }
  });

  // Assign IDs to admin-added products
  newProducts.forEach((product, idx, arr) => {
    arr[idx].productid = ++nextId;
  });

  // Merge default and admin-added product lists
  const products = [...productList, ...newProducts];

  // Set default/placeholder image if a product has no images.
  products.forEach((product, idx, arr) => {
    if (!product.image.length) {
      arr[idx].image.push("./images/image-placeholder.jpg");
    }
  });

  // Apply category filter if set
  if (filterCategory !== null) {
    return products.filter((product) => product.category == filterCategory);
  }
  return products;
}

// Get the product object matching the specified product ID.
export async function getProduct(productId) {
  const products = await getProducts();
  return products.find((product) => product.productid == productId);
}

// Get products where the name or description contains the specified string.
export async function searchProducts(searchFor) {
  const products = await getProducts();
  const searchText = searchFor.toLowerCase();
  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchText) ||
      product.description.toLowerCase().includes(searchText)
  );
}

export async function getProductsById(productsIdArray) {
  const products = await getProducts();
  const idsToFind = productsIdArray.map((item) => item.productid);
  const matchedProducts = products.filter((product) =>
    idsToFind.includes(product.productid)
  );
  return matchedProducts;
}

// Add this function to get low stock products
export async function getLowStockProducts() {
  const products = await getProducts();
  return products.filter(product => product.amount <= 2);
}

// Function to display low stock products in the admin panel
export async function displayLowStockProducts() {
  const lowStockList = document.querySelector("#low-stock-list"); // Assuming this element exists in your HTML
  const lowStockProducts = await getLowStockProducts();

  lowStockList.innerHTML = ""; // Clear previous entries
  if (lowStockProducts.length === 0) {
    lowStockList.innerHTML = "<li>No low stock products available.</li>";
  } else {
    lowStockProducts.forEach(product => {
      const listItem = document.createElement("li");
      listItem.textContent = `${product.name} - Amount: ${product.amount}`;
      lowStockList.appendChild(listItem);
    });
  }
}

// Call this function to display low stock products on page load or when appropriate
document.addEventListener("DOMContentLoaded", displayLowStockProducts);
// Function to count all products
export async function countAllProducts() {
  const products = await getProducts(); // Fetch all products (hardcoded + added via IndexedDB)
  return products.length;  // Return the number of products
}
