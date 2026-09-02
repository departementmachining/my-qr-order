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

    // -------------------------------------------------------------
    // TEMPEL SERVER KEY SANDBOX KAMU LANGSUNG DI SINI (DENGAN TITIK DUA DI AKHIR)
    // Contoh: "SB-Mid-server-xxxxxxx:"
    // -------------------------------------------------------------
    const rawServerKey = "SB-Mid-server-4WuTrqETNojiQYtOywScOXyt:"; 
    
    // Encode langsung ke Base64
    const authString = Buffer.from(rawServerKey).toString('base64');

    const grossAmount = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
    const orderId = `ORDER-${Date.now()}-TBL${table_number || '0'}`;

    const payload = {
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

    const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify(payload)
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
