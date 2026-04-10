

# Deploy bulk-insert-parts Edge Function

## What needs to happen

The `bulk-insert-parts` edge function doesn't exist in the codebase yet. It needs to be created (modeled after the working `bulk-insert-scooters` function) and deployed, along with the local sync script.

## Files to create

### 1. `supabase/functions/bulk-insert-parts/index.ts` — New Edge Function

Modeled on `bulk-insert-scooters`, adapted for the `parts` table:

- **Auth**: `x-admin-secret` header checked against `ADMIN_BULK_SECRET`
- **Client**: service_role to bypass RLS
- **Input**: `{ categoryName, categorySlug?, parts: [...] }`
- **Category handling**: Upsert category by slug (like brand upsert in scooters)
- **Part upsert**: For each part, upsert into `parts` table on conflict `slug` with `published: false`
- **Fields mapped**: `name`, `slug`, `price`, `image_url`, `description`, `stock_quantity`, `difficulty_level`, `sku`, `meta_title`, `meta_description`, `youtube_video_id`, `estimated_install_time_minutes`, `required_tools`, `technical_metadata`
- **Response**: `{ success, category, results: { inserted, updated, errors } }`

### 2. `supabase/config.toml` — Add function config

Add `[functions.bulk-insert-parts]` with `verify_jwt = false` (same as bulk-insert-scooters).

### 3. `scripts/sync-parts.js` — Local import script

Clone of `sync-scooters.js` adapted for parts:
- Reads JSON from `--file` argument
- POSTs to `bulk-insert-parts` endpoint with `x-admin-secret` header
- Logs inserted/updated/errors

### 4. Deploy the function

Use the deploy tool to push `bulk-insert-parts` to the server.

### 5. Test the deployed function

Curl the endpoint to verify it responds correctly.

## JSON format for part imports

```json
{
  "categoryName": "Pneus",
  "categorySlug": "pneus",
  "parts": [{
    "name": "Pneu 10x2.5 Wattiz",
    "slug": "pneu-10x2-5-wattiz",
    "price": 15.00,
    "stock_quantity": 0,
    "difficulty_level": 2,
    "description": "<p>Description HTML</p>",
    "meta_title": "Pneu 10x2.5 | PiècesTrottinettes.fr",
    "meta_description": "155 chars max",
    "technical_metadata": {
      "sources": ["https://example.com"]
    }
  }]
}
```

## Files summary

| File | Action |
|------|--------|
| `supabase/functions/bulk-insert-parts/index.ts` | Create |
| `supabase/config.toml` | Add function config block |
| `scripts/sync-parts.js` | Create |
| Deploy `bulk-insert-parts` | Via deploy tool |
| Test endpoint | Via curl tool |

