const products = document.querySelectorAll('[data-product]');
const productCount = document.querySelector('[data-product-count]');
const orderTotal = document.querySelector('[data-order-total]');
const reviewButton = document.querySelector('[data-review-order]');
const reviewMessage = document.querySelector('[data-review-message]');

const formatCurrency = (amount) =>
    amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

function updateOrder() {
    let total = 0;
    let quantityTotal = 0;

    products.forEach((product) => {
        const price = Number(product.dataset.price);
        const quantity = Number(product.querySelector('[data-quantity]').textContent);
        const linePrice = price * quantity;

        total += linePrice;
        quantityTotal += quantity;
        product.querySelector('[data-unit-price]').textContent =
            quantity > 0 ? formatCurrency(linePrice) : '$0';
        product.querySelector('[data-action="decrease"]').disabled = quantity === 0;
    });

    productCount.textContent = `${quantityTotal} ${quantityTotal === 1 ? 'producto' : 'productos'}`;
    orderTotal.textContent = `${formatCurrency(total)} MXN`;
    reviewButton.disabled = quantityTotal === 0;
}

products.forEach((product) => {
    product.querySelectorAll('[data-action]').forEach((button) => {
        button.addEventListener('click', () => {
            const quantityElement = product.querySelector('[data-quantity]');
            let quantity = Number(quantityElement.textContent);

            if (button.dataset.action === 'increase') {
                quantity = Math.min(quantity + 1, 99);
            } else {
                quantity = Math.max(quantity - 1, 0);
            }

            quantityElement.textContent = String(quantity);
            updateOrder();
        });
    });
});

reviewButton.addEventListener('click', () => {
    const cart = Array.from(products)
        .map((product) => ({
            name: product.dataset.name,
            price: Number(product.dataset.price),
            quantity: Number(product.querySelector('[data-quantity]').textContent),
            description: product.querySelector('.una-orden-de').textContent
        }))
        .filter((item) => item.quantity > 0);

    if (cart.length === 0) {
        reviewMessage.textContent = 'Agrega al menos un producto';
        return;
    }

    sessionStorage.setItem('utdFoodCart', JSON.stringify(cart));
    window.location.href = 'payment.html';
});

updateOrder();
