import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'order-messages-images';
const PUBLIC_MARKER = `/object/public/${BUCKET}/`;
const SIGNED_MARKER = `/object/sign/${BUCKET}/`;

/**
 * Extract the storage path from a stored value which may be a legacy public URL,
 * a signed URL, or a bare path.
 */
export function extractMessageImagePath(stored: string): string {
  if (!stored) return stored;
  const publicIdx = stored.indexOf(PUBLIC_MARKER);
  if (publicIdx >= 0) return stored.substring(publicIdx + PUBLIC_MARKER.length).split('?')[0];
  const signedIdx = stored.indexOf(SIGNED_MARKER);
  if (signedIdx >= 0) return stored.substring(signedIdx + SIGNED_MARKER.length).split('?')[0];
  return stored;
}

/**
 * Resolve a stored message image reference to a fresh signed URL.
 * The bucket is private; reads require a signed URL.
 */
export function useSignedMessageImageUrl(stored: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!stored) {
      setUrl(null);
      return;
    }
    const path = extractMessageImagePath(stored);
    supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (!cancelled) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [stored]);

  return url;
}
