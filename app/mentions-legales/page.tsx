export default function MentionsLegalesPage() {
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
          Mentions légales
        </h1>

        <p
          style={{
            color: "#c39b84",
            lineHeight: 1.7,
          }}
        >
          Dernière mise à jour : 11 août 2026
        </p>

        <Section title="Éditeur du site">
          <p>
            Le site CheckBuy est édité par :
          </p>

          <p>
            <strong>Nom / raison sociale :</strong> À compléter
            <br />
            <strong>Statut juridique :</strong> À compléter
            <br />
            <strong>Adresse :</strong> À compléter
            <br />
            <strong>Adresse e-mail :</strong> À compléter
            <br />
            <strong>SIREN / SIRET :</strong> À compléter lorsque disponible
          </p>
        </Section>

        <Section title="Responsable de la publication">
          <p>
            Responsable de la publication : À compléter
          </p>
        </Section>

        <Section title="Hébergement">
          <p>
            Le site CheckBuy est hébergé par :
          </p>

          <p>
            <strong>Hébergeur :</strong> À compléter
            <br />
            <strong>Adresse :</strong> À compléter
            <br />
            <strong>Site internet :</strong> À compléter
          </p>
        </Section>

        <Section title="Objet du service">
          <p>
            CheckBuy propose un outil d&apos;analyse permettant
            d&apos;identifier différents signaux techniques liés à
            un site internet.
          </p>

          <p>
            Les résultats fournis par CheckBuy sont donnés à titre
            informatif et ne constituent pas une garantie concernant
            la fiabilité d&apos;un vendeur, d&apos;un produit ou
            d&apos;une transaction.
          </p>
        </Section>

        <Section title="Propriété intellectuelle">
          <p>
            Les éléments présents sur CheckBuy, notamment le nom,
            l&apos;interface, les textes, les éléments graphiques et
            le code appartenant à CheckBuy, sont protégés par les
            règles applicables en matière de propriété intellectuelle.
          </p>

          <p>
            Toute reproduction ou utilisation non autorisée de ces
            éléments peut être interdite.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Pour toute question concernant CheckBuy, vous pouvez nous
            contacter à l&apos;adresse indiquée dans la section
            « Éditeur du site ».
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