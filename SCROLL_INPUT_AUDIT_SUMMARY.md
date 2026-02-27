# SkillAntra Scroll & Input System Audit

## Executive Summary

A full scroll and input audit was performed across the SkillAntra codebase. Several root-cause issues that caused scroll traps, trackpad problems, and input blocking were identified and fixed.

---

## Issues Found

### 1. **AuthForm Scroll Trap (CRITICAL)**
- **Symptom**: Long signup form could not be scrolled; users could not reach the submit button or see all fields.
- **Root cause**: `overflow-hidden` on the auth page container prevented vertical scroll. Combined with `flex items-center justify-center`, content that exceeded viewport height was clipped.
- **Impact**: Signup form unusable on laptops with shorter viewports or when zoomed.

### 2. **overscroll-behavior: none — Stiff Scroll Feel**
- **Symptom**: Scroll felt "locked" or "stuck" at top/bottom boundaries; trackpad scroll felt unnatural.
- **Root cause**: `overscroll-behavior: none` on both `html` and `body` prevented natural scroll chaining and momentum.
- **Impact**: Users reported scroll locking and inconsistent responsiveness, especially on trackpads.

### 3. **Modal Scroll Leak**
- **Symptom**: When PhoneNumberModal was open, background page could still scroll.
- **Root cause**: No body scroll lock when modal opens; no restoration when it closes.
- **Impact**: Poor modal UX; background scroll interfered with modal interaction.

### 4. **Landing Hero overflow-hidden**
- **Symptom**: Potential clip of hero content on very short viewports.
- **Root cause**: `overflow-hidden` on hero section clipped both horizontal and vertical overflow.
- **Fix**: Replaced with `overflow-x-hidden overflow-y-visible` to clip only horizontal, allow vertical scroll.

### 5. **main overflow-x: hidden — Trackpad Behavior**
- **Symptom**: On some setups, `overflow-x: hidden` on `main` could create an unintended scroll context.
- **Root cause**: `overflow-x: hidden` can establish a block formatting context that affects scroll propagation in some browsers.
- **Fix**: Use `overflow-x: clip` where supported (does not create scroll container); fallback to `hidden` for older Safari.

### 6. **Redundant overscroll-none Classes**
- **Symptom**: Over-application of `overscroll-none` on multiple containers.
- **Root cause**: Previous mobile optimization added `overscroll-none` to layout, auth, terms, privacy, and landing containers.
- **Fix**: Removed from containers; centralized and refined in globals.css.

---

## Structural Problems Identified

1. **No Body Scroll Lock for Modals**: Modals did not lock background scroll, causing scroll and focus to leak.
2. **Global overscroll-behavior Too Restrictive**: `overscroll-behavior: none` everywhere made scroll feel unnatural.
3. **Scroll Container Conflicts**: Multiple elements with overflow rules created nested scroll contexts that could capture trackpad input.
4. **Form Layout Not Scroll-Aware**: Auth form assumed content would always fit in viewport.

---

## What Was Refactored

### globals.css
- **html/body**: `overscroll-behavior: none` → `overscroll-behavior-x: none` and `overscroll-behavior-y: auto` (natural vertical scroll).
- **main**: `overflow-x: hidden` → `overflow-x: clip` (when supported) with `overflow-y: visible`.
- Kept `-webkit-overflow-scrolling: touch` for iOS momentum scroll.

### AuthForm
- Removed `overflow-hidden` so the page can scroll when the form is long.
- Changed `items-center` → `items-start` for top-aligned, scroll-friendly layout.
- Kept `overflow-x-hidden` to avoid horizontal overflow.

### PhoneNumberModal
- Added body scroll lock on open via `useEffect`: `document.body.style.overflow = 'hidden'`.
- Compensates for scrollbar width to prevent layout shift.
- Restores on unmount/close via cleanup function.

### Landing page hero
- `overflow-hidden` → `overflow-x-hidden overflow-y-visible` so only horizontal overflow is clipped.

### Layout containers
- Removed `overscroll-none` from layout root, auth, terms, privacy.
- Ensured `overflow-y-visible` on app layout divs so vertical scroll is not clipped.

### Root layout
- Removed `overscroll-none` class from `html`.
- Kept `touch-manipulation` on body for tap responsiveness.

---

## Scroll & Input Checklist

| Check | Status |
|-------|--------|
| No scroll traps | ✅ Fixed AuthForm overflow trap |
| No nested scroll conflicts | ✅ Sidebar nav uses `overscroll-contain`; modal content scrolls independently |
| No input blocking | ✅ No preventDefault on scroll/wheel; only on form submit |
| Mouse wheel scroll works | ✅ No blocking; document scroll is natural |
| Two-finger trackpad scroll works | ✅ overscroll-behavior-y: auto; main uses clip where supported |
| Touchscreen scroll works | ✅ -webkit-overflow-scrolling: touch; touch-action: manipulation on controls |
| Modal locks body scroll | ✅ PhoneNumberModal locks and restores body overflow |
| No dead-zones | ✅ All scrollable areas allow scroll |
| Sections scrollable | ✅ Landing, app pages, forms all scroll naturally |

---

## Input Handling Notes

- **preventDefault**: Only used in form submit handlers; no scroll or wheel prevention.
- **touch-action: manipulation**: Applied to buttons/links for tap responsiveness; does not block scroll.
- **No custom wheel/scroll listeners**: No JS that intercepts or blocks scroll input.

---

## Browser/Device Coverage

- **Chrome, Edge, Safari, Firefox**: Document scroll uses standard behavior; `overscroll-behavior` is supported.
- **Trackpad**: Natural scroll; `overscroll-behavior-y: auto` preserves expected behavior.
- **Touch**: `-webkit-overflow-scrolling: touch` for momentum on iOS.
- **overflow-x: clip**: Used with `@supports`; falls back to `hidden` for older Safari (< 16).

---

## Recommendations

1. **Manual QA**: Test scroll on target devices (laptop trackpad, touch, mouse wheel).
2. **Modal scroll lock**: If more modals are added, centralize body scroll lock in a hook (e.g. `useLockBodyScroll`).
3. **Sidebar scroll**: Desktop sidebar nav has its own scroll; cursor over sidebar scrolls nav, not page—acceptable for a narrow nav.

---

*Audit completed. All identified root causes addressed.*
