let cart = JSON.parse(localStorage.getItem("cart")) || [];

// function updateCartCount() {
//     let count = 0;
//     for (let item of cart) {
//         count += item.qty;
//     }
//     document.getElementById("cart-count").innerText = count;
// }

document.querySelectorAll("button").forEach(btn => {
    if (btn.innerText === "Add to Cart") {
        btn.addEventListener("click", function () {
            let card = btn.closest(".card");
            let name = card.querySelector("h3").innerText;
            let priceText = card.querySelectorAll("p")[1].innerText;
            let img = card.querySelector("img").src;

            let price = parseInt(priceText.match(/₹(\d+)/)[1]);

            let item = { name, price, img, qty: 1 };

            let exists = cart.find(i => i.name === name);
            if (exists) {
                exists.qty++;
            } else {
                cart.push(item);
            }

            localStorage.setItem("cart", JSON.stringify(cart));
            alert(`${name} added to cart`);
            updateCartCount();
        });
    }
});

updateCartCount();
