"use client";

import {
  useEffect,
  type CSSProperties,
} from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

type Props = {
  client?: string;
  slot?: string;
};

export default function AdBanner({
  client,
  slot,
}: Props) {
  useEffect(() => {
    if (!client || !slot) {
      return;
    }

    try {
      (
        window.adsbygoogle =
          window.adsbygoogle || []
      ).push({});
    } catch (error) {
      console.error(
        "Erreur AdSense :",
        error
      );
    }
  }, [client, slot]);

  /*
   * Tant qu'AdSense n'est pas configuré,
   * on affiche simplement l'emplacement.
   */
  if (!client || !slot) {
    return (
      <div style={styles.placeholder}>
        <div style={styles.label}>
          PUBLICITÉ
        </div>

        <div style={styles.text}>
          Emplacement publicitaire
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.label}>
        PUBLICITÉ
      </div>

      <ins
        className="adsbygoogle"
        style={{
          display: "block",
          width: "100%",
        }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

const styles: Record<
  string,
  CSSProperties
> = {
  wrapper: {
    width: "100%",

    maxWidth: "900px",

    margin: "35px auto",

    textAlign: "center",
  },

  placeholder: {
    width: "100%",

    maxWidth: "900px",

    minHeight: "95px",

    margin: "35px auto",

    boxSizing: "border-box",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    borderRadius: "15px",

    border:
      "1px solid rgba(255,125,66,0.13)",

    background:
      "rgba(255,125,66,0.025)",
  },

  label: {
    marginBottom: "7px",

    color: "#775d50",

    fontSize: "8px",

    fontWeight: 700,

    letterSpacing: "1px",
  },

  text: {
    color: "#765f54",

    fontSize: "10px",
  },
};