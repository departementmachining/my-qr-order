const midtransClient = require('midtrans-client');

export default async function handler(req, res) {
  // Hanya izinkan method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { table_number, items } = req.body;

    // Inisialisasi Midtrans Snap menggunakan Environment Variable Vercel
    const snap = new midtransClient.Snap({
      isProduction: false, // Ubah ke true jika sudah live production
      serverKey: process.env.MIDTRANS_SERVER_KEY ? process.env.MIDTRANS_SERVER_KEY.trim() : '',
clientKey: process.env.MIDTRANS_CLIENT_KEY ? process.env.MIDTRANS_CLIENT_KEY.trim() : ''
    });

    const grossAmount = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const orderId = `ORDER-${Date.now()}-TBL${table_number}`;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount
      },
      item_details: items.map(i => ({
        id: i.id,
        price: i.price,
        quantity: i.qty,
        name: i.name
      })),
      customer_details: {
        first_name: `Pelanggan Meja ${table_number}`
      }
    };

    const transaction = await snap.createTransaction(parameter);

    res.status(200).json({
      status: 'success',
      token: transaction.token,
      order_id: orderId
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
