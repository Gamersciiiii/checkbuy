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

type Language =
  | "fr"
  | "en"
  | "es"
  | "zh";

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

/* =========================================================
   THÈMES
========================================================= */

const THEMES: Record<
  ThemeName,
  Colors
> = {
  chaud: {
    background: "#100d0b",
    backgroundSecondary: "#17110e",
    card: "#18120f",
    cardStrong: "#201713",
    text: "#fff8f4",
    muted: "#aa9a91",
    subtle: "#756961",
    border: "rgba(255,125,66,0.16)",
    accent: "#ff7d42",
    accentSoft: "rgba(255,125,66,0.10)",
    buttonText: "#130c08",
  },

  sombre: {
    background: "#090b0f",
    backgroundSecondary: "#0e1117",
    card: "#11151c",
    cardStrong: "#161b24",
    text: "#f8fafc",
    muted: "#94a3b8",
    subtle: "#64748b",
    border: "rgba(255,255,255,0.08)",
    accent: "#f1f5f9",
    accentSoft: "rgba(255,255,255,0.07)",
    buttonText: "#090b0f",
  },

  clair: {
    background: "#f7f7f5",
    backgroundSecondary: "#ffffff",
    card: "#ffffff",
    cardStrong: "#f5f5f2",
    text: "#171717",
    muted: "#666666",
    subtle: "#8b8b8b",
    border: "rgba(0,0,0,0.09)",
    accent: "#111111",
    accentSoft: "rgba(0,0,0,0.05)",
    buttonText: "#ffffff",
  },

  froid: {
    background: "#080d14",
    backgroundSecondary: "#0c131d",
    card: "#101923",
    cardStrong: "#14202c",
    text: "#f4f9ff",
    muted: "#8fa4b8",
    subtle: "#667b90",
    border: "rgba(91,167,255,0.15)",
    accent: "#60a5fa",
    accentSoft: "rgba(96,165,250,0.10)",
    buttonText: "#07101a",
  },
};

/* =========================================================
   TRADUCTIONS
========================================================= */

const TRANSLATIONS = {
  fr: {
    verifyBeforeBuying: "Vérifiez avant d'acheter",
    heroLine1: "Achetez en toute",
    heroLine2: "confiance.",
    subtitle:
      "Analysez un site avant votre achat et détectez les premiers signes de risque en quelques secondes.",
    placeholder: "https://exemple.com",
    verify: "Vérifier",
    analyzing: "Analyse...",
    analysisRunning: "Analyse en cours",
    analysisRunningText:
      "CheckBuy vérifie le site et ses caractéristiques techniques.",
    analyzedSite: "SITE ANALYSÉ",
    analysisComplete: "✓ Analyse terminée",
    scoreLabel: "Score CheckBuy",
    excellent: "Excellent",
    good: "Bon",
    verifyLevel: "À vérifier",
    caution: "Prudence",
    highRisk: "Risque élevé",
    disclaimer:
      "Le score CheckBuy est basé sur des critères techniques. Il constitue une aide avant achat et ne garantit pas qu'un vendeur, un produit ou un site est fiable.",
    community: "COMMUNAUTÉ",
    reviewsOn: "Avis sur",
    yourReview: "Votre avis",
    reviewPlaceholder:
      "Partagez votre expérience avec ce site...",
    publishReview: "Publier l'avis",
    saving: "Enregistrement...",
    loginToReview:
      "Connectez-vous pour publier un avis.",
    login: "Se connecter",
    noReviews: "Aucun avis pour le moment.",
    loadingReviews: "Chargement des avis...",
    premium: "Premium",
    premiumActive: "Premium ✓",
    appearance: "Apparence",
    account: "Mon compte",
    freeRemaining: "analyse(s) gratuite(s) restante(s) sur les dernières 24 h.",
    unlimited: "Compte Premium — analyses illimitées.",
    feature1Title: "Score de confiance",
    feature1Text:
      "Obtenez un score clair sur 100 pour évaluer rapidement les signaux techniques d'un site.",
    feature2Title: "Sécurité",
    feature2Text:
      "CheckBuy vérifie plusieurs éléments techniques pour repérer les premiers signaux de risque.",
    feature3Title: "Avis communautaires",
    feature3Text:
      "Consultez les expériences partagées par les utilisateurs de CheckBuy avant votre achat.",
    simpleFast: "SIMPLE ET RAPIDE",
    howItWorks: "Comment ça marche ?",
    step1Title: "Collez le lien",
    step1Text:
      "Copiez l'adresse du site sur lequel vous envisagez d'acheter.",
    step2Title: "Lancez l'analyse",
    step2Text:
      "CheckBuy examine différents signaux techniques du site.",
    step3Title: "Consultez le résultat",
    step3Text:
      "Vous obtenez un score sur 100, les contrôles détaillés et les avis de la communauté.",
    beforeBuying: "AVANT D'ACHETER",
    whyCheckBuy: "Pourquoi CheckBuy ?",
    why1Title: "Un résultat compréhensible",
    why1Text:
      "Pas besoin d'être expert en cybersécurité : les contrôles sont présentés simplement.",
    why2Title: "Une analyse indépendante",
    why2Text:
      "Le score repose sur les critères techniques analysés par CheckBuy.",
    why3Title: "Une communauté",
    why3Text:
      "Les avis utilisateurs apportent un complément au résultat technique.",
    why4Title: "Une aide avant achat",
    why4Text:
      "CheckBuy vous aide à repérer les points de vigilance avant de transmettre vos informations ou de payer.",
    faqEyebrow: "QUESTIONS FRÉQUENTES",
    faqTitle: "Questions fréquentes",
    faq1Q: "CheckBuy garantit-il qu'un site est fiable ?",
    faq1A:
      "Non. CheckBuy fournit une analyse basée sur différents signaux techniques et les avis de la communauté. Le résultat constitue une aide à la décision, pas une garantie.",
    faq2Q:
      "Combien d'analyses puis-je faire gratuitement ?",
    faq2A:
      "Un compte gratuit peut effectuer jusqu'à 3 analyses sur une période glissante de 24 heures.",
    faq3Q: "Que donne CheckBuy Premium ?",
    faq3A:
      "Premium permet notamment d'effectuer des analyses sans la limite du compte gratuit et retire les publicités de CheckBuy.",
    faq4Q:
      "Pourquoi les avis sont-ils séparés du score ?",
    faq4A:
      "Le score CheckBuy repose sur l'analyse technique. Les avis communautaires sont affichés séparément afin de ne pas modifier artificiellement le résultat technique.",
    contactEyebrow: "CONTACT",
    contactTitle: "Une question ?",
    contactText:
      "Contactez CheckBuy pour une question sur le service ou votre compte.",
    contactButton: "Nous contacter",
    legal: "Mentions légales",
    privacy: "Confidentialité",
    cookies: "Cookies",
    copyright:
      "© 2026 CheckBuy — Vérifiez avant d'acheter.",
    cookieTitle: "Cookies",
    cookieText:
      "CheckBuy utilise des cookies nécessaires au fonctionnement du site. Les publicités ne sont affichées qu'après votre accord.",
    refuse: "Refuser",
    accept: "Accepter",
    menuHome: "Accueil",
    menuHistory: "Historique",
    menuPremium: "Premium",
    menuAccount: "Mon compte",
    menuLanguage: "Langue",
    menuAppearance: "Apparence",
    menuContact: "Contact",
    languageFrench: "Français",
    languageEnglish: "English",
    languageSpanish: "Español",
    languageChinese: "中文",
  },

  en: {
    verifyBeforeBuying: "Check before you buy",
    heroLine1: "Buy with",
    heroLine2: "confidence.",
    subtitle:
      "Analyze a website before purchasing and spot the first warning signs in seconds.",
    placeholder: "https://example.com",
    verify: "Check",
    analyzing: "Checking...",
    analysisRunning: "Analysis in progress",
    analysisRunningText:
      "CheckBuy is checking the website and its technical characteristics.",
    analyzedSite: "WEBSITE ANALYZED",
    analysisComplete: "✓ Analysis complete",
    scoreLabel: "CheckBuy Score",
    excellent: "Excellent",
    good: "Good",
    verifyLevel: "Check carefully",
    caution: "Caution",
    highRisk: "High risk",
    disclaimer:
      "The CheckBuy score is based on technical criteria. It is a purchasing aid and does not guarantee that a seller, product or website is trustworthy.",
    community: "COMMUNITY",
    reviewsOn: "Reviews for",
    yourReview: "Your review",
    reviewPlaceholder:
      "Share your experience with this website...",
    publishReview: "Publish review",
    saving: "Saving...",
    loginToReview:
      "Sign in to publish a review.",
    login: "Sign in",
    noReviews: "No reviews yet.",
    loadingReviews: "Loading reviews...",
    premium: "Premium",
    premiumActive: "Premium ✓",
    appearance: "Appearance",
    account: "My account",
    freeRemaining:
      "free analysis(es) remaining over the last 24 hours.",
    unlimited:
      "Premium account — unlimited analyses.",
    feature1Title: "Trust score",
    feature1Text:
      "Get a clear score out of 100 to quickly assess a website's technical signals.",
    feature2Title: "Security",
    feature2Text:
      "CheckBuy checks several technical elements to identify early warning signs.",
    feature3Title: "Community reviews",
    feature3Text:
      "Read experiences shared by CheckBuy users before purchasing.",
    simpleFast: "SIMPLE AND FAST",
    howItWorks: "How does it work?",
    step1Title: "Paste the link",
    step1Text:
      "Copy the address of the website you are considering buying from.",
    step2Title: "Run the analysis",
    step2Text:
      "CheckBuy examines different technical signals from the website.",
    step3Title: "View the result",
    step3Text:
      "Get a score out of 100, detailed checks and community reviews.",
    beforeBuying: "BEFORE YOU BUY",
    whyCheckBuy: "Why CheckBuy?",
    why1Title: "Easy to understand",
    why1Text:
      "You do not need to be a cybersecurity expert: checks are presented simply.",
    why2Title: "Independent analysis",
    why2Text:
      "The score is based on technical criteria analyzed by CheckBuy.",
    why3Title: "A community",
    why3Text:
      "User reviews complement the technical result.",
    why4Title: "Help before buying",
    why4Text:
      "CheckBuy helps you identify points to watch before sharing your information or paying.",
    faqEyebrow: "FREQUENTLY ASKED QUESTIONS",
    faqTitle: "Frequently asked questions",
    faq1Q:
      "Does CheckBuy guarantee that a website is trustworthy?",
    faq1A:
      "No. CheckBuy provides an analysis based on technical signals and community reviews. The result is decision support, not a guarantee.",
    faq2Q:
      "How many analyses can I run for free?",
    faq2A:
      "A free account can perform up to 3 analyses over a rolling 24-hour period.",
    faq3Q: "What does CheckBuy Premium include?",
    faq3A:
      "Premium removes the free account analysis limit and removes CheckBuy ads.",
    faq4Q:
      "Why are reviews separate from the score?",
    faq4A:
      "The CheckBuy score is based on technical analysis. Community reviews are displayed separately so they do not artificially modify the technical result.",
    contactEyebrow: "CONTACT",
    contactTitle: "Any questions?",
    contactText:
      "Contact CheckBuy with questions about the service or your account.",
    contactButton: "Contact us",
    legal: "Legal notice",
    privacy: "Privacy",
    cookies: "Cookies",
    copyright:
      "© 2026 CheckBuy — Check before you buy.",
    cookieTitle: "Cookies",
    cookieText:
      "CheckBuy uses cookies required for the website to function. Ads are only displayed after your consent.",
    refuse: "Refuse",
    accept: "Accept",
    menuHome: "Home",
    menuHistory: "History",
    menuPremium: "Premium",
    menuAccount: "My account",
    menuLanguage: "Language",
    menuAppearance: "Appearance",
    menuContact: "Contact",
    languageFrench: "Français",
    languageEnglish: "English",
    languageSpanish: "Español",
    languageChinese: "中文",
  },

  es: {
    verifyBeforeBuying: "Verifica antes de comprar",
    heroLine1: "Compra con",
    heroLine2: "confianza.",
    subtitle:
      "Analiza un sitio antes de comprar y detecta las primeras señales de riesgo en pocos segundos.",
    placeholder: "https://ejemplo.com",
    verify: "Verificar",
    analyzing: "Analizando...",
    analysisRunning: "Análisis en curso",
    analysisRunningText:
      "CheckBuy está verificando el sitio y sus características técnicas.",
    analyzedSite: "SITIO ANALIZADO",
    analysisComplete: "✓ Análisis terminado",
    scoreLabel: "Puntuación CheckBuy",
    excellent: "Excelente",
    good: "Bueno",
    verifyLevel: "A verificar",
    caution: "Precaución",
    highRisk: "Riesgo alto",
    disclaimer:
      "La puntuación CheckBuy se basa en criterios técnicos. Es una ayuda antes de comprar y no garantiza que un vendedor, producto o sitio sea fiable.",
    community: "COMUNIDAD",
    reviewsOn: "Opiniones sobre",
    yourReview: "Tu opinión",
    reviewPlaceholder:
      "Comparte tu experiencia con este sitio...",
    publishReview: "Publicar opinión",
    saving: "Guardando...",
    loginToReview:
      "Inicia sesión para publicar una opinión.",
    login: "Iniciar sesión",
    noReviews: "Todavía no hay opiniones.",
    loadingReviews: "Cargando opiniones...",
    premium: "Premium",
    premiumActive: "Premium ✓",
    appearance: "Apariencia",
    account: "Mi cuenta",
    freeRemaining:
      "análisis gratuito(s) restante(s) en las últimas 24 h.",
    unlimited:
      "Cuenta Premium — análisis ilimitados.",
    feature1Title: "Puntuación de confianza",
    feature1Text:
      "Obtén una puntuación clara sobre 100 para evaluar rápidamente las señales técnicas de un sitio.",
    feature2Title: "Seguridad",
    feature2Text:
      "CheckBuy verifica varios elementos técnicos para detectar las primeras señales de riesgo.",
    feature3Title: "Opiniones de la comunidad",
    feature3Text:
      "Consulta experiencias compartidas por otros usuarios de CheckBuy antes de comprar.",
    simpleFast: "SIMPLE Y RÁPIDO",
    howItWorks: "¿Cómo funciona?",
    step1Title: "Pega el enlace",
    step1Text:
      "Copia la dirección del sitio donde estás pensando comprar.",
    step2Title: "Inicia el análisis",
    step2Text:
      "CheckBuy examina diferentes señales técnicas del sitio.",
    step3Title: "Consulta el resultado",
    step3Text:
      "Obtén una puntuación sobre 100, verificaciones detalladas y opiniones de la comunidad.",
    beforeBuying: "ANTES DE COMPRAR",
    whyCheckBuy: "¿Por qué CheckBuy?",
    why1Title: "Un resultado comprensible",
    why1Text:
      "No necesitas ser experto en ciberseguridad: las verificaciones se presentan de forma sencilla.",
    why2Title: "Un análisis independiente",
    why2Text:
      "La puntuación se basa en criterios técnicos analizados por CheckBuy.",
    why3Title: "Una comunidad",
    why3Text:
      "Las opiniones de los usuarios complementan el resultado técnico.",
    why4Title: "Ayuda antes de comprar",
    why4Text:
      "CheckBuy te ayuda a detectar puntos de atención antes de compartir tus datos o pagar.",
    faqEyebrow: "PREGUNTAS FRECUENTES",
    faqTitle: "Preguntas frecuentes",
    faq1Q:
      "¿CheckBuy garantiza que un sitio es fiable?",
    faq1A:
      "No. CheckBuy ofrece un análisis basado en señales técnicas y opiniones de la comunidad. El resultado es una ayuda para decidir, no una garantía.",
    faq2Q:
      "¿Cuántos análisis puedo hacer gratis?",
    faq2A:
      "Una cuenta gratuita puede hacer hasta 3 análisis durante un periodo móvil de 24 horas.",
    faq3Q: "¿Qué incluye CheckBuy Premium?",
    faq3A:
      "Premium elimina el límite de análisis de la cuenta gratuita y elimina la publicidad de CheckBuy.",
    faq4Q:
      "¿Por qué las opiniones están separadas de la puntuación?",
    faq4A:
      "La puntuación CheckBuy se basa en el análisis técnico. Las opiniones se muestran por separado para no modificar artificialmente el resultado técnico.",
    contactEyebrow: "CONTACTO",
    contactTitle: "¿Alguna pregunta?",
    contactText:
      "Contacta con CheckBuy si tienes una pregunta sobre el servicio o tu cuenta.",
    contactButton: "Contactarnos",
    legal: "Aviso legal",
    privacy: "Privacidad",
    cookies: "Cookies",
    copyright:
      "© 2026 CheckBuy — Verifica antes de comprar.",
    cookieTitle: "Cookies",
    cookieText:
      "CheckBuy utiliza cookies necesarias para el funcionamiento del sitio. Los anuncios solo se muestran después de tu consentimiento.",
    refuse: "Rechazar",
    accept: "Aceptar",
    menuHome: "Inicio",
    menuHistory: "Historial",
    menuPremium: "Premium",
    menuAccount: "Mi cuenta",
    menuLanguage: "Idioma",
    menuAppearance: "Apariencia",
    menuContact: "Contacto",
    languageFrench: "Français",
    languageEnglish: "English",
    languageSpanish: "Español",
    languageChinese: "中文",
  },

  zh: {
    verifyBeforeBuying: "购买前先检查",
    heroLine1: "放心",
    heroLine2: "购买。",
    subtitle:
      "购买前分析网站，只需几秒即可发现初步风险信号。",
    placeholder: "https://example.com",
    verify: "检查",
    analyzing: "分析中...",
    analysisRunning: "正在分析",
    analysisRunningText:
      "CheckBuy 正在检查网站及其技术特征。",
    analyzedSite: "已分析网站",
    analysisComplete: "✓ 分析完成",
    scoreLabel: "CheckBuy 评分",
    excellent: "优秀",
    good: "良好",
    verifyLevel: "需要检查",
    caution: "谨慎",
    highRisk: "高风险",
    disclaimer:
      "CheckBuy 评分基于技术标准，仅用于购买前参考，并不能保证卖家、商品或网站完全可靠。",
    community: "社区",
    reviewsOn: "网站评价",
    yourReview: "您的评价",
    reviewPlaceholder: "分享您使用该网站的体验...",
    publishReview: "发布评价",
    saving: "保存中...",
    loginToReview: "请登录后发布评价。",
    login: "登录",
    noReviews: "暂无评价。",
    loadingReviews: "正在加载评价...",
    premium: "高级版",
    premiumActive: "高级版 ✓",
    appearance: "外观",
    account: "我的账户",
    freeRemaining: "次免费分析可在过去24小时内使用。",
    unlimited: "高级账户 — 无限分析。",
    feature1Title: "信任评分",
    feature1Text:
      "获得清晰的100分制评分，快速评估网站的技术信号。",
    feature2Title: "安全性",
    feature2Text:
      "CheckBuy 会检查多个技术因素，以发现早期风险信号。",
    feature3Title: "社区评价",
    feature3Text:
      "购买前查看 CheckBuy 用户分享的体验。",
    simpleFast: "简单快速",
    howItWorks: "如何使用？",
    step1Title: "粘贴链接",
    step1Text: "复制您准备购物的网站地址。",
    step2Title: "开始分析",
    step2Text:
      "CheckBuy 会检查网站的多个技术信号。",
    step3Title: "查看结果",
    step3Text:
      "获得100分制评分、详细检查结果和社区评价。",
    beforeBuying: "购买前",
    whyCheckBuy: "为什么使用 CheckBuy？",
    why1Title: "结果简单易懂",
    why1Text:
      "无需成为网络安全专家，检查结果会以简单方式展示。",
    why2Title: "独立分析",
    why2Text:
      "评分基于 CheckBuy 分析的技术标准。",
    why3Title: "用户社区",
    why3Text:
      "用户评价可以补充技术分析结果。",
    why4Title: "购买前参考",
    why4Text:
      "CheckBuy 帮助您在提交个人信息或付款前发现需要注意的问题。",
    faqEyebrow: "常见问题",
    faqTitle: "常见问题",
    faq1Q: "CheckBuy 能保证网站可靠吗？",
    faq1A:
      "不能。CheckBuy 根据技术信号和社区评价提供分析结果，仅作为决策参考，并非保证。",
    faq2Q: "免费用户可以分析多少次？",
    faq2A:
      "免费账户在滚动24小时内最多可以进行3次分析。",
    faq3Q: "CheckBuy 高级版包含什么？",
    faq3A:
      "高级版取消免费账户的分析次数限制，同时移除 CheckBuy 广告。",
    faq4Q: "为什么评价与评分分开？",
    faq4A:
      "CheckBuy 评分基于技术分析。社区评价单独显示，以避免人为影响技术评分。",
    contactEyebrow: "联系",
    contactTitle: "有问题吗？",
    contactText:
      "如果您对服务或账户有任何疑问，请联系 CheckBuy。",
    contactButton: "联系我们",
    legal: "法律声明",
    privacy: "隐私",
    cookies: "Cookies",
    copyright: "© 2026 CheckBuy — 购买前先检查。",
    cookieTitle: "Cookies",
    cookieText:
      "CheckBuy 使用网站运行所必需的 Cookies。只有在您同意后才会显示广告。",
    refuse: "拒绝",
    accept: "接受",
    menuHome: "首页",
    menuHistory: "历史记录",
    menuPremium: "高级版",
    menuAccount: "我的账户",
    menuLanguage: "语言",
    menuAppearance: "外观",
    menuContact: "联系",
    languageFrench: "Français",
    languageEnglish: "English",
    languageSpanish: "Español",
    languageChinese: "中文",
  },
};

/* =========================================================
   PAGE
========================================================= */

export default function Home() {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] =
    useState<Analysis | null>(null);
  const [error, setError] = useState("");

  const [sessionLoading, setSessionLoading] =
    useState(true);
  const [user, setUser] = useState<any>(null);
  const [isPremium, setIsPremium] =
    useState(false);

  const [theme, setTheme] =
    useState<ThemeName>("chaud");

  const [showThemes, setShowThemes] =
    useState(false);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [languageOpen, setLanguageOpen] =
    useState(false);

  const [language, setLanguage] =
    useState<Language>("fr");

  const [sideLanguageOpen, setSideLanguageOpen] =
    useState(false);

  const [reviews, setReviews] =
    useState<Review[]>([]);

  const [reviewsLoading, setReviewsLoading] =
    useState(false);

  const [reviewRating, setReviewRating] =
    useState(5);

  const [reviewComment, setReviewComment] =
    useState("");

  const [reviewMessage, setReviewMessage] =
    useState("");

  const [reviewSaving, setReviewSaving] =
    useState(false);

  const [cookieChoice, setCookieChoice] =
    useState<CookieChoice>(null);

  const colors = THEMES[theme];

  const styles = useMemo(
    () => getStyles(colors),
    [colors]
  );

  const t = TRANSLATIONS[language];

  /* =========================================================
     INITIALISATION
  ========================================================= */

  useEffect(() => {
    const savedTheme = localStorage.getItem(
      "checkbuy-theme"
    ) as ThemeName | null;

    if (savedTheme && THEMES[savedTheme]) {
      setTheme(savedTheme);
    }

    const savedLanguage = localStorage.getItem(
      "checkbuy-language"
    ) as Language | null;

    if (
      savedLanguage &&
      TRANSLATIONS[savedLanguage]
    ) {
      setLanguage(savedLanguage);
    }

    const savedCookies = localStorage.getItem(
      "checkbuy-cookie-choice"
    );

    if (
      savedCookies === "accepted" ||
      savedCookies === "refused"
    ) {
      setCookieChoice(savedCookies);
    }
  }, []);

  /* =========================================================
     AUTH
  ========================================================= */

  useEffect(() => {
    async function initAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user ?? null);

      if (session?.user) {
        await loadPremium(session.user.id);
      } else {
        setIsPremium(false);
      }

      setSessionLoading(false);
    }

    initAuth();

    const { data: listener } =
      supabase.auth.onAuthStateChange(
        async (_event, session) => {
          setUser(session?.user ?? null);

          if (session?.user) {
            await loadPremium(session.user.id);
          } else {
            setIsPremium(false);
          }
        }
      );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function loadPremium(userId: string) {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Erreur Premium :", error);
        setIsPremium(false);
        return;
      }

      setIsPremium(
        data?.status === "active" ||
          data?.status === "trialing"
      );
    } catch (err) {
      console.error(err);
      setIsPremium(false);
    }
  }

  /* =========================================================
     LANGUE
  ========================================================= */

  function selectLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);

    localStorage.setItem(
      "checkbuy-language",
      nextLanguage
    );

    setLanguageOpen(false);
    setSideLanguageOpen(false);
  }

  /* =========================================================
     THÈME
  ========================================================= */

  function selectTheme(nextTheme: ThemeName) {
    setTheme(nextTheme);

    localStorage.setItem(
      "checkbuy-theme",
      nextTheme
    );

    setShowThemes(false);
  }

  /* =========================================================
     ANALYSE
  ========================================================= */

  async function analyzeSite() {
    if (!url.trim()) {
      setError(
        language === "fr"
          ? "Entre l'adresse du site à vérifier."
          : language === "en"
            ? "Enter the website address to check."
            : language === "es"
              ? "Introduce la dirección del sitio que quieres verificar."
              : "请输入要检查的网站地址。"
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
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError(
          language === "fr"
            ? "Connecte-toi pour analyser un site."
            : language === "en"
              ? "Sign in to analyze a website."
              : language === "es"
                ? "Inicia sesión para analizar un sitio."
                : "请登录后分析网站。"
        );

        return;
      }

      const response = await fetch(
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

      const text = await response.text();

      let data: any;

      try {
        data = JSON.parse(text);
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
        await loadReviews(data.domain);
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

  /* =========================================================
     AVIS
  ========================================================= */

  async function loadReviews(domain: string) {
    setReviewsLoading(true);

    try {
      const { data, error } = await supabase
        .from("site_reviews")
        .select(
          "id,user_id,domain,rating,comment,created_at,updated_at"
        )
        .eq("domain", domain)
        .order("updated_at", {
          ascending: false,
        });

      if (error) {
        console.error("Erreur avis :", error);
        return;
      }

      setReviews(data ?? []);

      if (user) {
        const ownReview = (data ?? []).find(
          (review) =>
            review.user_id === user.id
        );

        if (ownReview) {
          setReviewRating(ownReview.rating);
          setReviewComment(
            ownReview.comment ?? ""
          );
        } else {
          setReviewRating(5);
          setReviewComment("");
        }
      }
    } finally {
      setReviewsLoading(false);
    }
  }

  async function saveReview() {
    if (!analysis) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (!reviewComment.trim()) {
      setReviewMessage(
        language === "fr"
          ? "Écris un commentaire avant de publier."
          : language === "en"
            ? "Write a comment before publishing."
            : language === "es"
              ? "Escribe un comentario antes de publicar."
              : "发布前请填写评价。"
      );

      return;
    }

    setReviewSaving(true);
    setReviewMessage("");

    try {
      const { error } = await supabase
        .from("site_reviews")
        .upsert(
          {
            user_id: user.id,
            domain: analysis.domain,
            rating: reviewRating,
            comment: reviewComment.trim(),
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict: "user_id,domain",
          }
        );

      if (error) {
        throw error;
      }

      setReviewMessage(
        language === "fr"
          ? "Ton avis a été enregistré."
          : language === "en"
            ? "Your review has been saved."
            : language === "es"
              ? "Tu opinión ha sido guardada."
              : "您的评价已保存。"
      );

      await loadReviews(analysis.domain);
    } catch (err) {
      console.error(err);

      setReviewMessage(
        language === "fr"
          ? "Impossible d'enregistrer ton avis."
          : language === "en"
            ? "Unable to save your review."
            : language === "es"
              ? "No se ha podido guardar tu opinión."
              : "无法保存您的评价。"
      );
    } finally {
      setReviewSaving(false);
    }
  }

  /* =========================================================
     COOKIES
  ========================================================= */

  function chooseCookies(
    choice: "accepted" | "refused"
  ) {
    setCookieChoice(choice);

    localStorage.setItem(
      "checkbuy-cookie-choice",
      choice
    );
  }

  /* =========================================================
     SCORE
  ========================================================= */

  function getScoreColor(score: number) {
    if (score >= 90) return "#22c55e";
    if (score >= 70) return "#f59e0b";
    return "#ef4444";
  }

  function getScoreText(score: number) {
    if (score >= 90) return t.excellent;
    if (score >= 80) return t.good;
    if (score >= 70) return t.verifyLevel;
    if (score >= 50) return t.caution;
    return t.highRisk;
  }

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (total, review) =>
              total + review.rating,
            0
          ) / reviews.length
        ).toFixed(1)
      : null;

  return (
    <main style={styles.page}>
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button
            onClick={() => setMenuOpen(true)}
            style={styles.menuButton}
            aria-label="Menu"
          >
            <span style={styles.menuLine} />
            <span style={styles.menuLine} />
            <span style={styles.menuLine} />
          </button>

          <button
            onClick={() => router.push("/")}
            style={styles.logoButton}
          >
            <span style={styles.logoCheck}>
              Check
            </span>

            <span
              style={{
                ...styles.logoBuy,
                color: colors.accent,
              }}
            >
              Buy
            </span>
          </button>
        </div>

        <div style={styles.headerActions}>
          <button
            style={styles.secondaryButton}
            onClick={() =>
              router.push("/premium")
            }
          >
            {isPremium
              ? t.premiumActive
              : t.premium}
          </button>

          <div style={styles.themeWrapper}>
            <button
              style={styles.secondaryButton}
              onClick={() =>
                setShowThemes(!showThemes)
              }
            >
              {t.appearance}
            </button>

            {showThemes && (
              <div style={styles.themeMenu}>
                <ThemeButton
                  label="Chaud"
                  active={theme === "chaud"}
                  onClick={() =>
                    selectTheme("chaud")
                  }
                  colors={colors}
                />

                <ThemeButton
                  label="Sombre"
                  active={theme === "sombre"}
                  onClick={() =>
                    selectTheme("sombre")
                  }
                  colors={colors}
                />

                <ThemeButton
                  label="Clair"
                  active={theme === "clair"}
                  onClick={() =>
                    selectTheme("clair")
                  }
                  colors={colors}
                />

                <ThemeButton
                  label="Froid"
                  active={theme === "froid"}
                  onClick={() =>
                    selectTheme("froid")
                  }
                  colors={colors}
                />
              </div>
            )}
          </div>

          {!sessionLoading &&
            (user ? (
              <button
                style={styles.accountButton}
                onClick={() =>
                  router.push("/account")
                }
              >
                {t.account}
              </button>
            ) : (
              <button
                style={styles.accountButton}
                onClick={() =>
                  router.push("/login")
                }
              >
                {t.login}
              </button>
            ))}

          {/* LANGUE À DROITE DE MON COMPTE */}

          <div style={styles.languageWrapper}>
            <button
              style={styles.languageButton}
              onClick={() =>
                setLanguageOpen(!languageOpen)
              }
            >
              {language.toUpperCase()}
              <span style={styles.languageArrow}>
                ▾
              </span>
            </button>

            {languageOpen && (
              <div style={styles.languageMenu}>
                <LanguageButton
                  label="Français"
                  code="FR"
                  active={language === "fr"}
                  onClick={() =>
                    selectLanguage("fr")
                  }
                  colors={colors}
                />

                <LanguageButton
                  label="English"
                  code="EN"
                  active={language === "en"}
                  onClick={() =>
                    selectLanguage("en")
                  }
                  colors={colors}
                />

                <LanguageButton
                  label="Español"
                  code="ES"
                  active={language === "es"}
                  onClick={() =>
                    selectLanguage("es")
                  }
                  colors={colors}
                />

                <LanguageButton
                  label="中文"
                  code="ZH"
                  active={language === "zh"}
                  onClick={() =>
                    selectLanguage("zh")
                  }
                  colors={colors}
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================
          MENU LATÉRAL
      ====================================================== */}

      {menuOpen && (
        <>
          <div
            style={styles.menuOverlay}
            onClick={() =>
              setMenuOpen(false)
            }
          />

          <aside style={styles.sideMenu}>
            <div style={styles.sideMenuTop}>
              <div style={styles.sideMenuLogo}>
                Check
                <span
                  style={{
                    color: colors.accent,
                  }}
                >
                  Buy
                </span>
              </div>

              <button
                style={styles.closeMenuButton}
                onClick={() =>
                  setMenuOpen(false)
                }
              >
                ×
              </button>
            </div>

            <div style={styles.sideMenuSection}>
              <button
                style={styles.sideMenuItem}
                onClick={() => {
                  router.push("/");
                  setMenuOpen(false);
                }}
              >
                <span style={styles.sideMenuIcon}>
                  ⌂
                </span>

                {t.menuHome}
              </button>

              <button
                style={styles.sideMenuItem}
                onClick={() => {
                  router.push("/account");
                  setMenuOpen(false);
                }}
              >
                <span style={styles.sideMenuIcon}>
                  ○
                </span>

                {t.menuAccount}
              </button>

              <button
                style={styles.sideMenuItem}
                onClick={() => {
                  router.push("/premium");
                  setMenuOpen(false);
                }}
              >
                <span style={styles.sideMenuIcon}>
                  ◇
                </span>

                {t.menuPremium}
              </button>
            </div>

            <div style={styles.sideMenuDivider} />

            {/* LANGUES MENU LATÉRAL */}

            <button
              style={styles.sideMenuItem}
              onClick={() =>
                setSideLanguageOpen(
                  !sideLanguageOpen
                )
              }
            >
              <span style={styles.sideMenuIcon}>
                文
              </span>

              <span style={{ flex: 1 }}>
                {t.menuLanguage}
              </span>

              <span
                style={{
                  color: colors.subtle,
                }}
              >
                {sideLanguageOpen ? "▴" : "▾"}
              </span>
            </button>

            {sideLanguageOpen && (
              <div style={styles.sideLanguageList}>
                <LanguageButton
                  label="Français"
                  code="FR"
                  active={language === "fr"}
                  onClick={() =>
                    selectLanguage("fr")
                  }
                  colors={colors}
                />

                <LanguageButton
                  label="English"
                  code="EN"
                  active={language === "en"}
                  onClick={() =>
                    selectLanguage("en")
                  }
                  colors={colors}
                />

                <LanguageButton
                  label="Español"
                  code="ES"
                  active={language === "es"}
                  onClick={() =>
                    selectLanguage("es")
                  }
                  colors={colors}
                />

                <LanguageButton
                  label="中文"
                  code="ZH"
                  active={language === "zh"}
                  onClick={() =>
                    selectLanguage("zh")
                  }
                  colors={colors}
                />
              </div>
            )}

            <button
              style={styles.sideMenuItem}
              onClick={() => {
                setShowThemes(true);
                setMenuOpen(false);
              }}
            >
              <span style={styles.sideMenuIcon}>
                ◐
              </span>

              {t.menuAppearance}
            </button>

            <button
              style={styles.sideMenuItem}
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
              <span style={styles.sideMenuIcon}>
                ✉
              </span>

              {t.menuContact}
            </button>

            <div style={styles.sideMenuDivider} />

            <button
              style={styles.sideMenuLegal}
              onClick={() => {
                router.push(
                  "/mentions-legales"
                );
                setMenuOpen(false);
              }}
            >
              {t.legal}
            </button>

            <button
              style={styles.sideMenuLegal}
              onClick={() => {
                router.push(
                  "/confidentialite"
                );
                setMenuOpen(false);
              }}
            >
              {t.privacy}
            </button>

            <button
              style={styles.sideMenuLegal}
              onClick={() => {
                router.push("/cookies");
                setMenuOpen(false);
              }}
            >
              {t.cookies}
            </button>
          </aside>
        </>
      )}

      {/* =====================================================
          HERO
      ====================================================== */}

      <section style={styles.hero}>
        <div style={styles.badge}>
          <span
            style={{
              ...styles.badgeDot,
              background: colors.accent,
            }}
          />

          {t.verifyBeforeBuying}
        </div>

        <h1 style={styles.title}>
          {t.heroLine1}
          <br />

          <span
            style={{
              ...styles.highlight,
              color: colors.accent,
              WebkitTextFillColor:
                colors.accent,
            }}
          >
            {t.heroLine2}
          </span>
        </h1>

        <p style={styles.subtitle}>
          {t.subtitle}
        </p>

        {/* RECHERCHE */}

        <div style={styles.searchContainer}>
          <input
            value={url}
            onChange={(e) =>
              setUrl(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                analyzeSite();
              }
            }}
            placeholder={t.placeholder}
            style={styles.input}
          />

          <button
            onClick={analyzeSite}
            disabled={loading}
            style={{
              ...styles.checkButton,
              opacity: loading ? 0.65 : 1,
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            {loading
              ? t.analyzing
              : t.verify}
          </button>
        </div>

        {/* QUOTA */}

        {user &&
          !isPremium &&
          analysis?.usage &&
          typeof analysis.usage.remaining ===
            "number" && (
            <div style={styles.quota}>
              {
                analysis.usage
                  .remaining
              }{" "}
              {t.freeRemaining}
            </div>
          )}

        {isPremium && (
          <div style={styles.quota}>
            {t.unlimited}
          </div>
        )}

        {/* ERREUR */}

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* CHARGEMENT */}

        {loading && (
          <div style={styles.loadingCard}>
            <div
              style={{
                ...styles.spinner,
                borderTopColor:
                  colors.accent,
              }}
            />

            <div>
              <div
                style={styles.loadingTitle}
              >
                {t.analysisRunning}
              </div>

              <div
                style={styles.loadingText}
              >
                {t.analysisRunningText}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            RÉSULTAT
        ====================================================== */}

        {analysis && !loading && (
          <div style={styles.resultCard}>
            <div style={styles.resultHeader}>
              <div>
                <div style={styles.eyebrow}>
                  {t.analyzedSite}
                </div>

                <div style={styles.domain}>
                  {analysis.domain}
                </div>
              </div>

              <div style={styles.finished}>
                {t.analysisComplete}
              </div>
            </div>

            <div style={styles.resultContent}>
              <div style={styles.scoreSection}>
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
                      background: colors.card,
                    }}
                  >
                    <div style={styles.scoreLine}>
                      <span
                        style={{
                          ...styles.scoreNumber,
                          color:
                            getScoreColor(
                              analysis.score
                            ),
                        }}
                      >
                        {analysis.score}
                      </span>

                      <span style={styles.outOf}>
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
                  {t.scoreLabel}
                </div>
              </div>

              <div style={styles.checkList}>
                {analysis.checks?.map(
                  (check, index) => (
                    <CheckItem
                      key={index}
                      check={check}
                      colors={colors}
                    />
                  )
                )}
              </div>
            </div>

            <div style={styles.disclaimer}>
              {t.disclaimer}
            </div>
          </div>
        )}

        {/* =====================================================
            AVIS
        ====================================================== */}

        {analysis && !loading && (
          <section
            style={styles.communityCard}
          >
            <div
              style={styles.sectionHeadingRow}
            >
              <div>
                <div style={styles.eyebrow}>
                  {t.community}
                </div>

                <h2
                  style={styles.communityTitle}
                >
                  {t.reviewsOn}{" "}
                  {analysis.domain}
                </h2>
              </div>

              {averageRating && (
                <div
                  style={
                    styles.averageRating
                  }
                >
                  ★ {averageRating} / 5
                </div>
              )}
            </div>

            {user ? (
              <div style={styles.reviewForm}>
                <div
                  style={styles.reviewFormTitle}
                >
                  {t.yourReview}
                </div>

                <div style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5].map(
                    (rating) => (
                      <button
                        key={rating}
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
                  value={reviewComment}
                  onChange={(e) =>
                    setReviewComment(
                      e.target.value
                    )
                  }
                  placeholder={
                    t.reviewPlaceholder
                  }
                  maxLength={1000}
                  style={styles.textarea}
                />

                <div style={styles.reviewBottom}>
                  <span
                    style={
                      styles.characterCount
                    }
                  >
                    {reviewComment.length}
                    /1000
                  </span>

                  <button
                    onClick={saveReview}
                    disabled={reviewSaving}
                    style={{
                      ...styles.publishButton,
                      opacity:
                        reviewSaving
                          ? 0.65
                          : 1,
                    }}
                  >
                    {reviewSaving
                      ? t.saving
                      : t.publishReview}
                  </button>
                </div>

                {reviewMessage && (
                  <div
                    style={
                      styles.reviewMessage
                    }
                  >
                    {reviewMessage}
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.loginReview}>
                {t.loginToReview}

                <button
                  onClick={() =>
                    router.push("/login")
                  }
                  style={
                    styles.smallActionButton
                  }
                >
                  {t.login}
                </button>
              </div>
            )}

            <div style={styles.reviewList}>
              {reviewsLoading ? (
                <div
                  style={styles.emptyReviews}
                >
                  {t.loadingReviews}
                </div>
              ) : reviews.length === 0 ? (
                <div
                  style={styles.emptyReviews}
                >
                  {t.noReviews}
                </div>
              ) : (
                reviews.map(
                  (review, index) => (
                    <div
                      key={
                        review.id ?? index
                      }
                      style={styles.reviewItem}
                    >
                      <div
                        style={
                          styles.reviewItemTop
                        }
                      >
                        <span>
                          {Array.from({
                            length: 5,
                          }).map((_, i) => (
                            <span
                              key={i}
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
                          ))}
                        </span>

                        <span
                          style={
                            styles.reviewDate
                          }
                        >
                          {review.updated_at
                            ? new Date(
                                review.updated_at
                              ).toLocaleDateString()
                            : ""}
                        </span>
                      </div>

                      <p
                        style={
                          styles.reviewComment
                        }
                      >
                        {review.comment}
                      </p>
                    </div>
                  )
                )
              )}
            </div>
          </section>
        )}

        {/* =====================================================
            FEATURES
        ====================================================== */}

        {!analysis && !loading && (
          <div style={styles.features}>
            <Feature
              number="01"
              title={t.feature1Title}
              text={t.feature1Text}
              colors={colors}
            />

            <Feature
              number="02"
              title={t.feature2Title}
              text={t.feature2Text}
              colors={colors}
            />

            <Feature
              number="03"
              title={t.feature3Title}
              text={t.feature3Text}
              colors={colors}
            />
          </div>
        )}

        {!isPremium &&
          cookieChoice === "accepted" && (
            <div style={styles.adContainer}>
              <AdBanner />
            </div>
          )}
      </section>

      {/* =====================================================
          COMMENT ÇA MARCHE
      ====================================================== */}

      <section style={styles.wideSection}>
        <div style={styles.eyebrow}>
          {t.simpleFast}
        </div>

        <h2 style={styles.sectionTitle}>
          {t.howItWorks}
        </h2>

        <div style={styles.infoGrid}>
          <InfoCard
            number="1"
            title={t.step1Title}
            text={t.step1Text}
            colors={colors}
          />

          <InfoCard
            number="2"
            title={t.step2Title}
            text={t.step2Text}
            colors={colors}
          />

          <InfoCard
            number="3"
            title={t.step3Title}
            text={t.step3Text}
            colors={colors}
          />
        </div>
      </section>

      {/* =====================================================
          POURQUOI CHECKBUY
      ====================================================== */}

      <section style={styles.wideSection}>
        <div style={styles.eyebrow}>
          {t.beforeBuying}
        </div>

        <h2 style={styles.sectionTitle}>
          {t.whyCheckBuy}
        </h2>

        <div style={styles.whyGrid}>
          <SimpleCard
            title={t.why1Title}
            text={t.why1Text}
            colors={colors}
          />

          <SimpleCard
            title={t.why2Title}
            text={t.why2Text}
            colors={colors}
          />

          <SimpleCard
            title={t.why3Title}
            text={t.why3Text}
            colors={colors}
          />

          <SimpleCard
            title={t.why4Title}
            text={t.why4Text}
            colors={colors}
          />
        </div>
      </section>

      {!isPremium &&
        cookieChoice === "accepted" && (
          <div style={styles.secondAd}>
            <AdBanner />
          </div>
        )}

      {/* =====================================================
          FAQ
      ====================================================== */}

      <section style={styles.wideSection}>
        <div style={styles.eyebrow}>
          {t.faqEyebrow}
        </div>

        <h2 style={styles.sectionTitle}>
          {t.faqTitle}
        </h2>

        <div style={styles.faqList}>
          <FaqItem
            question={t.faq1Q}
            answer={t.faq1A}
            colors={colors}
          />

          <FaqItem
            question={t.faq2Q}
            answer={t.faq2A}
            colors={colors}
          />

          <FaqItem
            question={t.faq3Q}
            answer={t.faq3A}
            colors={colors}
          />

          <FaqItem
            question={t.faq4Q}
            answer={t.faq4A}
            colors={colors}
          />
        </div>
      </section>

      {/* =====================================================
          CONTACT
      ====================================================== */}

      <section style={styles.contactSection}>
        <div style={styles.contactCard}>
          <div>
            <div style={styles.eyebrow}>
              {t.contactEyebrow}
            </div>

            <h2 style={styles.contactTitle}>
              {t.contactTitle}
            </h2>

            <p style={styles.contactText}>
              {t.contactText}
            </p>
          </div>

          <button
            style={styles.contactButton}
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
            {t.contactButton}
          </button>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer style={styles.footer}>
        <div style={styles.footerLogo}>
          Check
          <span
            style={{
              color: colors.accent,
            }}
          >
            Buy
          </span>
        </div>

        <div style={styles.footerLinks}>
          <button
            style={styles.footerLink}
            onClick={() =>
              router.push(
                "/mentions-legales"
              )
            }
          >
            {t.legal}
          </button>

          <button
            style={styles.footerLink}
            onClick={() =>
              router.push(
                "/confidentialite"
              )
            }
          >
            {t.privacy}
          </button>

          <button
            style={styles.footerLink}
            onClick={() =>
              router.push("/cookies")
            }
          >
            {t.cookies}
          </button>
        </div>

        <div
          style={styles.footerCopyright}
        >
          {t.copyright}
        </div>
      </footer>

      {/* =====================================================
          COOKIES
      ====================================================== */}

      {cookieChoice === null && (
        <div style={styles.cookieBanner}>
          <div>
            <div
              style={styles.cookieTitle}
            >
              {t.cookieTitle}
            </div>

            <div
              style={styles.cookieText}
            >
              {t.cookieText}
            </div>
          </div>

          <div style={styles.cookieActions}>
            <button
              onClick={() =>
                chooseCookies("refused")
              }
              style={styles.cookieRefuse}
            >
              {t.refuse}
            </button>

            <button
              onClick={() =>
                chooseCookies("accepted")
              }
              style={styles.cookieAccept}
            >
              {t.accept}
            </button>
          </div>
        </div>
      )}
    </main>
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

  if (check.status === "warning") {
    color = "#f59e0b";
    icon = "!";
  }

  if (check.status === "bad") {
    color = "#ef4444";
    icon = "×";
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
        padding: "14px",
        background: colors.cardStrong,
        border: `1px solid ${colors.border}`,
        borderRadius: "14px",
      }}
    >
      <div
        style={{
          width: "34px",
          height: "34px",
          minWidth: "34px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          background: `${color}16`,
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
            color: colors.text,
            fontWeight: 700,
            fontSize: "14px",
          }}
        >
          {check.title}
        </div>

        <div
          style={{
            color: colors.muted,
            fontSize: "13px",
            lineHeight: 1.5,
            marginTop: "3px",
          }}
        >
          {check.description}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FEATURE
========================================================= */

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
        borderRadius: "18px",
        background: colors.card,
        border: `1px solid ${colors.border}`,
        textAlign: "left",
      }}
    >
      <div
        style={{
          color: colors.accent,
          fontSize: "12px",
          fontWeight: 800,
          letterSpacing: "0.08em",
        }}
      >
        {number}
      </div>

      <h3
        style={{
          color: colors.text,
          margin: "12px 0 8px",
          fontSize: "17px",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: colors.muted,
          margin: 0,
          fontSize: "13px",
          lineHeight: 1.6,
        }}
      >
        {text}
      </p>
    </div>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

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
        borderRadius: "18px",
        border: `1px solid ${colors.border}`,
        background: colors.card,
      }}
    >
      <div
        style={{
          width: "34px",
          height: "34px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "10px",
          background: colors.accentSoft,
          color: colors.accent,
          fontWeight: 800,
          marginBottom: "18px",
        }}
      >
        {number}
      </div>

      <h3
        style={{
          margin: "0 0 8px",
          color: colors.text,
          fontSize: "17px",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: colors.muted,
          margin: 0,
          fontSize: "13px",
          lineHeight: 1.6,
        }}
      >
        {text}
      </p>
    </div>
  );
}

/* =========================================================
   SIMPLE CARD
========================================================= */

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
        borderRadius: "18px",
        background: colors.card,
        border: `1px solid ${colors.border}`,
      }}
    >
      <h3
        style={{
          margin: "0 0 8px",
          color: colors.text,
          fontSize: "16px",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: 0,
          color: colors.muted,
          lineHeight: 1.6,
          fontSize: "13px",
        }}
      >
        {text}
      </p>
    </div>
  );
}

/* =========================================================
   FAQ
========================================================= */

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
        padding: "17px 0",
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          color: colors.text,
          fontWeight: 700,
          fontSize: "14px",
        }}
      >
        {question}
      </summary>

      <p
        style={{
          color: colors.muted,
          lineHeight: 1.65,
          fontSize: "13px",
          margin: "12px 0 0",
          maxWidth: "750px",
        }}
      >
        {answer}
      </p>
    </details>
  );
}

/* =========================================================
   THEME BUTTON
========================================================= */

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
      onClick={onClick}
      style={{
        border: "none",
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        padding: "10px 12px",
        borderRadius: "9px",
        background: active
          ? colors.accentSoft
          : "transparent",
        color: active
          ? colors.accent
          : colors.text,
        fontWeight: active ? 700 : 500,
      }}
    >
      {label}
    </button>
  );
}

/* =========================================================
   LANGUAGE BUTTON
========================================================= */

function LanguageButton({
  label,
  code,
  active,
  onClick,
  colors,
}: {
  label: string;
  code: string;
  active: boolean;
  onClick: () => void;
  colors: Colors;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        border: "none",
        padding: "10px 11px",
        borderRadius: "8px",
        background: active
          ? colors.accentSoft
          : "transparent",
        color: active
          ? colors.accent
          : colors.text,
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        gap: "15px",
        alignItems: "center",
        fontSize: "12px",
        textAlign: "left",
      }}
    >
      <span>{label}</span>

      <span
        style={{
          color: active
            ? colors.accent
            : colors.subtle,
          fontSize: "10px",
          fontWeight: 800,
        }}
      >
        {code}
      </span>
    </button>
  );
}

/* =========================================================
   STYLES
========================================================= */

function getStyles(
  colors: Colors
): Record<string, CSSProperties> {
  return {
    page: {
      minHeight: "100vh",
      background: colors.background,
      color: colors.text,
      fontFamily:
        "Arial, Helvetica, sans-serif",
      transition:
        "background 0.2s ease, color 0.2s ease",
    },

    header: {
      minHeight: "68px",
      maxWidth: "1180px",
      margin: "0 auto",
      padding: "0 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "20px",
    },

    headerLeft: {
      display: "flex",
      alignItems: "center",
      gap: "11px",
    },

    menuButton: {
      width: "38px",
      height: "38px",
      borderRadius: "10px",
      border: `1px solid ${colors.border}`,
      background: "transparent",
      cursor: "pointer",
      padding: "9px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: "4px",
    },

    menuLine: {
      display: "block",
      width: "100%",
      height: "2px",
      background: colors.text,
      borderRadius: "999px",
    },

    logoButton: {
      background: "transparent",
      border: "none",
      padding: 0,
      cursor: "pointer",
      fontSize: "21px",
      fontWeight: 800,
      letterSpacing: "-0.04em",
    },

    logoCheck: {
      color: colors.text,
    },

    logoBuy: {
      color: colors.accent,
    },

    headerActions: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      flexWrap: "wrap",
      gap: "8px",
    },

    secondaryButton: {
      padding: "9px 13px",
      borderRadius: "10px",
      background: "transparent",
      border: `1px solid ${colors.border}`,
      color: colors.text,
      cursor: "pointer",
      fontSize: "13px",
    },

    accountButton: {
      padding: "9px 14px",
      borderRadius: "10px",
      border: "none",
      background: colors.accent,
      color: colors.buttonText,
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: 700,
    },

    themeWrapper: {
      position: "relative",
    },

    themeMenu: {
      position: "absolute",
      right: 0,
      top: "44px",
      minWidth: "145px",
      zIndex: 80,
      padding: "7px",
      borderRadius: "12px",
      background: colors.cardStrong,
      border: `1px solid ${colors.border}`,
      boxShadow:
        "0 16px 50px rgba(0,0,0,0.28)",
    },

    languageWrapper: {
      position: "relative",
    },

    languageButton: {
      height: "34px",
      padding: "0 9px",
      display: "flex",
      alignItems: "center",
      gap: "4px",
      borderRadius: "8px",
      border: `1px solid ${colors.border}`,
      background: "transparent",
      color: colors.muted,
      cursor: "pointer",
      fontSize: "10px",
      fontWeight: 800,
    },

    languageArrow: {
      fontSize: "8px",
      color: colors.subtle,
    },

    languageMenu: {
      position: "absolute",
      right: 0,
      top: "41px",
      width: "155px",
      padding: "6px",
      borderRadius: "11px",
      background: colors.cardStrong,
      border: `1px solid ${colors.border}`,
      boxShadow:
        "0 16px 45px rgba(0,0,0,0.30)",
      zIndex: 90,
    },

    menuOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.50)",
      backdropFilter: "blur(2px)",
      zIndex: 900,
    },

    sideMenu: {
      position: "fixed",
      top: 0,
      left: 0,
      bottom: 0,
      width: "290px",
      maxWidth: "82vw",
      padding: "21px",
      boxSizing: "border-box",
      overflowY: "auto",
      background: colors.cardStrong,
      borderRight: `1px solid ${colors.border}`,
      boxShadow:
        "20px 0 60px rgba(0,0,0,0.35)",
      zIndex: 1000,
    },

    sideMenuTop: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "15px",
      marginBottom: "27px",
    },

    sideMenuLogo: {
      color: colors.text,
      fontSize: "20px",
      fontWeight: 850,
      letterSpacing: "-0.04em",
    },

    closeMenuButton: {
      width: "34px",
      height: "34px",
      borderRadius: "9px",
      border: `1px solid ${colors.border}`,
      background: "transparent",
      color: colors.text,
      cursor: "pointer",
      fontSize: "22px",
      lineHeight: 1,
    },

    sideMenuSection: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    },

    sideMenuItem: {
      width: "100%",
      padding: "11px 10px",
      display: "flex",
      alignItems: "center",
      gap: "11px",
      border: "none",
      borderRadius: "10px",
      background: "transparent",
      color: colors.text,
      textAlign: "left",
      cursor: "pointer",
      fontSize: "13px",
    },

    sideMenuIcon: {
      width: "23px",
      color: colors.accent,
      textAlign: "center",
      fontWeight: 800,
    },

    sideMenuDivider: {
      height: "1px",
      background: colors.border,
      margin: "15px 0",
    },

    sideLanguageList: {
      margin: "3px 0 8px 30px",
      padding: "5px",
      border: `1px solid ${colors.border}`,
      borderRadius: "10px",
      background: colors.card,
    },

    sideMenuLegal: {
      display: "block",
      width: "100%",
      border: "none",
      background: "transparent",
      textAlign: "left",
      color: colors.subtle,
      cursor: "pointer",
      padding: "7px 10px",
      fontSize: "11px",
    },

    hero: {
      maxWidth: "940px",
      margin: "0 auto",
      padding: "86px 24px 30px",
      textAlign: "center",
    },

    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "7px 11px",
      borderRadius: "999px",
      border: `1px solid ${colors.border}`,
      background: colors.accentSoft,
      color: colors.muted,
      fontSize: "11px",
      fontWeight: 700,
    },

    badgeDot: {
      width: "6px",
      height: "6px",
      borderRadius: "50%",
    },

    title: {
      margin: "21px 0 13px",
      color: colors.text,
      fontSize: "clamp(42px, 6vw, 68px)",
      letterSpacing: "-0.055em",
      lineHeight: 0.98,
      fontWeight: 850,
    },

    highlight: {
      display: "inline-block",
      background: "transparent",
    },

    subtitle: {
      maxWidth: "600px",
      margin: "0 auto",
      color: colors.muted,
      fontSize: "15px",
      lineHeight: 1.7,
    },

    searchContainer: {
      maxWidth: "720px",
      margin: "30px auto 0",
      padding: "6px",
      display: "flex",
      gap: "7px",
      background: colors.card,
      border: `1px solid ${colors.border}`,
      borderRadius: "15px",
      boxShadow:
        "0 16px 45px rgba(0,0,0,0.13)",
    },

    input: {
      flex: 1,
      minWidth: 0,
      padding: "12px 14px",
      background: "transparent",
      border: "none",
      outline: "none",
      color: colors.text,
      fontSize: "14px",
    },

    checkButton: {
      padding: "11px 20px",
      borderRadius: "11px",
      border: "none",
      background: colors.accent,
      color: colors.buttonText,
      fontWeight: 800,
      fontSize: "13px",
    },

    quota: {
      marginTop: "10px",
      color: colors.subtle,
      fontSize: "11px",
    },

    error: {
      maxWidth: "720px",
      margin: "13px auto 0",
      padding: "12px 14px",
      background: "rgba(239,68,68,0.08)",
      border:
        "1px solid rgba(239,68,68,0.20)",
      color: "#ef4444",
      borderRadius: "11px",
      fontSize: "12px",
    },

    loadingCard: {
      maxWidth: "720px",
      margin: "20px auto 0",
      padding: "20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "14px",
      borderRadius: "16px",
      border: `1px solid ${colors.border}`,
      background: colors.card,
    },

    spinner: {
      width: "23px",
      height: "23px",
      border:
        "3px solid rgba(128,128,128,0.18)",
      borderRadius: "50%",
      borderTop: "3px solid",
    },

    loadingTitle: {
      color: colors.text,
      fontWeight: 700,
      fontSize: "14px",
      textAlign: "left",
    },

    loadingText: {
      color: colors.muted,
      marginTop: "3px",
      fontSize: "12px",
      textAlign: "left",
    },

    resultCard: {
      margin: "30px auto 0",
      overflow: "hidden",
      borderRadius: "20px",
      border: `1px solid ${colors.border}`,
      background: colors.card,
      textAlign: "left",
    },

    resultHeader: {
      padding: "18px 22px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "20px",
      borderBottom: `1px solid ${colors.border}`,
    },

    eyebrow: {
      color: colors.accent,
      fontSize: "10px",
      fontWeight: 800,
      letterSpacing: "0.1em",
    },

    domain: {
      color: colors.text,
      fontSize: "17px",
      fontWeight: 750,
      marginTop: "4px",
      wordBreak: "break-word",
    },

    finished: {
      padding: "7px 10px",
      color: "#22c55e",
      background: "rgba(34,197,94,0.08)",
      border:
        "1px solid rgba(34,197,94,0.16)",
      borderRadius: "999px",
      fontSize: "11px",
      whiteSpace: "nowrap",
    },

    resultContent: {
      display: "grid",
      gridTemplateColumns:
        "minmax(180px, 220px) minmax(260px, 1fr)",
      gap: "30px",
      padding: "28px",
      alignItems: "center",
    },

    scoreSection: {
      textAlign: "center",
    },

    scoreCircle: {
      width: "158px",
      height: "158px",
      margin: "0 auto",
      borderRadius: "50%",
      padding: "8px",
    },

    scoreCircleInside: {
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },

    scoreLine: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "center",
      gap: "12px",
    },

    scoreNumber: {
      fontSize: "44px",
      lineHeight: 1,
      fontWeight: 850,
    },

    outOf: {
      color: colors.subtle,
      fontSize: "12px",
      whiteSpace: "nowrap",
      fontWeight: 700,
    },

    scoreStatus: {
      marginTop: "13px",
      fontSize: "15px",
      fontWeight: 800,
    },

    scoreDescription: {
      color: colors.subtle,
      fontSize: "11px",
      marginTop: "3px",
    },

    checkList: {
      display: "flex",
      flexDirection: "column",
      gap: "9px",
    },

    disclaimer: {
      borderTop: `1px solid ${colors.border}`,
      padding: "14px 20px",
      color: colors.subtle,
      fontSize: "10px",
      lineHeight: 1.6,
    },

    communityCard: {
      margin: "20px auto 0",
      border: `1px solid ${colors.border}`,
      borderRadius: "20px",
      background: colors.card,
      padding: "22px",
      textAlign: "left",
    },

    sectionHeadingRow: {
      display: "flex",
      justifyContent: "space-between",
      gap: "20px",
      alignItems: "center",
    },

    communityTitle: {
      color: colors.text,
      fontSize: "20px",
      margin: "5px 0 0",
    },

    averageRating: {
      color: "#f5b942",
      fontSize: "13px",
      fontWeight: 800,
    },

    reviewForm: {
      marginTop: "20px",
      padding: "16px",
      background: colors.cardStrong,
      border: `1px solid ${colors.border}`,
      borderRadius: "14px",
    },

    reviewFormTitle: {
      fontSize: "13px",
      fontWeight: 700,
      color: colors.text,
    },

    ratingRow: {
      display: "flex",
      gap: "2px",
      margin: "8px 0",
    },

    starButton: {
      border: "none",
      background: "transparent",
      cursor: "pointer",
      fontSize: "21px",
      padding: "2px 2px",
    },

    textarea: {
      boxSizing: "border-box",
      width: "100%",
      minHeight: "90px",
      resize: "vertical",
      border: `1px solid ${colors.border}`,
      borderRadius: "11px",
      outline: "none",
      padding: "12px",
      color: colors.text,
      background: colors.card,
      fontFamily: "inherit",
      fontSize: "13px",
    },

    reviewBottom: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      marginTop: "10px",
    },

    characterCount: {
      color: colors.subtle,
      fontSize: "10px",
    },

    publishButton: {
      border: "none",
      borderRadius: "9px",
      padding: "9px 13px",
      background: colors.accent,
      color: colors.buttonText,
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: 800,
    },

    reviewMessage: {
      marginTop: "9px",
      color: colors.muted,
      fontSize: "11px",
    },

    loginReview: {
      marginTop: "18px",
      padding: "14px",
      borderRadius: "12px",
      background: colors.cardStrong,
      color: colors.muted,
      fontSize: "12px",
    },

    smallActionButton: {
      marginLeft: "10px",
      border: "none",
      background: "transparent",
      color: colors.accent,
      cursor: "pointer",
      fontWeight: 700,
    },

    reviewList: {
      marginTop: "15px",
      display: "flex",
      flexDirection: "column",
      gap: "9px",
    },

    emptyReviews: {
      padding: "18px 0",
      color: colors.subtle,
      fontSize: "12px",
      textAlign: "center",
    },

    reviewItem: {
      borderTop: `1px solid ${colors.border}`,
      paddingTop: "13px",
    },

    reviewItemTop: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "10px",
    },

    reviewDate: {
      color: colors.subtle,
      fontSize: "10px",
    },

    reviewComment: {
      color: colors.muted,
      fontSize: "12px",
      lineHeight: 1.6,
      margin: "7px 0 0",
    },

    features: {
      marginTop: "32px",
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "12px",
    },

    adContainer: {
      maxWidth: "850px",
      margin: "25px auto 0",
    },

    wideSection: {
      maxWidth: "1040px",
      margin: "0 auto",
      padding: "70px 24px 0",
    },

    sectionTitle: {
      margin: "7px 0 23px",
      color: colors.text,
      fontSize: "30px",
      letterSpacing: "-0.035em",
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
      maxWidth: "850px",
      margin: "45px auto 0",
      padding: "0 24px",
    },

    faqList: {
      borderTop: `1px solid ${colors.border}`,
    },

    contactSection: {
      maxWidth: "1040px",
      margin: "0 auto",
      padding: "70px 24px",
    },

    contactCard: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "28px",
      border: `1px solid ${colors.border}`,
      borderRadius: "20px",
      padding: "27px",
      background: colors.card,
    },

    contactTitle: {
      color: colors.text,
      fontSize: "26px",
      margin: "6px 0 6px",
    },

    contactText: {
      color: colors.muted,
      fontSize: "13px",
      lineHeight: 1.6,
      margin: 0,
    },

    contactButton: {
      border: "none",
      background: colors.accent,
      color: colors.buttonText,
      padding: "11px 17px",
      borderRadius: "10px",
      cursor: "pointer",
      fontWeight: 800,
      whiteSpace: "nowrap",
    },

    footer: {
      maxWidth: "1040px",
      margin: "0 auto",
      padding: "28px 24px 38px",
      borderTop: `1px solid ${colors.border}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "14px",
    },

    footerLogo: {
      color: colors.text,
      fontSize: "15px",
      fontWeight: 800,
    },

    footerLinks: {
      display: "flex",
      flexWrap: "wrap",
      gap: "13px",
    },

    footerLink: {
      border: "none",
      background: "transparent",
      color: colors.muted,
      cursor: "pointer",
      padding: 0,
      fontSize: "11px",
    },

    footerCopyright: {
      color: colors.subtle,
      fontSize: "10px",
    },

    cookieBanner: {
      position: "fixed",
      left: "18px",
      right: "18px",
      bottom: "18px",
      maxWidth: "780px",
      margin: "0 auto",
      zIndex: 1200,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "20px",
      padding: "16px 18px",
      borderRadius: "15px",
      border: `1px solid ${colors.border}`,
      background: colors.cardStrong,
      boxShadow:
        "0 20px 60px rgba(0,0,0,0.35)",
    },

    cookieTitle: {
      color: colors.text,
      fontWeight: 800,
      fontSize: "13px",
      marginBottom: "3px",
    },

    cookieText: {
      color: colors.muted,
      fontSize: "11px",
      lineHeight: 1.5,
    },

    cookieActions: {
      display: "flex",
      gap: "7px",
      flexShrink: 0,
    },

    cookieRefuse: {
      border: `1px solid ${colors.border}`,
      background: "transparent",
      color: colors.text,
      padding: "8px 11px",
      borderRadius: "9px",
      cursor: "pointer",
      fontSize: "11px",
    },

    cookieAccept: {
      border: "none",
      background: colors.accent,
      color: colors.buttonText,
      padding: "8px 11px",
      borderRadius: "9px",
      cursor: "pointer",
      fontWeight: 800,
      fontSize: "11px",
    },
  };
}