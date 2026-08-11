export default function ConfidentialitePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#07090d",
        color: "#ffffff",
        fontFamily: "Arial, Helvetica, sans-serif",
        padding: "70px 24px",
      }}
    >
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
        }}
      >
        <a
          href="/"
          style={{
            color: "#ff7d42",
            textDecoration: "none",
            fontSize: "13px",
          }}
        >
          ← Retour à CheckBuy
        </a>

        <h1
          style={{
            marginTop: "35px",
            fontSize: "42px",
            letterSpacing: "-1.5px",
          }}
        >
          Politique de confidentialité
        </h1>

        <p
          style={{
            color: "#c39b84",
            lineHeight: 1.7,
          }}
        >
          Dernière mise à jour : 11 août 2026
        </p>

        <Section title="Données collectées">
          <p>
            CheckBuy peut collecter certaines informations lorsque
            vous utilisez le service, notamment votre adresse e-mail,
            les informations liées à votre compte et les données
            nécessaires au fonctionnement des analyses.
          </p>
        </Section>

        <Section title="Utilisation des données">
          <p>
            Les données peuvent être utilisées pour :
          </p>

          <ul>
            <li>créer et gérer votre compte CheckBuy ;</li>
            <li>vous authentifier ;</li>
            <li>faire fonctionner les analyses de sites ;</li>
            <li>gérer votre historique ;</li>
            <li>gérer les avis communautaires ;</li>
            <li>gérer l&apos;abonnement Premium ;</li>
            <li>assurer la sécurité et le bon fonctionnement du service.</li>
          </ul>
        </Section>

        <Section title="Services utilisés">
          <p>
            CheckBuy utilise actuellement notamment :
          </p>

          <ul>
            <li>Supabase pour les comptes et certaines données ;</li>
            <li>Stripe pour la gestion des paiements et abonnements ;</li>
            <li>
              un hébergeur pour mettre le site en ligne lorsque CheckBuy
              sera publié.
            </li>
          </ul>
        </Section>

        <Section title="Paiements">
          <p>
            Les paiements Premium sont traités par Stripe. CheckBuy
            n&apos;a pas vocation à stocker directement les informations
            complètes de votre carte bancaire.
          </p>
        </Section>

        <Section title="Publicités">
          <p>
            Les comptes gratuits pourront afficher des publicités.
            CheckBuy prévoit d&apos;utiliser un service publicitaire tel
            que Google AdSense lorsque cette fonctionnalité sera activée.
          </p>

          <p>
            Les utilisateurs Premium et les utilisateurs bénéficiant
            d&apos;un essai Premium ne sont pas destinés à recevoir ces
            publicités sur CheckBuy.
          </p>
        </Section>

        <Section title="Conservation des données">
          <p>
            Les données sont conservées uniquement pendant la durée
            nécessaire au fonctionnement du service et au respect des
            obligations applicables.
          </p>
        </Section>

        <Section title="Vos droits">
          <p>
            Selon la réglementation applicable, vous pouvez notamment
            disposer de droits d&apos;accès, de rectification,
            d&apos;effacement ou de limitation concernant certaines de
            vos données personnelles.
          </p>

          <p>
            Les modalités précises de contact seront ajoutées avant le
            lancement public de CheckBuy.
          </p>
        </Section>

        <Section title="Sécurité">
          <p>
            CheckBuy met en œuvre des mesures destinées à protéger les
            comptes et les données. Aucun système informatique ne peut
            toutefois garantir une sécurité absolue.
          </p>
        </Section>

        <Section title="Modifications">
          <p>
            Cette politique pourra être modifiée afin de refléter les
            évolutions de CheckBuy, de ses prestataires ou des règles
            applicables.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Pour toute question concernant vos données personnelles,
            utilisez l&apos;adresse de contact officielle de CheckBuy
            lorsqu&apos;elle sera indiquée sur le site.
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        marginTop: "38px",
        paddingTop: "24px",
        borderTop: "1px solid rgba(255,125,66,0.15)",
      }}
    >
      <h2
        style={{
          marginBottom: "14px",
          fontSize: "20px",
        }}
      >
        {title}
      </h2>

      <div
        style={{
          color: "#c39b84",
          fontSize: "14px",
          lineHeight: 1.8,
        }}
      >
        {children}
      </div>
    </section>
  );
}