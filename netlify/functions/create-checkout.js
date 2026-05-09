const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Shipping rate IDs
const SHIPPING_RATES = {
  paintings: 'shr_1TVCupAStTTtTsGmGkztK5rp',
  clothesStandard: 'shr_1TVCmpAStTTtTsGme7qZMBlR',
  clothesExpress: 'shr_1TVCqLAStTTtTsGmMIEmpYRr'
};

// Clothing price IDs (to identify clothing items)
const CLOTHING_PRICE_IDS = [
  'price_1TVBg7AStTTtTsGmvMqYXOvZ', // Women XS
  'price_1TVBWuAStTTtTsGmNJ5RmlDe', // Women S
  'price_1TUz3gAStTTtTsGm8OzqHpJc', // Women M
  'price_1TUyCwAStTTtTsGmQPfbIM2b', // Women L
  'price_1TVBjKAStTTtTsGm2rnBD9HP', // Men S
  'price_1TVBijAStTTtTsGmfbseukwn', // Men M
  'price_1TVBiGAStTTtTsGmqYzV6AIL', // Men L
  'price_1TVBgVAStTTtTsGmpd3lxKH5'  // Men XL
];

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { items, shippingType } = JSON.parse(event.body);

    if (!items || items.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No items in cart' }) };
    }

    const line_items = items.map(item => ({
      price: item.priceId,
      quantity: item.quantity
    }));

    // Determine what's in the cart
    const hasClothes = items.some(item => CLOTHING_PRICE_IDS.includes(item.priceId));
    const hasPaintings = items.some(item => !CLOTHING_PRICE_IDS.includes(item.priceId));

    // Build shipping options
    let shipping_options = [];

    if (hasPaintings && !hasClothes) {
      // Only paintings
      shipping_options = [{ shipping_rate: SHIPPING_RATES.paintings }];
    } else if (hasClothes && !hasPaintings) {
      // Only clothes - offer standard and express
      shipping_options = [
        { shipping_rate: SHIPPING_RATES.clothesStandard },
        { shipping_rate: SHIPPING_RATES.clothesExpress }
      ];
    } else {
      // Mixed cart - painting shipping + clothes shipping options
      // For mixed carts, we'll use painting shipping (larger items dictate shipping)
      shipping_options = [{ shipping_rate: SHIPPING_RATES.paintings }];
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU']
      },
      shipping_options,
      success_url: `${event.headers.origin}/success.html`,
      cancel_url: `${event.headers.origin}/cart.html`
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };
  } catch (error) {
    console.error('Stripe error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
