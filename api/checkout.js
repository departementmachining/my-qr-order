// Sumber kebenaran menu & harga ada di SERVER, bukan dari client.
// Kalau menu di index.html berubah, WAJIB update juga di sini.
const MENU = {
  M1: { name: 'Mie Goreng Spesial', price: 15000 },
  M2: { name: 'Nasi Goreng Ayam', price: 18000 },
  M3: { name: 'Es Teh Manis', price: 5000 },
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { table_number, items } = req.body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Keranjang belanja kosong' });
    }

    const serverKey = (process.env.MIDTRANS_SERVER_KEY || '').trim();

    if (!serverKey) {
      return res.status(500).json({ message: 'MIDTRANS_SERVER_KEY belum diisi di Vercel' });
    }

    // Validasi setiap item terhadap MENU di server (harga & nama TIDAK dipercaya dari client)
    let item_details;
    try {
      item_details = items.map(item => {
        const menuItem = MENU[item.id];

        if (!menuItem) {
          throw new Error(`Item tidak dikenal: ${item.id}`);
        }

        const qty = Number(item.qty);
        if (!Number.isInteger(qty) || qty <= 0 || qty > 100) {
          throw new Error(`Qty tidak valid untuk item ${item.id}`);
        }

        return {
          id: String(item.id),
          price: menuItem.price,
          quantity: qty,
          name: menuItem.name.substring(0, 50),
        };
      });
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }

    const grossAmount = item_details.reduce((sum, i) => sum + i.price * i.quantity, 0);

    if (grossAmount <= 0) {
      return res.status(400).json({ message: 'Total pembayaran tidak valid' });
    }

    // Basic Auth Midtrans
    const authString = Buffer.from(`${serverKey}:`).toString('base64');
    const orderId = `ORDER-${Date.now()}-TBL${table_number || '0'}`;

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      item_details,
    };

    const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
}
