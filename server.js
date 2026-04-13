const axios = require("axios");

const MANAGER_API = "https://wiset.manager.io/api2";
const TOKEN = process.env.MANAGER_API_TOKEN;
const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

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
      { name: "Item A", quantity: 2 },
      { name: "Item B", quantity: 1 }
    ];

    const response = await axios.get(
      `${MANAGER_API}/inventory-items`,
      {
        headers: {
          "X-API-KEY": TOKEN
        }
      }
    );

    const inventory = response.data.data || [];

    for (let item of invoiceItems) {
      const stockItem = inventory.find(i => i.name === item.name);

      if (!stockItem) {
        return res.json({
          success: false,
          message: `❌ Item not found: ${item.name}`
        });
      }

      if (stockItem.qtyOnHand < item.quantity) {
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
    console.error(error.message);

    return res.json({
      success: false,
      message: "❌ " + error.message
    });
  }
});
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});