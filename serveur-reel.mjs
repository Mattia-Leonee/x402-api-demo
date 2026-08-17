import express from "express";
import { paymentMiddleware } from "x402-express";

const app = express();
app.use(express.json({ limit: "2mb" }));

app.use(paymentMiddleware(
  "0x59E5C50c462198155ace06aF1dB7DC69E60cBC10",
  {
    "POST /api/analyse-document": {
      price: "$0.05",
      network: "base-sepolia",
    },
  },
  { url: "https://x402.org/facilitator" }
));

app.post("/api/analyse-document", async (req, res) => {
  const texte = req.body?.texte;
  if (!texte) {
    return res.status(400).json({ erreur: "Envoie le texte du document dans le champ 'texte'" });
  }

  const reponseIA = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: "Analyse ce document et extrais les informations clés (type de document, parties, montants, dates, points importants). Réponds UNIQUEMENT avec un objet JSON, sans texte autour.\n\nDocument :\n" + texte,
      }],
    }),
  });

  const data = await reponseIA.json();
  const resultat = data.content?.[0]?.text ?? "{}";

  try {
    res.json(JSON.parse(resultat));
  } catch {
    res.json({ analyse: resultat });
  }
});

app.listen(process.env.PORT || 4021, () => {
  console.log("🏪 API d'analyse de documents en ligne");
});
