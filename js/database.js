/*
    Functions for temporarily storing user actions between pages. 
    Using browser IndexedDB to track admin-added products/cats, and user shopping cart entries. 
*/

let db = null;

// Open and set up IndexedDB
function initializeDB() {
    return new Promise((resolve, reject) => {
        if (!db) {
            const dbOpen = window.indexedDB.open("skateshop", 6);

            dbOpen.addEventListener("error", (event) => {
                console.log("Could not open local IndexedDB!");
                reject("Could not open local IndexedDB!");
            });

            dbOpen.addEventListener("success", (event) => {
                console.log("Local IndexedDB opened...");
                db = dbOpen.result;
                resolve();
            });

            // Setup: Create DB stores for categories, products, cart, and wishlist
            dbOpen.addEventListener("upgradeneeded", (event) => {
                db = event.target.result;

                // Categories table
                if (!db.objectStoreNames.contains("categories")) {
                    const dbCategories = db.createObjectStore("categories", {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                    dbCategories.createIndex("name", "name", { unique: false });
                    dbCategories.createIndex("image", "image", { unique: false });
                    dbCategories.createIndex("group", "group", { unique: false });
                }

                // Products table
                if (!db.objectStoreNames.contains("products")) {
                    const dbProducts = db.createObjectStore("products", {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                    dbProducts.createIndex("name", "name", { unique: false });
                    dbProducts.createIndex("date", "date", { unique: false });
                    dbProducts.createIndex("description", "description", { unique: false });
                    dbProducts.createIndex("price", "price", { unique: false });
                    dbProducts.createIndex("category", "category", { unique: false });
                    dbProducts.createIndex("image", "image", { unique: false });
                    dbProducts.createIndex("stock", "stock", { unique: false }); // Ensure stock is indexed
                }

                // Cart table
                if (!db.objectStoreNames.contains("shoppingcart")) {
                    const dbCart = db.createObjectStore("shoppingcart", {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                    dbCart.createIndex("productid", "productid", { unique: true });
                    dbCart.createIndex("amount", "amount", { unique: false });
                }

                // Wishlist table
                if (!db.objectStoreNames.contains("wishlist")) {
                    const dbWish = db.createObjectStore("wishlist", {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                    dbWish.createIndex("productid", "productid", { unique: true });
                }

                console.log("IndexedDB setup complete.");
            });
        } else {
            console.log("IndexedDB already initialized, skipping...");
            resolve();
        }
    });
}

// Add category to the admin-added categories table in IndexedDB
export async function addCategory(categoryName, categoryImage, categoryGroup) {
    await initializeDB();
    return new Promise((resolve, reject) => {
        if (db) {
            const newCategory = {
                name: categoryName,
                image: categoryImage,
                group: categoryGroup,
            };
            const dbTrans = db.transaction(["categories"], "readwrite");
            const store = dbTrans.objectStore("categories");
            const request = store.add(newCategory);

            request.onsuccess = () => {
                console.log("Category added successfully.");
                resolve();
            };

            request.onerror = (event) => {
                console.log("DB transaction error!", event);
                reject(event);
            };
        }
    });
}

// Add product to the admin-added products table in IndexedDB
export async function addProduct(productName, productDescription, productPrice, productCategory, productImage, productStock) {
    await initializeDB();
    return new Promise((resolve, reject) => {
        if (db) {
            const newProduct = {
                name: productName,
                date: timestampToDate(Date.now()),
                description: productDescription,
                price: productPrice,
                category: productCategory,
                image: JSON.stringify(Array.isArray(productImage) ? productImage : [productImage]),
                stock: productStock, // Ensure stock is being set here
            };
            const dbTrans = db.transaction(["products"], "readwrite");
            const store = dbTrans.objectStore("products");
            const request = store.add(newProduct);

            request.onsuccess = () => {
                console.log("Product added successfully.");
                resolve(newProduct);
            };

            request.onerror = (event) => {
                console.log("DB transaction error!", event);
                reject(event);
            };
        }
    });
}

// Update product in the admin-added products table in IndexedDB
export async function updateProduct(productId, updatedData) {
    await initializeDB();
    return new Promise((resolve, reject) => {
        if (db) {
            const transaction = db.transaction("products", "readwrite");
            const store = transaction.objectStore("products");
            const getRequest = store.get(productId);

            getRequest.onsuccess = () => {
                const product = getRequest.result;
                if (product) {
                    // Merge existing product data with the updated data
                    const updatedProduct = { ...product, ...updatedData };
                    const updateRequest = store.put(updatedProduct);

                    updateRequest.onsuccess = () => {
                        console.log(`Product ${productId} updated successfully.`);
                        resolve(updatedProduct);
                    };

                    updateRequest.onerror = (event) => {
                        console.error("Failed to update product:", event.target.error);
                        reject(event.target.error);
                    };
                } else {
                    console.error(`Product with ID ${productId} not found.`);
                    reject("Product not found");
                }
            };

            getRequest.onerror = (event) => {
                console.error("Failed to fetch product for update:", event.target.error);
                reject(event.target.error);
            };
        }
    });
}

// Remove product from the admin-added products table in IndexedDB
export async function removeProduct(productId) {
    await initializeDB();
    return new Promise((resolve, reject) => {
        if (db) {
            const transaction = db.transaction("products", "readwrite");
            const store = transaction.objectStore("products");
            const deleteRequest = store.delete(productId);

            deleteRequest.onsuccess = () => {
                console.log(`Product ${productId} deleted successfully.`);
                resolve();
            };

            deleteRequest.onerror = (event) => {
                console.error("Failed to delete product:", event.target.error);
                reject(event.target.error);
            };
        }
    });
}

// Add product to the admin-added cart table in IndexedDB
export async function addToCart(productId, productAmount) {
    await initializeDB();
    return new Promise((resolve, reject) => {
        if (db) {
            const newProduct = {
                productid: productId,
                amount: productAmount,
            };
            const dbTrans = db.transaction(["shoppingcart"], "readwrite");
            const store = dbTrans.objectStore("shoppingcart");
            const request = store.add(newProduct);

            request.onsuccess = () => {
                console.log("Product added to cart successfully.");
                resolve();
            };

            request.onerror = (event) => {
                console.log("DB transaction error! Product already in cart", event);
                reject(event);
            };
        }
    });
}

// Add product to the admin-added wishlist table in IndexedDB
export async function addToWishlist(productId) {
    await initializeDB();
    return new Promise((resolve, reject) => {
        if (db) {
            const newProduct = {
                productid: productId,
            };
            const dbTrans = db.transaction(["wishlist"], "readwrite");
            const store = dbTrans.objectStore("wishlist");
            const request = store.add(newProduct);

            request.onsuccess = () => {
                console.log("Product added to wishlist successfully.");
                resolve();
            };

            request.onerror = (event) => {
                console.log("DB transaction error! Product already in wishlist", event);
                reject(event);
            };
        }
    });
}

// Get list of admin-added categories from IndexedDB
export async function getCategories() {
    await initializeDB();
    return new Promise((resolve, reject) => {
        if (db) {
            const dbReq = db.transaction("categories").objectStore("categories").getAll();

            dbReq.addEventListener("success", (event) => {
                console.log("Fetched category list...");
                resolve(event.target.result);
            });

            dbReq.addEventListener("error", (event) => {
                console.log("Error fetching categories!", event);
                reject(event);
            });
        }
    });
}

// Get list of admin-added wishlist from IndexedDB
export async function getWishlist() {
    await initializeDB();
    return new Promise((resolve, reject) => {
        if (db) {
            const dbReq = db.transaction("wishlist").objectStore("wishlist").getAll();

            dbReq.addEventListener("success", (event) => {
                console.log("Fetched wishlist list...");
                resolve(event.target.result);
            });

            dbReq.addEventListener("error", (event) => {
                console.log("Error fetching wishlist!", event);
                reject(event);
            });
        }
    });
}

// Get list of admin-added shopping cart from IndexedDB
export async function getCart() {
    await initializeDB();
    return new Promise((resolve, reject) => {
        if (db) {
            const dbReq = db.transaction("shoppingcart").objectStore("shoppingcart").getAll();

            dbReq.addEventListener("success", (event) => {
                console.log("Fetched cart list...");
                resolve(event.target.result);
            });

            dbReq.addEventListener("error", (event) => {
                console.log("Error fetching cart!", event);
                reject(event);
            });
        }
    });
}

// Get list of admin-added products from IndexedDB
export async function getProducts() {
    await initializeDB();
    return new Promise((resolve, reject) => {
        if (db) {
            const dbReq = db.transaction("products").objectStore("products").getAll();

            dbReq.addEventListener("success", (event) => {
                console.log("Fetched product list...");
                resolve(event.target.result);
            });

            dbReq.addEventListener("error", (event) => {
                console.log("Error fetching products!", event);
                reject(event);
            });
        }
    });
}

// Helper function to format the timestamp to date
function timestampToDate(timestamp) {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
}
