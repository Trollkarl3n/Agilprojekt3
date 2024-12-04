import * as productdata from "./productdata.js";

const newProducts = document.getElementById ("latest-products");
if ( newProducts) {
    showNewProductsList();
} 
async function showNewProductsList(amount = 3) {
    const products = (await productdata.getProducts()).sort(sortByLatest).slice(0,amount);
    if(products){
        products.forEach(product => {
            newProducts.appendChild(generateProductCard(product))
        })
    }
    

}

const sortByLatest = (a,b) =>{
    return  new Date(b.date).getTime() - new Date(a.date).getTime()
}

const generateProductCard = (product) => {
    const div = document.createElement('div');
    div.classList.add('latest-product-card')
    div.innerHTML = `            
    <a class="mouseover" href="productinfo.html?product=${product.productid}">   
    <img class="latest-product-img" src="${product.image[0]}" alt="">
        <div class="latest-product-info">
            <a class="latest-product-link" href="productinfo.html?product=${product.productid}">${product.name}</a>
        </div></a>`
    return div
}