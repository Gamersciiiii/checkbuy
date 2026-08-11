"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";

import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [checking, setChecking] =
    useState(true);

  const [validSession, setValidSession] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  /* =========================
     VÉRIFICATION DU LIEN
  ========================= */

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (
        mounted &&
        session
      ) {
        setValidSession(true);
      }

      if (mounted) {
        setChecking(false);
      }
    }

    checkSession();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (event, session) => {
          if (
            event ===
              "PASSWORD_RECOVERY" ||
            session
          ) {
            setValidSession(true);
            setChecking(false);
          }
        }
      );

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };
  }, [supabase]);

  /* =========================
     NOUVEAU MOT DE PASSE
  ========================= */

  async function updatePassword(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");

    if (
      password.length < 8
    ) {
      setError(
        "Le mot de passe doit contenir au moins 8 caractères."
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Les deux mots de passe ne correspondent pas."
      );

      return;
    }

    setLoading(true);

    try {
      const {
        error: updateError,
      } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
    } catch (err) {
      console.error(
        "Erreur changement mot de passe :",
        err
      );

      setError(
        "Impossible de modifier le mot de passe. Le lien a peut-être expiré."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <p style={styles.subtitle}>
            Vérification du lien...
          </p>
        </div>
      </main>
    );
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

        {success ? (
          <>
            <div style={styles.successCircle}>
              ✓
            </div>

            <h1 style={styles.title}>
              Mot de passe modifié
            </h1>

            <p style={styles.subtitle}>
              Ton nouveau mot de passe
              a bien été enregistré.
            </p>

            <button
              style={styles.mainButton}
              onClick={async () => {
                await supabase.auth.signOut();

                router.push("/login");

                router.refresh();
              }}
            >
              Se connecter
            </button>
          </>
        ) : !validSession ? (
          <>
            <div style={styles.errorCircle}>
              !
            </div>

            <h1 style={styles.title}>
              Lien invalide
            </h1>

            <p style={styles.subtitle}>
              Ce lien de récupération
              est invalide ou a expiré.
              Demande un nouveau lien.
            </p>

            <button
              style={styles.mainButton}
              onClick={() =>
                router.push(
                  "/forgot-password"
                )
              }
            >
              Renvoyer un lien
            </button>
          </>
        ) : (
          <>
            <div style={styles.badge}>
              NOUVEAU MOT DE PASSE
            </div>

            <h1 style={styles.title}>
              Choisis ton nouveau
              mot de passe
            </h1>

            <p style={styles.subtitle}>
              Entre ton nouveau mot de
              passe deux fois pour le
              confirmer.
            </p>

            <form
              onSubmit={updatePassword}
              style={styles.form}
            >
              <label style={styles.label}>
                Nouveau mot de passe
              </label>

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
                placeholder="Minimum 8 caractères"
                autoComplete="new-password"
                style={styles.input}
              />

              <label style={styles.labelSecond}>
                Confirmer le mot de passe
              </label>

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Retape ton mot de passe"
                autoComplete="new-password"
                style={styles.input}
              />

              <button
                type="button"
                style={styles.showButton}
                onClick={() =>
                  setShowPassword(
                    (value) =>
                      !value
                  )
                }
              >
                {showPassword
                  ? "Masquer les mots de passe"
                  : "Afficher les mots de passe"}
              </button>

              {error && (
                <div style={styles.error}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.mainButton,

                  opacity:
                    loading
                      ? 0.6
                      : 1,
                }}
              >
                {loading
                  ? "Modification..."
                  : "Modifier le mot de passe"}
              </button>
            </form>
          </>
        )}
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

    background: "transparent",

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

    fontSize: "31px",

    letterSpacing: "-1px",
  },

  subtitle: {
    margin: 0,

    color: "#8d98aa",

    fontSize: "13px",

    lineHeight: 1.7,
  },

  form: {
    marginTop: "28px",

    display: "flex",

    flexDirection: "column",
  },

  label: {
    marginBottom: "8px",

    color: "#d7dce5",

    fontSize: "12px",

    fontWeight: 700,
  },

  labelSecond: {
    marginTop: "18px",

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
      "1px solid rgba(255,255,255,0.1)",

    outline: "none",

    background:
      "rgba(255,255,255,0.035)",

    color: "#ffffff",

    fontSize: "14px",
  },

  showButton: {
    marginTop: "10px",

    padding: 0,

    border: "none",

    background: "transparent",

    color: "#4da3ff",

    fontSize: "11px",

    textAlign: "left",

    cursor: "pointer",
  },

  mainButton: {
    width: "100%",

    marginTop: "22px",

    padding: "14px",

    border: "none",

    borderRadius: "13px",

    background:
      "linear-gradient(135deg, #4da3ff, #62e6ff)",

    color: "#ffffff",

    fontWeight: 800,

    cursor: "pointer",
  },

  error: {
    marginTop: "15px",

    padding: "11px",

    borderRadius: "10px",

    background:
      "rgba(239,68,68,0.08)",

    color: "#ef4444",

    fontSize: "11px",
  },

  successCircle: {
    width: "60px",
    height: "60px",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    marginBottom: "20px",

    borderRadius: "50%",

    background:
      "rgba(34,197,94,0.1)",

    color: "#22c55e",

    fontSize: "27px",
    fontWeight: 900,
  },

  errorCircle: {
    width: "60px",
    height: "60px",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    marginBottom: "20px",

    borderRadius: "50%",

    background:
      "rgba(239,68,68,0.1)",

    color: "#ef4444",

    fontSize: "27px",
    fontWeight: 900,
  },
};