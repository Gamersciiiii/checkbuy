"use client";

import { useRouter } from "next/navigation";

export default function PremiumSuccessPage() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#05070b",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "25px",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          padding: "40px",
          borderRadius: "24px",
          background: "#0b0f16",
          border: "1px solid rgba(255,255,255,0.09)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "65px",
            height: "65px",
            margin: "0 auto 25px",
            borderRadius: "50%",
            background: "rgba(34,197,94,0.12)",
            color: "#22c55e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "30px",
            fontWeight: 900,
          }}
        >
          ✓
        </div>

        <div
          style={{
            color: "#4da3ff",
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "1.2px",
            marginBottom: "12px",
          }}
        >
          CHECKBUY PREMIUM
        </div>

        <h1
          style={{
            margin: "0 0 15px",
            fontSize: "34px",
          }}
        >
          Paiement réussi
        </h1>

        <p
          style={{
            margin: "0 0 30px",
            color: "#8d98aa",
            lineHeight: 1.7,
          }}
        >
          Ton abonnement a bien été payé.
          Ton compte Premium est en cours d&apos;activation.
        </p>

        <button
          onClick={() => router.push("/account")}
          style={{
            width: "100%",
            padding: "15px",
            border: "none",
            borderRadius: "14px",
            background:
              "linear-gradient(135deg, #4da3ff, #62e6ff)",
            color: "#ffffff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Voir mon compte
        </button>

        <button
          onClick={() => router.push("/")}
          style={{
            width: "100%",
            marginTop: "10px",
            padding: "14px",
            borderRadius: "14px",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.09)",
            color: "#ffffff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Retour à l&apos;accueil
        </button>
      </div>
    </main>
  );
}