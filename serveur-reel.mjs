import express from "express";
import { paymentMiddleware } from "x402-express";

const app = express();
app.use(express.json({ limit: "25mb" }));

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

const CONSIGNE =
  "Analyse ce document et extrais les informations clés : type de document, " +
  "fournisseur (nom, adresse), client (nom, adresse), numero, date, echeance, " +
  "prestations (description, montant), sous_total, tva (taux, montant), " +
  "montant_total, devise, conditions_paiement, iban. " +
  "Utilise null pour toute information absente. " +
  "Réponds UNIQUEMENT avec un objet JSON, sans texte autour.";

async function analyser({ texte, pdfBase64 }) {
  const contenu = [];

  if (pdfBase64) {
    contenu.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: pdfBase64 },
    });
  }

  contenu.push({
    type: "text",
    text: texte ? CONSIGNE + "\n\nDocument :\n" + texte : CONSIGNE,
  });

  const reponseIA = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      messages: [{ role: "user", content: contenu }],
    }),
  });

  const data = await reponseIA.json();
  const brut = (data.content?.[0]?.text ?? "{}").replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(brut);
  } catch {
    return { analyse: brut };
  }
}

app.post("/api/analyse-document", async (req, res) => {
  const { texte, pdfBase64 } = req.body ?? {};
  if (!texte && !pdfBase64) {
    return res.status(400).json({ erreur: "Envoie 'texte' ou 'pdfBase64'" });
  }
  res.json(await analyser({ texte, pdfBase64 }));
});

app.post("/api/interne/analyse", async (req, res) => {
   if (req.headers["x-cle-interne"] !== process.env.CLE_INTERNE) {
    console.log("REFUS — reçu:[" + req.headers["x-cle-interne"] + "] attendu:[" + process.env.CLE_INTERNE + "]");
    return res.status(401).json({ erreur: "Accès refusé" });
  }
  const { texte, pdfBase64 } = req.body ?? {};
  if (!texte && !pdfBase64) {
    return res.status(400).json({ erreur: "Envoie 'texte' ou 'pdfBase64'" });
  }
  res.json(await analyser({ texte, pdfBase64 }));
});

app.get("/", (req, res) => res.send("API d'analyse de documents — en ligne"));

app.listen(process.env.PORT || 4021, () => {
  console.log("🏪 API d'analyse de documents en ligne (PDF + route interne)");
});
