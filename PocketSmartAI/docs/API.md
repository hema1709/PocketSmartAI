# PocketSmart AI API

## Authentication

### Register
`POST /register`

JSON:
```json
{"username":"alice","email":"alice@example.com","password":"StrongPass123!"}
```

### Login
`POST /login`

Form fields: `username`, `password`.

Use the returned `access_token` as:
`Authorization: Bearer <token>`

## Home

`POST /generate-home`

```json
{
  "budget": 100000,
  "room_type": "Living Room",
  "style": "modern",
  "items": [
    {"category":"ceiling fan","quantity":2,"notes":"energy efficient"},
    {"category":"wall art","quantity":3,"notes":"neutral"}
  ]
}
```

## Party

`POST /generate-party`

```json
{
  "budget": 75000,
  "guest_count": 50,
  "event_type": "birthday",
  "venue": "Community hall",
  "city": "Coimbatore",
  "preferences": "vegetarian food"
}
```

## Jewelry

`POST /generate-jewelry`

Multipart form fields:
- budget
- occasion
- style
- outfit_color
- notes
- optional `image`
