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

app.post("/create-invoice", (req, res) => {
  res.json({
    success: false,
    message: "❌ Stock validation not yet connected"
  });
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});