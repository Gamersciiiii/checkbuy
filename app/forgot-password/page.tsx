"use client";

import {
  useMemo,
  useState,
  type CSSProperties,
} from "react";

import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  async function sendResetEmail(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!email.trim()) {
      setError(
        "Entre ton adresse email."
      );

      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const redirectTo =
        `${window.location.origin}/update-password`;

      const {
        error: resetError,
      } =
        await supabase.auth
          .resetPasswordForEmail(
            email.trim(),
            {
              redirectTo,
            }
          );
console.log("Erreur reset password :", error);
      if (resetError) {
        throw resetError;
      }

      setMessage(
        "Email envoyé. Vérifie ta boîte mail et clique sur le lien pour créer un nouveau mot de passe."
      );
    } catch (err) {
      console.error(
        "Erreur mot de passe oublié :",
        err
      );

      setError(
        "Impossible d'envoyer l'email de récupération."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.glow} />

      <section style={styles.card}>
        <button
          style={styles.logo}
          onClick={() =>
            router.push("/")
          }
        >
          Check
          <span style={styles.logoBlue}>
            Buy
          </span>
        </button>

        <div style={styles.badge}>
          RÉCUPÉRATION
        </div>

        <h1 style={styles.title}>
          Mot de passe oublié ?
        </h1>

        <p style={styles.subtitle}>
          Entre l&apos;adresse email
          associée à ton compte CheckBuy.
          Nous t&apos;enverrons un lien
          pour choisir un nouveau mot de
          passe.
        </p>

        <form
          onSubmit={sendResetEmail}
          style={styles.form}
        >
          <label style={styles.label}>
            Adresse email
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            placeholder="exemple@email.com"
            autoComplete="email"
            style={styles.input}
          />

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          {message && (
            <div style={styles.success}>
              <div
                style={
                  styles.successIcon
                }
              >
                ✓
              </div>

              <div>
                {message}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.mainButton,

              opacity:
                loading ? 0.6 : 1,

              cursor:
                loading
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {loading
              ? "Envoi..."
              : "Envoyer le lien"}
          </button>
        </form>

        <button
          type="button"
          onClick={() =>
            router.push("/login")
          }
          style={styles.backButton}
        >
          ← Retour à la connexion
        </button>
      </section>
    </main>
  );
}

const styles: Record<
  string,
  CSSProperties
> = {
  page: {
    minHeight: "100vh",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    position: "relative",
    overflow: "hidden",

    padding: "25px",

    background: "#05070b",

    color: "#ffffff",

    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  glow: {
    position: "absolute",

    width: "700px",
    height: "700px",

    top: "-420px",
    left: "50%",

    transform:
      "translateX(-50%)",

    borderRadius: "50%",

    background:
      "rgba(77,163,255,0.17)",

    filter: "blur(100px)",
  },

  card: {
    position: "relative",

    zIndex: 1,

    width: "100%",
    maxWidth: "480px",

    padding: "36px",

    borderRadius: "25px",

    background: "#0b0f16",

    border:
      "1px solid rgba(255,255,255,0.09)",

    boxShadow:
      "0 30px 100px rgba(0,0,0,0.35)",
  },

  logo: {
    marginBottom: "35px",

    padding: 0,

    border: "none",

    background:
      "transparent",

    color: "#ffffff",

    fontSize: "25px",
    fontWeight: 800,

    letterSpacing: "-1px",

    cursor: "pointer",
  },

  logoBlue: {
    color: "#4da3ff",
  },

  badge: {
    display: "inline-block",

    padding: "7px 10px",

    borderRadius: "20px",

    background:
      "rgba(77,163,255,0.1)",

    color: "#4da3ff",

    fontSize: "10px",
    fontWeight: 800,

    letterSpacing: "1.2px",
  },

  title: {
    margin: "17px 0 10px",

    fontSize: "32px",

    letterSpacing: "-1px",
  },

  subtitle: {
    margin: 0,

    color: "#8d98aa",

    fontSize: "13px",

    lineHeight: 1.7,
  },

  form: {
    marginTop: "30px",

    display: "flex",

    flexDirection: "column",

    gap: "10px",
  },

  label: {
    color: "#d7dce5",

    fontSize: "12px",

    fontWeight: 700,
  },

  input: {
    width: "100%",

    boxSizing: "border-box",

    padding: "14px",

    borderRadius: "12px",

    border:
      "1px solid rgba(255,255,255,0.1)",

    outline: "none",

    background:
      "rgba(255,255,255,0.035)",

    color: "#ffffff",

    fontSize: "14px",
  },

  mainButton: {
    width: "100%",

    marginTop: "10px",

    padding: "14px",

    border: "none",

    borderRadius: "13px",

    background:
      "linear-gradient(135deg, #4da3ff, #62e6ff)",

    color: "#ffffff",

    fontWeight: 800,
  },

  backButton: {
    width: "100%",

    marginTop: "14px",

    padding: "12px",

    border: "none",

    background:
      "transparent",

    color: "#8d98aa",

    fontSize: "12px",

    cursor: "pointer",
  },

  success: {
    display: "flex",

    gap: "10px",

    alignItems: "flex-start",

    marginTop: "8px",

    padding: "13px",

    borderRadius: "12px",

    background:
      "rgba(34,197,94,0.08)",

    border:
      "1px solid rgba(34,197,94,0.16)",

    color: "#22c55e",

    fontSize: "12px",

    lineHeight: 1.5,
  },

  successIcon: {
    fontWeight: 900,
  },

  error: {
    marginTop: "5px",

    padding: "11px",

    borderRadius: "10px",

    background:
      "rgba(239,68,68,0.08)",

    color: "#ef4444",

    fontSize: "11px",
  },
};