/*
    Functions for temporarily storing user actions between pages. 
    Using browser IndexedDB to track admin-added products/cats, and user shopping cart entries. 
*/

let db = null;

// Open and set up IndexedDB
function initializeDB() {
  return new Promise((resolve, reject) => {
    // Only do this if the DB has not already been set up...
    if (!db) {
      const dbOpen = window.indexedDB.open("skateshop", 7); // Incremented version to 7

      dbOpen.onsuccess = (event) => {
        console.log("Local IndexedDB opened...");
        db = event.target.result;
        resolve();
      };

      dbOpen.onerror = (event) => {
        console.log("Could not open local IndexedDB!");
        reject("Could not open local IndexedDB!");
      };

      dbOpen.onupgradeneeded = (event) => {
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
      };
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

      dbTrans.onsuccess = (event) => {
        console.log("Database transaction complete.");
        resolve();
      };

      dbTrans.onerror = (event) => {
        console.log("DB transaction error!", event);
        reject(event);
      };

      dbTrans.objectStore("categories").add(newCategory);
    }
  });
}

// Add product to the admin-added products table in IndexedDB
export async function addProduct(
  productName,
  productDescription,
  productPrice,
  productCategory,
  productImage
) {
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
      };
      const dbTrans = db.transaction(["products"], "readwrite");

      dbTrans.onsuccess = (event) => {
        console.log("Database transaction complete.");
        resolve(newProduct);
      };

      dbTrans.onerror = (event) => {
        console.log("DB transaction error!", event);
        reject(event);
      };

      dbTrans.objectStore("products").add(newProduct);
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

      dbTrans.onsuccess = (event) => {
        console.log("Database transaction complete.");
        resolve();
      };

      dbTrans.onerror = (event) => {
        console.log("DB transaction error! Product already in cart", event);
        reject(event);
      };

      dbTrans.objectStore("shoppingcart").add(newProduct);
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

      dbTrans.onsuccess = (event) => {
        console.log("Database transaction complete.");
        resolve();
      };

      dbTrans.onerror = (event) => {
        console.log("DB transaction error! Product already in wishlist", event);
        reject(event);
      };

      dbTrans.objectStore("wishlist").add(newProduct);
    }
  });
}

// Get list of admin-added categories from IndexedDB
export async function getCategories() {
  await initializeDB();
  return new Promise((resolve, reject) => {
    if (db) {
      const dbReq = db.transaction("categories").objectStore("categories").getAll();

      dbReq.onsuccess = (event) => {
        console.log("Fetched category list...");
        resolve(event.target.result);
      };

      dbReq.onerror = (event) => {
        console.log("Error fetching categories!", event);
        reject(event);
      };
    }
  });
}

// Get list of admin-added wishlist from IndexedDB
export async function getWishlist() {
  await initializeDB();
  return new Promise((resolve, reject) => {
    if (db) {
      const dbReq = db.transaction("wishlist").objectStore("wishlist").getAll();

      dbReq.onsuccess = (event) => {
        console.log("Fetched wishlist list...");
        resolve(event.target.result);
      };

      dbReq.onerror = (event) => {
        console.log("Error fetching wishlist!", event);
        reject(event);
      };
    }
  });
}

// Get list of admin-added products from IndexedDB.
export async function getProducts() {
  await initializeDB();
  return new Promise((resolve, reject) => {
    if (db) {
      const dbStore = db.transaction("products").objectStore("products");
      const dbReq = dbStore.getAll();

      dbReq.onsuccess = (event) => {
        event.target.result.forEach((product, idx, arr) => {
          arr[idx].image = JSON.parse(product.image);
        });
        console.log("Fetched product list...", event.target.result);
        resolve(event.target.result);
      };

      dbReq.onerror = (event) => {
        console.log("Error fetching products!", event);
        reject(event);
      };
    }
  });
}

// Get list of cart from IndexedDB
export async function getShoppingCart() {
  await initializeDB();
  return new Promise((resolve, reject) => {
    if (db) {
      const dbReq = db.transaction("shoppingcart").objectStore("shoppingcart").getAll();

      dbReq.onsuccess = (event) => {
        console.log("Fetched shopping cart...");
        resolve(event.target.result);
      };

      dbReq.onerror = (event) => {
        console.log("Error fetching shopping cart!", event);
        reject(event);
      };
    }
  });
}

export async function updateCartProductAmount(key, updatedAmount) {
  return new Promise((resolve, reject) => {
    if (db) {
      const objectStore = db.transaction("shoppingcart", "readwrite").objectStore("shoppingcart");
      const getRequest = objectStore.get(key);

      getRequest.onsuccess = () => {
        const cartProduct = getRequest.result;

        if (cartProduct) {
          cartProduct.amount = updatedAmount;

          const updateRequest = objectStore.put(cartProduct);
          updateRequest.onsuccess = () => {
            console.log(`Product in cart amount updated to: ${updatedAmount}`);
            resolve();
          };

          updateRequest.onerror = (event) => {
            console.error("Failed to update product amount:", event.target.error);
            reject(event.target.error);
          };
        } else {
          console.error("Product not found in cart");
          reject("Product not found");
        }
      };

      getRequest.onerror = (event) => {
        console.error("Failed to fetch product from cart:", event.target.error);
        reject(event.target.error);
      };
    }
  });
}

export async function removeFromCart(productId) {
  await initializeDB();
  return new Promise((resolve, reject) => {
    if (db) {
      const dbTrans = db.transaction("shoppingcart", "readwrite");
      const objectStore = dbTrans.objectStore("shoppingcart");
      const dbReq = objectStore.delete(productId);

      dbReq.onsuccess = (event) => {
        console.log("Product removed from cart", event);
        resolve();
      };

      dbReq.onerror = (event) => {
        console.log("Error removing product from cart!", event);
        reject(event);
      };
    }
  });
}

export async function removeFromWishlist(productId) {
  await initializeDB();
  return new Promise((resolve, reject) => {
    if (db) {
      const dbTrans = db.transaction("wishlist", "readwrite");
      const objectStore = dbTrans.objectStore("wishlist");
      const dbReq = objectStore.delete(productId);

      dbReq.onsuccess = (event) => {
        console.log("Product removed from wishlist", event);
        resolve();
      };

      dbReq.onerror = (event) => {
        console.log("Error removing product from wishlist!", event);
        reject(event);
      };
    }
  });
}

// Convert timestamp to date format
function timestampToDate(timestamp) {
  const date = new Date(timestamp);
  return date.toISOString().slice(0, 10); // Format YYYY-MM-DD
}
