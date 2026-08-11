export default function CookiesPage() {
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
          Politique relative aux cookies
        </h1>

        <p
          style={{
            color: "#c39b84",
            lineHeight: 1.7,
          }}
        >
          Dernière mise à jour : 11 août 2026
        </p>

        <Section title="Qu’est-ce qu’un cookie ?">
          <p>
            Un cookie est un petit fichier pouvant être enregistré
            sur votre appareil lors de la consultation d’un site internet.
          </p>
        </Section>

        <Section title="Cookies nécessaires">
          <p>
            CheckBuy peut utiliser des cookies ou technologies similaires
            nécessaires au fonctionnement du service, notamment pour
            l’authentification, la sécurité et la gestion de votre session.
          </p>
        </Section>

        <Section title="Préférences">
          <p>
            CheckBuy peut enregistrer certaines préférences sur votre appareil.
            Par exemple, le thème choisi peut être conservé afin de retrouver
            la même apparence lors de votre prochaine visite.
          </p>
        </Section>

        <Section title="Publicités">
          <p>
            CheckBuy prévoit d’afficher des publicités sur les comptes gratuits.
            Lorsque Google AdSense ou un autre service publicitaire sera activé,
            des cookies ou technologies similaires pourront être utilisés
            selon votre consentement et la réglementation applicable.
          </p>

          <p>
            Les comptes Premium et les utilisateurs bénéficiant d’un essai
            Premium ne sont pas destinés à afficher ces publicités.
          </p>
        </Section>

        <Section title="Consentement">
          <p>
            Lorsque des cookies non indispensables seront utilisés, CheckBuy
            mettra en place un mécanisme permettant d’accepter, de refuser
            ou de modifier vos choix.
          </p>
        </Section>

        <Section title="Modifier vos choix">
          <p>
            Une option permettant de revoir les préférences liées aux cookies
            sera ajoutée avant l’activation des cookies publicitaires.
          </p>
        </Section>

        <Section title="Durée de conservation">
          <p>
            La durée de conservation dépend du type de cookie utilisé et
            du service concerné. Les durées exactes seront précisées lorsque
            les services publicitaires seront activés.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Pour toute question concernant l’utilisation des cookies sur
            CheckBuy, utilisez l’adresse de contact officielle indiquée
            dans les mentions légales.
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