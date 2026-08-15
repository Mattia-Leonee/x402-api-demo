import express from "express";
import { paymentMiddleware } from "x402-express";

const app = express();

app.use(paymentMiddleware(
  "0x59E5C50c462198155ace06aF1dB7DC69E60cBC10",
  {
    "GET /api/meteo-chantier": {
      price: "$0.01",
      network: "base-sepolia",
    },
  },
  { url: "https://x402.org/facilitator" }
));

app.get("/api/meteo-chantier", (req, res) => {
  res.json({
    lieu: "Neuchâtel",
    prevision: "Ensoleillé, 24°C — parfait pour un chantier",
  });
});

app.listen(4021, () => {
  console.log("🏪 API RÉELLE en ligne sur http://localhost:4021");
});