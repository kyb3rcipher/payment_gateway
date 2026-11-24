require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname)));

const accessToken = process.env.MP_ACCESS_TOKEN;
const client = accessToken ? new MercadoPagoConfig({ accessToken }) : null;

const catalog = {
  'Gorditas UTD': { price: 150, description: 'Orden de 5 gorditas' },
  'Tacos UTD': { price: 350, description: 'Una orden de tacos' },
  'Uber Eats': { price: 700, description: 'Crédito para tu pedido' }
};

function getBaseUrl(req) {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/$/, '');
  }

  const protocol = req.get('x-forwarded-proto') || req.protocol;
  return `${protocol}://${req.get('host')}`;
}


app.post('/create_preference', async (req, res) => {
  try {
    if (!client) { return res.status(503).json({ error: 'Configure MP_ACCESS_TOKEN with ur Mercado Pago access token.' }); }

    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (items.length === 0) {
      return res.status(400).json({ error: 'El carrito está vacío.' });
    }

    const validatedItems = items.map((item) => {
      const product = catalog[item.name];
      const quantity = Number(item.quantity);

      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        throw new Error('Hay un producto o cantidad inválida en el carrito.');
      }

      return {
        title: item.name,
        unit_price: product.price,
        quantity,
        currency_id: 'MXN'
      };
    });

    const baseUrl = getBaseUrl(req);
    const externalReference = `UTD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: validatedItems,
        external_reference: externalReference,
        back_urls: {
          success: `${baseUrl}/payment.html`,
          failure: `${baseUrl}/payment.html`,
          pending: `${baseUrl}/payment.html`
        },
        auto_return: 'approved',
        ...(process.env.APP_BASE_URL
          ? { notification_url: `${baseUrl}/mercadopago/webhook` }
          : {})
      }
    });

    res.json({ id: result.id, init_point: result.init_point });
  } catch (error) {
    console.error('ERROR: Mercado Pago:', error);
    const status = error.message?.includes('inválida') ? 400 : 500;
    res.status(status).json({ error: error.message || 'Error al crear la preferencia' });
  }
});

app.get('/payment-status/:paymentId', async (req, res) => {
  if (!client) {
    return res.status(503).json({ error: 'Mercado Pago no está configurado.' });
  }

  try {
    const payment = new Payment(client);
    const result = await payment.get({ id: req.params.paymentId });

    res.json({
      status: result.status,
      status_detail: result.status_detail,
      id: result.id
    });
  } catch (error) {
    console.error('ERROR al verificar el pago:', error);
    res.status(500).json({ error: 'No se pudo verificar el pago.' });
  }
});

app.post('/mercadopago/webhook', async (req, res) => {
  const paymentId = req.body?.data?.id || req.query?.['data.id'];

  if (paymentId) {
    try {
      if (client) {
        const payment = new Payment(client);
        const result = await payment.get({ id: paymentId });
        console.log(`Webhook Mercado Pago: pago ${paymentId} = ${result.status}`);
      }
    } catch (error) {
      console.error('ERROR en webhook de Mercado Pago:', error);
    }
  }

  res.sendStatus(200);
});

if (require.main === module) {
  app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running in the port: ${process.env.PORT || 3000}`);
  });
}

module.exports = app;
