import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);

export async function POST(
  request: Request
) {
  try {
    /* =========================
       1. VÉRIFICATION UTILISATEUR
    ========================= */

    const authHeader =
      request.headers.get("authorization");

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return NextResponse.json(
        {
          error:
            "Tu dois être connecté pour passer à Premium.",
        },
        {
          status: 401,
        }
      );
    }

    const accessToken =
      authHeader.replace("Bearer ", "");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(
      accessToken
    );

    if (
      userError ||
      !user ||
      !user.email
    ) {
      return NextResponse.json(
        {
          error:
            "Session utilisateur invalide.",
        },
        {
          status: 401,
        }
      );
    }

    /* =========================
       2. FORMULE CHOISIE
    ========================= */

    const body = await request.json();

    const billing = body.billing;

    if (
      billing !== "monthly" &&
      billing !== "yearly"
    ) {
      return NextResponse.json(
        {
          error:
            "Formule Premium invalide.",
        },
        {
          status: 400,
        }
      );
    }

    const priceId =
      billing === "monthly"
        ? process.env.STRIPE_PRICE_MONTHLY
        : process.env.STRIPE_PRICE_YEARLY;

    if (!priceId) {
      console.error(
        "ID Stripe manquant pour :",
        billing
      );

      return NextResponse.json(
        {
          error:
            "Configuration Stripe incomplète.",
        },
        {
          status: 500,
        }
      );
    }

    /* =========================
       3. URL DU SITE
    ========================= */

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    /* =========================
       4. CRÉATION CHECKOUT
    ========================= */

    const session =
      await stripe.checkout.sessions.create({
        mode: "subscription",

        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],

        customer_email: user.email,

        client_reference_id: user.id,

        metadata: {
          user_id: user.id,
          billing,
        },

      subscription_data: {
  trial_period_days: 3,

  metadata: {
    user_id: user.id,
    billing,
  },
},
    

        success_url:
          `${siteUrl}/premium/success?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${siteUrl}/premium`,
      });

    if (!session.url) {
      return NextResponse.json(
        {
          error:
            "Stripe n'a pas retourné d'URL de paiement.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error(
      "Erreur Stripe Checkout :",
      error
    );

    return NextResponse.json(
      {
        error:
          "Impossible de lancer le paiement Stripe.",
      },
      {
        status: 500,
      }
    );
  }
}