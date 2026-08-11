"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { useRouter } from "next/navigation";
import { createClient } from "../utils/supabase/client";
import AdBanner from "./components/AdBanner";

/* =========================================================
   TYPES
========================================================= */

type Check = {
  title: string;
  description: string;
  status: "good" | "warning" | "bad";
};

type Analysis = {
  score: number;
  level: string;
  domain: string;
  finalUrl: string;
  statusCode?: number;
  checks: Check[];

  premium?: boolean;

  usage?: {
    unlimited: boolean;
    limit?: number;
    used: number | null;
    remaining: number | null;
  };
};

type Review = {
  id: string;
  user_id: string;
  domain: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at?: string;
};

type ThemeName =
  | "sombre"
  | "clair"
  | "froid"
  | "chaud";

type CookieChoice =
  | "accepted"
  | "refused"
  | null;

type Colors = {
  page: string;
  header: string;
  card: string;
  cardStrong: string;
  text: string;
  muted: string;
  muted2: string;
  accent: string;
  accentSoft: string;
  border: string;
  input: string;
};

/* =========================================================
   THÈMES
========================================================= */

const THEMES: Record<ThemeName, Colors> = {
  sombre: {
    page: "#07090d",
    header: "#07090d",
    card: "#0d1118",
    cardStrong: "#0a0e14",
    text: "#ffffff",
    muted: "#929bad",
    muted2: "#5f6878",
    accent: "#4da3ff",
    accentSoft: "rgba(77,163,255,0.09)",
    border: "rgba(255,255,255,0.08)",
    input: "rgba(255,255,255,0.035)",
  },

  clair: {
    page: "#f7f8fb",
    header: "#ffffff",
    card: "#ffffff",
    cardStrong: "#ffffff",
    text: "#121826",
    muted: "#667085",
    muted2: "#98a2b3",
    accent: "#347de5",
    accentSoft: "rgba(52,125,229,0.08)",
    border: "rgba(16,24,40,0.10)",
    input: "#ffffff",
  },

  froid: {
    page: "#061014",
    header: "#061014",
    card: "#0a181d",
    cardStrong: "#081419",
    text: "#f3fcff",
    muted: "#89a7af",
    muted2: "#59727a",
    accent: "#58daf7",
    accentSoft: "rgba(88,218,247,0.09)",
    border: "rgba(88,218,247,0.12)",
    input: "rgba(88,218,247,0.035)",
  },

  chaud: {
    page: "#0d0705",
    header: "#0d0705",
    card: "#160d09",
    cardStrong: "#120a07",
    text: "#fff7f2",
    muted: "#c39b84",
    muted2: "#856452",
    accent: "#ff7d42",
    accentSoft: "rgba(255,125,66,0.09)",
    border: "rgba(255,125,66,0.18)",
    input: "#170c08",
  },
};

/* =========================================================
   PAGE PRINCIPALE
========================================================= */

export default function HomePage() {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  /* =======================================================
     APPARENCE
  ======================================================= */

  const [theme, setTheme] =
    useState<ThemeName>("chaud");

  const [themeMenu, setThemeMenu] =
    useState(false);

  const colors = THEMES[theme];
  const styles = getStyles(colors);

  /* =======================================================
     UTILISATEUR
  ======================================================= */

  const [user, setUser] =
    useState<any>(null);

  const [isPremium, setIsPremium] =
    useState(false);

  /* =======================================================
     COOKIES
  ======================================================= */

  const [
    cookieChoice,
    setCookieChoice,
  ] = useState<CookieChoice>(null);

  const [
    cookieLoaded,
    setCookieLoaded,
  ] = useState(false);

  /* =======================================================
     ANALYSE
  ======================================================= */

  const [url, setUrl] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [analysis, setAnalysis] =
    useState<Analysis | null>(null);

  const [error, setError] =
    useState("");

  /* =======================================================
     AVIS
  ======================================================= */

  const [reviews, setReviews] =
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
    reviewLoading,
    setReviewLoading,
  ] = useState(false);

  const [
    reviewMessage,
    setReviewMessage,
  ] = useState("");

  /* =========================================================
     CHARGEMENT DU THÈME
  ========================================================= */

  useEffect(() => {
    const saved =
      localStorage.getItem(
        "checkbuy-theme"
      ) as ThemeName | null;

    if (
      saved &&
      THEMES[saved]
    ) {
      setTheme(saved);
    }
  }, []);

  function changeTheme(
    nextTheme: ThemeName
  ) {
    setTheme(nextTheme);

    localStorage.setItem(
      "checkbuy-theme",
      nextTheme
    );

    setThemeMenu(false);
  }

  /* =========================================================
     COOKIES
  ========================================================= */

  useEffect(() => {
    const saved =
      localStorage.getItem(
        "checkbuy-cookie-choice"
      );

    if (saved === "accepted") {
      setCookieChoice(
        "accepted"
      );
    }

    if (saved === "refused") {
      setCookieChoice(
        "refused"
      );
    }

    setCookieLoaded(true);
  }, []);

  function acceptCookies() {
    localStorage.setItem(
      "checkbuy-cookie-choice",
      "accepted"
    );

    setCookieChoice(
      "accepted"
    );
  }

  function refuseCookies() {
    localStorage.setItem(
      "checkbuy-cookie-choice",
      "refused"
    );

    setCookieChoice(
      "refused"
    );
  }

  function changeCookieChoice() {
    localStorage.removeItem(
      "checkbuy-cookie-choice"
    );

    setCookieChoice(null);
  }

  /* =========================================================
     USER + PREMIUM
  ========================================================= */

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user: currentUser },
      } =
        await supabase.auth.getUser();

      setUser(
        currentUser ?? null
      );

      if (!currentUser) {
        setIsPremium(false);
        return;
      }

      const { data } =
        await supabase
          .from("subscriptions")
          .select("status")
          .eq(
            "user_id",
            currentUser.id
          )
          .maybeSingle();

      setIsPremium(
        data?.status ===
          "active" ||
          data?.status ===
            "trialing"
      );
    }

    loadUser();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        () => {
          loadUser();
        }
      );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  /* =========================================================
     ANALYSE
  ========================================================= */

  async function analyzeSite() {
    if (!url.trim()) {
      setError(
        "Entre un lien avant de lancer l'analyse."
      );

      return;
    }

    const {
      data: { session },
    } =
      await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);
    setReviews([]);
    setReviewMessage("");

    try {
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

            body: JSON.stringify({
              url: url.trim(),
            }),
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
          `Réponse serveur invalide (HTTP ${response.status}).`
        );
      }

      if (!response.ok) {
        setError(
          data.error ||
            "Impossible d'analyser ce site."
        );

        return;
      }

      setAnalysis(data);

      if (
        data.premium === true
      ) {
        setIsPremium(true);
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'analyser ce site."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     AVIS
  ========================================================= */

  useEffect(() => {
    if (!analysis?.domain) {
      return;
    }

    loadReviews(
      analysis.domain
    );
  }, [
    analysis?.domain,
    user?.id,
  ]);

  async function loadReviews(
    domain: string
  ) {
    setReviewsLoading(true);

    const { data, error } =
      await supabase
        .from("site_reviews")
        .select(
          "id,user_id,domain,rating,comment,created_at,updated_at"
        )
        .eq("domain", domain)
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.error(
        "Erreur avis :",
        error
      );

      setReviewsLoading(false);
      return;
    }

    const list =
      (data ?? []) as Review[];

    setReviews(list);

    if (user) {
      const myReview =
        list.find(
          (review) =>
            review.user_id ===
            user.id
        );

      if (myReview) {
        setReviewRating(
          myReview.rating
        );

        setReviewComment(
          myReview.comment
        );
      } else {
        setReviewRating(5);
        setReviewComment("");
      }
    }

    setReviewsLoading(false);
  }

  async function publishReview() {
    if (!analysis) {
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    if (
      reviewComment
        .trim().length < 3
    ) {
      setReviewMessage(
        "Ton commentaire doit contenir au moins 3 caractères."
      );

      return;
    }

    setReviewLoading(true);
    setReviewMessage("");

    const { error } =
      await supabase
        .from("site_reviews")
        .upsert(
          {
            user_id: user.id,

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
      console.error(error);

      setReviewMessage(
        "Impossible d'enregistrer ton avis."
      );

      setReviewLoading(false);
      return;
    }

    setReviewMessage(
      "Ton avis a été enregistré."
    );

    await loadReviews(
      analysis.domain
    );

    setReviewLoading(false);
  }

  /* =========================================================
     SCORE
  ========================================================= */

  function getScoreColor(
    score: number
  ) {
    if (score >= 85) {
      return "#22c55e";
    }

    if (score >= 70) {
      return "#f59e0b";
    }

    if (score >= 50) {
      return "#f97316";
    }

    return "#ef4444";
  }

  const averageRating =
    reviews.length > 0
      ? reviews.reduce(
          (
            total,
            review
          ) =>
            total +
            review.rating,
          0
        ) / reviews.length
      : 0;

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main style={styles.page}>

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header style={styles.header}>
        <button
          style={styles.logo}
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
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
            styles.headerActions
          }
        >
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
            {isPremium
              ? "Premium"
              : "Découvrir Premium"}
          </button>

          <div
            style={
              styles.themeWrapper
            }
          >
            <button
              style={
                styles.headerButton
              }
              onClick={() =>
                setThemeMenu(
                  (value) =>
                    !value
                )
              }
            >
              Apparence
            </button>

            {themeMenu && (
              <div
                style={
                  styles.themeMenu
                }
              >
                {(
                  [
                    [
                      "sombre",
                      "Sombre",
                    ],
                    [
                      "clair",
                      "Clair",
                    ],
                    [
                      "froid",
                      "Froid",
                    ],
                    [
                      "chaud",
                      "Chaud",
                    ],
                  ] as [
                    ThemeName,
                    string
                  ][]
                ).map(
                  ([
                    value,
                    label,
                  ]) => (
                    <button
                      key={value}
                      onClick={() =>
                        changeTheme(
                          value
                        )
                      }
                      style={{
                        ...styles.themeOption,

                        color:
                          theme ===
                          value
                            ? colors.accent
                            : colors.text,

                        background:
                          theme ===
                          value
                            ? colors.accentSoft
                            : "transparent",
                      }}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          <button
            style={
              styles.headerButton
            }
            onClick={() =>
              router.push(
                user
                  ? "/account"
                  : "/login"
              )
            }
          >
            {user
              ? "Mon compte"
              : "Se connecter"}
          </button>
        </div>
      </header>

      {/* =====================================================
          HERO
      ====================================================== */}

      <section style={styles.hero}>
        <div style={styles.badge}>
          <span
            style={{
              ...styles.dot,
              background:
                colors.accent,
            }}
          />

          Vérifiez avant
          d&apos;acheter
        </div>

        <h1 style={styles.title}>
          Achetez en toute
          <br />

          <span
            style={
              styles.highlight
            }
          >
            confiance.
          </span>
        </h1>

        <p
          style={
            styles.subtitle
          }
        >
          Analysez un site avant
          votre achat et détectez les
          premiers signes de risque
          en quelques secondes.
        </p>

        {/* =================================================
            RECHERCHE
        ================================================== */}

        <div
          style={
            styles.searchContainer
          }
        >
          <input
            value={url}
            onChange={(event) =>
              setUrl(
                event.target.value
              )
            }
            onKeyDown={(event) => {
              if (
                event.key ===
                "Enter"
              ) {
                analyzeSite();
              }
            }}
            placeholder="https://exemple.com"
            style={styles.input}
          />

          <button
            onClick={
              analyzeSite
            }
            disabled={loading}
            style={{
              ...styles.checkButton,

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
              ? "Analyse..."
              : "Vérifier"}
          </button>
        </div>

        {/* =================================================
            QUOTA
        ================================================== */}

        {analysis?.usage &&
          !analysis.usage
            .unlimited && (
            <div
              style={
                styles.usage
              }
            >
              {analysis.usage
                .remaining ?? 0}{" "}
              analyse
              {(analysis.usage
                .remaining ??
                0) !== 1
                ? "s"
                : ""}{" "}
              restante
              {(analysis.usage
                .remaining ??
                0) !== 1
                ? "s"
                : ""}{" "}
              sur 3
            </div>
          )}

        {analysis?.usage
          ?.unlimited && (
          <div
            style={
              styles.usagePremium
            }
          >
            Premium — analyses
            illimitées
          </div>
        )}

        {/* =================================================
            ERREUR
        ================================================== */}

        {error && (
          <div
            style={styles.error}
          >
            {error}

            {error.includes(
              "3 analyses"
            ) && (
              <button
                onClick={() =>
                  router.push(
                    "/premium"
                  )
                }
                style={
                  styles.inlinePremium
                }
              >
                Passer à Premium
              </button>
            )}
          </div>
        )}

        {/* =================================================
            CHARGEMENT
        ================================================== */}

        {loading && (
          <div
            style={
              styles.loadingCard
            }
          >
            <div
              style={{
                ...styles.loadingIcon,

                color:
                  colors.accent,

                borderColor:
                  colors.accent,
              }}
            >
              •••
            </div>

            <h2
              style={
                styles.loadingTitle
              }
            >
              Analyse en cours
            </h2>

            <p
              style={
                styles.loadingText
              }
            >
              CheckBuy vérifie le
              site et plusieurs
              éléments techniques.
            </p>
          </div>
        )}

        {/* =================================================
            RÉSULTAT
        ================================================== */}

        {analysis &&
          !loading && (
            <>
              <div
                style={
                  styles.resultCard
                }
              >
                <div
                  style={
                    styles.resultTop
                  }
                >
                  <div>
                    <div
                      style={
                        styles.miniLabel
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
                    styles.resultGrid
                  }
                >
                  <div
                    style={
                      styles.scoreArea
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
                          ${colors.border}
                          ${
                            analysis.score *
                            3.6
                          }deg
                        )`,
                      }}
                    >
                      <div
                        style={
                          styles.scoreInside
                        }
                      >
                        <div
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
                        </div>

                        <div
                          style={
                            styles.outOf
                          }
                        >
                          / 100
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        ...styles.level,

                        color:
                          getScoreColor(
                            analysis.score
                          ),
                      }}
                    >
                      {
                        analysis.level
                      }
                    </div>

                    <div
                      style={
                        styles.scoreLabel
                      }
                    >
                      Score CheckBuy
                    </div>
                  </div>

                  <div
                    style={
                      styles.checks
                    }
                  >
                    {analysis.checks.map(
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
                  constitue une aide
                  à la décision. Il
                  ne garantit pas
                  qu&apos;un vendeur,
                  un produit ou un
                  achat soit fiable à
                  100 %.
                </div>
              </div>

              {/* =================================================
                  COMMUNAUTÉ
              ================================================== */}

              <div
                style={
                  styles.community
                }
              >
                <div
                  style={
                    styles.communityTop
                  }
                >
                  <div>
                    <div
                      style={
                        styles.sectionLabel
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

                  {reviews.length >
                    0 && (
                    <div
                      style={
                        styles.average
                      }
                    >
                      <strong
                        style={{
                          color:
                            colors.accent,
                        }}
                      >
                        {averageRating.toFixed(
                          1
                        )}
                      </strong>

                      /5 ·{" "}
                      {
                        reviews.length
                      }{" "}
                      avis
                    </div>
                  )}
                </div>

                <div
                  style={
                    styles.reviewForm
                  }
                >
                  <div
                    style={
                      styles.formTitle
                    }
                  >
                    Votre avis
                  </div>

                  <div
                    style={
                      styles.stars
                    }
                  >
                    {[
                      1,
                      2,
                      3,
                      4,
                      5,
                    ].map(
                      (star) => (
                        <button
                          type="button"
                          key={
                            star
                          }
                          onClick={() =>
                            setReviewRating(
                              star
                            )
                          }
                          style={{
                            ...styles.star,

                            color:
                              star <=
                              reviewRating
                                ? colors.accent
                                : colors.muted2,
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
                    onChange={(
                      event
                    ) =>
                      setReviewComment(
                        event.target
                          .value
                      )
                    }
                    maxLength={
                      1000
                    }
                    placeholder="Partagez votre expérience avec ce site..."
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
                        styles.counter
                      }
                    >
                      {
                        reviewComment.length
                      }
                      /1000
                    </span>

                    <button
                      onClick={
                        publishReview
                      }
                      disabled={
                        reviewLoading
                      }
                      style={{
                        ...styles.smallCta,

                        opacity:
                          reviewLoading
                            ? 0.6
                            : 1,
                      }}
                    >
                      {reviewLoading
                        ? "Enregistrement..."
                        : "Publier"}
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

                <div
                  style={
                    styles.reviewList
                  }
                >
                  {reviewsLoading ? (
                    <div
                      style={
                        styles.empty
                      }
                    >
                      Chargement...
                    </div>
                  ) : reviews.length ===
                    0 ? (
                    <div
                      style={
                        styles.empty
                      }
                    >
                      Aucun avis pour
                      le moment.
                    </div>
                  ) : (
                    reviews.map(
                      (review) => (
                        <div
                          key={
                            review.id
                          }
                          style={
                            styles.review
                          }
                        >
                          <div
                            style={
                              styles.reviewHeader
                            }
                          >
                            <div>
                              <strong
                                style={
                                  styles.reviewUser
                                }
                              >
                                Utilisateur
                                CheckBuy
                              </strong>

                              <div
                                style={
                                  styles.reviewDate
                                }
                              >
                                {new Date(
                                  review.created_at
                                ).toLocaleDateString(
                                  "fr-FR"
                                )}
                              </div>
                            </div>

                            <div
                              style={{
                                color:
                                  colors.accent,
                              }}
                            >
                              {"★".repeat(
                                review.rating
                              )}
                            </div>
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
                    )
                  )}
                </div>
              </div>
            </>
          )}

        {/* =================================================
            3 CARTES PRINCIPALES
        ================================================== */}

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
                text="Obtenez rapidement un score pour évaluer le site que vous souhaitez utiliser."
                styles={styles}
              />

              <Feature
                number="02"
                title="Sécurité"
                text="CheckBuy vérifie plusieurs éléments techniques et signaux de sécurité."
                styles={styles}
              />

              <Feature
                number="03"
                title="Détection des risques"
                text="Repérez plus facilement les éléments qui méritent votre attention avant un achat."
                styles={styles}
              />
            </div>
          )}

        {/* =================================================
            PUB 1
            Free uniquement + consentement accepté
        ================================================== */}

        {!isPremium &&
          cookieChoice ===
            "accepted" && (
            <AdBanner />
          )}
      </section>

      {/* =====================================================
          COMMENT ÇA MARCHE
      ====================================================== */}

      <section
        style={styles.section}
        id="fonctionnement"
      >
        <div
          style={
            styles.sectionLabel
          }
        >
          FONCTIONNEMENT
        </div>

        <h2
          style={
            styles.sectionTitle
          }
        >
          Comment ça marche ?
        </h2>

        <p
          style={
            styles.sectionIntro
          }
        >
          Une vérification simple
          avant de passer à
          l&apos;achat.
        </p>

        <div
          style={
            styles.threeGrid
          }
        >
          <SectionCard
            number="01"
            title="Collez l'URL"
            text="Copiez simplement l'adresse du site que vous souhaitez vérifier."
            styles={styles}
          />

          <SectionCard
            number="02"
            title="Nous vérifions"
            text="CheckBuy analyse plusieurs caractéristiques techniques du site."
            styles={styles}
          />

          <SectionCard
            number="03"
            title="Obtenez le score"
            text="Consultez le score sur 100 et les éléments qui méritent votre attention."
            styles={styles}
          />
        </div>
      </section>

      {/* =====================================================
          POURQUOI CHECKBUY
      ====================================================== */}

      <section
        style={styles.section}
        id="pourquoi"
      >
        <div
          style={
            styles.sectionLabel
          }
        >
          POURQUOI CHECKBUY ?
        </div>

        <h2
          style={
            styles.sectionTitle
          }
        >
          Plus d&apos;informations.
          <br />
          Moins d&apos;incertitude.
        </h2>

        <p
          style={
            styles.sectionIntro
          }
        >
          CheckBuy rassemble
          plusieurs signaux dans une
          analyse claire et rapide.
        </p>

        <div
          style={
            styles.fourGrid
          }
        >
          <SmallCard
            icon="✓"
            title="Signaux suspects"
            text="Repérez plus facilement certains éléments inhabituels."
            styles={styles}
            colors={colors}
          />

          <SmallCard
            icon="100"
            title="Score simple"
            text="Un résultat sur 100 facile à lire et à comprendre."
            styles={styles}
            colors={colors}
          />

          <SmallCard
            icon="★"
            title="Communauté"
            text="Consultez les avis des autres utilisateurs CheckBuy."
            styles={styles}
            colors={colors}
          />

          <SmallCard
            icon="⚡"
            title="Rapide"
            text="Une URL suffit pour lancer la vérification."
            styles={styles}
            colors={colors}
          />
        </div>

        <div
          style={
            styles.notice
          }
        >
          <strong
            style={{
              color:
                colors.accent,
            }}
          >
            Important :
          </strong>{" "}
          CheckBuy aide à identifier
          des signaux techniques,
          mais ne peut jamais
          garantir à 100 % la
          fiabilité d&apos;un
          vendeur ou d&apos;un
          achat.
        </div>
      </section>

      {/* =====================================================
          PUB 2
      ====================================================== */}

      {!isPremium &&
        cookieChoice ===
          "accepted" && (
          <AdBanner />
        )}

      {/* =====================================================
          FAQ
      ====================================================== */}

      <section
        style={styles.section}
        id="faq"
      >
        <div
          style={
            styles.sectionLabel
          }
        >
          FAQ
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
          <Faq
            question="CheckBuy peut-il garantir qu'un site n'est pas une arnaque ?"
            answer="Non. CheckBuy permet de repérer plusieurs signaux techniques, mais aucun outil ne peut garantir à 100 % la fiabilité d'un vendeur."
            styles={styles}
          />

          <Faq
            question="Que signifie le score sur 100 ?"
            answer="Le score correspond au résultat des différents contrôles réalisés par CheckBuy."
            styles={styles}
          />

          <Faq
            question="Pourquoi un site connu peut-il ne pas obtenir 100/100 ?"
            answer="Un site peut ne pas répondre parfaitement à certains critères techniques sans pour autant être dangereux."
            styles={styles}
          />

          <Faq
            question="Combien d'analyses sont gratuites ?"
            answer="Un compte gratuit permet actuellement d'effectuer 3 analyses toutes les 24 heures."
            styles={styles}
          />

          <Faq
            question="Que permet CheckBuy Premium ?"
            answer="CheckBuy Premium permet d'effectuer des analyses sans limite."
            styles={styles}
          />

          <Faq
            question="Les avis influencent-ils le score ?"
            answer="Non. Les avis communautaires sont séparés du score technique CheckBuy."
            styles={styles}
          />
        </div>
      </section>

      {/* =====================================================
          CONTACT
      ====================================================== */}

      <section
        style={styles.section}
        id="contact"
      >
        <div
          style={
            styles.contactBox
          }
        >
          <div
            style={
              styles.sectionLabel
            }
          >
            NOUS CONTACTER
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
            Une suggestion, un
            problème avec CheckBuy ou
            une question concernant
            votre compte ?
          </p>

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

              window.location.href =
                `mailto:${email}?subject=Contact CheckBuy`;
            }}
          >
            Nous contacter
          </button>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer
        style={
          styles.footer
        }
      >
        <div
          style={
            styles.footerTop
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
                document
                  .getElementById(
                    "fonctionnement"
                  )
                  ?.scrollIntoView({
                    behavior:
                      "smooth",
                  })
              }
            >
              Comment ça marche
            </button>

            <button
              style={
                styles.footerLink
              }
              onClick={() =>
                document
                  .getElementById(
                    "pourquoi"
                  )
                  ?.scrollIntoView({
                    behavior:
                      "smooth",
                  })
              }
            >
              Pourquoi CheckBuy
            </button>

            <button
              style={
                styles.footerLink
              }
              onClick={() =>
                document
                  .getElementById(
                    "faq"
                  )
                  ?.scrollIntoView({
                    behavior:
                      "smooth",
                  })
              }
            >
              FAQ
            </button>

            <button
              style={
                styles.footerLink
              }
              onClick={() =>
                document
                  .getElementById(
                    "contact"
                  )
                  ?.scrollIntoView({
                    behavior:
                      "smooth",
                  })
              }
            >
              Contact
            </button>

            <button
              style={
                styles.footerLink
              }
              onClick={() =>
                router.push(
                  "/premium"
                )
              }
            >
              Premium
            </button>

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

            <button
              style={
                styles.footerLink
              }
              onClick={
                changeCookieChoice
              }
            >
              Gérer les cookies
            </button>
          </div>
        </div>

        <div
          style={
            styles.copyright
          }
        >
          © 2026 CheckBuy —
          Vérifiez avant
          d&apos;acheter.
        </div>
      </footer>

      {/* =====================================================
          BANDEAU COOKIES
      ====================================================== */}

      {cookieLoaded &&
        cookieChoice ===
          null && (
          <div
            style={
              styles.cookieOverlay
            }
          >
            <div
              style={
                styles.cookieBanner
              }
            >
              <div
                style={
                  styles.cookieContent
                }
              >
                <strong
                  style={
                    styles.cookieTitle
                  }
                >
                  Vos préférences de
                  confidentialité
                </strong>

                <p
                  style={
                    styles.cookieText
                  }
                >
                  CheckBuy utilise
                  les technologies
                  nécessaires au
                  fonctionnement du
                  site. Avec votre
                  accord, des
                  technologies
                  publicitaires
                  pourront également
                  être utilisées sur
                  les comptes
                  gratuits.
                </p>

                <button
                  style={
                    styles.cookiePolicyLink
                  }
                  onClick={() =>
                    router.push(
                      "/cookies"
                    )
                  }
                >
                  En savoir plus
                </button>
              </div>

              <div
                style={
                  styles.cookieButtons
                }
              >
                <button
                  style={
                    styles.cookieRefuse
                  }
                  onClick={
                    refuseCookies
                  }
                >
                  Refuser
                </button>

                <button
                  style={
                    styles.cookieAccept
                  }
                  onClick={
                    acceptCookies
                  }
                >
                  Accepter
                </button>
              </div>
            </div>
          </div>
        )}
    </main>
  );
}

/* =========================================================
   FEATURE
========================================================= */

function Feature({
  number,
  title,
  text,
  styles,
}: {
  number: string;
  title: string;
  text: string;
  styles: Record<
    string,
    CSSProperties
  >;
}) {
  return (
    <div
      style={styles.feature}
    >
      <div
        style={
          styles.featureNumber
        }
      >
        {number}
      </div>

      <h3
        style={
          styles.featureTitle
        }
      >
        {title}
      </h3>

      <p
        style={
          styles.featureText
        }
      >
        {text}
      </p>
    </div>
  );
}

/* =========================================================
   SECTION CARD
========================================================= */

function SectionCard({
  number,
  title,
  text,
  styles,
}: {
  number: string;
  title: string;
  text: string;
  styles: Record<
    string,
    CSSProperties
  >;
}) {
  return (
    <div
      style={
        styles.sectionCard
      }
    >
      <div
        style={
          styles.sectionNumber
        }
      >
        {number}
      </div>

      <h3
        style={
          styles.sectionCardTitle
        }
      >
        {title}
      </h3>

      <p
        style={
          styles.sectionCardText
        }
      >
        {text}
      </p>
    </div>
  );
}

/* =========================================================
   SMALL CARD
========================================================= */

function SmallCard({
  icon,
  title,
  text,
  styles,
  colors,
}: {
  icon: string;
  title: string;
  text: string;
  styles: Record<
    string,
    CSSProperties
  >;
  colors: Colors;
}) {
  return (
    <div
      style={
        styles.smallCard
      }
    >
      <div
        style={{
          ...styles.smallIcon,

          color:
            colors.accent,

          background:
            colors.accentSoft,
        }}
      >
        {icon}
      </div>

      <h3
        style={
          styles.smallTitle
        }
      >
        {title}
      </h3>

      <p
        style={
          styles.smallText
        }
      >
        {text}
      </p>
    </div>
  );
}

/* =========================================================
   FAQ
========================================================= */

function Faq({
  question,
  answer,
  styles,
}: {
  question: string;
  answer: string;
  styles: Record<
    string,
    CSSProperties
  >;
}) {
  return (
    <details
      style={
        styles.faqItem
      }
    >
      <summary
        style={
          styles.faqQuestion
        }
      >
        {question}
      </summary>

      <p
        style={
          styles.faqAnswer
        }
      >
        {answer}
      </p>
    </details>
  );
}

/* =========================================================
   CHECK ITEM
========================================================= */

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
    check.status === "bad"
  ) {
    color = "#ef4444";
    icon = "×";
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "11px",
        padding: "12px",
        borderRadius: "12px",
        background:
          colors.card,
        border:
          `1px solid ${colors.border}`,
      }}
    >
      <div
        style={{
          width: "31px",
          height: "31px",
          minWidth: "31px",

          display: "flex",
          alignItems: "center",
          justifyContent:
            "center",

          borderRadius: "50%",

          background:
            `${color}16`,

          color,

          border:
            `1px solid ${color}28`,

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

            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          {check.title}
        </div>

        <div
          style={{
            marginTop: "3px",

            color:
              colors.muted,

            fontSize: "11px",
            lineHeight: 1.5,
          }}
        >
          {check.description}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   STYLES
========================================================= */

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
        colors.page,
      color: colors.text,

      fontFamily:
        "Arial, Helvetica, sans-serif",
    },

    /* HEADER */

    header: {
      minHeight: "58px",

      padding: "0 32px",

      display: "flex",

      alignItems: "center",

      justifyContent:
        "space-between",

      gap: "20px",

      background:
        colors.header,

      borderBottom:
        `1px solid ${colors.border}`,

      position: "relative",

      zIndex: 20,
    },

    logo: {
      border: "none",

      background:
        "transparent",

      padding: 0,

      color:
        colors.text,

      fontSize: "25px",

      fontWeight: 900,

      letterSpacing:
        "-1.2px",

      cursor: "pointer",
    },

    headerActions: {
      display: "flex",

      alignItems: "center",

      gap: "8px",

      flexWrap: "wrap",
    },

    headerButton: {
      padding:
        "10px 14px",

      borderRadius: "10px",

      border:
        `1px solid ${colors.border}`,

      background:
        colors.card,

      color:
        colors.text,

      fontSize: "11px",

      fontWeight: 700,

      cursor: "pointer",
    },

    premiumButton: {
      padding:
        "10px 14px",

      borderRadius: "10px",

      border:
        `1px solid ${colors.border}`,

      background:
        colors.accentSoft,

      color:
        colors.accent,

      fontSize: "11px",

      fontWeight: 800,

      cursor: "pointer",
    },

    themeWrapper: {
      position: "relative",
    },

    themeMenu: {
      position: "absolute",

      top: "44px",
      right: 0,

      width: "130px",

      padding: "7px",

      display: "flex",

      flexDirection:
        "column",

      gap: "3px",

      borderRadius: "12px",

      background:
        colors.cardStrong,

      border:
        `1px solid ${colors.border}`,

      boxShadow:
        "0 20px 60px rgba(0,0,0,0.35)",
    },

    themeOption: {
      border: "none",

      padding:
        "10px 11px",

      textAlign: "left",

      borderRadius: "8px",

      fontSize: "11px",

      fontWeight: 600,

      cursor: "pointer",
    },

    /* HERO */

    hero: {
      maxWidth: "900px",

      margin: "0 auto",

      padding:
        "65px 24px 80px",

      textAlign: "center",
    },

    badge: {
      display:
        "inline-flex",

      alignItems: "center",

      gap: "8px",

      padding:
        "8px 13px",

      borderRadius: "30px",

      background:
        colors.accentSoft,

      border:
        `1px solid ${colors.border}`,

      color:
        colors.accent,

      fontSize: "12px",

      fontWeight: 700,
    },

    dot: {
      width: "6px",

      height: "6px",

      borderRadius: "50%",
    },

    title: {
      margin:
        "27px 0 18px",

      color:
        colors.text,

      fontSize:
        "clamp(44px, 6vw, 66px)",

      lineHeight: 1,

      letterSpacing: "-3px",

      fontWeight: 900,
    },

    highlight: {
      display:
        "inline-block",

      color:
        colors.accent,

      WebkitTextFillColor:
        colors.accent,

      background:
        "transparent",
    },

    subtitle: {
      maxWidth: "600px",

      margin: "0 auto",

      color:
        colors.muted,

      fontSize: "14px",

      lineHeight: 1.65,
    },

    searchContainer: {
      maxWidth: "750px",

      margin:
        "36px auto 0",

      padding: "6px",

      display: "flex",

      gap: "7px",

      borderRadius: "17px",

      background:
        colors.input,

      border:
        `1px solid ${colors.border}`,
    },

    input: {
      flex: 1,

      minWidth: 0,

      padding:
        "14px 16px",

      border: "none",

      outline: "none",

      background:
        "transparent",

      color:
        colors.text,

      fontSize: "13px",
    },

    checkButton: {
      minWidth: "108px",

      padding:
        "0 22px",

      border: "none",

      borderRadius: "12px",

      background:
        colors.accent,

      color: "#ffffff",

      fontSize: "12px",

      fontWeight: 800,
    },

    usage: {
      marginTop: "12px",

      color:
        colors.muted,

      fontSize: "10px",
    },

    usagePremium: {
      marginTop: "12px",

      color:
        colors.accent,

      fontSize: "10px",

      fontWeight: 700,
    },

    error: {
      marginTop: "13px",

      color: "#ef4444",

      fontSize: "11px",
    },

    inlinePremium: {
      marginLeft: "8px",

      border: "none",

      background:
        "transparent",

      color:
        colors.accent,

      fontWeight: 800,

      cursor: "pointer",
    },

    /* FEATURES */

    features: {
      marginTop: "72px",

      display: "grid",

      gridTemplateColumns:
        "repeat(auto-fit, minmax(220px, 1fr))",

      gap: "16px",

      textAlign: "left",
    },

    feature: {
      minHeight: "145px",

      boxSizing:
        "border-box",

      padding: "24px",

      borderRadius: "19px",

      background:
        colors.card,

      border:
        `1px solid ${colors.border}`,
    },

    featureNumber: {
      marginBottom: "31px",

      color:
        colors.accent,

      fontSize: "10px",

      fontWeight: 800,
    },

    featureTitle: {
      margin: 0,

      color:
        colors.text,

      fontSize: "15px",
    },

    featureText: {
      margin:
        "7px 0 0",

      color:
        colors.muted,

      fontSize: "11px",

      lineHeight: 1.6,
    },

    /* LOADING */

    loadingCard: {
      maxWidth: "700px",

      margin:
        "25px auto 0",

      padding: "35px",

      borderRadius: "19px",

      background:
        colors.card,

      border:
        `1px solid ${colors.border}`,
    },

    loadingIcon: {
      width: "45px",

      height: "45px",

      margin: "0 auto",

      display: "flex",

      alignItems: "center",

      justifyContent:
        "center",

      border: "2px solid",

      borderRadius: "50%",

      fontSize: "10px",
    },

    loadingTitle: {
      margin:
        "15px 0 6px",

      color:
        colors.text,

      fontSize: "17px",
    },

    loadingText: {
      margin: 0,

      color:
        colors.muted,

      fontSize: "11px",
    },

    /* RESULT */

    resultCard: {
      maxWidth: "800px",

      margin:
        "28px auto 0",

      overflow: "hidden",

      textAlign: "left",

      borderRadius: "20px",

      background:
        colors.cardStrong,

      border:
        `1px solid ${colors.border}`,
    },

    resultTop: {
      padding: "20px",

      display: "flex",

      justifyContent:
        "space-between",

      alignItems: "center",

      gap: "15px",

      flexWrap: "wrap",

      borderBottom:
        `1px solid ${colors.border}`,
    },

    miniLabel: {
      color:
        colors.muted2,

      fontSize: "9px",

      letterSpacing: "1px",
    },

    domain: {
      marginTop: "4px",

      color:
        colors.text,

      fontSize: "15px",

      fontWeight: 700,

      wordBreak: "break-all",
    },

    finished: {
      padding:
        "6px 10px",

      borderRadius: "20px",

      background:
        "rgba(34,197,94,0.09)",

      color: "#22c55e",

      fontSize: "10px",

      fontWeight: 700,
    },

    resultGrid: {
      padding: "28px",

      display: "grid",

      gridTemplateColumns:
        "repeat(auto-fit, minmax(220px, 1fr))",

      gap: "28px",

      alignItems: "center",
    },

    scoreArea: {
      textAlign: "center",
    },

    scoreCircle: {
      width: "145px",

      height: "145px",

      margin: "0 auto",

      padding: "7px",

      boxSizing:
        "border-box",

      borderRadius: "50%",
    },

    scoreInside: {
      width: "100%",

      height: "100%",

      display: "flex",

      flexDirection:
        "column",

      alignItems: "center",

      justifyContent:
        "center",

      borderRadius: "50%",

      background:
        colors.cardStrong,
    },

    scoreNumber: {
      fontSize: "38px",

      fontWeight: 900,

      lineHeight: 1,
    },

    outOf: {
      marginTop: "4px",

      color:
        colors.muted,

      fontSize: "10px",
    },

    level: {
      marginTop: "12px",

      fontSize: "13px",

      fontWeight: 800,
    },

    scoreLabel: {
      marginTop: "3px",

      color:
        colors.muted2,

      fontSize: "9px",
    },

    checks: {
      display: "flex",

      flexDirection:
        "column",

      gap: "8px",
    },

    disclaimer: {
      padding:
        "14px 20px",

      borderTop:
        `1px solid ${colors.border}`,

      color:
        colors.muted2,

      fontSize: "9px",

      lineHeight: 1.55,
    },

    /* COMMUNITY */

    community: {
      maxWidth: "800px",

      margin:
        "18px auto 0",

      padding: "22px",

      boxSizing:
        "border-box",

      textAlign: "left",

      borderRadius: "20px",

      background:
        colors.cardStrong,

      border:
        `1px solid ${colors.border}`,
    },

    communityTop: {
      display: "flex",

      justifyContent:
        "space-between",

      alignItems: "center",

      gap: "15px",

      flexWrap: "wrap",
    },

    communityTitle: {
      margin:
        "5px 0 0",

      color:
        colors.text,

      fontSize: "18px",
    },

    average: {
      color:
        colors.muted,

      fontSize: "11px",
    },

    reviewForm: {
      marginTop: "18px",

      padding: "16px",

      borderRadius: "14px",

      background:
        colors.card,

      border:
        `1px solid ${colors.border}`,
    },

    formTitle: {
      color:
        colors.text,

      fontSize: "11px",

      fontWeight: 700,
    },

    stars: {
      display: "flex",

      margin:
        "7px 0 9px",

      gap: "1px",
    },

    star: {
      padding: 0,

      border: "none",

      background:
        "transparent",

      fontSize: "20px",

      cursor: "pointer",
    },

    textarea: {
      width: "100%",

      minHeight: "80px",

      boxSizing:
        "border-box",

      padding: "11px",

      resize: "vertical",

      outline: "none",

      borderRadius: "10px",

      border:
        `1px solid ${colors.border}`,

      background:
        colors.input,

      color:
        colors.text,

      fontFamily:
        "inherit",

      fontSize: "11px",
    },

    reviewBottom: {
      marginTop: "8px",

      display: "flex",

      justifyContent:
        "space-between",

      alignItems: "center",
    },

    counter: {
      color:
        colors.muted2,

      fontSize: "9px",
    },

    smallCta: {
      padding:
        "8px 12px",

      border: "none",

      borderRadius: "8px",

      background:
        colors.accent,

      color: "#ffffff",

      fontSize: "10px",

      fontWeight: 800,

      cursor: "pointer",
    },

    reviewMessage: {
      marginTop: "8px",

      color:
        colors.accent,

      fontSize: "10px",
    },

    reviewList: {
      marginTop: "16px",

      display: "flex",

      flexDirection:
        "column",

      gap: "8px",
    },

    empty: {
      padding: "20px",

      textAlign: "center",

      color:
        colors.muted,

      fontSize: "10px",
    },

    review: {
      padding: "14px",

      borderRadius: "12px",

      background:
        colors.card,

      border:
        `1px solid ${colors.border}`,
    },

    reviewHeader: {
      display: "flex",

      justifyContent:
        "space-between",

      gap: "12px",

      flexWrap: "wrap",
    },

    reviewUser: {
      color:
        colors.text,

      fontSize: "10px",
    },

    reviewDate: {
      marginTop: "2px",

      color:
        colors.muted2,

      fontSize: "8px",
    },

    reviewText: {
      margin:
        "9px 0 0",

      color:
        colors.muted,

      fontSize: "10px",

      lineHeight: 1.6,

      whiteSpace:
        "pre-wrap",
    },

    /* SECTIONS */

    section: {
      maxWidth: "900px",

      margin: "0 auto",

      padding:
        "82px 24px",

      textAlign: "center",

      borderTop:
        `1px solid ${colors.border}`,
    },

    sectionLabel: {
      color:
        colors.accent,

      fontSize: "9px",

      fontWeight: 800,

      letterSpacing:
        "1.3px",
    },

    sectionTitle: {
      margin:
        "12px 0 0",

      color:
        colors.text,

      fontSize:
        "clamp(28px, 4vw, 39px)",

      lineHeight: 1.1,

      letterSpacing:
        "-1.5px",
    },

    sectionIntro: {
      maxWidth: "540px",

      margin:
        "14px auto 0",

      color:
        colors.muted,

      fontSize: "12px",

      lineHeight: 1.7,
    },

    threeGrid: {
      marginTop: "40px",

      display: "grid",

      gridTemplateColumns:
        "repeat(auto-fit, minmax(220px, 1fr))",

      gap: "14px",

      textAlign: "left",
    },

    sectionCard: {
      minHeight: "150px",

      padding: "22px",

      boxSizing:
        "border-box",

      borderRadius: "18px",

      background:
        colors.card,

      border:
        `1px solid ${colors.border}`,
    },

    sectionNumber: {
      marginBottom: "26px",

      color:
        colors.accent,

      fontSize: "9px",

      fontWeight: 800,
    },

    sectionCardTitle: {
      margin: 0,

      color:
        colors.text,

      fontSize: "14px",
    },

    sectionCardText: {
      margin:
        "6px 0 0",

      color:
        colors.muted,

      fontSize: "10px",

      lineHeight: 1.65,
    },

    fourGrid: {
      marginTop: "40px",

      display: "grid",

      gridTemplateColumns:
        "repeat(auto-fit, minmax(180px, 1fr))",

      gap: "14px",

      textAlign: "left",
    },

    smallCard: {
      padding: "21px",

      borderRadius: "18px",

      background:
        colors.card,

      border:
        `1px solid ${colors.border}`,
    },

    smallIcon: {
      width: "35px",

      height: "35px",

      display: "flex",

      alignItems: "center",

      justifyContent:
        "center",

      marginBottom: "18px",

      borderRadius: "10px",

      fontSize: "10px",

      fontWeight: 900,
    },

    smallTitle: {
      margin: 0,

      color:
        colors.text,

      fontSize: "13px",
    },

    smallText: {
      margin:
        "6px 0 0",

      color:
        colors.muted,

      fontSize: "10px",

      lineHeight: 1.6,
    },

    notice: {
      maxWidth: "690px",

      margin:
        "32px auto 0",

      padding:
        "15px 17px",

      textAlign: "left",

      borderRadius: "12px",

      background:
        colors.accentSoft,

      border:
        `1px solid ${colors.border}`,

      color:
        colors.muted,

      fontSize: "10px",

      lineHeight: 1.6,
    },

    /* FAQ */

    faqList: {
      maxWidth: "700px",

      margin:
        "36px auto 0",

      display: "flex",

      flexDirection:
        "column",

      gap: "8px",

      textAlign: "left",
    },

    faqItem: {
      padding:
        "0 17px",

      borderRadius: "13px",

      background:
        colors.card,

      border:
        `1px solid ${colors.border}`,
    },

    faqQuestion: {
      padding:
        "17px 0",

      color:
        colors.text,

      fontSize: "11px",

      fontWeight: 700,

      cursor: "pointer",
    },

    faqAnswer: {
      margin: 0,

      padding:
        "0 0 17px",

      color:
        colors.muted,

      fontSize: "10px",

      lineHeight: 1.7,
    },

    /* CONTACT */

    contactBox: {
      padding:
        "45px 25px",

      borderRadius: "20px",

      background:
        colors.card,

      border:
        `1px solid ${colors.border}`,
    },

    contactTitle: {
      margin:
        "10px 0 0",

      color:
        colors.text,

      fontSize: "31px",

      letterSpacing: "-1px",
    },

    contactText: {
      maxWidth: "480px",

      margin:
        "12px auto 0",

      color:
        colors.muted,

      fontSize: "11px",

      lineHeight: 1.7,
    },

    contactButton: {
      marginTop: "22px",

      padding:
        "11px 17px",

      border: "none",

      borderRadius: "10px",

      background:
        colors.accent,

      color: "#ffffff",

      fontSize: "11px",

      fontWeight: 800,

      cursor: "pointer",
    },

    /* FOOTER */

    footer: {
      padding:
        "35px 32px 20px",

      borderTop:
        `1px solid ${colors.border}`,
    },

    footerTop: {
      maxWidth: "900px",

      margin: "0 auto",

      display: "flex",

      justifyContent:
        "space-between",

      alignItems: "center",

      gap: "25px",

      flexWrap: "wrap",
    },

    footerLogo: {
      color:
        colors.text,

      fontSize: "18px",

      fontWeight: 900,
    },

    footerLinks: {
      display: "flex",

      flexWrap: "wrap",

      gap: "14px",
    },

    footerLink: {
      border: "none",

      padding: 0,

      background:
        "transparent",

      color:
        colors.muted,

      fontSize: "9px",

      cursor: "pointer",
    },

    copyright: {
      maxWidth: "900px",

      margin:
        "28px auto 0",

      paddingTop: "16px",

      borderTop:
        `1px solid ${colors.border}`,

      textAlign: "center",

      color:
        colors.muted2,

      fontSize: "8px",
    },

    /* COOKIES */

    cookieOverlay: {
      position: "fixed",

      left: 0,
      right: 0,
      bottom: 0,

      zIndex: 9999,

      padding:
        "18px 20px",

      pointerEvents: "none",
    },

    cookieBanner: {
      maxWidth: "850px",

      margin: "0 auto",

      boxSizing:
        "border-box",

      padding: "18px",

      display: "flex",

      justifyContent:
        "space-between",

      alignItems: "center",

      gap: "20px",

      flexWrap: "wrap",

      borderRadius: "17px",

      background:
        colors.cardStrong,

      border:
        `1px solid ${colors.border}`,

      boxShadow:
        "0 20px 80px rgba(0,0,0,0.45)",

      pointerEvents: "auto",
    },

    cookieContent: {
      flex: 1,

      minWidth: "240px",

      textAlign: "left",
    },

    cookieTitle: {
      color:
        colors.text,

      fontSize: "13px",
    },

    cookieText: {
      maxWidth: "580px",

      margin:
        "7px 0 0",

      color:
        colors.muted,

      fontSize: "10px",

      lineHeight: 1.6,
    },

    cookiePolicyLink: {
      marginTop: "7px",

      padding: 0,

      border: "none",

      background:
        "transparent",

      color:
        colors.accent,

      fontSize: "9px",

      fontWeight: 700,

      cursor: "pointer",
    },

    cookieButtons: {
      display: "flex",

      alignItems: "center",

      gap: "8px",
    },

    cookieRefuse: {
      padding:
        "10px 15px",

      borderRadius: "10px",

      border:
        `1px solid ${colors.border}`,

      background:
        colors.card,

      color:
        colors.text,

      fontSize: "10px",

      fontWeight: 700,

      cursor: "pointer",
    },

    cookieAccept: {
      padding:
        "10px 15px",

      borderRadius: "10px",

      border: "none",

      background:
        colors.accent,

      color: "#ffffff",

      fontSize: "10px",

      fontWeight: 800,

      cursor: "pointer",
    },
  };
}