# Auth Performance Playbook
**Updated:** 2025-09-11


- Show lightweight skeletons on critical forms
- Debounce validation and login attempts to avoid thrash
- Backoff on 429 with visible countdown; disable submit during cooldown
- Avoid global store for auth pages; use local signals to keep bundle small

