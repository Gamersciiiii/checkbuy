"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";

import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

/* =========================
   TYPES
========================= */

type HistoryItem = {
  id: string;
  domain: string;
  url: string;
  score: number;
  level: string | null;
  created_at: string;
};

type ReviewItem = {
  id: string;
  domain: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
};

type SubscriptionInfo = {
  status: string;
  billing: "monthly" | "yearly" | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
};

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

/* =========================
   THÈMES
========================= */

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

/* =========================
   PAGE
========================= */

export default function AccountPage() {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [portalLoading, setPortalLoading] =
    useState(false);

  const [history, setHistory] =
    useState<HistoryItem[]>([]);

  const [reviews, setReviews] =
    useState<ReviewItem[]>([]);

  const [
    subscriptionInfo,
    setSubscriptionInfo,
  ] =
    useState<SubscriptionInfo | null>(
      null
    );

  const [historyError, setHistoryError] =
    useState("");

  const [reviewsError, setReviewsError] =
    useState("");

  const [theme, setTheme] =
    useState<ThemeName>("dark");

  const colors = themes[theme];
  const styles = createStyles(colors);

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
     CHARGEMENT DU COMPTE
  ========================= */

  useEffect(() => {
    async function loadAccount() {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        router.push("/login");
        return;
      }

      setEmail(
        user.email ?? ""
      );

      /* HISTORIQUE */

      const {
        data: historyData,
        error: historyQueryError,
      } =
        await supabase
          .from("analysis_history")
          .select(
            "id, domain, url, score, level, created_at"
          )
          .eq(
            "user_id",
            user.id
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          )
          .limit(30);

      if (historyQueryError) {
        console.error(
          "Erreur historique :",
          historyQueryError
        );

        setHistoryError(
          "Impossible de charger l'historique."
        );
      } else {
        setHistory(
          (historyData ??
            []) as HistoryItem[]
        );
      }

      /* COMMENTAIRES */

      const {
        data: reviewsData,
        error: reviewsQueryError,
      } =
        await supabase
          .from("site_reviews")
          .select(
            "id, domain, rating, comment, created_at, updated_at"
          )
          .eq(
            "user_id",
            user.id
          )
          .order(
            "updated_at",
            {
              ascending: false,
            }
          )
          .limit(30);

      if (reviewsQueryError) {
        console.error(
          "Erreur commentaires :",
          reviewsQueryError
        );

        setReviewsError(
          "Impossible de charger tes commentaires."
        );
      } else {
        setReviews(
          (reviewsData ??
            []) as ReviewItem[]
        );
      }

      /* ABONNEMENT */

      const {
        data: premiumData,
        error: premiumError,
      } =
        await supabase
          .from("subscriptions")
          .select(
            "status, billing, stripe_customer_id, stripe_subscription_id, current_period_end"
          )
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();

      if (premiumError) {
        console.error(
          "Erreur abonnement :",
          premiumError
        );

        setSubscriptionInfo(
          null
        );
      } else {
        setSubscriptionInfo(
          premiumData as SubscriptionInfo | null
        );
      }

      setLoading(false);
    }

    loadAccount();
  }, [
    router,
    supabase,
  ]);

  /* =========================
     DÉCONNEXION
  ========================= */

  async function handleLogout() {
    await supabase.auth.signOut();

    router.push("/");
    router.refresh();
  }

  /* =========================
     PORTAIL STRIPE
  ========================= */

  async function manageSubscription() {
    if (portalLoading) {
      return;
    }

    setPortalLoading(true);

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
          "/api/stripe/portal",
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.error ||
            "Impossible d'ouvrir la gestion de l'abonnement."
        );

        return;
      }

      if (!data.url) {
        alert(
          "Stripe n'a pas retourné l'URL du portail."
        );

        return;
      }

      window.location.href =
        data.url;
    } catch (error) {
      console.error(
        "Erreur portail Stripe :",
        error
      );

      alert(
        "Impossible d'ouvrir la gestion de l'abonnement."
      );
    } finally {
      setPortalLoading(false);
    }
  }

  /* =========================
     PREMIUM
  ========================= */

  const isTrial =
    subscriptionInfo?.status ===
    "trialing";

  const isActive =
    subscriptionInfo?.status ===
    "active";

  const isPremium =
    isTrial || isActive;

  const billingText =
    subscriptionInfo?.billing ===
    "yearly"
      ? "49,99 € / an"
      : subscriptionInfo?.billing ===
          "monthly"
        ? "4,99 € / mois"
        : null;

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <main
        style={{
          ...styles.page,

          display: "flex",

          alignItems:
            "center",

          justifyContent:
            "center",
        }}
      >
        <div
          style={{
            color:
              colors.secondaryText,

            fontSize: "14px",
          }}
        >
          Chargement du compte...
        </div>
      </main>
    );
  }

  /* =========================
     INTERFACE
  ========================= */

  return (
    <main style={styles.page}>
      {/* HEADER */}

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
            styles.headerButtons
          }
        >
          <button
            style={
              styles.secondaryButton
            }
            onClick={() =>
              router.push("/")
            }
          >
            ← Accueil
          </button>

          <button
            style={
              styles.logoutButton
            }
            onClick={
              handleLogout
            }
          >
            Se déconnecter
          </button>
        </div>
      </header>

      {/* TITRE */}

      <section style={styles.hero}>
        <div
          style={
            styles.sectionMiniLabel
          }
        >
          MON COMPTE
        </div>

        <h1
          style={styles.heroTitle}
        >
          Tableau de bord
        </h1>

        <p
          style={
            styles.heroText
          }
        >
          Gérez votre compte,
          votre abonnement et
          retrouvez vos activités
          CheckBuy.
        </p>
      </section>

      {/* PROFIL + ABONNEMENT */}

      <section
        style={
          styles.topGrid
        }
      >
        {/* PROFIL */}

        <div
          style={
            styles.profileCard
          }
        >
          <div
            style={
              styles.cardLabel
            }
          >
            PROFIL
          </div>

          <div
            style={
              styles.profileIcon
            }
          >
            {email
              .charAt(0)
              .toUpperCase()}
          </div>

          <h2
            style={
              styles.profileTitle
            }
          >
            Mon compte
          </h2>

          <div
            style={
              styles.emailText
            }
          >
            {email}
          </div>

          <div
            style={
              styles.connectedBadge
            }
          >
            <span
              style={
                styles.greenDot
              }
            />

            Connecté
          </div>
        </div>

        {/* ABONNEMENT */}

        <div
          style={
            isPremium
              ? styles.premiumPlanCard
              : styles.planCard
          }
        >
          <div
            style={
              isPremium
                ? styles.premiumCardLabel
                : styles.cardLabel
            }
          >
            ABONNEMENT
          </div>

          {isTrial ? (
            <>
              <div
                style={
                  styles.premiumBadge
                }
              >
                ESSAI PREMIUM
              </div>

              <h2
                style={
                  styles.planTitle
                }
              >
                Essai Premium actif
              </h2>

              <p
                style={
                  styles.planDescription
                }
              >
                Tu profites
                actuellement de
                CheckBuy Premium
                pendant ta période
                d&apos;essai gratuite.
              </p>

              {billingText && (
                <div
                  style={
                    styles.priceText
                  }
                >
                  Puis {billingText}
                </div>
              )}

              <button
                style={
                  styles.manageButton
                }
                onClick={
                  manageSubscription
                }
                disabled={
                  portalLoading
                }
              >
                {portalLoading
                  ? "Ouverture..."
                  : "Gérer mon abonnement"}
              </button>

              <div
                style={
                  styles.manageHint
                }
              >
                Tu peux notamment
                annuler ton abonnement
                depuis Stripe.
              </div>
            </>
          ) : isActive ? (
            <>
              <div
                style={
                  styles.premiumBadge
                }
              >
                PREMIUM
              </div>

              <h2
                style={
                  styles.planTitle
                }
              >
                Premium actif
              </h2>

              <p
                style={
                  styles.planDescription
                }
              >
                Ton abonnement
                CheckBuy Premium est
                actif.
              </p>

              {billingText && (
                <div
                  style={
                    styles.priceText
                  }
                >
                  {billingText}
                </div>
              )}

              <button
                style={
                  styles.manageButton
                }
                onClick={
                  manageSubscription
                }
                disabled={
                  portalLoading
                }
              >
                {portalLoading
                  ? "Ouverture..."
                  : "Gérer mon abonnement"}
              </button>

              <div
                style={
                  styles.manageHint
                }
              >
                Paiement, moyen de
                paiement et résiliation.
              </div>
            </>
          ) : (
            <>
              <div
                style={
                  styles.freeBadge
                }
              >
                GRATUIT
              </div>

              <h2
                style={
                  styles.planTitle
                }
              >
                CheckBuy Free
              </h2>

              <p
                style={
                  styles.planDescription
                }
              >
                Passe à Premium pour
                profiter des analyses
                illimitées, de
                l&apos;historique
                complet et de
                l&apos;expérience sans
                publicité.
              </p>

              <button
                style={
                  styles.premiumButton
                }
                onClick={() =>
                  router.push(
                    "/premium"
                  )
                }
              >
                Découvrir Premium
              </button>
            </>
          )}
        </div>
      </section>

      {/* STATISTIQUES */}

      <section
        style={
          styles.statsGrid
        }
      >
        <div
          style={
            styles.statCard
          }
        >
          <div
            style={
              styles.statValue
            }
          >
            {history.length}
          </div>

          <div
            style={
              styles.statLabel
            }
          >
            Analyses enregistrées
          </div>
        </div>

        <div
          style={
            styles.statCard
          }
        >
          <div
            style={
              styles.statValue
            }
          >
            {reviews.length}
          </div>

          <div
            style={
              styles.statLabel
            }
          >
            Commentaires publiés
          </div>
        </div>

        <div
          style={
            styles.statCard
          }
        >
          <div
            style={{
              ...styles.statValue,

              color:
                isPremium
                  ? "#22c55e"
                  : colors.text,
            }}
          >
            {isTrial
              ? "Essai"
              : isActive
                ? "Premium"
                : "Free"}
          </div>

          <div
            style={
              styles.statLabel
            }
          >
            Votre formule
          </div>
        </div>
      </section>

      {/* HISTORIQUE */}

      <section
        style={
          styles.bigCard
        }
      >
        <div
          style={
            styles.cardHeader
          }
        >
          <div>
            <div
              style={
                styles.sectionMiniLabel
              }
            >
              HISTORIQUE
            </div>

            <h2
              style={
                styles.sectionTitle
              }
            >
              Vos analyses
            </h2>
          </div>

          <div
            style={
              styles.countBadge
            }
          >
            {history.length}
          </div>
        </div>

        {historyError ? (
          <p
            style={
              styles.errorText
            }
          >
            {historyError}
          </p>
        ) : history.length ===
          0 ? (
          <div
            style={
              styles.emptyState
            }
          >
            <div
              style={
                styles.emptyTitle
              }
            >
              Aucune analyse
            </div>

            <p
              style={
                styles.emptyText
              }
            >
              Les sites analysés avec
              ton compte apparaîtront
              ici.
            </p>

            <button
              style={
                styles.smallButton
              }
              onClick={() =>
                router.push("/")
              }
            >
              Analyser un site
            </button>
          </div>
        ) : (
          <div
            style={
              styles.list
            }
          >
            {history.map(
              (item) => (
                <div
                  key={
                    item.id
                  }
                  style={
                    styles.historyRow
                  }
                >
                  <div
                    style={
                      styles.historyMain
                    }
                  >
                    <div
                      style={
                        styles.domain
                      }
                    >
                      {
                        item.domain
                      }
                    </div>

                    <div
                      style={
                        styles.date
                      }
                    >
                      {formatDate(
                        item.created_at
                      )}
                    </div>

                    <div
                      style={
                        styles.url
                      }
                    >
                      {item.url}
                    </div>
                  </div>

                  <div
                    style={
                      styles.scoreArea
                    }
                  >
                    <div
                      style={{
                        ...styles.score,

                        color:
                          scoreColor(
                            item.score
                          ),
                      }}
                    >
                      {
                        item.score
                      }
                    </div>

                    <div
                      style={
                        styles.scoreOutOf
                      }
                    >
                      /100
                    </div>

                    {item.level && (
                      <div
                        style={
                          styles.level
                        }
                      >
                        {
                          item.level
                        }
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* COMMENTAIRES */}

      <section
        style={
          styles.bigCard
        }
      >
        <div
          style={
            styles.cardHeader
          }
        >
          <div>
            <div
              style={
                styles.sectionMiniLabel
              }
            >
              COMMUNAUTÉ
            </div>

            <h2
              style={
                styles.sectionTitle
              }
            >
              Vos commentaires
            </h2>
          </div>

          <div
            style={
              styles.countBadge
            }
          >
            {reviews.length}
          </div>
        </div>

        {reviewsError ? (
          <p
            style={
              styles.errorText
            }
          >
            {reviewsError}
          </p>
        ) : reviews.length ===
          0 ? (
          <div
            style={
              styles.emptyState
            }
          >
            <div
              style={
                styles.emptyTitle
              }
            >
              Aucun commentaire
            </div>

            <p
              style={
                styles.emptyText
              }
            >
              Les avis que tu publies
              sur les sites apparaîtront
              ici.
            </p>
          </div>
        ) : (
          <div
            style={
              styles.list
            }
          >
            {reviews.map(
              (review) => (
                <div
                  key={
                    review.id
                  }
                  style={
                    styles.reviewRow
                  }
                >
                  <div
                    style={
                      styles.reviewTop
                    }
                  >
                    <div>
                      <div
                        style={
                          styles.domain
                        }
                      >
                        {
                          review.domain
                        }
                      </div>

                      <div
                        style={
                          styles.date
                        }
                      >
                        {formatDate(
                          review.updated_at ||
                            review.created_at
                        )}
                      </div>
                    </div>

                    <div
                      style={
                        styles.ratingNumber
                      }
                    >
                      {
                        review.rating
                      }
                      /5
                    </div>
                  </div>

                  <div
                    style={
                      styles.stars
                    }
                  >
                    <span>
                      {"★".repeat(
                        review.rating
                      )}
                    </span>

                    <span
                      style={{
                        opacity:
                          0.18,
                      }}
                    >
                      {"★".repeat(
                        5 -
                          review.rating
                      )}
                    </span>
                  </div>

                  <p
                    style={
                      styles.reviewText
                    }
                  >
                    {
                      review.comment
                    }
                  </p>
                </div>
              )
            )}
          </div>
        )}
      </section>

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
   OUTILS
========================= */

function formatDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(
    new Date(value)
  );
}

function scoreColor(
  score: number
) {
  if (score >= 80) {
    return "#22c55e";
  }

  if (score >= 65) {
    return "#f59e0b";
  }

  return "#ef4444";
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
        ${colors.background} 42%
      )`,

      color: colors.text,

      fontFamily:
        "Arial, Helvetica, sans-serif",

      paddingBottom:
        "40px",
    },

    header: {
      maxWidth: "1100px",

      minHeight: "80px",

      margin: "0 auto",

      padding:
        "0 25px",

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

      letterSpacing:
        "-1px",

      cursor: "pointer",
    },

    headerButtons: {
      display: "flex",

      gap: "10px",
    },

    secondaryButton: {
      padding:
        "10px 15px",

      borderRadius:
        "12px",

      border:
        `1px solid ${colors.border}`,

      background:
        colors.card,

      color:
        colors.text,

      cursor: "pointer",
    },

    logoutButton: {
      padding:
        "10px 15px",

      borderRadius:
        "12px",

      border:
        `1px solid ${colors.border}`,

      background:
        "transparent",

      color:
        colors.secondaryText,

      cursor: "pointer",
    },

    hero: {
      maxWidth:
        "1100px",

      margin:
        "0 auto",

      padding:
        "70px 25px 45px",
    },

    sectionMiniLabel: {
      color:
        colors.accent,

      fontSize:
        "11px",

      fontWeight:
        800,

      letterSpacing:
        "1.3px",
    },

    heroTitle: {
      margin:
        "10px 0",

      fontSize:
        "clamp(38px, 6vw, 58px)",

      letterSpacing:
        "-2px",
    },

    heroText: {
      margin: 0,

      maxWidth:
        "600px",

      color:
        colors.secondaryText,

      fontSize:
        "15px",

      lineHeight:
        1.7,
    },

    topGrid: {
      maxWidth:
        "1100px",

      margin:
        "0 auto",

      padding:
        "0 25px 20px",

      display:
        "grid",

      gridTemplateColumns:
        "repeat(2, minmax(0, 1fr))",

      gap:
        "18px",
    },

    profileCard: {
      minHeight:
        "290px",

      padding:
        "28px",

      borderRadius:
        "24px",

      background:
        colors.card,

      border:
        `1px solid ${colors.border}`,
    },

    planCard: {
      minHeight:
        "290px",

      padding:
        "28px",

      borderRadius:
        "24px",

      background:
        colors.card,

      border:
        `1px solid ${colors.border}`,
    },

    premiumPlanCard: {
      minHeight:
        "290px",

      padding:
        "28px",

      borderRadius:
        "24px",

      background:
        colors.cardStrong,

      border:
        `1px solid ${colors.accent}60`,

      boxShadow:
        `0 20px 60px ${colors.accent}15`,
    },

    cardLabel: {
      color:
        colors.mutedText,

      fontSize:
        "10px",

      fontWeight:
        800,

      letterSpacing:
        "1.2px",
    },

    premiumCardLabel: {
      color:
        colors.accent,

      fontSize:
        "10px",

      fontWeight:
        800,

      letterSpacing:
        "1.2px",
    },

    profileIcon: {
      width:
        "55px",

      height:
        "55px",

      marginTop:
        "25px",

      borderRadius:
        "50%",

      display:
        "flex",

      alignItems:
        "center",

      justifyContent:
        "center",

      background:
        colors.accentSoft,

      color:
        colors.accent,

      fontSize:
        "22px",

      fontWeight:
        800,
    },

    profileTitle: {
      margin:
        "18px 0 8px",

      fontSize:
        "22px",
    },

    emailText: {
      color:
        colors.secondaryText,

      fontSize:
        "13px",

      wordBreak:
        "break-all",
    },

    connectedBadge: {
      display:
        "inline-flex",

      alignItems:
        "center",

      gap:
        "7px",

      marginTop:
        "20px",

      padding:
        "7px 10px",

      borderRadius:
        "20px",

      background:
        "rgba(34,197,94,0.08)",

      color:
        "#22c55e",

      fontSize:
        "10px",

      fontWeight:
        700,
    },

    greenDot: {
      width:
        "7px",

      height:
        "7px",

      borderRadius:
        "50%",

      background:
        "#22c55e",
    },

    premiumBadge: {
      display:
        "inline-block",

      marginTop:
        "20px",

      padding:
        "7px 10px",

      borderRadius:
        "20px",

      background:
        colors.accentSoft,

      color:
        colors.accent,

      fontSize:
        "10px",

      fontWeight:
        800,
    },

    freeBadge: {
      display:
        "inline-block",

      marginTop:
        "20px",

      padding:
        "7px 10px",

      borderRadius:
        "20px",

      background:
        colors.cardStrong,

      color:
        colors.secondaryText,

      fontSize:
        "10px",

      fontWeight:
        800,
    },

    planTitle: {
      margin:
        "15px 0 10px",

      fontSize:
        "24px",
    },

    planDescription: {
      margin: 0,

      color:
        colors.secondaryText,

      fontSize:
        "13px",

      lineHeight:
        1.7,
    },

    priceText: {
      marginTop:
        "13px",

      color:
        "#22c55e",

      fontWeight:
        700,

      fontSize:
        "13px",
    },

    manageButton: {
      width:
        "100%",

      marginTop:
        "22px",

      padding:
        "13px",

      borderRadius:
        "13px",

      border:
        `1px solid ${colors.accent}50`,

      background:
        colors.accentSoft,

      color:
        colors.accent,

      fontWeight:
        800,

      cursor:
        "pointer",
    },

    manageHint: {
      marginTop:
        "9px",

      color:
        colors.mutedText,

      textAlign:
        "center",

      fontSize:
        "10px",
    },

    premiumButton: {
      width:
        "100%",

      marginTop:
        "25px",

      padding:
        "14px",

      borderRadius:
        "13px",

      border:
        "none",

      background: `linear-gradient(
        135deg,
        ${colors.accent},
        ${colors.accent2}
      )`,

      color:
        "#ffffff",

      fontWeight:
        800,

      cursor:
        "pointer",
    },

    statsGrid: {
      maxWidth:
        "1100px",

      margin:
        "0 auto",

      padding:
        "0 25px 20px",

      display:
        "grid",

      gridTemplateColumns:
        "repeat(3, minmax(0, 1fr))",

      gap:
        "14px",
    },

    statCard: {
      padding:
        "22px",

      borderRadius:
        "18px",

      background:
        colors.card,

      border:
        `1px solid ${colors.border}`,
    },

    statValue: {
      fontSize:
        "28px",

      fontWeight:
        800,
    },

    statLabel: {
      marginTop:
        "7px",

      color:
        colors.secondaryText,

      fontSize:
        "11px",
    },

    bigCard: {
      maxWidth:
        "1050px",

      margin:
        "0 auto 20px",

      padding:
        "28px",

      borderRadius:
        "24px",

      background:
        colors.card,

      border:
        `1px solid ${colors.border}`,
    },

    cardHeader: {
      display:
        "flex",

      justifyContent:
        "space-between",

      alignItems:
        "center",

      gap:
        "15px",

      marginBottom:
        "25px",
    },

    sectionTitle: {
      margin:
        "8px 0 0",

      fontSize:
        "25px",
    },

    countBadge: {
      minWidth:
        "38px",

      height:
        "38px",

      padding:
        "0 10px",

      borderRadius:
        "12px",

      display:
        "flex",

      alignItems:
        "center",

      justifyContent:
        "center",

      background:
        colors.accentSoft,

      color:
        colors.accent,

      fontSize:
        "12px",

      fontWeight:
        800,
    },

    list: {
      display:
        "flex",

      flexDirection:
        "column",

      gap:
        "10px",
    },

    historyRow: {
      display:
        "flex",

      justifyContent:
        "space-between",

      alignItems:
        "center",

      gap:
        "20px",

      padding:
        "18px",

      borderRadius:
        "16px",

      background:
        colors.cardStrong,

      border:
        `1px solid ${colors.border}`,
    },

    historyMain: {
      minWidth: 0,

      flex: 1,
    },

    domain: {
      color:
        colors.text,

      fontSize:
        "14px",

      fontWeight:
        800,
    },

    date: {
      marginTop:
        "4px",

      color:
        colors.mutedText,

      fontSize:
        "10px",
    },

    url: {
      marginTop:
        "8px",

      color:
        colors.secondaryText,

      fontSize:
        "11px",

      whiteSpace:
        "nowrap",

      overflow:
        "hidden",

      textOverflow:
        "ellipsis",
    },

    scoreArea: {
      textAlign:
        "right",

      flexShrink:
        0,
    },

    score: {
      display:
        "inline-block",

      fontSize:
        "27px",

      fontWeight:
        900,
    },

    scoreOutOf: {
      display:
        "inline-block",

      marginLeft:
        "3px",

      color:
        colors.mutedText,

      fontSize:
        "10px",
    },

    level: {
      marginTop:
        "4px",

      color:
        colors.secondaryText,

      fontSize:
        "10px",
    },

    reviewRow: {
      padding:
        "18px",

      borderRadius:
        "16px",

      background:
        colors.cardStrong,

      border:
        `1px solid ${colors.border}`,
    },

    reviewTop: {
      display:
        "flex",

      justifyContent:
        "space-between",

      alignItems:
        "flex-start",

      gap:
        "20px",
    },

    ratingNumber: {
      color:
        colors.secondaryText,

      fontSize:
        "11px",

      fontWeight:
        700,
    },

    stars: {
      marginTop:
        "13px",

      color:
        "#fbbf24",

      fontSize:
        "15px",

      letterSpacing:
        "1px",
    },

    reviewText: {
      margin:
        "12px 0 0",

      color:
        colors.secondaryText,

      fontSize:
        "13px",

      lineHeight:
        1.7,
    },

    emptyState: {
      padding:
        "35px 20px",

      borderRadius:
        "16px",

      textAlign:
        "center",

      background:
        colors.cardStrong,

      border:
        `1px solid ${colors.border}`,
    },

    emptyTitle: {
      fontSize:
        "16px",

      fontWeight:
        800,
    },

    emptyText: {
      margin:
        "8px auto 18px",

      maxWidth:
        "400px",

      color:
        colors.secondaryText,

      fontSize:
        "12px",

      lineHeight:
        1.6,
    },

    smallButton: {
      padding:
        "11px 15px",

      borderRadius:
        "11px",

      border:
        "none",

      background:
        colors.accent,

      color:
        "#ffffff",

      fontWeight:
        700,

      cursor:
        "pointer",
    },

    errorText: {
      color:
        "#ef4444",

      fontSize:
        "12px",
    },

    footer: {
      maxWidth:
        "1100px",

      margin:
        "50px auto 0",

      padding:
        "30px 25px",

      textAlign:
        "center",

      borderTop:
        `1px solid ${colors.border}`,

      color:
        colors.mutedText,

      fontSize:
        "11px",
    },
  };
}