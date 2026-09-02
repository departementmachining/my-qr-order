const midtransClient = require('midtrans-client');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });

    const statusResponse = await snap.transaction.notification(req.body);
    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;

    if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
      console.log(`[PAID] Pesanan ${orderId} DIBAYAR! Teruskan ke Dapur.`);
      // TODO: Di sini simpan data ke Firebase/Supabase untuk Layar Dapur
    }

    res.status(200).send('OK');
  } catch (err) {
    res.status(500).send(err.message);
  }
}