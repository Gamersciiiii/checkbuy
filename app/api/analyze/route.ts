import { NextResponse } from "next/server";
import { lookup } from "dns/promises";
import net from "net";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/* =========================================================
   CONFIGURATION
========================================================= */

const FREE_ANALYSIS_LIMIT = 3;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/* =========================================================
   TYPES
========================================================= */

type CheckStatus =
  | "good"
  | "warning"
  | "bad";

type Check = {
  title: string;
  description: string;
  status: CheckStatus;
};

type DomainAgeResult = {
  years: number | null;
  domainUsed: string | null;
};

/* =========================================================
   IP PRIVÉES / LOCALES
========================================================= */

function isPrivateIPv4(ip: string) {
  const parts = ip
    .split(".")
    .map(Number);

  if (
    parts.length !== 4 ||
    parts.some(Number.isNaN)
  ) {
    return true;
  }

  const [a, b] = parts;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 &&
      b >= 64 &&
      b <= 127) ||
    (a === 169 &&
      b === 254) ||
    (a === 172 &&
      b >= 16 &&
      b <= 31) ||
    (a === 192 &&
      b === 168) ||
    a >= 224
  );
}

function isPrivateIPv6(ip: string) {
  const normalized =
    ip.toLowerCase();

  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  );
}

async function validateHost(
  hostname: string
) {
  const host =
    hostname.toLowerCase();

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local")
  ) {
    throw new Error(
      "Adresse locale interdite."
    );
  }

  if (net.isIP(host)) {
    if (
      (net.isIPv4(host) &&
        isPrivateIPv4(host)) ||
      (net.isIPv6(host) &&
        isPrivateIPv6(host))
    ) {
      throw new Error(
        "Adresse IP privée interdite."
      );
    }

    return;
  }

  const addresses =
    await lookup(host, {
      all: true,
    });

  if (addresses.length === 0) {
    throw new Error(
      "Domaine introuvable."
    );
  }

  for (const address of addresses) {
    if (
      (address.family === 4 &&
        isPrivateIPv4(
          address.address
        )) ||
      (address.family === 6 &&
        isPrivateIPv6(
          address.address
        ))
    ) {
      throw new Error(
        "Ce domaine pointe vers une adresse privée."
      );
    }
  }
}

/* =========================================================
   ÂGE DU DOMAINE
========================================================= */

async function getDomainAge(
  hostname: string
): Promise<DomainAgeResult> {
  const cleanHost = hostname
    .toLowerCase()
    .replace(/^www\./, "");

  const parts =
    cleanHost.split(".");

  const candidates: string[] =
    [];

  for (
    let i = 0;
    i <= parts.length - 2;
    i++
  ) {
    candidates.push(
      parts.slice(i).join(".")
    );
  }

  for (
    const candidate of candidates
  ) {
    try {
      const response =
        await fetch(
          `https://rdap.org/domain/${encodeURIComponent(
            candidate
          )}`,
          {
            headers: {
              Accept:
                "application/rdap+json, application/json",
            },

            signal:
              AbortSignal.timeout(
                5000
              ),
          }
        );

      if (!response.ok) {
        continue;
      }

      const data =
        await response.json();

      const events =
        Array.isArray(
          data.events
        )
          ? data.events
          : [];

      const registrationEvent =
        events.find(
          (event: {
            eventAction?: string;
            eventDate?: string;
          }) =>
            event.eventAction ===
              "registration" ||
            event.eventAction ===
              "registered"
        );

      if (
        !registrationEvent?.eventDate
      ) {
        continue;
      }

      const registrationDate =
        new Date(
          registrationEvent.eventDate
        );

      if (
        Number.isNaN(
          registrationDate.getTime()
        )
      ) {
        continue;
      }

      const ageMs =
        Date.now() -
        registrationDate.getTime();

      const years =
        ageMs /
        (
          1000 *
          60 *
          60 *
          24 *
          365.25
        );

      return {
        years,
        domainUsed:
          candidate,
      };
    } catch {
      // On essaye le domaine suivant.
    }
  }

  return {
    years: null,
    domainUsed: null,
  };
}

/* =========================================================
   LECTURE HTML LIMITÉE
========================================================= */

async function readBodyLimited(
  response: Response,
  maxBytes = 300_000
) {
  if (!response.body) {
    return "";
  }

  const reader =
    response.body.getReader();

  const decoder =
    new TextDecoder();

  let result = "";
  let total = 0;

  while (total < maxBytes) {
    const {
      done,
      value,
    } =
      await reader.read();

    if (done) {
      break;
    }

    if (!value) {
      continue;
    }

    total +=
      value.byteLength;

    result +=
      decoder.decode(
        value,
        {
          stream: true,
        }
      );

    if (
      total >= maxBytes
    ) {
      break;
    }
  }

  try {
    await reader.cancel();
  } catch {
    // Rien à faire.
  }

  return result;
}

/* =========================================================
   FETCH SÉCURISÉ
========================================================= */

async function safeFetch(
  startUrl: URL
) {
  let currentUrl =
    new URL(
      startUrl.toString()
    );

  const redirects: string[] =
    [];

  for (
    let i = 0;
    i <= 5;
    i++
  ) {
    await validateHost(
      currentUrl.hostname
    );

    const response =
      await fetch(
        currentUrl,
        {
          method: "GET",

          redirect:
            "manual",

          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; CheckBuy/1.0)",

            Accept:
              "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",

            "Accept-Language":
              "fr-FR,fr;q=0.9,en;q=0.7",
          },

          signal:
            AbortSignal.timeout(
              8000
            ),
        }
      );

    if (
      response.status >= 300 &&
      response.status < 400
    ) {
      const location =
        response.headers.get(
          "location"
        );

      if (!location) {
        return {
          response,
          finalUrl:
            currentUrl,
          redirects,
        };
      }

      if (
        redirects.length >= 5
      ) {
        throw new Error(
          "Trop de redirections."
        );
      }

      const nextUrl =
        new URL(
          location,
          currentUrl
        );

      if (
        nextUrl.protocol !==
          "http:" &&
        nextUrl.protocol !==
          "https:"
      ) {
        throw new Error(
          "Redirection vers un protocole interdit."
        );
      }

      redirects.push(
        nextUrl.toString()
      );

      currentUrl =
        nextUrl;

      continue;
    }

    return {
      response,
      finalUrl:
        currentUrl,
      redirects,
    };
  }

  throw new Error(
    "Trop de redirections."
  );
}

/* =========================================================
   STRUCTURE URL
========================================================= */

function scoreUrlStructure(
  url: URL,
  checks: Check[]
) {
  let score = 15;

  const hostname =
    url.hostname.toLowerCase();

  const suspiciousTerms = [
    "verify-account",
    "account-verify",
    "confirm-account",
    "wallet-connect",
    "claim-prize",
    "free-gift",
    "crypto-airdrop",
    "urgent-login",
    "security-check-login",
  ];

  if (
    net.isIP(hostname)
  ) {
    score -= 10;

    checks.push({
      title:
        "Adresse IP utilisée",

      description:
        "Le site utilise directement une adresse IP au lieu d'un nom de domaine.",

      status:
        "warning",
    });
  }

  const fullUrl =
    url
      .toString()
      .toLowerCase();

  const suspiciousWord =
    suspiciousTerms.find(
      (term) =>
        fullUrl.includes(
          term
        )
    );

  if (suspiciousWord) {
    score -= 8;

    checks.push({
      title:
        "URL suspecte",

      description:
        "L'adresse contient des termes souvent utilisés dans des liens frauduleux.",

      status: "bad",
    });
  }

  if (
    fullUrl.length > 180
  ) {
    score -= 3;
  }

  const labels =
    hostname.split(".");

  if (
    labels.length >= 6
  ) {
    score -= 3;
  }

  score =
    Math.max(
      0,
      Math.min(15, score)
    );

  if (score >= 13) {
    checks.push({
      title:
        "Adresse du site",

      description:
        "La structure de l'URL ne présente pas de signal suspect évident.",

      status: "good",
    });
  } else if (
    !suspiciousWord
  ) {
    checks.push({
      title:
        "Adresse complexe",

      description:
        "L'adresse du site est plus complexe que la normale.",

      status:
        "warning",
    });
  }

  return score;
}

/* =========================================================
   CONTENU
========================================================= */

function analyzeContent(
  html: string,
  checks: Check[]
) {
  if (!html) {
    checks.push({
      title:
        "Informations du site",

      description:
        "CheckBuy n'a pas pu analyser suffisamment le contenu de la page.",

      status:
        "warning",
    });

    return {
      identityScore: 6,
      scamScore: 10,
    };
  }

  const text = html
    .toLowerCase()
    .replace(/\s+/g, " ");

  const identitySignals = [
    [
      "mentions légales",
      "legal notice",
      "legal information",
      "imprint",
    ],

    [
      "politique de confidentialité",
      "privacy policy",
      "privacy",
    ],

    [
      "conditions générales",
      "terms of service",
      "terms and conditions",
      "terms",
    ],

    [
      "contact",
      "contact us",
      "nous contacter",
      "customer service",
    ],
  ];

  let identityFound = 0;

  for (
    const group of identitySignals
  ) {
    if (
      group.some(
        (word) =>
          text.includes(
            word
          )
      )
    ) {
      identityFound++;
    }
  }

  const identityScore =
    Math.min(
      10,
      5 +
        identityFound *
          1.25
    );

  if (
    identityFound >= 3
  ) {
    checks.push({
      title:
        "Informations de confiance",

      description:
        "Plusieurs éléments d'identité, de contact ou de confidentialité ont été trouvés.",

      status: "good",
    });
  } else if (
    identityFound >= 1
  ) {
    checks.push({
      title:
        "Informations du site",

      description:
        "Certaines informations de contact ou juridiques ont été trouvées.",

      status: "good",
    });
  } else {
    checks.push({
      title:
        "Informations limitées",

      description:
        "Peu d'informations juridiques ou de contact ont été détectées automatiquement.",

      status:
        "warning",
    });
  }

  const strongScamSignals = [
    "send us your seed phrase",
    "enter your seed phrase",
    "recovery phrase",
    "pay with gift card",
    "payment by gift card only",
    "send bitcoin to",
    "send crypto to",
    "guaranteed investment return",
    "guaranteed crypto return",
    "claim your prize now",
  ];

  const foundScamSignals =
    strongScamSignals.filter(
      (term) =>
        text.includes(
          term
        )
    );

  let scamScore = 10;

  if (
    foundScamSignals.length === 1
  ) {
    scamScore = 5;

    checks.push({
      title:
        "Expression suspecte détectée",

      description:
        "Le contenu contient une formulation pouvant être associée à une fraude.",

      status:
        "warning",
    });
  }

  if (
    foundScamSignals.length >= 2
  ) {
    scamScore = 0;

    checks.push({
      title:
        "Plusieurs signaux suspects",

      description:
        "Plusieurs formulations fortement associées aux arnaques ont été détectées.",

      status: "bad",
    });
  }

  if (
    foundScamSignals.length === 0
  ) {
    checks.push({
      title:
        "Contenu analysé",

      description:
        "Aucun signal de fraude évident n'a été détecté dans le contenu analysé.",

      status: "good",
    });
  }

  return {
    identityScore,
    scamScore,
  };
}

/* =========================================================
   ROUTE POST
========================================================= */

export async function POST(
  request: Request
) {
  try {
    /* =====================================================
       1. COMPTE CONNECTÉ
    ===================================================== */

    const authHeader =
      request.headers.get(
        "authorization"
      );

    if (
      !authHeader ||
      !authHeader.startsWith(
        "Bearer "
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Connecte-toi pour analyser un site.",
        },
        {
          status: 401,
        }
      );
    }

    const accessToken =
      authHeader.replace(
        "Bearer ",
        ""
      );

    const supabaseAuth =
      createClient(
        process.env
          .NEXT_PUBLIC_SUPABASE_URL!,

        process.env
          .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,

        {
          auth: {
            persistSession:
              false,

            autoRefreshToken:
              false,
          },
        }
      );

    const {
      data: { user },
      error: userError,
    } =
      await supabaseAuth.auth.getUser(
        accessToken
      );

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            "Ta session a expiré. Reconnecte-toi.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       2. PREMIUM
    ===================================================== */

    const {
      data: subscription,
      error:
        subscriptionError,
    } =
      await supabaseAdmin
        .from(
          "subscriptions"
        )
        .select("status")
        .eq(
          "user_id",
          user.id
        )
        .maybeSingle();

    if (
      subscriptionError
    ) {
      console.error(
        "Erreur vérification Premium :",
        subscriptionError
      );
    }

    const isPremium =
      subscription?.status ===
        "active" ||
      subscription?.status ===
        "trialing";

    /* =====================================================
       3. QUOTA FREE
    ===================================================== */

    let freeUsage = 0;

    if (!isPremium) {
      const since =
        new Date(
          Date.now() -
            24 *
              60 *
              60 *
              1000
        ).toISOString();

      const {
        count,
        error:
          countError,
      } =
        await supabaseAdmin
          .from(
            "analysis_history"
          )
          .select(
            "id",
            {
              count:
                "exact",

              head: true,
            }
          )
          .eq(
            "user_id",
            user.id
          )
          .gte(
            "created_at",
            since
          );

      if (countError) {
        console.error(
          "Erreur quota :",
          countError
        );

        return NextResponse.json(
          {
            error:
              "Impossible de vérifier ton quota d'analyses.",
          },
          {
            status: 500,
          }
        );
      }

      freeUsage =
        count ?? 0;

      if (
        freeUsage >=
        FREE_ANALYSIS_LIMIT
      ) {
        return NextResponse.json(
          {
            error:
              "Tu as utilisé tes 3 analyses gratuites du jour. Passe à Premium pour continuer sans limite.",

            code:
              "FREE_LIMIT_REACHED",

            limit:
              FREE_ANALYSIS_LIMIT,

            used:
              freeUsage,

            remaining: 0,
          },
          {
            status: 429,
          }
        );
      }
    }

    /* =====================================================
       4. URL
    ===================================================== */

    const body =
      await request.json();

    const input =
      body.url;

    if (
      !input ||
      typeof input !==
        "string"
    ) {
      return NextResponse.json(
        {
          error:
            "URL manquante.",
        },
        {
          status: 400,
        }
      );
    }

    let url: URL;

    try {
      url =
        new URL(
          input.trim()
        );

      if (
        url.protocol !==
          "http:" &&
        url.protocol !==
          "https:"
      ) {
        throw new Error();
      }
    } catch {
      return NextResponse.json(
        {
          error:
            "URL invalide. Exemple : https://google.com",
        },
        {
          status: 400,
        }
      );
    }

    await validateHost(
      url.hostname
    );

    const checks: Check[] =
      [];

    let score = 0;

    /* =====================================================
       5. HTTPS — 20
    ===================================================== */

    if (
      url.protocol ===
      "https:"
    ) {
      score += 20;

      checks.push({
        title:
          "Connexion sécurisée",

        description:
          "Le site utilise HTTPS pour chiffrer la connexion.",

        status: "good",
      });
    } else {
      checks.push({
        title:
          "Connexion non sécurisée",

        description:
          "Le site utilise HTTP au lieu de HTTPS.",

        status: "bad",
      });
    }

    /* =====================================================
       6. STRUCTURE URL — 15
    ===================================================== */

    score +=
      scoreUrlStructure(
        url,
        checks
      );

    /* =====================================================
       7. ÂGE DU DOMAINE — 20
    ===================================================== */

    const domainAge =
      await getDomainAge(
        url.hostname
      );

    if (
      domainAge.years ===
      null
    ) {
      score += 10;

      checks.push({
        title:
          "Âge du domaine inconnu",

        description:
          "CheckBuy n'a pas pu déterminer avec certitude la date de création du domaine.",

        status:
          "warning",
      });
    } else {
      const years =
        domainAge.years;

      if (
        years >= 5
      ) {
        score += 20;

        checks.push({
          title:
            "Domaine ancien",

          description:
            `Ce domaine existe depuis environ ${Math.floor(
              years
            )} ans.`,

          status:
            "good",
        });
      } else if (
        years >= 2
      ) {
        score += 18;

        checks.push({
          title:
            "Domaine établi",

          description:
            "Le domaine existe depuis plusieurs années.",

          status:
            "good",
        });
      } else if (
        years >= 1
      ) {
        score += 15;

        checks.push({
          title:
            "Domaine relativement récent",

          description:
            "Le domaine existe depuis plus d'un an.",

          status:
            "good",
        });
      } else if (
        years >= 0.5
      ) {
        score += 11;

        checks.push({
          title:
            "Domaine récent",

          description:
            "Le domaine existe depuis moins d'un an.",

          status:
            "warning",
        });
      } else if (
        years >= 0.25
      ) {
        score += 7;

        checks.push({
          title:
            "Domaine très récent",

          description:
            "Le domaine a seulement quelques mois.",

          status:
            "warning",
        });
      } else {
        score += 2;

        checks.push({
          title:
            "Domaine tout récent",

          description:
            "Le domaine semble avoir été enregistré très récemment.",

          status: "bad",
        });
      }
    }

    /* =====================================================
       8. CHARGEMENT DU SITE
    ===================================================== */

    let response: Response;
    let finalUrl: URL;
    let redirects: string[];

    try {
      const result =
        await safeFetch(url);

      response =
        result.response;

      finalUrl =
        result.finalUrl;

      redirects =
        result.redirects;
    } catch {
      checks.push({
        title:
          "Site difficile à joindre",

        description:
          "CheckBuy n'a pas réussi à charger correctement le site.",

        status: "bad",
      });

      return NextResponse.json(
        {
          score:
            Math.min(
              100,
              Math.max(
                0,
                Math.round(
                  score
                )
              )
            ),

          level:
            "Risque élevé",

          domain:
            url.hostname,

          finalUrl:
            url.toString(),

          statusCode: 0,

          domainAgeYears:
            domainAge.years,

          redirects: [],

          checks,

          premium:
            isPremium,
        }
      );
    }

    /* =====================================================
       9. ACCESSIBILITÉ — 10
    ===================================================== */

    if (
      response.status >=
        200 &&
      response.status <
        400
    ) {
      score += 10;

      checks.push({
        title:
          "Site accessible",

        description:
          `Le serveur répond normalement (HTTP ${response.status}).`,

        status: "good",
      });
    } else if (
      response.status ===
        401 ||
      response.status ===
        403
    ) {
      score += 8;

      checks.push({
        title:
          "Accès protégé",

        description:
          `Le serveur répond mais limite l'accès automatisé (HTTP ${response.status}).`,

        status: "good",
      });
    } else if (
      response.status >=
        400 &&
      response.status <
        500
    ) {
      score += 4;

      checks.push({
        title:
          "Erreur du site",

        description:
          `Le serveur répond avec le code HTTP ${response.status}.`,

        status:
          "warning",
      });
    } else {
      score += 2;

      checks.push({
        title:
          "Problème serveur",

        description:
          `Le serveur répond avec le code HTTP ${response.status}.`,

        status:
          "warning",
      });
    }

    /* =====================================================
       10. REDIRECTIONS — 5
    ===================================================== */

    if (
      redirects.length === 0
    ) {
      score += 5;

      checks.push({
        title:
          "Pas de redirection suspecte",

        description:
          "L'adresse mène directement au site analysé.",

        status: "good",
      });
    } else {
      const originalHost =
        url.hostname.replace(
          /^www\./,
          ""
        );

      const finalHost =
        finalUrl.hostname.replace(
          /^www\./,
          ""
        );

      if (
        originalHost ===
        finalHost
      ) {
        score += 5;

        checks.push({
          title:
            "Redirection normale",

          description:
            "Le site effectue une redirection interne normale.",

          status: "good",
        });
      } else if (
        redirects.length <=
        2
      ) {
        score += 3;

        checks.push({
          title:
            "Redirection externe",

          description:
            "Le site redirige vers un autre domaine.",

          status:
            "warning",
        });
      } else {
        score += 1;

        checks.push({
          title:
            "Plusieurs redirections",

          description:
            "Plusieurs changements d'adresse ont été détectés.",

          status:
            "warning",
        });
      }
    }

    /* =====================================================
       11. HEADERS — 10
    ===================================================== */

    let headerScore = 5;

    const headers =
      response.headers;

    const securityHeaders = [
      "strict-transport-security",
      "content-security-policy",
      "x-content-type-options",
      "x-frame-options",
      "referrer-policy",
    ];

    let headersFound = 0;

    for (
      const header of securityHeaders
    ) {
      if (
        headers.has(header)
      ) {
        headersFound++;
      }
    }

    headerScore +=
      headersFound;

    headerScore =
      Math.min(
        10,
        headerScore
      );

    score +=
      headerScore;

    if (
      headersFound >= 4
    ) {
      checks.push({
        title:
          "Bonne configuration de sécurité",

        description:
          "Plusieurs protections HTTP importantes sont activées.",

        status: "good",
      });
    } else if (
      headersFound >= 2
    ) {
      checks.push({
        title:
          "Sécurité HTTP correcte",

        description:
          "Le site utilise plusieurs protections HTTP.",

        status: "good",
      });
    } else {
      checks.push({
        title:
          "Protections HTTP limitées",

        description:
          "Peu de headers de sécurité ont été détectés, sans que cela signifie forcément que le site est dangereux.",

        status:
          "warning",
      });
    }

    /* =====================================================
       12. CONTENU — 20
    ===================================================== */

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    let html = "";

    if (
      contentType.includes(
        "text/html"
      ) ||
      contentType.includes(
        "text/plain"
      )
    ) {
      try {
        html =
          await readBodyLimited(
            response
          );
      } catch {
        html = "";
      }
    }

    const contentResult =
      analyzeContent(
        html,
        checks
      );

    score +=
      contentResult.identityScore;

    score +=
      contentResult.scamScore;

    /* =====================================================
       13. SCORE FINAL
    ===================================================== */

    score =
      Math.round(
        Math.max(
          0,
          Math.min(
            100,
            score
          )
        )
      );

    let level: string;

    if (
      score >= 90
    ) {
      level =
        "Excellent";
    } else if (
      score >= 80
    ) {
      level =
        "Bon niveau";
    } else if (
      score >= 65
    ) {
      level =
        "À vérifier";
    } else if (
      score >= 45
    ) {
      level =
        "Prudence";
    } else {
      level =
        "Risque élevé";
    }

    const finalResult = {
      score,
      level,

      domain:
        url.hostname,

      finalUrl:
        finalUrl.toString(),

      statusCode:
        response.status,

      domainAgeYears:
        domainAge.years,

      redirects,

      checks,
    };

    /* =====================================================
       14. HISTORIQUE
    ===================================================== */

    const {
      error:
        historyError,
    } =
      await supabaseAdmin
        .from(
          "analysis_history"
        )
        .insert({
          user_id:
            user.id,

          domain:
            finalResult.domain,

          url:
            finalResult.finalUrl,

          score:
            finalResult.score,

          level:
            finalResult.level,
        });

    if (historyError) {
      console.error(
        "Erreur historique :",
        historyError
      );
    }

    /* =====================================================
       15. RÉPONSE
    ===================================================== */

    return NextResponse.json({
      ...finalResult,

      premium:
        isPremium,

      usage:
        isPremium
          ? {
              unlimited:
                true,

              used: null,

              remaining:
                null,
            }
          : {
              unlimited:
                false,

              limit:
                FREE_ANALYSIS_LIMIT,

              used:
                freeUsage +
                1,

              remaining:
                Math.max(
                  0,

                  FREE_ANALYSIS_LIMIT -
                    freeUsage -
                    1
                ),
            },
    });
  } catch (error) {
    console.error(
      "Erreur CheckBuy :",
      error
    );

    return NextResponse.json(
      {
        error:
          "Impossible d'analyser ce site pour le moment.",
      },
      {
        status: 500,
      }
    );
  }
}