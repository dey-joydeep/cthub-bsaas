# Customer Social Accounts — LLD

    ## Components & Layout
    - SocialLinkPanel

    ## Fields & Validation
    - provider connect/unlink

    ## i18n keys (en/bn/hi)
    - `settings.customer.social.title`
- `settings.shared.social.unlinked`

    ## Accessibility & Mobile
    - Buttons labeled with provider
- Explain link/unlink impact

## Test Notes
- E2E: link Google; unlink; handle 409 conflict.


    ## Reusable components (Angular placements)

- `SocialLinkPanel` — `libs/web/ui/security/social/social-link-panel.component.ts`
