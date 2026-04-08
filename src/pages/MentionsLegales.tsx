import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const MentionsLegales = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Mentions Légales | Pièces Trottinettes"
        description="Mentions légales du site piècestrottinettes.fr : éditeur, hébergeur, propriété intellectuelle, données personnelles."
      />
      <Header />
      <main className="pt-24 pb-16 px-4">
        <article className="max-w-3xl mx-auto prose prose-neutral prose-headings:font-display prose-headings:tracking-wide prose-headings:text-carbon">
          <h1 className="text-3xl md:text-4xl mb-8">Mentions Légales</h1>

          <h2>Éditeur du site</h2>
          <p>
            Le site piècestrottinettes.fr est édité par :<br />
            <strong>DI LIEGRO Nolan Enzo</strong><br />
            Entrepreneur individuel (micro-entreprise)<br />
            Siège social : 258 Avenue de Toulon, 1er étage, 13010 Marseille, France<br />
            SIRET : 801 164 542 00053<br />
            TVA : Non assujetti à la TVA (franchise en base, article 293 B du CGI)<br />
            Directeur de la publication : Di Liegro Nolan Enzo<br />
            Contact : <a href="mailto:contact@piecestrottinettes.fr">contact@piecestrottinettes.fr</a>
          </p>

          <h2>Hébergeur</h2>
          <p>
            Le site est hébergé par :<br />
            <strong>Lovable / Supabase</strong><br />
            Les serveurs sont situés dans l'Union Européenne.
          </p>

          <h2>Propriété intellectuelle</h2>
          <p>
            L'ensemble des contenus (textes, images, logos, vidéos) présents sur le site
            piècestrottinettes.fr sont protégés par le droit d'auteur. Toute reproduction, même
            partielle, est interdite sans autorisation préalable de l'éditeur.
          </p>

          <h2>Données personnelles et RGPD</h2>
          <p>
            Conformément au Règlement Général sur la Protection des Données (RGPD), les données
            personnelles collectées sur ce site (nom, email, adresse) sont utilisées exclusivement
            pour le traitement des commandes et la communication avec les clients.
          </p>
          <p>
            Vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité
            de vos données. Pour exercer ces droits, contactez-nous à{" "}
            <a href="mailto:contact@piecestrottinettes.fr">contact@piecestrottinettes.fr</a>.
          </p>
          <p>
            Responsable du traitement : Di Liegro Nolan Enzo
          </p>

          <h2>Cookies</h2>
          <p>
            Le site utilise des cookies techniques nécessaires au bon fonctionnement du service
            (authentification, panier d'achat). Aucun cookie publicitaire ou de suivi tiers n'est
            utilisé sans votre consentement.
          </p>

          <h2>Médiation</h2>
          <p>
            En cas de litige, le consommateur peut recourir gratuitement au service de médiation.
            Médiateur : [Nom du médiateur ou de l'organisme]<br />
            Site : [URL du médiateur]
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default MentionsLegales;
