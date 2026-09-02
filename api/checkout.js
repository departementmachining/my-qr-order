const midtransClient = require('midtrans-client');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { table_number, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Keranjang belanja kosong' });
    }

    // Ambil key dan bersihkan dari spasi
    const serverKey = (process.env.MIDTRANS_SERVER_KEY || '').trim();
    const clientKey = (process.env.MIDTRANS_CLIENT_KEY || '').trim();

    // Validasi sederhana jika key belum diset
    if (!serverKey) {
      return res.status(500).json({ message: 'MIDTRANS_SERVER_KEY belum dikonfigurasi di Vercel' });
    }

    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: serverKey,
      clientKey: clientKey
    });

    const grossAmount = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const orderId = `ORDER-${Date.now()}-TBL${table_number || '0'}`;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount
      },
      item_details: items.map(item => ({
        id: String(item.id || Math.floor(Math.random() * 1000)),
        price: Number(item.price),
        quantity: Number(item.qty),
        name: String(item.name).substring(0, 50)
      }))
    };

    const transaction = await snap.createTransaction(parameter);
    return res.status(200).json(transaction);

  } catch (error) {
    return res.status(error.httpStatusCode || 500).json({ 
      message: error.message || 'Gagal memproses transaksi',
      details: error 
    });
  }
}
