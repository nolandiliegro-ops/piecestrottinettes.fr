import { useState } from "react";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const payload = {
      name: (formData.get("name") as string).trim(),
      email: (formData.get("email") as string).trim(),
      subject: (formData.get("subject") as string).trim(),
      message: (formData.get("message") as string).trim(),
    };

    try {
      const { data, error } = await supabase.functions.invoke("send-contact-email", {
        body: payload,
      });

      if (error) throw error;
      if (data && !data.success) throw new Error(data.error || "Erreur inconnue");

      toast.success("Message envoyé ! Nous vous répondrons sous 48h.");
      form.reset();
    } catch (err) {
      console.error("Contact form error:", err);
      toast.error("Erreur lors de l'envoi. Veuillez réessayer ou nous écrire directement par email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Contact | Pièces Trottinettes"
        description="Contactez l'équipe piècestrottinettes.fr pour toute question sur vos pièces détachées de trottinette électrique."
      />
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl text-carbon tracking-wide mb-4">
            CONTACTEZ-NOUS
          </h1>
          <p className="text-muted-foreground mb-8">
            Une question sur une commande ou une pièce ? Écrivez-nous, nous répondons sous 48h.
          </p>

          <div className="flex items-center gap-3 bg-mineral/10 rounded-xl p-4 mb-10">
            <Mail className="w-5 h-5 text-mineral shrink-0" />
            <a
              href="mailto:contact@piecestrottinettes.fr"
              className="text-carbon font-medium hover:text-mineral transition-colors"
            >
              contact@piecestrottinettes.fr
            </a>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-carbon">Nom *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  maxLength={100}
                  placeholder="Jean Dupont"
                  className="text-base bg-white/60 border-white/30 focus:border-mineral focus:ring-mineral/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-carbon">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  maxLength={255}
                  placeholder="jean@exemple.fr"
                  className="text-base bg-white/60 border-white/30 focus:border-mineral focus:ring-mineral/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject" className="text-carbon">Sujet *</Label>
              <Input
                id="subject"
                name="subject"
                required
                maxLength={200}
                placeholder="Question sur ma commande #..."
                className="text-base bg-white/60 border-white/30 focus:border-mineral focus:ring-mineral/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-carbon">Message *</Label>
              <Textarea
                id="message"
                name="message"
                required
                maxLength={5000}
                rows={6}
                placeholder="Décrivez votre demande..."
                className="text-base bg-white/60 border-white/30 focus:border-mineral focus:ring-mineral/20 resize-none"
              />
            </div>

            <Button
              type="submit"
              variant="cta"
              size="lg"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
