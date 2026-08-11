import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);

export async function POST(request: Request) {
  try {
    /* =========================
       1. VÉRIFIER LE COMPTE
    ========================= */

    const authHeader =
      request.headers.get("authorization");

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return NextResponse.json(
        {
          error: "Tu dois être connecté.",
        },
        {
          status: 401,
        }
      );
    }

    const accessToken =
      authHeader.replace("Bearer ", "");

    const supabaseAuth = createClient(
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
    } = await supabaseAuth.auth.getUser(
      accessToken
    );

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Session invalide.",
        },
        {
          status: 401,
        }
      );
    }

    /* =========================
       2. CLIENT SUPABASE SERVEUR
    ========================= */

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

    /* =========================
       3. TROUVER LE CLIENT STRIPE
    ========================= */

    const {
      data: subscription,
      error: subscriptionError,
    } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "stripe_customer_id, stripe_subscription_id, status"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriptionError) {
      console.error(
        "Erreur abonnement Supabase :",
        subscriptionError
      );

      return NextResponse.json(
        {
          error:
            "Impossible de récupérer ton abonnement.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      !subscription ||
      !subscription.stripe_customer_id
    ) {
      return NextResponse.json(
        {
          error:
            "Aucun abonnement Stripe trouvé pour ce compte.",
        },
        {
          status: 404,
        }
      );
    }

    /* =========================
       4. CRÉER LE PORTAIL STRIPE
    ========================= */

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const portalSession =
      await stripe.billingPortal.sessions.create({
        customer:
          subscription.stripe_customer_id,

        return_url:
          `${siteUrl}/account`,
      });

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error) {
    console.error(
      "Erreur portail Stripe :",
      error
    );

    return NextResponse.json(
      {
        error:
          "Impossible d'ouvrir la gestion de l'abonnement.",
      },
      {
        status: 500,
      }
    );
  }
}