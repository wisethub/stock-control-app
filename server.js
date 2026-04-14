const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

const MANAGER_API = "https://wiset.manager.io/api2";
const TOKEN = process.env.MANAGER_API_TOKEN;

// 🔥 Your real customer key (already correct)
const CUSTOMER_KEY = "8b2b501c-84c9-4ee8-b0e4-30a25298b829";

app.use(express.json());

/* ================= FRONTEND ================= */
app.get("/manager-extension", (req, res) => {
  res.send(`
    <h2>Stock-Controlled Invoice</h2>

    <label>Select Item:</label><br/>
    <select id="itemSelect"></select><br/><br/>

    <label>Quantity:</label><br/>
    <input id="qty" type="number" value="1"/><br/><br/>

    <button onclick="createInvoice()">Create Invoice</button>

    <script>
      async function loadItems() {
        const res = await fetch('/get-items');
        const data = await res.json();

        const select = document.getElementById("itemSelect");

        (data.inventoryItems || []).forEach(item => {
          const option = document.createElement("option");
          option.value = item.key;
          option.text = item.itemName + " (Stock: " + item.qtyOnHand + ")";
          select.appendChild(option);
        });
      }

      async function createInvoice() {
        const key = document.getElementById("itemSelect").value;
        const quantity = Number(document.getElementById("qty").value);

        const res = await fetch('/create-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{ key, quantity }]
          })
        });

        const data = await res.json();
        alert(data.message);
      }

      loadItems();
    </script>
  `);
});

/* ================= BACKEND ================= */
app.post("/create-invoice", async (req, res) => {
  try {
    console.log("CREATE INVOICE START");

    const invoiceItems = req.body.items || [];

    // ✅ GET INVENTORY (FIXED)
    const response = await axios.get(
      `${MANAGER_API}/inventory-items`,
      {
        headers: { "X-API-KEY": TOKEN }
      }
    );

    const inventory = response.data.inventoryItems || [];

    console.log("Inventory count:", inventory.length);

    // ✅ VALIDATE STOCK
    for (let item of invoiceItems) {
      const stockItem = inventory.find(i => i.key === item.key);

      if (!stockItem) {
        return res.json({
          success: false,
          message: "❌ Item not found"
        });
      }

      const qty = Number(stockItem.qtyOnHand || 0);

      if (qty < item.quantity) {
        return res.json({
          success: false,
          message: \`❌ Insufficient stock for \${stockItem.itemName}\`
        });
      }
    }

    // ✅ CREATE INVOICE (FINAL CORRECT FORMAT)
    const invoicePayload = {
      contact: { key: CUSTOMER_KEY },
      date: new Date().toISOString().split("T")[0],
      reference: "API Invoice",
      lines: invoiceItems.map(item => ({
        inventoryItem: { key: item.key },
        quantity: item.quantity
      }))
    };

    console.log("PAYLOAD:", JSON.stringify(invoicePayload, null, 2));

    const createRes = await axios.post(
      `${MANAGER_API}/sales-invoice`,
      invoicePayload,
      {
        headers: {
          "X-API-KEY": TOKEN,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("SUCCESS RESPONSE:", createRes.data);

    return res.json({
      success: true,
      message: "✅ Invoice created successfully"
    });

  } catch (error) {
    console.error("🔥 FULL ERROR:", error.response?.data || error.message);

    return res.json({
      success: false,
      message: JSON.stringify(error.response?.data || error.message)
    });
  }
});

/* ================= GET ITEMS ================= */
app.get("/get-items", async (req, res) => {
  try {
    const response = await axios.get(
      `${MANAGER_API}/inventory-items`,
      {
        headers: { "X-API-KEY": TOKEN }
      }
    );

    res.json(response.data);

  } catch (error) {
    res.json({ error: error.message });
  }
});

/* ================= GET CUSTOMERS ================= */
app.get("/get-customers", async (req, res) => {
  try {
    const response = await axios.get(
      `${MANAGER_API}/customers`,
      {
        headers: { "X-API-KEY": TOKEN }
      }
    );

    res.json(response.data);

  } catch (error) {
    res.json({
      success: false,
      message: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});