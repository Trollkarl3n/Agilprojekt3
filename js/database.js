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
      const dbOpen = window.indexedDB.open("skateshop", 8); // Incremented version to 8

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
          dbProducts.createIndex("stock", "stock", { unique: false }); // Add stock index
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
  productImage,
  productStock // Ensure this parameter is correctly populated
) {
  await initializeDB();
  return new Promise((resolve, reject) => {
    if (db) {
      const newProduct = {
        name: productName,
        date: Date.now(),
        description: productDescription,
        price: productPrice,
        category: productCategory,
        image: JSON.stringify(Array.isArray(productImage) ? productImage : [productImage]),
        stock: productStock // This should contain the stock level
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
            arr[idx].stock = product.stock; // Ensure stock is properly retrieved
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

  export async function getProductById(productId) {
    const db = await openDatabase(); // Replace with your database connection logic
    const transaction = db.transaction('products', 'readonly');
    const store = transaction.objectStore('products');

    return new Promise((resolve, reject) => {
        const request = store.get(productId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
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

// Update the product amount in the cart
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
          console.error("Product not found in cart.");
          reject("Product not found in cart.");
        }
      };

      getRequest.onerror = (event) => {
        console.error("Failed to get product from cart:", event.target.error);
        reject(event.target.error);
      };
    }
  });
}

// Remove product from cart
export async function removeFromCart(key) {
  return new Promise((resolve, reject) => {
    if (db) {
      const objectStore = db.transaction("shoppingcart", "readwrite").objectStore("shoppingcart");
      const deleteRequest = objectStore.delete(key);

      deleteRequest.onsuccess = () => {
        console.log(`Product with key ${key} removed from cart.`);
        resolve();
      };

      deleteRequest.onerror = (event) => {
        console.error("Failed to delete product from cart:", event.target.error);
        reject(event.target.error);
      };
    }
  });
}

// Remove product from wishlist
export async function removeFromWishlist(key) {
  return new Promise((resolve, reject) => {
    if (db) {
      const objectStore = db.transaction("wishlist", "readwrite").objectStore("wishlist");
      const deleteRequest = objectStore.delete(key);

      deleteRequest.onsuccess = () => {
        console.log(`Product with key ${key} removed from wishlist.`);
        resolve();
      };

      deleteRequest.onerror = (event) => {
        console.error("Failed to delete product from wishlist:", event.target.error);
        reject(event.target.error);
      };
    }
  });
}

// Clear shopping cart
export async function clearShoppingCart() {
  return new Promise((resolve, reject) => {
    if (db) {
      const objectStore = db.transaction("shoppingcart", "readwrite").objectStore("shoppingcart");
      const clearRequest = objectStore.clear();

      clearRequest.onsuccess = () => {
        console.log("Shopping cart cleared.");
        resolve();
      };

      clearRequest.onerror = (event) => {
        console.error("Failed to clear shopping cart:", event.target.error);
        reject(event.target.error);
      };
    }
  });
}
