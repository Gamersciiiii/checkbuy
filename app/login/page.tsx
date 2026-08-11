"use client";

import {
  useMemo,
  useState,
  type CSSProperties,
} from "react";

import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [mode, setMode] =
    useState<Mode>("login");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  /* =========================
     CONNEXION / INSCRIPTION
  ========================= */

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim()) {
      setError(
        "Entre ton adresse email."
      );

      return;
    }

    if (password.length < 6) {
      setError(
        "Le mot de passe doit contenir au moins 6 caractères."
      );

      return;
    }

    setLoading(true);

    try {
      /* =====================
         CRÉATION DE COMPTE
      ====================== */

      if (mode === "signup") {
        const {
          data,
          error: signupError,
        } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,
          });

        if (signupError) {
          throw signupError;
        }

        /*
         * Si Supabase demande une
         * confirmation par email.
         */
        if (!data.session) {
          setMessage(
            "Compte créé. Vérifie ton email pour confirmer ton compte."
          );

          return;
        }

        router.push("/");
        router.refresh();

        return;
      }

      /* =====================
         CONNEXION
      ====================== */

      const {
        error: loginError,
      } =
        await supabase.auth
          .signInWithPassword({
            email: email.trim(),
            password,
          });

      if (loginError) {
        throw loginError;
      }

      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      console.error(
        "Erreur authentification :",
        err
      );

      let text =
        "Une erreur est survenue.";

      if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof err.message === "string"
      ) {
        const message =
          err.message.toLowerCase();

        if (
          message.includes(
            "invalid login credentials"
          )
        ) {
          text =
            "Email ou mot de passe incorrect.";
        } else if (
          message.includes(
            "user already registered"
          )
        ) {
          text =
            "Un compte existe déjà avec cette adresse email.";
        } else if (
          message.includes(
            "email not confirmed"
          )
        ) {
          text =
            "Confirme ton adresse email avant de te connecter.";
        } else if (
          message.includes(
            "password"
          )
        ) {
          text =
            "Le mot de passe n'est pas valide.";
        } else if (
          message.includes(
            "invalid api key"
          )
        ) {
          text =
            "Erreur de configuration Supabase.";
        }
      }

      setError(text);
    } finally {
      setLoading(false);
    }
  }

  function changeMode(
    newMode: Mode
  ) {
    setMode(newMode);

    setError("");
    setMessage("");

    setPassword("");
  }

  return (
    <main style={styles.page}>
      <div style={styles.glowOne} />
      <div style={styles.glowTwo} />

      {/* =====================
          HEADER
      ====================== */}

      <header style={styles.header}>
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

        <button
          style={styles.homeButton}
          onClick={() =>
            router.push("/")
          }
        >
          ← Accueil
        </button>
      </header>

      {/* =====================
          CONNEXION
      ====================== */}

      <section style={styles.container}>
        <div style={styles.card}>
          <div style={styles.badge}>
            COMPTE CHECKBUY
          </div>

          <h1 style={styles.title}>
            {mode === "login"
              ? "Bon retour."
              : "Créer un compte."}
          </h1>

          <p style={styles.subtitle}>
            {mode === "login"
              ? "Connecte-toi pour retrouver ton historique, tes commentaires et ton abonnement Premium."
              : "Crée ton compte pour sauvegarder tes analyses et accéder aux fonctionnalités CheckBuy."}
          </p>

          {/* SWITCH */}

          <div style={styles.switchContainer}>
            <button
              type="button"
              onClick={() =>
                changeMode("login")
              }
              style={{
                ...styles.switchButton,

                ...(mode === "login"
                  ? styles.switchButtonActive
                  : {}),
              }}
            >
              Connexion
            </button>

            <button
              type="button"
              onClick={() =>
                changeMode("signup")
              }
              style={{
                ...styles.switchButton,

                ...(mode === "signup"
                  ? styles.switchButtonActive
                  : {}),
              }}
            >
              Inscription
            </button>
          </div>

          {/* FORMULAIRE */}

          <form
            onSubmit={handleSubmit}
            style={styles.form}
          >
            {/* EMAIL */}

            <div style={styles.field}>
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
            </div>

            {/* PASSWORD */}

            <div style={styles.field}>
              <label style={styles.label}>
                Mot de passe
              </label>

              <div
                style={
                  styles.passwordWrapper
                }
              >
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder={
                    mode === "signup"
                      ? "Crée ton mot de passe"
                      : "Ton mot de passe"
                  }
                  autoComplete={
                    mode === "signup"
                      ? "new-password"
                      : "current-password"
                  }
                  style={
                    styles.passwordInput
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (value) =>
                        !value
                    )
                  }
                  style={
                    styles.showPasswordButton
                  }
                >
                  {showPassword
                    ? "Masquer"
                    : "Afficher"}
                </button>
              </div>

              {/* MOT DE PASSE OUBLIÉ */}

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/forgot-password"
                    )
                  }
                  style={
                    styles.forgotButton
                  }
                >
                  Mot de passe oublié ?
                </button>
              )}
            </div>

            {/* ERREUR */}

            {error && (
              <div style={styles.errorBox}>
                <span
                  style={
                    styles.errorIcon
                  }
                >
                  !
                </span>

                <span>
                  {error}
                </span>
              </div>
            )}

            {/* SUCCESS */}

            {message && (
              <div
                style={styles.successBox}
              >
                <span
                  style={
                    styles.successIcon
                  }
                >
                  ✓
                </span>

                <span>
                  {message}
                </span>
              </div>
            )}

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.mainButton,

                opacity:
                  loading
                    ? 0.6
                    : 1,

                cursor:
                  loading
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {loading
                ? mode === "login"
                  ? "Connexion..."
                  : "Création..."
                : mode === "login"
                  ? "Se connecter"
                  : "Créer mon compte"}
            </button>
          </form>

          {/* BOTTOM */}

          <div style={styles.bottom}>
            {mode === "login" ? (
              <>
                <span
                  style={
                    styles.bottomText
                  }
                >
                  Pas encore de compte ?
                </span>

                <button
                  type="button"
                  onClick={() =>
                    changeMode(
                      "signup"
                    )
                  }
                  style={
                    styles.bottomButton
                  }
                >
                  Créer un compte
                </button>
              </>
            ) : (
              <>
                <span
                  style={
                    styles.bottomText
                  }
                >
                  Déjà un compte ?
                </span>

                <button
                  type="button"
                  onClick={() =>
                    changeMode(
                      "login"
                    )
                  }
                  style={
                    styles.bottomButton
                  }
                >
                  Se connecter
                </button>
              </>
            )}
          </div>
        </div>

        {/* INFO */}

        <div style={styles.info}>
          <div style={styles.infoItem}>
            <span style={styles.check}>
              ✓
            </span>

            Historique de vos analyses
          </div>

          <div style={styles.infoItem}>
            <span style={styles.check}>
              ✓
            </span>

            Avis communautaires
          </div>

          <div style={styles.infoItem}>
            <span style={styles.check}>
              ✓
            </span>

            Accès à CheckBuy Premium
          </div>
        </div>
      </section>

      <footer style={styles.footer}>
        © 2026 CheckBuy — Vérifiez avant
        d&apos;acheter.
      </footer>
    </main>
  );
}

/* =========================
   STYLES
========================= */

const styles: Record<
  string,
  CSSProperties
> = {
  page: {
    minHeight: "100vh",

    position: "relative",

    overflow: "hidden",

    background: "#05070b",

    color: "#ffffff",

    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  glowOne: {
    position: "absolute",

    width: "750px",
    height: "750px",

    top: "-520px",
    left: "50%",

    transform:
      "translateX(-50%)",

    borderRadius: "50%",

    background:
      "rgba(77,163,255,0.22)",

    filter: "blur(100px)",

    pointerEvents: "none",
  },

  glowTwo: {
    position: "absolute",

    width: "400px",
    height: "400px",

    bottom: "-300px",
    right: "-150px",

    borderRadius: "50%",

    background:
      "rgba(98,230,255,0.08)",

    filter: "blur(80px)",

    pointerEvents: "none",
  },

  header: {
    position: "relative",

    zIndex: 2,

    maxWidth: "1100px",

    minHeight: "80px",

    margin: "0 auto",

    padding: "0 25px",

    display: "flex",

    alignItems: "center",

    justifyContent:
      "space-between",
  },

  logo: {
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

  homeButton: {
    padding: "10px 15px",

    borderRadius: "12px",

    border:
      "1px solid rgba(255,255,255,0.09)",

    background:
      "rgba(255,255,255,0.035)",

    color: "#ffffff",

    cursor: "pointer",
  },

  container: {
    position: "relative",

    zIndex: 2,

    width: "100%",

    maxWidth: "500px",

    margin: "0 auto",

    padding:
      "65px 25px 80px",

    boxSizing: "border-box",
  },

  card: {
    width: "100%",

    boxSizing: "border-box",

    padding: "36px",

    borderRadius: "26px",

    background: "#0b0f16",

    border:
      "1px solid rgba(255,255,255,0.09)",

    boxShadow:
      "0 30px 100px rgba(0,0,0,0.35)",
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
    margin: "18px 0 10px",

    fontSize: "35px",

    letterSpacing: "-1.5px",
  },

  subtitle: {
    margin: 0,

    color: "#8d98aa",

    fontSize: "13px",

    lineHeight: 1.7,
  },

  switchContainer: {
    marginTop: "28px",

    padding: "5px",

    display: "grid",

    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",

    gap: "5px",

    borderRadius: "14px",

    background:
      "rgba(255,255,255,0.025)",

    border:
      "1px solid rgba(255,255,255,0.07)",
  },

  switchButton: {
    padding: "11px",

    border: "none",

    borderRadius: "10px",

    background:
      "transparent",

    color: "#667085",

    fontWeight: 700,

    cursor: "pointer",
  },

  switchButtonActive: {
    background:
      "rgba(77,163,255,0.1)",

    color: "#4da3ff",
  },

  form: {
    marginTop: "28px",

    display: "flex",

    flexDirection: "column",

    gap: "20px",
  },

  field: {
    display: "flex",

    flexDirection: "column",
  },

  label: {
    marginBottom: "8px",

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
      "1px solid rgba(255,255,255,0.10)",

    outline: "none",

    background:
      "rgba(255,255,255,0.035)",

    color: "#ffffff",

    fontSize: "14px",
  },

  passwordWrapper: {
    display: "flex",

    alignItems: "center",

    borderRadius: "12px",

    background:
      "rgba(255,255,255,0.035)",

    border:
      "1px solid rgba(255,255,255,0.10)",

    overflow: "hidden",
  },

  passwordInput: {
    minWidth: 0,

    flex: 1,

    padding: "14px",

    border: "none",

    outline: "none",

    background:
      "transparent",

    color: "#ffffff",

    fontSize: "14px",
  },

  showPasswordButton: {
    padding: "10px 13px",

    border: "none",

    background:
      "transparent",

    color: "#8d98aa",

    fontSize: "11px",

    fontWeight: 700,

    cursor: "pointer",
  },

  forgotButton: {
    alignSelf: "flex-end",

    marginTop: "9px",

    padding: 0,

    border: "none",

    background:
      "transparent",

    color: "#4da3ff",

    fontSize: "11px",

    fontWeight: 700,

    cursor: "pointer",
  },

  mainButton: {
    width: "100%",

    padding: "15px",

    border: "none",

    borderRadius: "13px",

    background:
      "linear-gradient(135deg, #4da3ff, #62e6ff)",

    color: "#ffffff",

    fontWeight: 800,

    boxShadow:
      "0 15px 40px rgba(77,163,255,0.18)",
  },

  errorBox: {
    display: "flex",

    gap: "9px",

    alignItems: "center",

    padding: "12px",

    borderRadius: "11px",

    background:
      "rgba(239,68,68,0.08)",

    border:
      "1px solid rgba(239,68,68,0.15)",

    color: "#ef4444",

    fontSize: "11px",
  },

  errorIcon: {
    fontWeight: 900,
  },

  successBox: {
    display: "flex",

    gap: "9px",

    alignItems: "flex-start",

    padding: "12px",

    borderRadius: "11px",

    background:
      "rgba(34,197,94,0.08)",

    border:
      "1px solid rgba(34,197,94,0.15)",

    color: "#22c55e",

    fontSize: "11px",

    lineHeight: 1.5,
  },

  successIcon: {
    fontWeight: 900,
  },

  bottom: {
    marginTop: "25px",

    paddingTop: "22px",

    borderTop:
      "1px solid rgba(255,255,255,0.07)",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    gap: "6px",
  },

  bottomText: {
    color: "#667085",

    fontSize: "11px",
  },

  bottomButton: {
    padding: 0,

    border: "none",

    background:
      "transparent",

    color: "#4da3ff",

    fontSize: "11px",

    fontWeight: 700,

    cursor: "pointer",
  },

  info: {
    marginTop: "18px",

    display: "flex",

    flexDirection: "column",

    gap: "9px",
  },

  infoItem: {
    display: "flex",

    alignItems: "center",

    gap: "9px",

    color: "#667085",

    fontSize: "11px",
  },

  check: {
    color: "#22c55e",

    fontWeight: 900,
  },

  footer: {
    position: "relative",

    zIndex: 2,

    padding: "25px",

    textAlign: "center",

    color: "#667085",

    fontSize: "11px",
  },
};