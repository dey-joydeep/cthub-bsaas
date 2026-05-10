# Customer Social Accounts — HLD
    **Surface:** Settings/Security

Connect/unlink OAuth providers.

    ## Endpoints & Contracts
    **GET /auth/oauth/:provider/start** → 302

**GET /auth/oauth/:provider/callback** → 302 (success) or 200 (link step)

**POST /auth/social/unlink** → 200/401/409/422/500
Request:
```json
{ "provider":"google" }
```
Response:
```json
{ "success":true, "data":{ "unlinked":true } }
```
