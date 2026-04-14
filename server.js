const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

const MANAGER_API = "https://wiset.manager.io/api2";
const TOKEN = process.env.MANAGER_API_TOKEN;

app.use(express.json());

app.get("/manager-extension", (req, res) => {
  res.send(`
    <h2>Stock-Controlled Invoice</h2>
    <button onclick="createInvoice()">Create Invoice</button>

    <script>
      async function createInvoice() {
        const res = await fetch('/create-invoice', { method: 'POST' });
        const data = await res.json();
        alert(data.message);
      }
    </script>
  `);
});

app.post("/create-invoice", async (req, res) => {
  try {
    // ✅ USE KEYS (REPLACE WITH REAL KEYS FROM YOUR SYSTEM)
    const invoiceItems = [
      { key: "PUT-REAL-KEY-1-HERE", quantity: 2 },
      { key: "PUT-REAL-KEY-2-HERE", quantity: 1 }
    ];

    // ✅ FETCH INVENTORY WITH KEYS
    const response = await axios.post(
  `${MANAGER_API}/inventory-items`,
  {
    fields: ["Key", "Name", "Qty"]
  },
  {
    headers: {
      "X-API-KEY": TOKEN,
      "Content-Type": "application/json"
    }
  }
);

    // ✅ NORMALIZE RESPONSE
    let inventory = [];

    if (Array.isArray(response.data)) {
      inventory = response.data;
    } else if (Array.isArray(response.data.data)) {
      inventory = response.data.data;
    } else if (Array.isArray(response.data.rows)) {
      inventory = response.data.rows.map(row => ({
        Key: row[0],
        Name: row[1],
        Qty: row[2]
      }));
    }

    // 🔍 DEBUG (SEE YOUR KEYS)
    console.log("Inventory FULL:", JSON.stringify(inventory, null, 2));

    for (let item of invoiceItems) {
      const stockItem = inventory.find(i => i.Key === item.key);

      if (!stockItem) {
        return res.json({
          success: false,
          message: `❌ Item not found for key: ${item.key}`
        });
      }

      const qty = Number(stockItem.Qty || 0);

      if (qty < item.quantity) {
        return res.json({
          success: false,
          message: `❌ Insufficient stock for ${stockItem.Name}`
        });
      }
    }

    return res.json({
      success: true,
      message: "✅ Stock available — invoice allowed"
    });

  } catch (error) {
    console.error("FULL ERROR:", error.response?.data || error.message);

    return res.json({
      success: false,
      message: "❌ " + (error.response?.data?.error || error.message)
    });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});