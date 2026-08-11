"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";

import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

type Billing = "monthly" | "yearly";

type ThemeName =
  | "dark"
  | "light"
  | "cold"
  | "warm";

type ThemeColors = {
  background: string;
  glow: string;
  card: string;
  cardStrong: string;
  text: string;
  secondaryText: string;
  mutedText: string;
  border: string;
  accent: string;
  accent2: string;
  accentSoft: string;
};

type StyleMap = Record<string, CSSProperties>;

const themes: Record<
  ThemeName,
  ThemeColors
> = {
  dark: {
    background: "#05070b",
    glow: "#102341",
    card: "rgba(255,255,255,0.035)",
    cardStrong: "#0b0f16",
    text: "#ffffff",
    secondaryText: "#8d98aa",
    mutedText: "#667085",
    border: "rgba(255,255,255,0.09)",
    accent: "#4da3ff",
    accent2: "#62e6ff",
    accentSoft: "rgba(77,163,255,0.1)",
  },

  light: {
    background: "#f4f7fb",
    glow: "#dcecff",
    card: "#ffffff",
    cardStrong: "#ffffff",
    text: "#111827",
    secondaryText: "#64748b",
    mutedText: "#94a3b8",
    border: "rgba(15,23,42,0.10)",
    accent: "#2563eb",
    accent2: "#0891b2",
    accentSoft: "rgba(37,99,235,0.08)",
  },

  cold: {
    background: "#050712",
    glow: "#231b55",
    card: "rgba(100,110,255,0.05)",
    cardStrong: "#0c1020",
    text: "#f8faff",
    secondaryText: "#9ba8c7",
    mutedText: "#697597",
    border: "rgba(130,150,255,0.14)",
    accent: "#7c83ff",
    accent2: "#3de7ff",
    accentSoft: "rgba(124,131,255,0.12)",
  },

  warm: {
    background: "#0e0805",
    glow: "#4a1e0d",
    card: "rgba(255,150,80,0.045)",
    cardStrong: "#17100c",
    text: "#fffaf6",
    secondaryText: "#b9a195",
    mutedText: "#806e65",
    border: "rgba(255,180,120,0.12)",
    accent: "#ff8b4d",
    accent2: "#ffc857",
    accentSoft: "rgba(255,139,77,0.1)",
  },
};

export default function PremiumPage() {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [billing, setBilling] =
    useState<Billing>("monthly");

  const [theme, setTheme] =
    useState<ThemeName>("dark");

  const [userEmail, setUserEmail] =
    useState<string | null>(null);

  const [checkoutLoading, setCheckoutLoading] =
    useState(false);

  const colors = themes[theme];

  const styles =
    createStyles(colors);

  /* =========================
     THÈME
  ========================= */

  useEffect(() => {
    const savedTheme =
      localStorage.getItem(
        "checkbuy-theme"
      ) as ThemeName | null;

    if (
      savedTheme &&
      themes[savedTheme]
    ) {
      setTheme(savedTheme);
    }
  }, []);

  /* =========================
     UTILISATEUR
  ========================= */

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      setUserEmail(
        user?.email ?? null
      );
    }

    loadUser();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUserEmail(
            session?.user?.email ??
              null
          );
        }
      );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  /* =========================
     STRIPE CHECKOUT
  ========================= */

  async function startPremium() {
    if (checkoutLoading) {
      return;
    }

    setCheckoutLoading(true);

    try {
      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const response =
        await fetch(
          "/api/stripe/checkout",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body: JSON.stringify({
              billing,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.error ||
            "Impossible de lancer le paiement."
        );

        return;
      }

      if (!data.url) {
        alert(
          "Stripe n'a pas retourné d'URL de paiement."
        );

        return;
      }

      window.location.href =
        data.url;
    } catch (error) {
      console.error(
        "Erreur paiement Stripe :",
        error
      );

      alert(
        "Impossible de lancer le paiement."
      );
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <main style={styles.page}>
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
          <span
            style={{
              color:
                colors.accent,
            }}
          >
            Buy
          </span>
        </button>

        <div
          style={
            styles.headerRight
          }
        >
          <button
            style={
              styles.headerButton
            }
            onClick={() =>
              router.push("/")
            }
          >
            ← Accueil
          </button>

          {userEmail && (
            <button
              style={
                styles.accountButton
              }
              onClick={() =>
                router.push(
                  "/account"
                )
              }
            >
              Mon compte
            </button>
          )}
        </div>
      </header>

      {/* =====================
          HERO
      ====================== */}

      <section style={styles.hero}>
        <div style={styles.badge}>
          CHECKBUY PREMIUM
        </div>

        <h1 style={styles.title}>
          Passez à
          <br />

          <span
            style={{
              color:
                colors.accent,
            }}
          >
            Premium.
          </span>
        </h1>

        <p style={styles.subtitle}>
          Analyses illimitées,
          vérifications supplémentaires,
          historique complet et aucune
          publicité.
        </p>
      </section>

      {/* =====================
          CHOIX DE L'ABONNEMENT
      ====================== */}

      <section
        style={
          styles.billingSection
        }
      >
        <div
          style={
            styles.billingSelector
          }
        >
          {/* MENSUEL */}

          <button
            onClick={() =>
              setBilling("monthly")
            }
            style={{
              ...styles.billingOption,

              ...(billing ===
              "monthly"
                ? styles.billingOptionActive
                : {}),
            }}
          >
            <div
              style={
                styles.billingTitle
              }
            >
              Mensuel
            </div>

            <div
              style={
                styles.billingPrice
              }
            >
              4,99 €
            </div>

            <div
              style={
                styles.billingPeriod
              }
            >
              par mois
            </div>

            <div
              style={
                styles.billingDescription
              }
            >
              Paiement chaque mois
            </div>
          </button>

          {/* ANNUEL */}

          <button
            onClick={() =>
              setBilling("yearly")
            }
            style={{
              ...styles.billingOption,

              ...(billing ===
              "yearly"
                ? styles.billingOptionActive
                : {}),
            }}
          >
            <div
              style={
                styles.billingTitleRow
              }
            >
              <span>
                Annuel
              </span>

              <span
                style={
                  styles.discountBadge
                }
              >
                -17 %
              </span>
            </div>

            <div
              style={
                styles.billingPrice
              }
            >
              49,99 €
            </div>

            <div
              style={
                styles.billingPeriod
              }
            >
              par an
            </div>

            <div
              style={
                styles.saving
              }
            >
              Économisez 9,89 €
            </div>
          </button>
        </div>
      </section>

      {/* =====================
          CARTES
      ====================== */}

      <section
        style={
          styles.pricingSection
        }
      >
        {/* GRATUIT */}

        <div style={styles.freeCard}>
          <div
            style={styles.planLabel}
          >
            GRATUIT
          </div>

          <h2
            style={styles.planTitle}
          >
            CheckBuy Free
          </h2>

          <div>
            <span
              style={
                styles.mainPrice
              }
            >
              0 €
            </span>

            <span
              style={
                styles.mainPeriod
              }
            >
              / mois
            </span>
          </div>

          <div
            style={styles.divider}
          />

          <div
            style={styles.features}
          >
            <Feature text="Score CheckBuy" />

            <Feature text="Analyse des sites" />

            <Feature text="Avis communautaires" />

            <Feature text="Historique du compte" />

            <Feature
              text="Analyses limitées"
              disabled
            />

            <Feature
              text="Avec publicité"
              disabled
            />
          </div>

          <button
            style={
              styles.freeButton
            }
            onClick={() =>
              router.push("/")
            }
          >
            Continuer gratuitement
          </button>
        </div>

        {/* PREMIUM */}

        <div
          style={
            styles.premiumCard
          }
        >
          <div
            style={
              styles.recommended
            }
          >
            RECOMMANDÉ
          </div>

          <div
            style={
              styles.premiumLabel
            }
          >
            PREMIUM
          </div>

          <h2
            style={styles.planTitle}
          >
            CheckBuy Premium
          </h2>

          {/* PRIX MENSUEL */}

          {billing === "monthly" ? (
            <>
              <div
                style={
                  styles.priceLine
                }
              >
                <span
                  style={
                    styles.premiumPrice
                  }
                >
                  4,99 €
                </span>

                <span
                  style={
                    styles.premiumPeriod
                  }
                >
                  / mois
                </span>
              </div>

              <p
                style={
                  styles.billingInfo
                }
              >
                Facturé 4,99 €
                chaque mois
              </p>

              <div
                style={
                  styles.flexibleText
                }
              >
                Formule flexible
              </div>
            </>
          ) : (
            <>
              {/* PRIX ANNUEL */}

              <div
                style={
                  styles.priceLine
                }
              >
                <span
                  style={
                    styles.premiumPrice
                  }
                >
                  49,99 €
                </span>

                <span
                  style={
                    styles.premiumPeriod
                  }
                >
                  / an
                </span>
              </div>

              <p
                style={
                  styles.billingInfo
                }
              >
                Facturé une fois
                par an
              </p>

              <div
                style={
                  styles.yearlySaving
                }
              >
                Économisez 9,89 €
                par an
              </div>

              <div
                style={
                  styles.monthEquivalent
                }
              >
                Soit environ
                4,17 € / mois
              </div>
            </>
          )}

          <div
            style={styles.divider}
          />

          <div
            style={styles.features}
          >
            <Feature
              text="Analyses illimitées"
              premium
            />

            <Feature
              text="Analyse plus approfondie"
              premium
            />

            <Feature
              text="Aucune publicité"
              premium
            />

            <Feature
              text="Historique complet"
              premium
            />

            <Feature
              text="Alertes sur les sites à risque"
              premium
            />

            <Feature
              text="Rapports et exports"
              premium
            />

            <Feature
              text="Nouveautés Premium"
              premium
            />
          </div>

          <button
            style={{
              ...styles.premiumButton,

              opacity:
                checkoutLoading
                  ? 0.6
                  : 1,

              cursor:
                checkoutLoading
                  ? "not-allowed"
                  : "pointer",
            }}
            onClick={
              startPremium
            }
            disabled={
              checkoutLoading
            }
          >
            {checkoutLoading
              ? "Ouverture du paiement..."
              : billing ===
                  "monthly"
                ? "Choisir 4,99 € / mois"
                : "Choisir 49,99 € / an"}
          </button>

          <div
            style={
              styles.cancelText
            }
          >
            Résiliable à tout moment
          </div>

          {!userEmail && (
            <div
              style={
                styles.loginText
              }
            >
              Connecte-toi pour
              souscrire à Premium.
            </div>
          )}
        </div>
      </section>

      {/* =====================
          COMPARAISON
      ====================== */}

      <section
        style={
          styles.comparisonSection
        }
      >
        <div
          style={
            styles.sectionLabel
          }
        >
          CHOISISSEZ VOTRE FORMULE
        </div>

        <h2
          style={
            styles.sectionTitle
          }
        >
          Mensuel ou annuel
        </h2>

        <div
          style={
            styles.comparisonGrid
          }
        >
          {/* MENSUEL */}

          <div
            style={
              styles.comparisonCard
            }
          >
            <div
              style={
                styles.comparisonName
              }
            >
              Premium Mensuel
            </div>

            <div
              style={
                styles.comparisonPrice
              }
            >
              4,99 €
            </div>

            <div
              style={
                styles.comparisonPeriod
              }
            >
              / mois
            </div>

            <p
              style={
                styles.comparisonText
              }
            >
              Paiement de 4,99 €
              chaque mois.
            </p>

            <button
              style={
                styles.comparisonButton
              }
              onClick={() => {
                setBilling("monthly");

                window.scrollTo({
                  top: 250,
                  behavior: "smooth",
                });
              }}
            >
              Choisir Mensuel
            </button>
          </div>

          {/* ANNUEL */}

          <div
            style={
              styles.comparisonCardBest
            }
          >
            <div
              style={
                styles.bestBadge
              }
            >
              MEILLEURE VALEUR
            </div>

            <div
              style={
                styles.comparisonName
              }
            >
              Premium Annuel
            </div>

            <div
              style={
                styles.comparisonPrice
              }
            >
              49,99 €
            </div>

            <div
              style={
                styles.comparisonPeriod
              }
            >
              / an
            </div>

            <p
              style={
                styles.comparisonText
              }
            >
              Un paiement par an
              et 9,89 € économisés.
            </p>

            <button
              style={
                styles.comparisonButtonBest
              }
              onClick={() => {
                setBilling("yearly");

                window.scrollTo({
                  top: 250,
                  behavior: "smooth",
                });
              }}
            >
              Choisir Annuel
            </button>
          </div>
        </div>
      </section>

      {/* =====================
          AVANTAGES
      ====================== */}

      <section
        style={
          styles.advantages
        }
      >
        <div
          style={
            styles.sectionLabel
          }
        >
          PREMIUM
        </div>

        <h2
          style={
            styles.sectionTitle
          }
        >
          Pourquoi passer à
          Premium ?
        </h2>

        <div
          style={
            styles.advantagesGrid
          }
        >
          <Advantage
            number="01"
            title="Analyses illimitées"
            description="Analysez autant de sites que nécessaire."
            styles={styles}
          />

          <Advantage
            number="02"
            title="Analyse approfondie"
            description="Profitez de vérifications supplémentaires."
            styles={styles}
          />

          <Advantage
            number="03"
            title="Sans publicité"
            description="Utilisez CheckBuy sans emplacement publicitaire."
            styles={styles}
          />
        </div>
      </section>

      {/* FOOTER */}

      <footer
        style={styles.footer}
      >
        © 2026 CheckBuy —
        Vérifiez avant
        d&apos;acheter.
      </footer>
    </main>
  );
}

/* =========================
   FEATURE
========================= */

function Feature({
  text,
  premium = false,
  disabled = false,
}: {
  text: string;
  premium?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "center",

        opacity:
          disabled ? 0.45 : 1,

        fontSize: "14px",
      }}
    >
      <span
        style={{
          color: disabled
            ? "#64748b"
            : premium
              ? "#4da3ff"
              : "#22c55e",

          fontWeight: 800,
        }}
      >
        {disabled
          ? "—"
          : "✓"}
      </span>

      {text}
    </div>
  );
}

/* =========================
   AVANTAGES
========================= */

function Advantage({
  number,
  title,
  description,
  styles,
}: {
  number: string;
  title: string;
  description: string;
  styles: StyleMap;
}) {
  return (
    <div
      style={
        styles.advantageCard
      }
    >
      <div
        style={
          styles.advantageNumber
        }
      >
        {number}
      </div>

      <h3
        style={
          styles.advantageTitle
        }
      >
        {title}
      </h3>

      <p
        style={
          styles.advantageDescription
        }
      >
        {description}
      </p>
    </div>
  );
}

/* =========================
   STYLES
========================= */

function createStyles(
  colors: ThemeColors
): StyleMap {
  return {
    page: {
      minHeight: "100vh",

      background: `radial-gradient(
        circle at 50% 0%,
        ${colors.glow} 0%,
        ${colors.background} 45%
      )`,

      color: colors.text,

      fontFamily:
        "Arial, Helvetica, sans-serif",
    },

    /* HEADER */

    header: {
      maxWidth: "1150px",
      minHeight: "80px",

      margin: "0 auto",
      padding: "0 25px",

      display: "flex",

      justifyContent:
        "space-between",

      alignItems: "center",

      gap: "20px",
    },

    logo: {
      border: "none",

      background:
        "transparent",

      color: colors.text,

      fontSize: "25px",

      fontWeight: 800,

      letterSpacing: "-1px",

      cursor: "pointer",
    },

    headerRight: {
      display: "flex",
      gap: "10px",
    },

    headerButton: {
      padding: "10px 15px",

      borderRadius: "12px",

      background:
        colors.card,

      border:
        `1px solid ${colors.border}`,

      color: colors.text,

      cursor: "pointer",
    },

    accountButton: {
      padding: "10px 15px",

      borderRadius: "12px",

      background:
        colors.accentSoft,

      border:
        `1px solid ${colors.accent}30`,

      color: colors.accent,

      cursor: "pointer",
    },

    /* HERO */

    hero: {
      maxWidth: "800px",

      margin: "0 auto",

      padding:
        "85px 25px 45px",

      textAlign: "center",
    },

    badge: {
      display: "inline-block",

      padding: "9px 14px",

      borderRadius: "30px",

      background:
        colors.accentSoft,

      border:
        `1px solid ${colors.accent}30`,

      color: colors.accent,

      fontSize: "11px",

      fontWeight: 800,

      letterSpacing: "1.4px",
    },

    title: {
      margin:
        "25px 0 20px",

      fontSize:
        "clamp(48px, 7vw, 72px)",

      lineHeight: 1.03,

      letterSpacing: "-3px",
    },

    subtitle: {
      maxWidth: "650px",

      margin: "0 auto",

      color:
        colors.secondaryText,

      fontSize: "17px",

      lineHeight: 1.7,
    },

    /* CHOIX ABONNEMENT */

    billingSection: {
      maxWidth: "700px",

      margin: "0 auto",

      padding:
        "10px 25px 40px",
    },

    billingSelector: {
      display: "grid",

      gridTemplateColumns:
        "repeat(2, minmax(0, 1fr))",

      gap: "10px",
    },

    billingOption: {
      padding: "20px",

      borderRadius: "18px",

      background:
        colors.card,

      border:
        `1px solid ${colors.border}`,

      color: colors.text,

      textAlign: "left",

      cursor: "pointer",

      transition:
        "all 0.2s ease",
    },

    billingOptionActive: {
      background:
        colors.accentSoft,

      border:
        `1px solid ${colors.accent}`,
    },

    billingTitle: {
      fontSize: "14px",

      fontWeight: 800,
    },

    billingTitleRow: {
      display: "flex",

      justifyContent:
        "space-between",

      alignItems: "center",

      gap: "10px",

      fontSize: "14px",

      fontWeight: 800,
    },

    billingPrice: {
      marginTop: "12px",

      color: colors.accent,

      fontSize: "28px",

      fontWeight: 800,
    },

    billingPeriod: {
      marginTop: "3px",

      color:
        colors.secondaryText,

      fontSize: "12px",
    },

    billingDescription: {
      marginTop: "8px",

      color:
        colors.mutedText,

      fontSize: "11px",
    },

    discountBadge: {
      padding: "5px 8px",

      borderRadius: "20px",

      background:
        "rgba(34,197,94,0.12)",

      color: "#22c55e",

      fontSize: "9px",

      fontWeight: 800,
    },

    saving: {
      marginTop: "8px",

      color: "#22c55e",

      fontSize: "11px",

      fontWeight: 700,
    },

    /* TARIFS */

    pricingSection: {
      maxWidth: "900px",

      margin: "0 auto",

      padding:
        "10px 25px 100px",

      display: "grid",

      gridTemplateColumns:
        "repeat(2, minmax(0, 1fr))",

      gap: "20px",
    },

    freeCard: {
      padding: "32px",

      borderRadius: "26px",

      background:
        colors.card,

      border:
        `1px solid ${colors.border}`,
    },

    premiumCard: {
      position: "relative",

      padding: "32px",

      borderRadius: "26px",

      background:
        colors.cardStrong,

      border:
        `1px solid ${colors.accent}70`,

      boxShadow:
        `0 25px 80px ${colors.accent}18`,
    },

    recommended: {
      position: "absolute",

      top: "-13px",
      right: "25px",

      padding: "7px 12px",

      borderRadius: "20px",

      background:
        colors.accent,

      color: "#ffffff",

      fontSize: "10px",

      fontWeight: 800,
    },

    planLabel: {
      color:
        colors.mutedText,

      fontSize: "11px",

      fontWeight: 700,

      letterSpacing: "1.2px",
    },

    premiumLabel: {
      color: colors.accent,

      fontSize: "11px",

      fontWeight: 700,

      letterSpacing: "1.2px",
    },

    planTitle: {
      margin:
        "10px 0 20px",

      fontSize: "25px",
    },

    mainPrice: {
      fontSize: "48px",

      fontWeight: 800,
    },

    mainPeriod: {
      marginLeft: "7px",

      color:
        colors.secondaryText,

      fontSize: "14px",
    },

    priceLine: {
      display: "flex",

      alignItems: "flex-end",

      gap: "8px",
    },

    premiumPrice: {
      color: colors.accent,

      fontSize: "48px",

      fontWeight: 800,

      letterSpacing: "-2px",
    },

    premiumPeriod: {
      paddingBottom: "8px",

      color:
        colors.secondaryText,

      fontSize: "14px",
    },

    billingInfo: {
      margin: "8px 0 0",

      color:
        colors.mutedText,

      fontSize: "12px",
    },

    flexibleText: {
      marginTop: "8px",

      color: colors.accent,

      fontSize: "11px",

      fontWeight: 700,
    },

    yearlySaving: {
      marginTop: "8px",

      color: "#22c55e",

      fontSize: "12px",

      fontWeight: 700,
    },

    monthEquivalent: {
      marginTop: "5px",

      color:
        colors.secondaryText,

      fontSize: "11px",
    },

    divider: {
      height: "1px",

      margin: "25px 0",

      background:
        colors.border,
    },

    features: {
      minHeight: "245px",

      display: "flex",

      flexDirection:
        "column",

      gap: "15px",

      color:
        colors.secondaryText,
    },

    freeButton: {
      width: "100%",

      marginTop: "25px",

      padding: "15px",

      borderRadius: "14px",

      background:
        colors.card,

      border:
        `1px solid ${colors.border}`,

      color: colors.text,

      fontWeight: 700,

      cursor: "pointer",
    },

    premiumButton: {
      width: "100%",

      marginTop: "25px",

      padding: "15px",

      border: "none",

      borderRadius: "14px",

      background: `linear-gradient(
        135deg,
        ${colors.accent},
        ${colors.accent2}
      )`,

      color: "#ffffff",

      fontWeight: 800,

      boxShadow:
        `0 15px 40px ${colors.accent}25`,
    },

    cancelText: {
      marginTop: "12px",

      textAlign: "center",

      color:
        colors.mutedText,

      fontSize: "10px",
    },

    loginText: {
      marginTop: "7px",

      textAlign: "center",

      color: colors.accent,

      fontSize: "10px",
    },

    /* COMPARAISON */

    comparisonSection: {
      maxWidth: "850px",

      margin: "0 auto",

      padding:
        "0 25px 100px",
    },

    sectionLabel: {
      color: colors.accent,

      fontSize: "11px",

      fontWeight: 700,

      letterSpacing: "1.2px",
    },

    sectionTitle: {
      margin:
        "10px 0 30px",

      fontSize: "32px",

      letterSpacing: "-1px",
    },

    comparisonGrid: {
      display: "grid",

      gridTemplateColumns:
        "repeat(2, minmax(0, 1fr))",

      gap: "16px",
    },

    comparisonCard: {
      padding: "25px",

      borderRadius: "20px",

      background:
        colors.card,

      border:
        `1px solid ${colors.border}`,
    },

    comparisonCardBest: {
      padding: "25px",

      borderRadius: "20px",

      background:
        colors.cardStrong,

      border:
        `1px solid ${colors.accent}60`,
    },

    bestBadge: {
      display: "inline-block",

      marginBottom: "15px",

      padding: "5px 9px",

      borderRadius: "20px",

      background:
        "rgba(34,197,94,0.12)",

      color: "#22c55e",

      fontSize: "9px",

      fontWeight: 800,
    },

    comparisonName: {
      fontSize: "15px",

      fontWeight: 800,
    },

    comparisonPrice: {
      marginTop: "12px",

      color: colors.accent,

      fontSize: "36px",

      fontWeight: 800,
    },

    comparisonPeriod: {
      color:
        colors.secondaryText,

      fontSize: "12px",
    },

    comparisonText: {
      minHeight: "45px",

      color:
        colors.mutedText,

      fontSize: "12px",

      lineHeight: 1.6,
    },

    comparisonButton: {
      width: "100%",

      padding: "12px",

      borderRadius: "12px",

      background:
        colors.card,

      border:
        `1px solid ${colors.border}`,

      color: colors.text,

      fontWeight: 700,

      cursor: "pointer",
    },

    comparisonButtonBest: {
      width: "100%",

      padding: "12px",

      borderRadius: "12px",

      background:
        colors.accent,

      border: "none",

      color: "#ffffff",

      fontWeight: 700,

      cursor: "pointer",
    },

    /* AVANTAGES */

    advantages: {
      maxWidth: "1000px",

      margin: "0 auto",

      padding:
        "0 25px 100px",
    },

    advantagesGrid: {
      display: "grid",

      gridTemplateColumns:
        "repeat(3, minmax(0, 1fr))",

      gap: "16px",
    },

    advantageCard: {
      padding: "25px",

      borderRadius: "20px",

      background:
        colors.card,

      border:
        `1px solid ${colors.border}`,
    },

    advantageNumber: {
      marginBottom: "25px",

      color: colors.accent,

      fontSize: "12px",

      fontWeight: 700,
    },

    advantageTitle: {
      margin: "0 0 10px",

      fontSize: "18px",
    },

    advantageDescription: {
      margin: 0,

      color:
        colors.secondaryText,

      fontSize: "13px",

      lineHeight: 1.7,
    },

    footer: {
      padding: "30px",

      textAlign: "center",

      borderTop:
        `1px solid ${colors.border}`,

      color:
        colors.mutedText,

      fontSize: "12px",
    },
  };
}