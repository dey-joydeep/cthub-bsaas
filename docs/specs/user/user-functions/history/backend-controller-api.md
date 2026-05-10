# user - history - Backend API

## Endpoint

/api/v1/user/history

### Request

`http
GET /api/v1/user/history
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
