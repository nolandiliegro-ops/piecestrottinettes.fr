

## Diagnostic

**Garage.tsx (L162-209)** : déjà refait en segmented control 3 colonnes (✅ pas de scroll horizontal). **Aucune modif nécessaire** sur les onglets — sauf retirer `font-display tracking-wide` MAJUSCULES qui surcharge ; le style « simple » demandé.

**GarageMessages.tsx ConversationList (L326-380)** : actuellement style iMessage (avatars ronds + puces). À remplacer par style **carte commande** identique à `OrderHistorySection.OrderCard`.

## Plan d'exécution

### A. `src/pages/Garage.tsx` — onglets (alléger)
Remplacer `font-display tracking-wide` par `font-medium` sur les 3 `<span>` libellés (L174, L188, L202). Reste inchangé.

### B. `src/components/garage/GarageMessages.tsx` — ConversationList refonte (L326-380)

Copie exacte du pattern `OrderCard` :

```tsx
<div className="space-y-3">
  {conversations.map((conv) => {
    const isDirect = conv.order_id === 'direct';
    const preview = (conv.last_message || 'Nouvelle conversation').slice(0, 60);
    const isPending = conv.last_sender_type === 'client';
    
    // Status config aligné OrderHistorySection
    const statusCfg = isPending
      ? { label: 'En attente', bgClass: 'bg-orange-500/15', textClass: 'text-orange-600' }
      : { label: 'Répondu', bgClass: 'bg-green-500/15', textClass: 'text-green-600' };
    
    return (
      <motion.button
        key={conv.order_id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => onSelect(conv)}
        className="w-full bg-white/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
      >
        <div className="p-5 flex items-center justify-between gap-4 flex-wrap md:flex-nowrap text-left">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-mineral/10 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-mineral" />
            </div>
            <div className="min-w-0">
              <h3 className="font-mono text-lg font-bold text-carbon truncate">
                {isDirect ? 'Message général' : conv.order_number}
              </h3>
              <p className="text-sm text-carbon/50 truncate">{preview}</p>
            </div>
          </div>
          
          {/* Badge statut – style identique StatusBadge commande */}
          <div className={cn(
            "px-4 py-1.5 rounded-full border border-current/20",
            statusCfg.bgClass, statusCfg.textClass
          )}>
            <span className="text-xs font-semibold tracking-wide uppercase">{statusCfg.label}</span>
          </div>
          
          {/* Date + unread à droite */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right">
              <p className="text-[10px] text-carbon/40 uppercase tracking-wide">Dernier msg</p>
              <p className="text-sm font-medium text-carbon">
                {format(new Date(conv.last_message_at), "d MMM", { locale: fr })}
              </p>
            </div>
            {conv.unread_count > 0 && (
              <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-pulse">
                {conv.unread_count > 9 ? '9+' : conv.unread_count}
              </span>
            )}
          </div>
        </div>
      </motion.button>
    );
  })}
</div>
```

Suppressions : conteneur `bg-white rounded-2xl divide-y`, avatars ronds gradient, puces de statut sur avatar, `formatShortDate`.

## Fichiers touchés

| Fichier | Action |
|---|---|
| `src/pages/Garage.tsx` | Remplacer `font-display tracking-wide` → `font-medium` sur 3 libellés onglets |
| `src/components/garage/GarageMessages.tsx` | Refonte L326-380 ConversationList → cartes style OrderCard |

## Garanties
- Style carte 1:1 avec `OrderHistorySection.OrderCard` (mêmes classes : `bg-white/60`, `rounded-2xl`, `shadow-sm hover:shadow-lg`, padding `p-5`)
- Badge statut identique au `StatusBadge` commandes (`px-4 py-1.5 rounded-full border border-current/20`, `bg-X/15 text-X-600`)
- Numéro commande `font-mono text-lg font-bold text-carbon` (même que commandes)
- Aperçu message tronqué 60 chars en gris clair sous le numéro
- 0 régression : `useOrderConversations`, `onSelect`, badge unread préservés

