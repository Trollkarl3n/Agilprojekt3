/*
    Script for building content on the category list page.
*/
import * as productdata from "./productdata.js";

// Display categories in the category list element.
const categoryCardTemplate = document.querySelector("#category-card-template");
if (categoryCardTemplate) {
    console.log("Loading categories...");
    showCategoryList(".category-list");
}

// Fetch list of categories and display them on the page.
async function showCategoryList(targetSelector) {
    const groupFilter = new URLSearchParams(window.location.search).get("group");
    const groups = productdata.getGroups();
    const outBox = document.querySelector(targetSelector);
    const template = document.querySelector("#category-card-template");

    try {
        // Filter categories based on group if specified
        const categories = await productdata.getCategories(
            groupFilter && groupFilter.length && groups.some((group) => group.name === groupFilter)
                ? groupFilter
                : null
        );

        if (template && outBox) {
            outBox.innerHTML = ""; // Clear the category list container

            if (categories.length > 0) {
                for (const category of categories) {
                    console.log("Category: ", category);
                    const card = template.content.firstElementChild.cloneNode(true);
                    const image = card.querySelector("img");
                    const label = card.querySelector("span");

                    card.href = `productlist.html?category=${category.categoryid}`;
                    image.src = category.image || "images/default-category.jpg"; // Default image fallback
                    image.alt = category.name || "Category Image";
                    label.innerText = category.name || "Unnamed Category";

                    outBox.appendChild(card);
                }
            } else {
                // Show a message if no categories are found
                outBox.innerHTML = "<p>No categories found for this group.</p>";
            }
        }

        // Update the list title based on the group filter
        const listTitle = document.querySelector("main > section > h2");
        if (listTitle && groupFilter && groupFilter.length && groups.some((group) => group.name === groupFilter)) {
            const displayedGroup = groups.find((group) => group.name === groupFilter);
            listTitle.innerText = displayedGroup.label || "Categories";
        }
    } catch (error) {
        console.error("Error fetching or displaying categories:", error);

        if (outBox) {
            outBox.innerHTML = "<p>Failed to load categories. Please try again later.</p>";
        }
    }
}
