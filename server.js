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
    const invoiceItems = [
      { name: "STONE BASE", quantity: 2 },
      { name: "GRANITE", quantity: 1 }
    ];

    // ✅ CORRECT API CALL
    const response = await axios.get(
  `${MANAGER_API}/inventory-items`,
  {
    headers: {
      "X-API-KEY": TOKEN,
      "Accept": "application/json"
    }
  }
);

    // ✅ FIX RESPONSE STRUCTURE
    const inventory = response.data || [];

    // 🔍 DEBUG (optional)
    console.log("Inventory Items:", inventory.map(i => i.Name));

    for (let item of invoiceItems) {
      const stockItem = inventory.find(
        i =>
          i.Name &&
          i.Name.trim().toLowerCase() === item.name.trim().toLowerCase()
      );

      if (!stockItem) {
        return res.json({
          success: false,
          message: `❌ Item not found: ${item.name}`
        });
      }

      // ⚠️ qtyOnHand may not exist → fallback to Qty
      const qty = stockItem.qtyOnHand || stockItem.Qty || 0;

      if (qty < item.quantity) {
        return res.json({
          success: false,
          message: `❌ Insufficient stock for ${item.name}`
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