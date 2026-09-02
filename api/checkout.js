export default async function handler(req, res) {
  // Hanya izinkan method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { table_number, items } = req.body;

    // Hitung total bayar
    const grossAmount = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const orderId = `ORDER-${Date.now()}-TBL${table_number}`;

    // Ambil dan bersihkan Server Key dari Environment Variable
    const serverKey = (process.env.MIDTRANS_SERVER_KEY || '').trim();

    if (!serverKey) {
      return res.status(500).json({ error_messages: ["MIDTRANS_SERVER_KEY belum diisi di Vercel"] });
    }

    // Buat Otentikasi Basic Auth (Server Key + Titik Dua, di-encode ke Base64)
    const authString = Buffer.from(`${serverKey}:`).toString('base64');

    // Buat Payload Transaksi
    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount
      },
      item_details: items.map(item => ({
        id: item.id || `ITEM-${Math.random().toString(36).substring(7)}`,
        price: item.price,
        quantity: item.qty,
        name: item.name
      }))
    };

    // Panggil API Midtrans Snap Sandbox langsung
    const midtransResponse = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify(payload)
    });

    const data = await midtransResponse.json();

    // Jika Midtrans mengembalikan error (seperti 401), teruskan response error-nya
    if (!midtransResponse.ok) {
      return res.status(midtransResponse.status).json(data);
    }

    // Kirim token pembayaran ke frontend
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error_messages: [error.message] });
  }
}
