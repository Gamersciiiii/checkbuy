import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);

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

export async function POST(request: Request) {
  const signature =
    request.headers.get("stripe-signature");

  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error(
      "Signature ou STRIPE_WEBHOOK_SECRET manquant"
    );

    return NextResponse.json(
      { error: "Webhook mal configuré" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error(
      "Erreur signature Stripe :",
      error
    );

    return NextResponse.json(
      { error: "Signature invalide" },
      { status: 400 }
    );
  }

  try {
    /* =====================================
       PAIEMENT CHECKOUT TERMINÉ
    ===================================== */

    if (
      event.type ===
      "checkout.session.completed"
    ) {
      const session =
        event.data.object as Stripe.Checkout.Session;

      const userId =
        session.client_reference_id;

      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;

      const billing =
        session.metadata?.billing;

      if (!userId) {
        throw new Error(
          "user_id introuvable dans la session Stripe"
        );
      }

      if (!subscriptionId) {
        throw new Error(
          "subscription_id introuvable"
        );
      }

      /*
       * On demande directement à Stripe
       * l'état réel de l'abonnement.
       */
      const subscription =
        await stripe.subscriptions.retrieve(
          subscriptionId
        );

      const { error } =
        await supabaseAdmin
          .from("subscriptions")
          .upsert(
            {
              user_id: userId,

              stripe_customer_id:
                customerId ?? null,

              stripe_subscription_id:
                subscriptionId,

              status:
                subscription.status,

              billing:
                billing === "monthly" ||
                billing === "yearly"
                  ? billing
                  : null,

              updated_at:
                new Date().toISOString(),
            },
            {
              onConflict: "user_id",
            }
          );

      if (error) {
        console.error(
          "ERREUR SUPABASE :",
          error
        );

        throw error;
      }

      console.log(
        "✅ PREMIUM ENREGISTRÉ :",
        userId,
        subscription.status
      );
    }

    /* =====================================
       ABONNEMENT MODIFIÉ / ANNULÉ
    ===================================== */

    if (
      event.type ===
        "customer.subscription.updated" ||
      event.type ===
        "customer.subscription.deleted"
    ) {
      const subscription =
        event.data.object as Stripe.Subscription;

      const userId =
        subscription.metadata?.user_id;

      if (userId) {
        const { error } =
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status:
                subscription.status,

              updated_at:
                new Date().toISOString(),
            })
            .eq("user_id", userId);

        if (error) {
          throw error;
        }

        console.log(
          "✅ ABONNEMENT MIS À JOUR :",
          subscription.status
        );
      }
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "ERREUR WEBHOOK :",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erreur traitement webhook",
      },
      {
        status: 500,
      }
    );
  }
}