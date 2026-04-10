

# Plan — Deploy `generate-seo` Edge Function

## Steps

1. **Add config entry** in `supabase/config.toml` — add `[functions.generate-seo]` with `verify_jwt = false` (the function uses `apikey` header auth, not JWT).

2. **Deploy** the function using the deploy tool.

## Files modified

| File | Action |
|------|--------|
| `supabase/config.toml` | Add `[functions.generate-seo]` block |

