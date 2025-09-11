# Admin Sessions & Devices — HLD
    **Surface:** Settings/Security

List active devices/sessions; allow revoke and logout-others.

    ## Endpoints & Contracts
    **GET /auth/devices** → 200/401/500
Response:
```json
{ "success":true, "data":{ "devices":[{ "id":"dev_1","ua":"Chrome 126 / macOS","ip":"203.0.113.5","lastSeen":"2025-09-10T02:22:00Z","current":true }] } }
```

**POST /auth/devices/revoke** → 200/401/404/500
Request:
```json
{ "deviceId":"dev_1" }
```
Response:
```json
{ "success":true, "data":{ "revoked":true } }
```

**POST /auth/logout-others** → 200/401/500
Response:
```json
{ "success":true, "data":{ "loggedOutOthers":true } }
```

(Token maintenance) **POST /auth/refresh** → 200/401/403/429/500

## Cookies/Headers Effects
- Revoke clears session server-side; FE refreshes list; logout-others invalidates RTs.
