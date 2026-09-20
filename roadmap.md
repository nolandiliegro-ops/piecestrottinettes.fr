# Roadmap

## En cours
- [ ] Edge Function `ingest-fitment-raw` (Key Hunter) : fonction + bloc config.toml, périmètre strict fitment_raw / supplier_model_alias, secret KEY_HUNTER_SECRET (à créer par l'utilisateur).

## À faire plus tard (signalés, hors périmètre)
- `awaiting_payment` absent du mapping de statuts admin (OrdersManager.tsx).
- `parts.stock_quantity` jamais décrémenté à la vente, ni restitué à l'annulation.
- `send-order-email` envoie une copie vers contact@piecestrottinettes.fr.
- Scan sécurité : 3 alertes critiques dont `_backup_victor_20260717` lisible publiquement.
- Erreurs front preview : `Cannot read properties of null (reading 'useContext')`.
