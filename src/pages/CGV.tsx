import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const CGV = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Conditions Générales de Vente | Pièces Trottinettes"
        description="Consultez les conditions générales de vente de piècestrottinettes.fr : commande, livraison, retour, garantie."
      />
      <Header />
      <main className="pt-24 pb-16 px-4">
        <article className="max-w-3xl mx-auto prose prose-neutral prose-headings:font-display prose-headings:tracking-wide prose-headings:text-carbon">
          <h1 className="text-3xl md:text-4xl mb-8">Conditions Générales de Vente</h1>
          <p className="text-muted-foreground text-sm">Dernière mise à jour : 8 avril 2026</p>

          {/* Identité du vendeur */}
          <div className="bg-mineral/10 border border-mineral/20 rounded-xl p-6 my-8 not-prose">
            <h2 className="font-display text-lg tracking-wide text-carbon mb-3">VENDEUR</h2>
            <ul className="space-y-1 text-sm text-foreground/80">
              <li><strong>Nom :</strong> DI LIEGRO Nolan Enzo</li>
              <li><strong>Forme juridique :</strong> Entrepreneur individuel (micro-entreprise)</li>
              <li><strong>Siège social :</strong> 258 Avenue de Toulon, 1er étage, 13010 Marseille, France</li>
              <li><strong>SIRET :</strong> 801 164 542 00053</li>
              <li><strong>Email :</strong>{" "}
                <a href="mailto:contact@piecestrottinettes.fr" className="text-mineral hover:underline">
                  contact@piecestrottinettes.fr
                </a>
              </li>
            </ul>
          </div>

          <h2>Article 1 — Objet</h2>
          <p>
            Les présentes conditions générales de vente (CGV) régissent les ventes de pièces détachées
            pour trottinettes électriques réalisées sur le site piècestrottinettes.fr. Toute commande
            implique l'acceptation sans réserve des présentes CGV.
          </p>

          <h2>Article 2 — Prix</h2>
          <p>
            Les prix sont indiqués en euros, nets et TTC. Le vendeur n'est pas assujetti à la TVA
            en application de l'article 293 B du Code général des impôts (franchise en base de TVA).
            En conséquence, la TVA n'est pas applicable et aucune TVA ne sera facturée.
            Les prix peuvent être modifiés à tout moment, mais les produits sont facturés sur la base du
            tarif en vigueur au moment de la validation de la commande.
          </p>

          <h2>Article 3 — Commande</h2>
          <p>
            La commande est validée après confirmation du paiement. Un email de confirmation est envoyé
            à l'adresse indiquée lors de la commande. Le vendeur se réserve le droit de refuser toute
            commande en cas de stock insuffisant ou de problème de paiement.
          </p>

          <h2>Article 4 — Paiement</h2>
          <p>
            Le paiement s'effectue par carte bancaire via la plateforme sécurisée Stripe. Le montant est
            débité au moment de la validation de la commande.
          </p>

          <h2>Article 5 — Livraison</h2>
          <p>
            Les produits sont livrés à l'adresse indiquée lors de la commande. Les délais de livraison
            sont donnés à titre indicatif. Un retard de livraison ne peut donner lieu à l'annulation de
            la commande ni à une indemnisation. Les frais de livraison sont indiqués avant la validation
            de la commande.
          </p>

          <h2>Article 6 — Droit de rétractation</h2>
          <p>
            Conformément à l'article L221-18 du Code de la consommation, vous disposez d'un délai de
            14 jours à compter de la réception du produit pour exercer votre droit de rétractation, sans
            avoir à justifier de motifs ni à payer de pénalités. Les frais de retour sont à la charge de
            l'acheteur. Le produit doit être retourné dans son emballage d'origine, en parfait état.
          </p>

          <h2>Article 7 — Garanties</h2>
          <p>
            Tous les produits bénéficient de la garantie légale de conformité (articles L217-4 à L217-12
            du Code de la consommation) et de la garantie contre les vices cachés (articles 1641 à 1649
            du Code civil).
          </p>

          <h2>Article 8 — Responsabilité</h2>
          <p>
            Le vendeur ne saurait être tenu responsable des dommages résultant d'une mauvaise utilisation
            du produit, d'une installation non conforme aux instructions fournies, ou de l'usure normale
            des pièces.
          </p>

          <h2>Article 9 — Données personnelles</h2>
          <p>
            Les données collectées lors de la commande sont nécessaires au traitement de celle-ci.
            Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression
            de vos données. Pour exercer ces droits, contactez-nous à{" "}
            <a href="mailto:contact@piecestrottinettes.fr">contact@piecestrottinettes.fr</a>.
          </p>

          <h2>Article 10 — Droit applicable</h2>
          <p>
            Les présentes CGV sont soumises au droit français. En cas de litige, les tribunaux compétents
            seront ceux du ressort du domicile du défendeur.
          </p>

          <h2>Article 11 — Médiation</h2>
          <p>
            Conformément aux articles L611-1 et R612-1 du Code de la consommation, en cas de litige
            non résolu, le consommateur peut recourir gratuitement au service de médiation suivant :
          </p>
          <p>
            <strong>CM2C — Centre de la Médiation de la Consommation de Conciliateurs de Justice</strong><br />
            Site internet :{" "}
            <a href="https://www.cm2c.net" target="_blank" rel="noopener noreferrer">
              www.cm2c.net
            </a>
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default CGV;
