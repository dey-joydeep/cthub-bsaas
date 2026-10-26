# Auth Accessibility Reference

**Updated:** 2025-09-11

## Patterns

- Inputs use `<label>` and `aria-describedby` for errors; live region `aria-live="polite"`
- Keyboard: tab order matches reading order; submit on Enter; Escape closes dialog
- Focus: first invalid control gets focus; focus trap in dialogs; visible focus rings
- Contrast AA; states not conveyed by color alone

## Forms

- `<label for>` + `aria-describedby` for helper/error
- Error announcements via live region; throttle announcements
- Keep tab order logical and visible focus
