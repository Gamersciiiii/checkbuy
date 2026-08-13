"use client";

import {
  CSSProperties,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import AdBanner from "./components/AdBanner";

type CheckStatus =
  | "good"
  | "warning"
  | "bad";

type Check = {
  title: string;
  description: string;
  status: CheckStatus;
};

type Usage = {
  limit?: number | null;
  used?: number;
  remaining?: number | null;
  isPremium?: boolean;
};

type Analysis = {
  score: number;
  level: string;
  domain: string;
  finalUrl?: string;
  statusCode?: number;
  checks: Check[];
  usage?: Usage;
};

type Review = {
  id?: string;
  user_id?: string;
  domain: string;
  rating: number;
  comment: string;
  created_at?: string;
  updated_at?: string;
};

type ThemeName =
  | "chaud"
  | "sombre"
  | "clair"
  | "froid";

type CookieChoice =
  | "accepted"
  | "refused"
  | null;

type Colors = {
  background: string;
  backgroundSecondary: string;
  card: string;
  cardStrong: string;
  text: string;
  muted: string;
  subtle: string;
  border: string;
  accent: string;
  accentSoft: string;
  buttonText: string;
};

const THEMES: Record<
  ThemeName,
  Colors
> = {
  chaud: {
    background: "#100d0b",
    backgroundSecondary:
      "#17110e",
    card: "#18120f",
    cardStrong: "#201713",
    text: "#fff8f4",
    muted: "#aa9a91",
    subtle: "#756961",
    border:
      "rgba(255,125,66,0.16)",
    accent: "#ff7d42",
    accentSoft:
      "rgba(255,125,66,0.10)",
    buttonText: "#130c08",
  },

  sombre: {
    background: "#090b0f",
    backgroundSecondary:
      "#0e1117",
    card: "#11151c",
    cardStrong: "#161b24",
    text: "#f8fafc",
    muted: "#94a3b8",
    subtle: "#64748b",
    border:
      "rgba(255,255,255,0.08)",
    accent: "#f1f5f9",
    accentSoft:
      "rgba(255,255,255,0.07)",
    buttonText: "#090b0f",
  },

  clair: {
    background: "#f7f7f5",
    backgroundSecondary:
      "#ffffff",
    card: "#ffffff",
    cardStrong: "#f5f5f2",
    text: "#171717",
    muted: "#666666",
    subtle: "#8b8b8b",
    border:
      "rgba(0,0,0,0.09)",
    accent: "#111111",
    accentSoft:
      "rgba(0,0,0,0.05)",
    buttonText: "#ffffff",
  },

  froid: {
    background: "#080d14",
    backgroundSecondary:
      "#0c131d",
    card: "#101923",
    cardStrong: "#14202c",
    text: "#f4f9ff",
    muted: "#8fa4b8",
    subtle: "#667b90",
    border:
      "rgba(91,167,255,0.15)",
    accent: "#60a5fa",
    accentSoft:
      "rgba(96,165,250,0.10)",
    buttonText: "#07101a",
  },
};

export default function Home() {
  const router = useRouter();

  const supabase =
    useMemo(
      () => createClient(),
      []
    );

  const [url, setUrl] =
    useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    analysis,
    setAnalysis,
  ] =
    useState<Analysis | null>(
      null
    );

  const [error, setError] =
    useState("");

  const [
    sessionLoading,
    setSessionLoading,
  ] = useState(true);

  const [user, setUser] =
    useState<any>(null);

  const [
    isPremium,
    setIsPremium,
  ] = useState(false);

  const [
    theme,
    setTheme,
  ] =
    useState<ThemeName>(
      "chaud"
    );

  const [
    showThemes,
    setShowThemes,
  ] = useState(false);

  const [
    reviews,
    setReviews,
  ] =
    useState<Review[]>([]);

  const [
    reviewsLoading,
    setReviewsLoading,
  ] = useState(false);

  const [
    reviewRating,
    setReviewRating,
  ] = useState(5);

  const [
    reviewComment,
    setReviewComment,
  ] = useState("");

  const [
    reviewMessage,
    setReviewMessage,
  ] = useState("");

  const [
    reviewSaving,
    setReviewSaving,
  ] = useState(false);

  const [
    cookieChoice,
    setCookieChoice,
  ] =
    useState<CookieChoice>(
      null
    );

  const colors =
    THEMES[theme];

  const styles =
    useMemo(
      () =>
        getStyles(colors),
      [colors]
    );

  /* ==========================================
     INITIALISATION
  ========================================== */

  useEffect(() => {
    const savedTheme =
      localStorage.getItem(
        "checkbuy-theme"
      ) as ThemeName | null;

    if (
      savedTheme &&
      THEMES[savedTheme]
    ) {
      setTheme(savedTheme);
    }

    const savedCookies =
      localStorage.getItem(
        "checkbuy-cookie-choice"
      );

    if (
      savedCookies ===
        "accepted" ||
      savedCookies ===
        "refused"
    ) {
      setCookieChoice(
        savedCookies
      );
    }
  }, []);

  /* ==========================================
     AUTH
  ========================================== */

  useEffect(() => {
    async function initAuth() {
      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();

      setUser(
        session?.user ?? null
      );

      if (session?.user) {
        await loadPremium(
          session.user.id
        );
      } else {
        setIsPremium(false);
      }

      setSessionLoading(
        false
      );
    }

    initAuth();

    const {
      data: listener,
    } =
      supabase.auth.onAuthStateChange(
        async (
          _event,
          session
        ) => {
          setUser(
            session?.user ??
              null
          );

          if (
            session?.user
          ) {
            await loadPremium(
              session.user.id
            );
          } else {
            setIsPremium(
              false
            );
          }
        }
      );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function loadPremium(
    userId: string
  ) {
    try {
      const {
        data,
        error,
      } = await supabase
        .from(
          "subscriptions"
        )
        .select("status")
        .eq(
          "user_id",
          userId
        )
        .maybeSingle();

      if (error) {
        console.error(
          "Erreur Premium :",
          error
        );

        setIsPremium(
          false
        );
        return;
      }

      setIsPremium(
        data?.status ===
          "active" ||
          data?.status ===
            "trialing"
      );
    } catch (err) {
      console.error(err);
      setIsPremium(false);
    }
  }

  /* ==========================================
     ANALYSE
  ========================================== */

  async function analyzeSite() {
    if (!url.trim()) {
      setError(
        "Entre l'adresse du site à vérifier."
      );
      return;
    }

    setError("");
    setAnalysis(null);
    setReviews([]);
    setReviewMessage("");
    setLoading(true);

    try {
      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();

      if (!session) {
        setError(
          "Connecte-toi pour analyser un site."
        );

        return;
      }

      const response =
        await fetch(
          "/api/analyze",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body: JSON.stringify(
              {
                url: url.trim(),
              }
            ),
          }
        );

      const text =
        await response.text();

      let data: any;

      try {
        data =
          JSON.parse(text);
      } catch {
        throw new Error(
          `Réponse invalide du serveur (HTTP ${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Impossible d'analyser ce site."
        );
      }

      setAnalysis(data);

      if (data.domain) {
        await loadReviews(
          data.domain
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'analyser ce site."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ==========================================
     AVIS
  ========================================== */

  async function loadReviews(
    domain: string
  ) {
    setReviewsLoading(
      true
    );

    try {
      const {
        data,
        error,
      } = await supabase
        .from("site_reviews")
        .select(
          "id,user_id,domain,rating,comment,created_at,updated_at"
        )
        .eq(
          "domain",
          domain
        )
        .order(
          "updated_at",
          {
            ascending: false,
          }
        );

      if (error) {
        console.error(
          "Erreur avis :",
          error
        );
        return;
      }

      setReviews(
        data ?? []
      );

      if (user) {
        const ownReview =
          (
            data ?? []
          ).find(
            (review) =>
              review.user_id ===
              user.id
          );

        if (ownReview) {
          setReviewRating(
            ownReview.rating
          );

          setReviewComment(
            ownReview.comment ??
              ""
          );
        } else {
          setReviewRating(5);
          setReviewComment(
            ""
          );
        }
      }
    } finally {
      setReviewsLoading(
        false
      );
    }
  }

  async function saveReview() {
    if (!analysis) {
      return;
    }

    if (!user) {
      router.push(
        "/login"
      );
      return;
    }

    if (
      !reviewComment.trim()
    ) {
      setReviewMessage(
        "Écris un commentaire avant de publier."
      );
      return;
    }

    setReviewSaving(true);
    setReviewMessage("");

    try {
      const {
        error,
      } = await supabase
        .from(
          "site_reviews"
        )
        .upsert(
          {
            user_id:
              user.id,

            domain:
              analysis.domain,

            rating:
              reviewRating,

            comment:
              reviewComment.trim(),

            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              "user_id,domain",
          }
        );

      if (error) {
        throw error;
      }

      setReviewMessage(
        "Ton avis a été enregistré."
      );

      await loadReviews(
        analysis.domain
      );
    } catch (err) {
      console.error(err);

      setReviewMessage(
        "Impossible d'enregistrer ton avis."
      );
    } finally {
      setReviewSaving(
        false
      );
    }
  }

  /* ==========================================
     THÈMES
  ========================================== */

  function selectTheme(
    nextTheme: ThemeName
  ) {
    setTheme(nextTheme);

    localStorage.setItem(
      "checkbuy-theme",
      nextTheme
    );

    setShowThemes(
      false
    );
  }

  /* ==========================================
     COOKIES
  ========================================== */

  function chooseCookies(
    choice:
      | "accepted"
      | "refused"
  ) {
    setCookieChoice(
      choice
    );

    localStorage.setItem(
      "checkbuy-cookie-choice",
      choice
    );
  }

  /* ==========================================
     SCORE
  ========================================== */

  function getScoreColor(
    score: number
  ) {
    if (score >= 90)
      return "#22c55e";

    if (score >= 70)
      return "#f59e0b";

    return "#ef4444";
  }

  function getScoreText(
    score: number
  ) {
    if (score >= 90)
      return "Excellent";

    if (score >= 80)
      return "Bon";

    if (score >= 70)
      return "À vérifier";

    if (score >= 50)
      return "Prudence";

    return "Risque élevé";
  }

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (
              total,
              review
            ) =>
              total +
              review.rating,
            0
          ) /
          reviews.length
        ).toFixed(1)
      : null;

  return (
    <main
      style={
        styles.page
      }
    >
      {/* =====================================
          HEADER
      ====================================== */}

      <header
        style={
          styles.header
        }
      >
        <button
          onClick={() =>
            router.push("/")
          }
          style={
            styles.logoButton
          }
        >
          <span
            style={
              styles.logoCheck
            }
          >
            Check
          </span>

          <span
            style={{
              ...styles.logoBuy,
              color:
                colors.accent,
            }}
          >
            Buy
          </span>
        </button>

        <div
          style={
            styles.headerActions
          }
        >
          <button
            style={
              styles.secondaryButton
            }
            onClick={() =>
              router.push(
                "/premium"
              )
            }
          >
            {isPremium
              ? "Premium ✓"
              : "Premium"}
          </button>

          <div
            style={
              styles.themeWrapper
            }
          >
            <button
              style={
                styles.secondaryButton
              }
              onClick={() =>
                setShowThemes(
                  !showThemes
                )
              }
            >
              Apparence
            </button>

            {showThemes && (
              <div
                style={
                  styles.themeMenu
                }
              >
                <ThemeButton
                  label="Chaud"
                  active={
                    theme ===
                    "chaud"
                  }
                  onClick={() =>
                    selectTheme(
                      "chaud"
                    )
                  }
                  colors={
                    colors
                  }
                />

                <ThemeButton
                  label="Sombre"
                  active={
                    theme ===
                    "sombre"
                  }
                  onClick={() =>
                    selectTheme(
                      "sombre"
                    )
                  }
                  colors={
                    colors
                  }
                />

                <ThemeButton
                  label="Clair"
                  active={
                    theme ===
                    "clair"
                  }
                  onClick={() =>
                    selectTheme(
                      "clair"
                    )
                  }
                  colors={
                    colors
                  }
                />

                <ThemeButton
                  label="Froid"
                  active={
                    theme ===
                    "froid"
                  }
                  onClick={() =>
                    selectTheme(
                      "froid"
                    )
                  }
                  colors={
                    colors
                  }
                />
              </div>
            )}
          </div>

          {!sessionLoading &&
            (user ? (
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
            ) : (
              <button
                style={
                  styles.accountButton
                }
                onClick={() =>
                  router.push(
                    "/login"
                  )
                }
              >
                Se connecter
              </button>
            ))}
        </div>
      </header>

      {/* =====================================
          HERO
      ====================================== */}

      <section
        style={
          styles.hero
        }
      >
        <div
          style={
            styles.badge
          }
        >
          <span
            style={{
              ...styles.badgeDot,
              background:
                colors.accent,
            }}
          />

          Vérifiez avant
          d&apos;acheter
        </div>

        <h1
          style={
            styles.title
          }
        >
          Achetez en toute
          <br />

          <span
            style={{
              ...styles.highlight,
              color:
                colors.accent,
              WebkitTextFillColor:
                colors.accent,
            }}
          >
            confiance.
          </span>
        </h1>

        <p
          style={
            styles.subtitle
          }
        >
          Analysez un site
          avant votre achat et
          détectez les premiers
          signes de risque en
          quelques secondes.
        </p>

        {/* RECHERCHE */}

        <div
          style={
            styles.searchContainer
          }
        >
          <input
            value={url}
            onChange={(e) =>
              setUrl(
                e.target.value
              )
            }
            onKeyDown={(
              e
            ) => {
              if (
                e.key ===
                "Enter"
              ) {
                analyzeSite();
              }
            }}
            placeholder="https://exemple.com"
            style={
              styles.input
            }
          />

          <button
            onClick={
              analyzeSite
            }
            disabled={
              loading
            }
            style={{
              ...styles.checkButton,

              opacity:
                loading
                  ? 0.65
                  : 1,

              cursor:
                loading
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {loading
              ? "Analyse..."
              : "Vérifier"}
          </button>
        </div>

        {/* QUOTA */}

        {user &&
          !isPremium &&
          analysis?.usage &&
          typeof analysis
            .usage
            .remaining ===
            "number" && (
            <div
              style={
                styles.quota
              }
            >
              {
                analysis
                  .usage
                  .remaining
              }{" "}
              analyse
              {analysis
                .usage
                .remaining !==
              1
                ? "s"
                : ""}{" "}
              gratuite
              {analysis
                .usage
                .remaining !==
              1
                ? "s"
                : ""}{" "}
              restante
              {analysis
                .usage
                .remaining !==
              1
                ? "s"
                : ""}{" "}
              sur les dernières
              24 h.
            </div>
          )}

        {isPremium && (
          <div
            style={
              styles.quota
            }
          >
            Compte Premium —
            analyses
            illimitées.
          </div>
        )}

        {/* ERREUR */}

        {error && (
          <div
            style={
              styles.error
            }
          >
            {error}

            {!user &&
              error.includes(
                "Connecte"
              ) && (
                <button
                  style={
                    styles.errorButton
                  }
                  onClick={() =>
                    router.push(
                      "/login"
                    )
                  }
                >
                  Se connecter
                </button>
              )}
          </div>
        )}

        {/* CHARGEMENT */}

        {loading && (
          <div
            style={
              styles.loadingCard
            }
          >
            <div
              style={{
                ...styles.spinner,
                borderTopColor:
                  colors.accent,
              }}
            />

            <div>
              <div
                style={
                  styles.loadingTitle
                }
              >
                Analyse en
                cours
              </div>

              <div
                style={
                  styles.loadingText
                }
              >
                CheckBuy vérifie
                le site et ses
                caractéristiques
                techniques.
              </div>
            </div>
          </div>
        )}

        {/* =====================================
            RÉSULTAT
        ====================================== */}

        {analysis &&
          !loading && (
            <div
              style={
                styles.resultCard
              }
            >
              <div
                style={
                  styles.resultHeader
                }
              >
                <div>
                  <div
                    style={
                      styles.eyebrow
                    }
                  >
                    SITE ANALYSÉ
                  </div>

                  <div
                    style={
                      styles.domain
                    }
                  >
                    {
                      analysis.domain
                    }
                  </div>
                </div>

                <div
                  style={
                    styles.finished
                  }
                >
                  ✓ Analyse
                  terminée
                </div>
              </div>

              <div
                style={
                  styles.resultContent
                }
              >
                {/* SCORE */}

                <div
                  style={
                    styles.scoreSection
                  }
                >
                  <div
                    style={{
                      ...styles.scoreCircle,

                      background: `conic-gradient(
                        ${getScoreColor(
                          analysis.score
                        )}
                        ${
                          analysis.score *
                          3.6
                        }deg,
                        ${colors.cardStrong}
                        ${
                          analysis.score *
                          3.6
                        }deg
                      )`,
                    }}
                  >
                    <div
                      style={{
                        ...styles.scoreCircleInside,
                        background:
                          colors.card,
                      }}
                    >
                      <div
                        style={
                          styles.scoreLine
                        }
                      >
                        <span
                          style={{
                            ...styles.scoreNumber,

                            color:
                              getScoreColor(
                                analysis.score
                              ),
                          }}
                        >
                          {
                            analysis.score
                          }
                        </span>

                        <span
                          style={
                            styles.outOf
                          }
                        >
                          / 100
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      ...styles.scoreStatus,

                      color:
                        getScoreColor(
                          analysis.score
                        ),
                    }}
                  >
                    {getScoreText(
                      analysis.score
                    )}
                  </div>

                  <div
                    style={
                      styles.scoreDescription
                    }
                  >
                    Score CheckBuy
                  </div>
                </div>

                {/* CONTRÔLES */}

                <div
                  style={
                    styles.checkList
                  }
                >
                  {analysis.checks?.map(
                    (
                      check,
                      index
                    ) => (
                      <CheckItem
                        key={
                          index
                        }
                        check={
                          check
                        }
                        colors={
                          colors
                        }
                      />
                    )
                  )}
                </div>
              </div>

              <div
                style={
                  styles.disclaimer
                }
              >
                Le score CheckBuy
                est basé sur des
                critères
                techniques. Il
                constitue une aide
                avant achat et ne
                garantit pas qu&apos;un
                vendeur, un produit
                ou un site est
                fiable.
              </div>
            </div>
          )}

        {/* =====================================
            AVIS COMMUNAUTÉ
        ====================================== */}

        {analysis &&
          !loading && (
            <section
              style={
                styles.communityCard
              }
            >
              <div
                style={
                  styles.sectionHeadingRow
                }
              >
                <div>
                  <div
                    style={
                      styles.eyebrow
                    }
                  >
                    COMMUNAUTÉ
                  </div>

                  <h2
                    style={
                      styles.communityTitle
                    }
                  >
                    Avis sur{" "}
                    {
                      analysis.domain
                    }
                  </h2>
                </div>

                {averageRating && (
                  <div
                    style={
                      styles.averageRating
                    }
                  >
                    ★{" "}
                    {
                      averageRating
                    }{" "}
                    / 5
                  </div>
                )}
              </div>

              {user ? (
                <div
                  style={
                    styles.reviewForm
                  }
                >
                  <div
                    style={
                      styles.reviewFormTitle
                    }
                  >
                    Votre avis
                  </div>

                  <div
                    style={
                      styles.ratingRow
                    }
                  >
                    {[
                      1, 2, 3,
                      4, 5,
                    ].map(
                      (
                        rating
                      ) => (
                        <button
                          key={
                            rating
                          }
                          onClick={() =>
                            setReviewRating(
                              rating
                            )
                          }
                          style={{
                            ...styles.starButton,

                            color:
                              rating <=
                              reviewRating
                                ? "#f5b942"
                                : colors.subtle,
                          }}
                        >
                          ★
                        </button>
                      )
                    )}
                  </div>

                  <textarea
                    value={
                      reviewComment
                    }
                    onChange={(e) =>
                      setReviewComment(
                        e.target.value
                      )
                    }
                    placeholder="Partagez votre expérience avec ce site..."
                    maxLength={
                      1000
                    }
                    style={
                      styles.textarea
                    }
                  />

                  <div
                    style={
                      styles.reviewBottom
                    }
                  >
                    <span
                      style={
                        styles.characterCount
                      }
                    >
                      {
                        reviewComment.length
                      }
                      /1000
                    </span>

                    <button
                      onClick={
                        saveReview
                      }
                      disabled={
                        reviewSaving
                      }
                      style={{
                        ...styles.publishButton,

                        opacity:
                          reviewSaving
                            ? 0.65
                            : 1,
                      }}
                    >
                      {reviewSaving
                        ? "Enregistrement..."
                        : "Publier l'avis"}
                    </button>
                  </div>

                  {reviewMessage && (
                    <div
                      style={
                        styles.reviewMessage
                      }
                    >
                      {
                        reviewMessage
                      }
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={
                    styles.loginReview
                  }
                >
                  Connectez-vous
                  pour publier un
                  avis.

                  <button
                    onClick={() =>
                      router.push(
                        "/login"
                      )
                    }
                    style={
                      styles.smallActionButton
                    }
                  >
                    Se connecter
                  </button>
                </div>
              )}

              <div
                style={
                  styles.reviewList
                }
              >
                {reviewsLoading ? (
                  <div
                    style={
                      styles.emptyReviews
                    }
                  >
                    Chargement des
                    avis...
                  </div>
                ) : reviews.length ===
                  0 ? (
                  <div
                    style={
                      styles.emptyReviews
                    }
                  >
                    Aucun avis pour
                    le moment.
                  </div>
                ) : (
                  reviews.map(
                    (
                      review,
                      index
                    ) => (
                      <div
                        key={
                          review.id ??
                          index
                        }
                        style={
                          styles.reviewItem
                        }
                      >
                        <div
                          style={
                            styles.reviewItemTop
                          }
                        >
                          <span>
                            {Array.from(
                              {
                                length:
                                  5,
                              }
                            ).map(
                              (
                                _,
                                i
                              ) => (
                                <span
                                  key={
                                    i
                                  }
                                  style={{
                                    color:
                                      i <
                                      review.rating
                                        ? "#f5b942"
                                        : colors.subtle,
                                  }}
                                >
                                  ★
                                </span>
                              )
                            )}
                          </span>

                          <span
                            style={
                              styles.reviewDate
                            }
                          >
                            {review.updated_at
                              ? new Date(
                                  review.updated_at
                                ).toLocaleDateString(
                                  "fr-FR"
                                )
                              : ""}
                          </span>
                        </div>

                        <p
                          style={
                            styles.reviewComment
                          }
                        >
                          {
                            review.comment
                          }
                        </p>
                      </div>
                    )
                  )
                )}
              </div>
            </section>
          )}

        {/* =====================================
            CARTES PRINCIPALES
        ====================================== */}

        {!analysis &&
          !loading && (
            <div
              style={
                styles.features
              }
            >
              <Feature
                number="01"
                title="Score de confiance"
                text="Obtenez un score clair sur 100 pour évaluer rapidement les signaux techniques d'un site."
                colors={
                  colors
                }
              />

              <Feature
                number="02"
                title="Sécurité"
                text="CheckBuy vérifie plusieurs éléments techniques pour repérer les premiers signaux de risque."
                colors={
                  colors
                }
              />

              <Feature
                number="03"
                title="Avis communautaires"
                text="Consultez les expériences partagées par les utilisateurs de CheckBuy avant votre achat."
                colors={
                  colors
                }
              />
            </div>
          )}

        {/* PUB FREE */}

        {!isPremium &&
          cookieChoice ===
            "accepted" && (
            <div
              style={
                styles.adContainer
              }
            >
              <AdBanner />
            </div>
          )}
      </section>

      {/* =====================================
          COMMENT ÇA MARCHE
      ====================================== */}

      <section
        style={
          styles.wideSection
        }
      >
        <div
          style={
            styles.eyebrow
          }
        >
          SIMPLE ET RAPIDE
        </div>

        <h2
          style={
            styles.sectionTitle
          }
        >
          Comment ça marche ?
        </h2>

        <div
          style={
            styles.infoGrid
          }
        >
          <InfoCard
            number="1"
            title="Collez le lien"
            text="Copiez l'adresse du site sur lequel vous envisagez d'acheter."
            colors={
              colors
            }
          />

          <InfoCard
            number="2"
            title="Lancez l'analyse"
            text="CheckBuy examine différents signaux techniques du site."
            colors={
              colors
            }
          />

          <InfoCard
            number="3"
            title="Consultez le résultat"
            text="Vous obtenez un score sur 100, les contrôles détaillés et les avis de la communauté."
            colors={
              colors
            }
          />
        </div>
      </section>

      {/* =====================================
          POURQUOI CHECKBUY
      ====================================== */}

      <section
        style={
          styles.wideSection
        }
      >
        <div
          style={
            styles.eyebrow
          }
        >
          AVANT D&apos;ACHETER
        </div>

        <h2
          style={
            styles.sectionTitle
          }
        >
          Pourquoi CheckBuy ?
        </h2>

        <div
          style={
            styles.whyGrid
          }
        >
          <SimpleCard
            title="Un résultat compréhensible"
            text="Pas besoin d'être expert en cybersécurité : les contrôles sont présentés simplement."
            colors={
              colors
            }
          />

          <SimpleCard
            title="Une analyse indépendante"
            text="Le score repose sur les critères techniques analysés par CheckBuy."
            colors={
              colors
            }
          />

          <SimpleCard
            title="Une communauté"
            text="Les avis utilisateurs apportent un complément au résultat technique."
            colors={
              colors
            }
          />

          <SimpleCard
            title="Une aide avant achat"
            text="CheckBuy vous aide à repérer les points de vigilance avant de transmettre vos informations ou de payer."
            colors={
              colors
            }
          />
        </div>
      </section>

      {!isPremium &&
        cookieChoice ===
          "accepted" && (
          <div
            style={
              styles.secondAd
            }
          >
            <AdBanner />
          </div>
        )}

      {/* =====================================
          FAQ
      ====================================== */}

      <section
        style={
          styles.wideSection
        }
      >
        <div
          style={
            styles.eyebrow
          }
        >
          QUESTIONS FRÉQUENTES
        </div>

        <h2
          style={
            styles.sectionTitle
          }
        >
          Questions fréquentes
        </h2>

        <div
          style={
            styles.faqList
          }
        >
          <FaqItem
            question="CheckBuy garantit-il qu'un site est fiable ?"
            answer="Non. CheckBuy fournit une analyse basée sur différents signaux techniques et les avis de la communauté. Le résultat constitue une aide à la décision, pas une garantie."
            colors={
              colors
            }
          />

          <FaqItem
            question="Combien d'analyses puis-je faire gratuitement ?"
            answer="Un compte gratuit peut effectuer jusqu'à 3 analyses sur une période glissante de 24 heures."
            colors={
              colors
            }
          />

          <FaqItem
            question="Que donne CheckBuy Premium ?"
            answer="Premium permet notamment d'effectuer des analyses sans la limite du compte gratuit et retire les publicités de CheckBuy."
            colors={
              colors
            }
          />

          <FaqItem
            question="Pourquoi les avis sont-ils séparés du score ?"
            answer="Le score CheckBuy repose sur l'analyse technique. Les avis communautaires sont affichés séparément afin de ne pas modifier artificiellement le résultat technique."
            colors={
              colors
            }
          />
        </div>
      </section>

      {/* =====================================
          CONTACT
      ====================================== */}

      <section
        style={
          styles.contactSection
        }
      >
        <div
          style={
            styles.contactCard
          }
        >
          <div>
            <div
              style={
                styles.eyebrow
              }
            >
              CONTACT
            </div>

            <h2
              style={
                styles.contactTitle
              }
            >
              Une question ?
            </h2>

            <p
              style={
                styles.contactText
              }
            >
              Contactez CheckBuy
              pour une question
              sur le service ou
              votre compte.
            </p>
          </div>

          <button
            style={
              styles.contactButton
            }
            onClick={() => {
              const email =
                process.env
                  .NEXT_PUBLIC_CONTACT_EMAIL;

              if (!email) {
                alert(
                  "L'adresse de contact CheckBuy doit encore être configurée."
                );

                return;
              }

              window.open(
                `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                  email
                )}&su=${encodeURIComponent(
                  "Contact CheckBuy"
                )}`,
                "_blank",
                "noopener,noreferrer"
              );
            }}
          >
            Nous contacter
          </button>
        </div>
      </section>

      {/* =====================================
          FOOTER
      ====================================== */}

      <footer
        style={
          styles.footer
        }
      >
        <div
          style={
            styles.footerLogo
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
        </div>

        <div
          style={
            styles.footerLinks
          }
        >
          <button
            style={
              styles.footerLink
            }
            onClick={() =>
              router.push(
                "/mentions-legales"
              )
            }
          >
            Mentions légales
          </button>

          <button
            style={
              styles.footerLink
            }
            onClick={() =>
              router.push(
                "/confidentialite"
              )
            }
          >
            Confidentialité
          </button>

          <button
            style={
              styles.footerLink
            }
            onClick={() =>
              router.push(
                "/cookies"
              )
            }
          >
            Cookies
          </button>
        </div>

        <div
          style={
            styles.footerCopyright
          }
        >
          © 2026 CheckBuy —
          Vérifiez avant
          d&apos;acheter.
        </div>
      </footer>

      {/* =====================================
          COOKIES
      ====================================== */}

      {cookieChoice ===
        null && (
        <div
          style={
            styles.cookieBanner
          }
        >
          <div>
            <div
              style={
                styles.cookieTitle
              }
            >
              Cookies
            </div>

            <div
              style={
                styles.cookieText
              }
            >
              CheckBuy utilise
              des cookies
              nécessaires au
              fonctionnement du
              site. Les
              publicités ne sont
              affichées qu&apos;après
              votre accord.
            </div>
          </div>

          <div
            style={
              styles.cookieActions
            }
          >
            <button
              onClick={() =>
                chooseCookies(
                  "refused"
                )
              }
              style={
                styles.cookieRefuse
              }
            >
              Refuser
            </button>

            <button
              onClick={() =>
                chooseCookies(
                  "accepted"
                )
              }
              style={
                styles.cookieAccept
              }
            >
              Accepter
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

/* ==========================================
   CHECK ITEM
========================================== */

function CheckItem({
  check,
  colors,
}: {
  check: Check;
  colors: Colors;
}) {
  let color = "#22c55e";
  let icon = "✓";

  if (
    check.status ===
    "warning"
  ) {
    color = "#f59e0b";
    icon = "!";
  }

  if (
    check.status ===
    "bad"
  ) {
    color = "#ef4444";
    icon = "×";
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        alignItems:
          "flex-start",
        padding: "14px",
        background:
          colors.cardStrong,
        border: `1px solid ${colors.border}`,
        borderRadius:
          "14px",
      }}
    >
      <div
        style={{
          width: "34px",
          height: "34px",
          minWidth: "34px",
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          borderRadius:
            "50%",
          background:
            `${color}16`,
          border: `1px solid ${color}35`,
          color,
          fontWeight: 800,
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            color:
              colors.text,
            fontWeight: 700,
            fontSize:
              "14px",
          }}
        >
          {check.title}
        </div>

        <div
          style={{
            color:
              colors.muted,
            fontSize:
              "13px",
            lineHeight: 1.5,
            marginTop: "3px",
          }}
        >
          {
            check.description
          }
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   FEATURE
========================================== */

function Feature({
  number,
  title,
  text,
  colors,
}: {
  number: string;
  title: string;
  text: string;
  colors: Colors;
}) {
  return (
    <div
      style={{
        padding: "22px",
        borderRadius:
          "18px",
        background:
          colors.card,
        border: `1px solid ${colors.border}`,
        textAlign: "left",
      }}
    >
      <div
        style={{
          color:
            colors.accent,
          fontSize:
            "12px",
          fontWeight: 800,
          letterSpacing:
            "0.08em",
        }}
      >
        {number}
      </div>

      <h3
        style={{
          color:
            colors.text,
          margin:
            "12px 0 8px",
          fontSize:
            "17px",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color:
            colors.muted,
          margin: 0,
          fontSize:
            "13px",
          lineHeight: 1.6,
        }}
      >
        {text}
      </p>
    </div>
  );
}

/* ==========================================
   INFO CARD
========================================== */

function InfoCard({
  number,
  title,
  text,
  colors,
}: {
  number: string;
  title: string;
  text: string;
  colors: Colors;
}) {
  return (
    <div
      style={{
        padding: "24px",
        borderRadius:
          "18px",
        border: `1px solid ${colors.border}`,
        background:
          colors.card,
      }}
    >
      <div
        style={{
          width: "34px",
          height: "34px",
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          borderRadius:
            "10px",
          background:
            colors.accentSoft,
          color:
            colors.accent,
          fontWeight: 800,
          marginBottom:
            "18px",
        }}
      >
        {number}
      </div>

      <h3
        style={{
          margin:
            "0 0 8px",
          color:
            colors.text,
          fontSize:
            "17px",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color:
            colors.muted,
          margin: 0,
          fontSize:
            "13px",
          lineHeight: 1.6,
        }}
      >
        {text}
      </p>
    </div>
  );
}

/* ==========================================
   SIMPLE CARD
========================================== */

function SimpleCard({
  title,
  text,
  colors,
}: {
  title: string;
  text: string;
  colors: Colors;
}) {
  return (
    <div
      style={{
        padding: "22px",
        borderRadius:
          "18px",
        background:
          colors.card,
        border: `1px solid ${colors.border}`,
      }}
    >
      <h3
        style={{
          margin:
            "0 0 8px",
          color:
            colors.text,
          fontSize:
            "16px",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: 0,
          color:
            colors.muted,
          lineHeight: 1.6,
          fontSize:
            "13px",
        }}
      >
        {text}
      </p>
    </div>
  );
}

/* ==========================================
   FAQ
========================================== */

function FaqItem({
  question,
  answer,
  colors,
}: {
  question: string;
  answer: string;
  colors: Colors;
}) {
  return (
    <details
      style={{
        borderBottom: `1px solid ${colors.border}`,
        padding:
          "17px 0",
      }}
    >
      <summary
        style={{
          cursor:
            "pointer",
          color:
            colors.text,
          fontWeight: 700,
          fontSize:
            "14px",
        }}
      >
        {question}
      </summary>

      <p
        style={{
          color:
            colors.muted,
          lineHeight: 1.65,
          fontSize:
            "13px",
          margin:
            "12px 0 0",
          maxWidth:
            "750px",
        }}
      >
        {answer}
      </p>
    </details>
  );
}

/* ==========================================
   THEME BUTTON
========================================== */

function ThemeButton({
  label,
  active,
  onClick,
  colors,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  colors: Colors;
}) {
  return (
    <button
      onClick={
        onClick
      }
      style={{
        border: "none",
        width: "100%",
        textAlign: "left",
        cursor:
          "pointer",
        padding:
          "10px 12px",
        borderRadius:
          "9px",
        background:
          active
            ? colors.accentSoft
            : "transparent",
        color:
          active
            ? colors.accent
            : colors.text,
        fontWeight:
          active
            ? 700
            : 500,
      }}
    >
      {label}
    </button>
  );
}

/* ==========================================
   STYLES
========================================== */

function getStyles(
  colors: Colors
): Record<
  string,
  CSSProperties
> {
  return {
    page: {
      minHeight: "100vh",
      background:
        colors.background,
      color: colors.text,
      fontFamily:
        "Arial, Helvetica, sans-serif",
      transition:
        "background 0.2s ease, color 0.2s ease",
    },

    header: {
      minHeight: "68px",
      maxWidth:
        "1180px",
      margin: "0 auto",
      padding:
        "0 24px",
      display: "flex",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: "20px",
    },

    logoButton: {
      background:
        "transparent",
      border: "none",
      padding: 0,
      cursor:
        "pointer",
      fontSize:
        "21px",
      fontWeight: 800,
      letterSpacing:
        "-0.04em",
    },

    logoCheck: {
      color: colors.text,
    },

    logoBuy: {
      color:
        colors.accent,
    },

    headerActions: {
      display: "flex",
      alignItems:
        "center",
      justifyContent:
        "flex-end",
      flexWrap: "wrap",
      gap: "8px",
    },

    secondaryButton: {
      padding:
        "9px 13px",
      borderRadius:
        "10px",
      background:
        "transparent",
      border: `1px solid ${colors.border}`,
      color: colors.text,
      cursor:
        "pointer",
      fontSize:
        "13px",
    },

    accountButton: {
      padding:
        "9px 14px",
      borderRadius:
        "10px",
      border: "none",
      background:
        colors.accent,
      color:
        colors.buttonText,
      cursor:
        "pointer",
      fontSize:
        "13px",
      fontWeight: 700,
    },

    themeWrapper: {
      position:
        "relative",
    },

    themeMenu: {
      position:
        "absolute",
      right: 0,
      top: "44px",
      minWidth:
        "145px",
      zIndex: 50,
      padding: "7px",
      borderRadius:
        "12px",
      background:
        colors.cardStrong,
      border: `1px solid ${colors.border}`,
      boxShadow:
        "0 16px 50px rgba(0,0,0,0.28)",
    },

    hero: {
      maxWidth:
        "940px",
      margin: "0 auto",
      padding:
        "86px 24px 30px",
      textAlign:
        "center",
    },

    badge: {
      display:
        "inline-flex",
      alignItems:
        "center",
      gap: "8px",
      padding:
        "7px 11px",
      borderRadius:
        "999px",
      border: `1px solid ${colors.border}`,
      background:
        colors.accentSoft,
      color:
        colors.muted,
      fontSize:
        "11px",
      fontWeight: 700,
    },

    badgeDot: {
      width: "6px",
      height: "6px",
      borderRadius:
        "50%",
    },

    title: {
      margin:
        "21px 0 13px",
      color: colors.text,
      fontSize:
        "clamp(42px, 6vw, 68px)",
      letterSpacing:
        "-0.055em",
      lineHeight: 0.98,
      fontWeight: 850,
    },

    highlight: {
      display:
        "inline-block",
      background:
        "transparent",
    },

    subtitle: {
      maxWidth:
        "600px",
      margin:
        "0 auto",
      color:
        colors.muted,
      fontSize:
        "15px",
      lineHeight: 1.7,
    },

    searchContainer: {
      maxWidth:
        "720px",
      margin:
        "30px auto 0",
      padding: "6px",
      display: "flex",
      gap: "7px",
      background:
        colors.card,
      border: `1px solid ${colors.border}`,
      borderRadius:
        "15px",
      boxShadow:
        "0 16px 45px rgba(0,0,0,0.13)",
    },

    input: {
      flex: 1,
      minWidth: 0,
      padding:
        "12px 14px",
      background:
        "transparent",
      border: "none",
      outline: "none",
      color: colors.text,
      fontSize:
        "14px",
    },

    checkButton: {
      padding:
        "11px 20px",
      borderRadius:
        "11px",
      border: "none",
      background:
        colors.accent,
      color:
        colors.buttonText,
      fontWeight: 800,
      fontSize:
        "13px",
    },

    quota: {
      marginTop:
        "10px",
      color:
        colors.subtle,
      fontSize:
        "11px",
    },

    error: {
      maxWidth:
        "720px",
      margin:
        "13px auto 0",
      padding:
        "12px 14px",
      background:
        "rgba(239,68,68,0.08)",
      border:
        "1px solid rgba(239,68,68,0.20)",
      color:
        "#ef4444",
      borderRadius:
        "11px",
      fontSize:
        "12px",
    },

    errorButton: {
      marginLeft:
        "10px",
      border: "none",
      background:
        "transparent",
      color: "#ef4444",
      textDecoration:
        "underline",
      cursor:
        "pointer",
      fontWeight: 700,
    },

    loadingCard: {
      maxWidth:
        "720px",
      margin:
        "20px auto 0",
      padding: "20px",
      display: "flex",
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: "14px",
      borderRadius:
        "16px",
      border: `1px solid ${colors.border}`,
      background:
        colors.card,
    },

    spinner: {
      width: "23px",
      height: "23px",
      border:
        "3px solid rgba(128,128,128,0.18)",
      borderRadius:
        "50%",
      borderTop:
        "3px solid",
    },

    loadingTitle: {
      color:
        colors.text,
      fontWeight: 700,
      fontSize:
        "14px",
      textAlign: "left",
    },

    loadingText: {
      color:
        colors.muted,
      marginTop: "3px",
      fontSize:
        "12px",
      textAlign: "left",
    },

    resultCard: {
      margin:
        "30px auto 0",
      overflow:
        "hidden",
      borderRadius:
        "20px",
      border: `1px solid ${colors.border}`,
      background:
        colors.card,
      textAlign: "left",
    },

    resultHeader: {
      padding:
        "18px 22px",
      display: "flex",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: "20px",
      borderBottom: `1px solid ${colors.border}`,
    },

    eyebrow: {
      color:
        colors.accent,
      fontSize:
        "10px",
      fontWeight: 800,
      letterSpacing:
        "0.1em",
    },

    domain: {
      color:
        colors.text,
      fontSize:
        "17px",
      fontWeight: 750,
      marginTop: "4px",
      wordBreak:
        "break-word",
    },

    finished: {
      padding:
        "7px 10px",
      color:
        "#22c55e",
      background:
        "rgba(34,197,94,0.08)",
      border:
        "1px solid rgba(34,197,94,0.16)",
      borderRadius:
        "999px",
      fontSize:
        "11px",
      whiteSpace:
        "nowrap",
    },

    resultContent: {
      display: "grid",
      gridTemplateColumns:
        "minmax(180px, 220px) minmax(260px, 1fr)",
      gap: "30px",
      padding: "28px",
      alignItems:
        "center",
    },

    scoreSection: {
      textAlign:
        "center",
    },

    scoreCircle: {
      width: "158px",
      height: "158px",
      margin: "0 auto",
      borderRadius:
        "50%",
      padding: "8px",
    },

    scoreCircleInside: {
      width: "100%",
      height: "100%",
      borderRadius:
        "50%",
      display: "flex",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    scoreLine: {
      display: "flex",
      alignItems:
        "baseline",
      justifyContent:
        "center",
      gap: "12px",
    },

    scoreNumber: {
      fontSize:
        "44px",
      lineHeight: 1,
      fontWeight: 850,
    },

    outOf: {
      color:
        colors.subtle,
      fontSize:
        "12px",
      whiteSpace:
        "nowrap",
      fontWeight: 700,
    },

    scoreStatus: {
      marginTop:
        "13px",
      fontSize:
        "15px",
      fontWeight: 800,
    },

    scoreDescription: {
      color:
        colors.subtle,
      fontSize:
        "11px",
      marginTop: "3px",
    },

    checkList: {
      display: "flex",
      flexDirection:
        "column",
      gap: "9px",
    },

    disclaimer: {
      borderTop: `1px solid ${colors.border}`,
      padding:
        "14px 20px",
      color:
        colors.subtle,
      fontSize:
        "10px",
      lineHeight: 1.6,
    },

    communityCard: {
      margin:
        "20px auto 0",
      border: `1px solid ${colors.border}`,
      borderRadius:
        "20px",
      background:
        colors.card,
      padding: "22px",
      textAlign: "left",
    },

    sectionHeadingRow: {
      display: "flex",
      justifyContent:
        "space-between",
      gap: "20px",
      alignItems:
        "center",
    },

    communityTitle: {
      color:
        colors.text,
      fontSize:
        "20px",
      margin:
        "5px 0 0",
    },

    averageRating: {
      color:
        "#f5b942",
      fontSize:
        "13px",
      fontWeight: 800,
    },

    reviewForm: {
      marginTop:
        "20px",
      padding: "16px",
      background:
        colors.cardStrong,
      border: `1px solid ${colors.border}`,
      borderRadius:
        "14px",
    },

    reviewFormTitle: {
      fontSize:
        "13px",
      fontWeight: 700,
      color:
        colors.text,
    },

    ratingRow: {
      display: "flex",
      gap: "2px",
      margin:
        "8px 0",
    },

    starButton: {
      border: "none",
      background:
        "transparent",
      cursor:
        "pointer",
      fontSize:
        "21px",
      padding:
        "2px 2px",
    },

    textarea: {
      boxSizing:
        "border-box",
      width: "100%",
      minHeight:
        "90px",
      resize:
        "vertical",
      border: `1px solid ${colors.border}`,
      borderRadius:
        "11px",
      outline: "none",
      padding: "12px",
      color:
        colors.text,
      background:
        colors.card,
      fontFamily:
        "inherit",
      fontSize:
        "13px",
    },

    reviewBottom: {
      display: "flex",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: "12px",
      marginTop:
        "10px",
    },

    characterCount: {
      color:
        colors.subtle,
      fontSize:
        "10px",
    },

    publishButton: {
      border: "none",
      borderRadius:
        "9px",
      padding:
        "9px 13px",
      background:
        colors.accent,
      color:
        colors.buttonText,
      cursor:
        "pointer",
      fontSize:
        "12px",
      fontWeight: 800,
    },

    reviewMessage: {
      marginTop:
        "9px",
      color:
        colors.muted,
      fontSize:
        "11px",
    },

    loginReview: {
      marginTop:
        "18px",
      padding: "14px",
      borderRadius:
        "12px",
      background:
        colors.cardStrong,
      color:
        colors.muted,
      fontSize:
        "12px",
    },

    smallActionButton: {
      marginLeft:
        "10px",
      border: "none",
      background:
        "transparent",
      color:
        colors.accent,
      cursor:
        "pointer",
      fontWeight: 700,
    },

    reviewList: {
      marginTop:
        "15px",
      display: "flex",
      flexDirection:
        "column",
      gap: "9px",
    },

    emptyReviews: {
      padding:
        "18px 0",
      color:
        colors.subtle,
      fontSize:
        "12px",
      textAlign:
        "center",
    },

    reviewItem: {
      borderTop: `1px solid ${colors.border}`,
      paddingTop:
        "13px",
    },

    reviewItemTop: {
      display: "flex",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: "10px",
    },

    reviewDate: {
      color:
        colors.subtle,
      fontSize:
        "10px",
    },

    reviewComment: {
      color:
        colors.muted,
      fontSize:
        "12px",
      lineHeight: 1.6,
      margin:
        "7px 0 0",
    },

    features: {
      marginTop:
        "32px",
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "12px",
    },

    adContainer: {
      maxWidth:
        "850px",
      margin:
        "25px auto 0",
    },

    wideSection: {
      maxWidth:
        "1040px",
      margin: "0 auto",
      padding:
        "70px 24px 0",
    },

    sectionTitle: {
      margin:
        "7px 0 23px",
      color:
        colors.text,
      fontSize:
        "30px",
      letterSpacing:
        "-0.035em",
    },

    infoGrid: {
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(210px, 1fr))",
      gap: "12px",
    },

    whyGrid: {
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(240px, 1fr))",
      gap: "12px",
    },

    secondAd: {
      maxWidth:
        "850px",
      margin:
        "45px auto 0",
      padding:
        "0 24px",
    },

    faqList: {
      borderTop: `1px solid ${colors.border}`,
    },

    contactSection: {
      maxWidth:
        "1040px",
      margin: "0 auto",
      padding:
        "70px 24px",
    },

    contactCard: {
      display: "flex",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: "28px",
      border: `1px solid ${colors.border}`,
      borderRadius:
        "20px",
      padding:
        "27px",
      background:
        colors.card,
    },

    contactTitle: {
      color:
        colors.text,
      fontSize:
        "26px",
      margin:
        "6px 0 6px",
    },

    contactText: {
      color:
        colors.muted,
      fontSize:
        "13px",
      lineHeight: 1.6,
      margin: 0,
    },

    contactButton: {
      border: "none",
      background:
        colors.accent,
      color:
        colors.buttonText,
      padding:
        "11px 17px",
      borderRadius:
        "10px",
      cursor:
        "pointer",
      fontWeight: 800,
      whiteSpace:
        "nowrap",
    },

    footer: {
      maxWidth:
        "1040px",
      margin: "0 auto",
      padding:
        "28px 24px 38px",
      borderTop: `1px solid ${colors.border}`,
      display: "flex",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      flexWrap: "wrap",
      gap: "14px",
    },

    footerLogo: {
      color:
        colors.text,
      fontSize:
        "15px",
      fontWeight: 800,
    },

    footerLinks: {
      display: "flex",
      flexWrap: "wrap",
      gap: "13px",
    },

    footerLink: {
      border: "none",
      background:
        "transparent",
      color:
        colors.muted,
      cursor:
        "pointer",
      padding: 0,
      fontSize:
        "11px",
    },

    footerCopyright: {
      color:
        colors.subtle,
      fontSize:
        "10px",
    },

    cookieBanner: {
      position:
        "fixed",
      left: "18px",
      right: "18px",
      bottom: "18px",
      maxWidth:
        "780px",
      margin: "0 auto",
      zIndex: 100,
      display: "flex",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: "20px",
      padding:
        "16px 18px",
      borderRadius:
        "15px",
      border: `1px solid ${colors.border}`,
      background:
        colors.cardStrong,
      boxShadow:
        "0 20px 60px rgba(0,0,0,0.35)",
    },

    cookieTitle: {
      color:
        colors.text,
      fontWeight: 800,
      fontSize:
        "13px",
      marginBottom:
        "3px",
    },

    cookieText: {
      color:
        colors.muted,
      fontSize:
        "11px",
      lineHeight: 1.5,
    },

    cookieActions: {
      display: "flex",
      gap: "7px",
      flexShrink: 0,
    },

    cookieRefuse: {
      border: `1px solid ${colors.border}`,
      background:
        "transparent",
      color:
        colors.text,
      padding:
        "8px 11px",
      borderRadius:
        "9px",
      cursor:
        "pointer",
      fontSize:
        "11px",
    },

    cookieAccept: {
      border: "none",
      background:
        colors.accent,
      color:
        colors.buttonText,
      padding:
        "8px 11px",
      borderRadius:
        "9px",
      cursor:
        "pointer",
      fontWeight: 800,
      fontSize:
        "11px",
    },
  };
}