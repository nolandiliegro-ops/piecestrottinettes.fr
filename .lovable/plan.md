

# Redesign "PRÉSENTATION" — Implementation Plan

## Summary
Move the product description into the desktop Bento Grid as the 4th tile in Row 1 (next to PurchaseBlock), remove the old standalone section, upgrade visuals with a sage green accent bar, scroll-reveal animation, and ensure readable typography.

## File: `src/pages/PartDetail.tsx`

### 1. Remove `FileText` import
Change `import { ArrowLeft, FileText }` → `import { ArrowLeft }`.

### 2. Desktop Bento Grid — Add description as Row 1, Col 4
After the PurchaseBlock div (line 137), insert a new tile conditionally rendered when `part.description` exists:

```tsx
{/* Description — PRÉSENTATION */}
{part.description && part.description.trim() && (
  <div className="col-span-1 row-span-1">
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className="h-full rounded-2xl shadow-md bg-white/70 backdrop-blur-sm border border-white/40 p-6 overflow-y-auto border-l-4 border-l-[#4A7C59]"
    >
      <h2 className="font-black text-carbon uppercase tracking-tight text-lg mb-4">
        Présentation
      </h2>
      <div
        className="quill-content text-[#1A1A1A] text-sm leading-[1.7]"
        dangerouslySetInnerHTML={{ __html: part.description }}
      />
    </motion.div>
  </div>
)}
```

This places the description immediately after PurchaseBlock in the 4th column of Row 1.

### 3. Remove old desktop description section
Delete lines 169–192 (the `hidden md:block` description section that sits below the bento grid).

### 4. Mobile — Upgrade description card
Replace the current mobile description block (lines 222–241) with:

```tsx
{part.description && part.description.trim() && (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
    className="rounded-2xl shadow-md bg-white/70 backdrop-blur-sm border border-white/40 p-6 border-l-4 border-l-[#4A7C59]"
  >
    <h2 className="font-black text-carbon uppercase tracking-tight text-base mb-4">
      Présentation
    </h2>
    <div
      className="quill-content text-[#1A1A1A] text-sm leading-[1.7]"
      dangerouslySetInnerHTML={{ __html: part.description }}
    />
  </motion.div>
)}
```

Key changes: `p-6` padding, green accent bar via `border-l-4 border-l-[#4A7C59]`, `whileInView` scroll reveal, text color `#1A1A1A`, `leading-[1.7]`.

## File: `src/index.css`

Update the `.quill-content` styles at the bottom to enforce readable typography:

```css
.quill-content p {
  margin-bottom: 0.75rem;
  line-height: 1.7;
  color: #1A1A1A;
}

.quill-content strong {
  font-weight: 700;
  color: #0d0d0d;
}

.quill-content ul,
.quill-content ol {
  padding-left: 1.5rem;
  margin-bottom: 0.75rem;
  color: #1A1A1A;
}

.quill-content li {
  margin-bottom: 0.25rem;
  line-height: 1.7;
}
```

## Build error fix
The `resend` import errors in `send-contact-email` and `stripe-webhook` are pre-existing and unrelated — no action needed for this task.

## Visual result
- **Desktop**: Description is the 4th tile in Row 1, with a sage green left accent bar, scroll-animated reveal, and overflow-y-auto for long content
- **Mobile**: Full-width card after PurchaseBlock with p-6 padding, green accent bar, smooth scroll reveal
- **Typography**: Text color `#1A1A1A`, line-height 1.7, proper paragraph spacing

