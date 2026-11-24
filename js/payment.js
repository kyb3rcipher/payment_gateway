const formatCurrency = (amount) =>
    amount.toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN',
        maximumFractionDigits: 0
    });

const cart = JSON.parse(sessionStorage.getItem('utdFoodCart') || '[]');
const productsContainer = document.getElementById('order-products');

let quantityTotal = 0;
let total = 0;

cart.forEach((item) => {
    quantityTotal += item.quantity;
    total += item.price * item.quantity;

    const row = document.createElement('div');
    row.className = 'gorditas-utd';
    row.innerHTML = `
        <div class="detalle-de-gorditas-utd">
            <div class="div"></div>
            <div class="una-orden-de"></div>
        </div>
        <div class="div3"></div>
    `;
    row.querySelector('.detalle-de-gorditas-utd .div').textContent = item.name;
    row.querySelector('.una-orden-de').textContent =
        `${item.quantity} × ${item.description}`;
    row.querySelector('.div3').textContent =
        formatCurrency(item.price * item.quantity);
    productsContainer.appendChild(row);
});

if (cart.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'una-orden-de';
    emptyMessage.textContent = 'No hay productos seleccionados.';
    productsContainer.appendChild(emptyMessage);
}

document.getElementById('subtotal-label').textContent =
    `Subtotal · ${quantityTotal} ${quantityTotal === 1 ? 'producto' : 'productos'}`;
document.getElementById('subtotal').textContent = formatCurrency(total);
document.getElementById('payment-total').textContent = formatCurrency(total);
document.getElementById('pay-button-label').textContent =
    `Pagar ${formatCurrency(total)} MXN →`;

document.getElementById('back-to-order').addEventListener('click', () => {
    window.location.href = 'index.html';
});

const payButton = document.getElementById('pay-button');
const payButtonLabel = document.getElementById('pay-button-label');

payButton.addEventListener('click', async () => {
    if (cart.length === 0) {
        showPaymentBanner('failure', 'No hay productos', 'Agrega productos antes de pagar.');
        alert('No hay productos seleccionados.');
        return;
    }

    payButton.disabled = true;
    payButtonLabel.textContent = 'Creando pago seguro...';

    try {
        const response = await fetch('/create_preference', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: cart })
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'No se pudo iniciar el pago.');
        }

        window.location.href = result.init_point;
    } catch (error) {
        payButton.disabled = false;
        payButtonLabel.textContent = `Pagar ${formatCurrency(total)} MXN →`;
        showPaymentBanner('failure', 'Pago no iniciado', error.message);
        alert(`No se pudo iniciar el pago: ${error.message}`);
    }
});

const banner = document.getElementById('payment-banner');
const bannerTitle = document.getElementById('payment-banner-title');
const bannerMessage = document.getElementById('payment-banner-message');

function showPaymentBanner(status, title, message) {
    banner.hidden = false;
    banner.dataset.status = status;
    bannerTitle.textContent = title;
    bannerMessage.textContent = message;
}

async function checkPaymentResult() {
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get('payment_id');
    const collectionStatus = params.get('collection_status');
    const queryStatus = params.get('status');

    if (!paymentId && !collectionStatus && !queryStatus) {
        return;
    }

    if (paymentId) {
        try {
            const response = await fetch(`/payment-status/${encodeURIComponent(paymentId)}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'No se pudo verificar el pago.');
            }

            if (result.status === 'approved') {
                showPaymentBanner('approved', 'Pago aprobado', `El pago ${result.id} se realizó correctamente.`);
                alert('¡Pago aprobado! Tu pedido fue confirmado.');
            } else if (result.status === 'pending' || result.status === 'in_process') {
                showPaymentBanner('pending', 'Pago pendiente', 'Mercado Pago está procesando el pago.');
                alert('El pago está pendiente de confirmación.');
            } else {
                showPaymentBanner('rejected', 'Pago no realizado', 'El pago fue rechazado o cancelado.');
                alert('El pago no fue aprobado.');
            }
            return;
        } catch (error) {
            showPaymentBanner('rejected', 'No se pudo comprobar', error.message);
            alert(`No se pudo comprobar el pago: ${error.message}`);
            return;
        }
    }

    const status = collectionStatus || queryStatus;
    if (status === 'approved') {
        showPaymentBanner('approved', 'Pago aprobado', 'Mercado Pago confirmó la aprobación.');
        alert('¡Pago aprobado!');
    } else if (status === 'pending' || status === 'in_process') {
        showPaymentBanner('pending', 'Pago pendiente', 'Mercado Pago está procesando el pago.');
        alert('El pago está pendiente.');
    } else {
        showPaymentBanner('failure', 'Pago no realizado', 'El pago fue rechazado, cancelado o falló.');
        alert('El pago no fue aprobado.');
    }
}

checkPaymentResult();
