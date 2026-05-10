# dashboard - overview - Backend API

## Endpoint

/api/v1/dashboard/overview

### Request

`http
GET /api/v1/dashboard/overview
Authorization: Bearer {token}
`

### Response

`json
{
  "data": {},
  "meta": {}
}
`

## Error Responses

| Status Code | Error Code   | Description              |
| ----------- | ------------ | ------------------------ |
| 401         | UNAUTHORIZED | Missing or invalid token |
| 403         | FORBIDDEN    | Insufficient permissions |
