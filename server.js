const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

const MANAGER_API = "https://wiset.manager.io/api2";
const TOKEN = process.env.MANAGER_API_TOKEN;

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

        if (data.success) {
          window.open(
            "https://wiset.manager.io/start?ogYXUFJPRFVDVElPTiBURVNUIENPTVBBTlk#/sales-invoices",
            "_blank"
          );
        }
      }

      loadItems();
    </script>
  `);
});

/* ================= BACKEND ================= */
app.post("/create-invoice", async (req, res) => {
  try {
    const invoiceItems = req.body.items || [];

    const response = await axios.get(
      `${MANAGER_API}/inventory-items`,
      {
        headers: { "X-API-KEY": TOKEN }
      }
    );

    const inventory = response.data.inventoryItems || [];

    for (let item of invoiceItems) {
      const stockItem = inventory.find(i => i.key === item.key);

      if (!stockItem) {
        return res.json({ success: false, message: "❌ Item not found" });
      }

      const qty = Number(stockItem.qtyOnHand || 0);

      if (qty < item.quantity) {
        return res.json({
          success: false,
          message: "❌ Insufficient stock for " + stockItem.itemName
        });
      }
    }

    return res.json({
      success: true,
      message: "✅ Stock OK — proceed to create invoice"
    });

  } catch (error) {
    return res.json({
      success: false,
      message: error.response?.data || error.message
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

/* ================= SMART SEARCH (FIXED) ================= */
app.get("/stock-check", (req, res) => {
  res.send(`
    <h2>🔍 Smart Stock Search</h2>

    <input id="search" placeholder="Type item name..." style="width:300px;padding:8px;" />
    <div id="results" style="margin-top:15px;"></div>

    <script>
      let items = [];

      async function loadItems() {
        const res = await fetch('/get-items');
        const data = await res.json();
        items = data.inventoryItems || [];
      }

      function searchItems() {
        const query = document.getElementById("search").value.toLowerCase();
        const resultsDiv = document.getElementById("results");

        if (!query) {
          resultsDiv.innerHTML = "";
          return;
        }

        const filtered = items.filter(i =>
          i.itemName && i.itemName.toLowerCase().includes(query)
        );

        let html = "";

        if (filtered.length === 0) {
          html = "<p>No item found</p>";
        } else {
          filtered.forEach(item => {
            html += "<div style='padding:8px;border-bottom:1px solid #ccc;'>";
            html += "<strong>" + item.itemName + "</strong><br/>";
            html += "Stock: " + item.qtyOnHand;
            html += "</div>";
          });
        }

        resultsDiv.innerHTML = html;
      }

      document.addEventListener("DOMContentLoaded", () => {
        loadItems();
        document.getElementById("search").addEventListener("input", searchItems);
      });
    </script>
  `);
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});