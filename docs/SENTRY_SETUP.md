# Configuration Sentry - PiècesTrottinettes

## Mission 3.5 - Monitoring & Error Tracking

Ce document explique comment configurer Sentry pour le monitoring d'erreurs et la performance.

---

## 📋 **Prérequis**

1. Compte Sentry (gratuit) : https://sentry.io/signup/
2. Projet créé sur Sentry

---

## 🔧 **Configuration**

### **1. Créer un projet Sentry**

1. Allez sur https://sentry.io/
2. Cliquez sur **"Create Project"**
3. Sélectionnez **"React"**
4. Nommez le projet : `piecestrottinettes`
5. Copiez le **DSN** fourni

### **2. Configurer les variables d'environnement**

Ajoutez dans votre fichier `.env` (ou dans Lovable Settings) :

```env
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id
VITE_APP_VERSION=1.0.0
```

### **3. Vérifier l'installation**

Les fichiers suivants ont été créés/modifiés :

- ✅ `src/lib/sentry.ts` - Configuration Sentry
- ✅ `src/main.tsx` - Initialisation Sentry
- ✅ `src/contexts/AuthContext.tsx` - Tracking utilisateur
- ✅ `.env.example` - Variables d'environnement
- ✅ `package.json` - Dépendance `@sentry/react`

---

## 🎯 **Fonctionnalités**

### **1. Error Tracking**

Toutes les erreurs JavaScript sont automatiquement capturées et envoyées à Sentry.

### **2. Performance Monitoring**

Les transactions et les performances sont trackées :
- Temps de chargement des pages
- Requêtes API
- Interactions utilisateur

### **3. Session Replay**

10% des sessions sont enregistrées pour debug (100% si erreur).

### **4. User Context**

Les informations utilisateur sont automatiquement associées aux erreurs :
- ID utilisateur
- Email
- Actions effectuées (breadcrumbs)

### **5. Filtrage des données sensibles**

Les données sensibles sont automatiquement filtrées :
- Mots de passe
- Tokens d'authentification
- Cookies
- Headers Authorization

---

## 📊 **Utilisation**

### **Capturer une erreur manuellement**

```typescript
import { captureError } from '@/lib/sentry';

try {
  // Code qui peut échouer
  await riskyOperation();
} catch (error) {
  captureError(error as Error, {
    context: 'checkout',
    orderId: '123',
  });
}
```

### **Capturer un message**

```typescript
import { captureMessage } from '@/lib/sentry';

captureMessage('Payment processed successfully', 'info');
```

### **Ajouter un breadcrumb**

```typescript
import { addBreadcrumb } from '@/lib/sentry';

addBreadcrumb(
  'User added item to cart',
  'user-action',
  { productId: '123', quantity: 2 }
);
```

### **Tracker une transaction**

```typescript
import { startTransaction } from '@/lib/sentry';

const transaction = startTransaction('checkout-process', 'http');
// ... code ...
transaction.finish();
```

---

## 🧪 **Tester Sentry**

### **1. Tester en développement**

Sentry est désactivé en développement par défaut. Pour tester :

1. Modifiez `src/lib/sentry.ts` :
```typescript
if (import.meta.env.PROD || true) { // Force activation
```

2. Ajoutez un bouton de test :
```tsx
<button onClick={() => {
  throw new Error('Test Sentry Error');
}}>
  Test Sentry
</button>
```

### **2. Tester en production**

1. Déployez sur Lovable
2. Ouvrez la console du navigateur
3. Tapez : `throw new Error('Test Sentry');`
4. Vérifiez sur Sentry.io que l'erreur apparaît

---

## 📈 **Dashboard Sentry**

### **Accéder au dashboard**

1. Allez sur https://sentry.io/
2. Sélectionnez votre projet `piecestrottinettes`
3. Vous verrez :
   - **Issues** : Toutes les erreurs
   - **Performance** : Métriques de performance
   - **Replays** : Enregistrements de sessions
   - **Releases** : Versions déployées

### **Configurer les alertes**

1. Allez dans **Settings** > **Alerts**
2. Créez une règle :
   - **Condition** : "An issue is first seen"
   - **Action** : "Send a notification via Email"
3. Sauvegardez

---

## 🔒 **Sécurité**

### **Données filtrées automatiquement**

- ✅ Mots de passe
- ✅ Tokens JWT
- ✅ API Keys
- ✅ Cookies
- ✅ Headers Authorization

### **Erreurs ignorées**

- Extensions de navigateur
- Erreurs réseau (attendues)
- Erreurs d'authentification Supabase (normales)

---

## 📝 **Checklist de déploiement**

Avant de déployer en production :

- [ ] DSN Sentry configuré dans `.env`
- [ ] Version de l'app définie (`VITE_APP_VERSION`)
- [ ] Alertes configurées sur Sentry.io
- [ ] Test d'erreur effectué en production
- [ ] Dashboard Sentry vérifié

---

## 🆘 **Support**

- Documentation Sentry : https://docs.sentry.io/platforms/javascript/guides/react/
- Support Sentry : https://sentry.io/support/

---

## ✅ **Statut**

**Mission 3.5 - Monitoring Sentry : TERMINÉE**

- ✅ SDK installé
- ✅ Configuration créée
- ✅ Initialisation dans main.tsx
- ✅ Tracking utilisateur dans AuthContext
- ✅ Filtrage des données sensibles
- ✅ Documentation complète
