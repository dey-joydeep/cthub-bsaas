# Partner Email Change — HLD
    **Surface:** Settings/Security

OTP-based email change flow.

    ## Endpoints & Contracts
    **POST /auth/email/change/request** → 202/401/429/500
Request:
```json
{ "newEmail":"new@example.com" }
```
Response:
```json
{ "success":true, "data":{ "sent":true } }
```

**POST /auth/email/change/confirm** → 200/400/410/422/401/429/500
Request:
```json
{ "otp":"654321" }
```
Response:
```json
{ "success":true, "data":{ "changed":true } }
```

## Cookies/Headers Effects
- On success: update email; sessions may be rotated per policy.
