function addToCart(name, price) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push({ name, price });
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Added to cart");
}

function loadCart() {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let cartDiv = document.getElementById("cart");
  let total = 0;
  cartDiv.innerHTML = "";

  cart.forEach(item => {
    cartDiv.innerHTML += `<p>${item.name} - ${item.price} JOD</p>`;
    total += item.price;
  });

  document.getElementById("total").innerText =
    "Total: " + total + " JOD";
}

function getTotal() {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  return cart.reduce((sum, item) => sum + item.price, 0).toFixed(2);
}

function searchBooks() {
  let input = document.getElementById("search").value.toLowerCase();
  let products = document.getElementsByClassName("product");

  for (let i = 0; i < products.length; i++) {
    let title =
      products[i].getElementsByTagName("h3")[0].innerText.toLowerCase();
    products[i].style.display =
      title.includes(input) ? "block" : "none";
  }
                     }
