// Initialize IndexedDB for second-hand shop
let db = null;

async function initializeDB() {
    return new Promise((resolve, reject) => {
        if (!db) {
            const dbOpen = window.indexedDB.open("secondHandShop", 1);

            dbOpen.onerror = () => reject("Failed to open IndexedDB");
            dbOpen.onsuccess = () => {
                db = dbOpen.result;
                resolve();
            };

            dbOpen.onupgradeneeded = (event) => {
                db = event.target.result;
                if (!db.objectStoreNames.contains("clothes")) {
                    const store = db.createObjectStore("clothes", {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                    store.createIndex("name", "name", { unique: false });
                    store.createIndex("price", "price", { unique: false });
                    store.createIndex("image", "image", { unique: false });
                }
                console.log("Database setup complete.");
            };
        } else {
            resolve();
        }
    });
}

// Add clothing to IndexedDB
async function addClothing(name, price, image) {
    await initializeDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("clothes", "readwrite");
        const store = transaction.objectStore("clothes");
        const request = store.add({ name, price, image });

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

// Fetch clothes from IndexedDB
async function getClothes() {
    await initializeDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("clothes", "readonly");
        const store = transaction.objectStore("clothes");
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

// Update the displayed list of clothes
async function updateClothesList() {
    const clothesList = document.getElementById("clothesList");
    clothesList.innerHTML = "";

    const clothes = await getClothes();
    clothes.forEach(({ name, price, image }) => {
        const item = document.createElement("div");
        item.className = "product-card";

        item.innerHTML = `
            <img class="product-image" src="${image}" alt="${name}" />
            <div class="product-name">${name}</div>
            <div class="product-price">Price: kr${price}</div>
            <button class="contact-seller-button">Kontakta säljaren</button>
        `;

        // Add event listener for the contact button
        const contactButton = item.querySelector(".contact-seller-button");
        contactButton.addEventListener("click", () => {
            alert(`Contacting the seller for "${name}".`);
        });

        clothesList.appendChild(item);
    });
}

// Set up form submission
document.getElementById("addClothesForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("clothingName").value;
    const price = document.getElementById("clothingPrice").value;
    const image = document.getElementById("clothingImage").value;

    try {
        await addClothing(name, price, image);
        console.log("Clothing added successfully.");
        updateClothesList();

        // Clear form fields
        event.target.reset();
    } catch (error) {
        console.error("Error adding clothing:", error);
    }
});

// Initialize the page
initializeDB().then(() => {
    console.log("Database initialized.");
    updateClothesList();
});
