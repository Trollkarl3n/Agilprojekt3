// This script handles the contact form submission and stores the data into IndexedDB

const contactForm = document.querySelector(".contact-form");

if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
        event.preventDefault();

        // Gather the form data
        const formData = new FormData(contactForm);
        const name = formData.get("name");
        const surname = formData.get("surname");
        const email = formData.get("email");
        const message = formData.get("message");

        // Store the submission
        storeContactSubmission({ name, surname, email, message }).then(() => {
            alert("Tack för ditt meddelande!"); // Thank you message in Swedish
            contactForm.reset(); // Reset the form fields after submission
        }).catch(error => {
            console.error("Error submitting contact form", error);
        });
    });
}

// Function to store form submission in IndexedDB
async function storeContactSubmission(submission) {
    const db = await openDatabase();
    const transaction = db.transaction("submissions", "readwrite");
    const store = transaction.objectStore("submissions");

    console.log("Storing submission:", submission); // For debugging

    store.add(submission);

    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
            console.log("Submission stored successfully");
            resolve();
        };
        transaction.onerror = (error) => {
            console.error("Error storing submission:", error);
            reject(error);
        };
    });
}

// Function to open or create the IndexedDB database and object store
async function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("siteDatabase", 1);

        // Handle error when opening the database
        request.onerror = () => reject("Unable to open database.");

        // Success handler
        request.onsuccess = () => resolve(request.result);

        // Handle database upgrade (creation of the object store)
        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Create the 'submissions' object store if it doesn't exist
            if (!db.objectStoreNames.contains("submissions")) {
                db.createObjectStore("submissions", { autoIncrement: true });
            }
        };
    });
}
