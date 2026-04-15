import json
import os
import base64
import uuid
import psycopg2
import psycopg2.extras
import jwt
import boto3

DATABASE_URL = os.environ.get("DATABASE_URL", "")
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
JWT_SECRET = os.environ.get("JWT_SECRET", "fallback-secret")

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Authorization",
    "Content-Type": "application/json",
}

VALID_TYPES = ["shop", "supplier", "finisher", "other"]
ALLOWED_IMAGE_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def json_response(data, status_code=200):
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(data, default=str),
    }


def error_response(message, status_code):
    return json_response({"error": message}, status_code)


def extract_token(headers):
    auth_header = (
        headers.get("X-Authorization")
        or headers.get("x-authorization")
        or headers.get("Authorization")
        or headers.get("authorization")
        or ""
    )
    if not auth_header.startswith("Bearer "):
        return None
    return auth_header[7:]


def verify_token(token):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def parse_body(body):
    if not body:
        return None
    if isinstance(body, str):
        return json.loads(body)
    return body


def authenticate(headers):
    """Аутентификация запроса."""
    token = extract_token(headers)
    if not token:
        return error_response("Authorization header with Bearer token is required", 401)

    payload = verify_token(token)
    if not payload:
        return error_response("Invalid or expired token", 401)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT id, email, role FROM {SCHEMA}.users WHERE id = %s",
                (payload["userId"],),
            )
            user = cur.fetchone()

        if not user:
            return error_response("User not found", 404)

        return dict(user)
    finally:
        conn.close()


def upload_logo(image_base64, content_type):
    """Загрузка логотипа в S3, возвращает CDN URL."""
    if content_type not in ALLOWED_IMAGE_TYPES:
        return None, "Unsupported image format. Use JPG, PNG or WebP"

    image_data = base64.b64decode(image_base64)
    if len(image_data) > MAX_IMAGE_SIZE:
        return None, "Image size exceeds 5 MB"

    ext = ALLOWED_IMAGE_TYPES[content_type]
    file_key = f"partners/{uuid.uuid4().hex}.{ext}"

    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    s3.put_object(
        Bucket="files",
        Key=file_key,
        Body=image_data,
        ContentType=content_type,
    )

    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{file_key}"
    return cdn_url, None


def handle_list(qsp, user):
    """Список партнёров с фильтрацией и поиском."""
    partner_type = qsp.get("type")
    search = qsp.get("search", "").strip()
    show_archived = qsp.get("archived") == "true"
    sort_by = qsp.get("sort", "name")
    sort_dir = "DESC" if qsp.get("dir") == "desc" else "ASC"

    allowed_sorts = {"name": "p.name", "discount": "p.discount", "partner_type": "p.partner_type", "created_at": "p.created_at"}
    order_col = allowed_sorts.get(sort_by, "p.name")

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            conditions = ["p.owner_id = %s"]
            params = [str(user["id"])]

            if not show_archived:
                conditions.append("p.is_archived = false")

            if partner_type and partner_type in VALID_TYPES:
                conditions.append("p.partner_type = %s")
                params.append(partner_type)

            if search:
                conditions.append("(p.name ILIKE %s OR p.services ILIKE %s)")
                like = f"%{search}%"
                params.extend([like, like])

            where = " AND ".join(conditions)

            cur.execute(
                f"""SELECT p.id, p.name, p.partner_type, p.discount, p.services,
                           p.phone, p.email, p.website, p.address, p.contact_person,
                           p.note, p.logo_url, p.is_archived, p.created_at, p.updated_at
                    FROM {SCHEMA}.partners p
                    WHERE {where}
                    ORDER BY {order_col} {sort_dir}""",
                params,
            )
            rows = cur.fetchall()

        return json_response({"partners": [dict(r) for r in rows]})
    finally:
        conn.close()


def handle_get(partner_id, user):
    """Получение одного партнёра."""
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"""SELECT * FROM {SCHEMA}.partners WHERE id = %s AND owner_id = %s""",
                (partner_id, str(user["id"])),
            )
            row = cur.fetchone()

        if not row:
            return error_response("Partner not found", 404)

        return json_response({"partner": dict(row)})
    finally:
        conn.close()


def handle_create(body_str, user):
    """Создание партнёра."""
    body = parse_body(body_str)
    if not body:
        return error_response("Invalid JSON body", 400)

    name = (body.get("name") or "").strip()
    if not name or len(name) < 2 or len(name) > 255:
        return error_response("Name is required (2-255 chars)", 400)

    partner_type = body.get("partner_type")
    if partner_type not in VALID_TYPES:
        return error_response(f"partner_type must be one of: {', '.join(VALID_TYPES)}", 400)

    discount = body.get("discount", 0)
    try:
        discount = float(discount)
        if discount < 0 or discount > 100:
            raise ValueError
    except (ValueError, TypeError):
        return error_response("discount must be a number 0-100", 400)

    phone = (body.get("phone") or "").strip()
    if not phone:
        return error_response("Phone is required", 400)

    logo_url = None
    logo_base64 = body.get("logo_base64")
    logo_content_type = body.get("logo_content_type", "image/jpeg")
    if logo_base64:
        logo_url, err = upload_logo(logo_base64, logo_content_type)
        if err:
            return error_response(err, 400)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"""INSERT INTO {SCHEMA}.partners
                    (owner_id, name, partner_type, discount, services, phone, email, website, address, contact_person, note, logo_url)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING *""",
                (
                    str(user["id"]),
                    name,
                    partner_type,
                    discount,
                    body.get("services") or None,
                    phone,
                    body.get("email") or None,
                    body.get("website") or None,
                    body.get("address") or None,
                    body.get("contact_person") or None,
                    body.get("note") or None,
                    logo_url,
                ),
            )
            partner = dict(cur.fetchone())
            conn.commit()

        return json_response({"partner": partner}, 201)
    except Exception as e:
        conn.rollback()
        print(f"Create partner error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_update(partner_id, body_str, user):
    """Обновление партнёра."""
    if not partner_id:
        return error_response("Partner id is required", 400)

    body = parse_body(body_str)
    if not body:
        return error_response("Invalid JSON body", 400)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT id FROM {SCHEMA}.partners WHERE id = %s AND owner_id = %s",
                (partner_id, str(user["id"])),
            )
            if not cur.fetchone():
                return error_response("Partner not found", 404)

            logo_base64 = body.pop("logo_base64", None)
            logo_content_type = body.pop("logo_content_type", "image/jpeg")
            if logo_base64:
                logo_url, err = upload_logo(logo_base64, logo_content_type)
                if err:
                    return error_response(err, 400)
                body["logo_url"] = logo_url

            if body.get("remove_logo"):
                body["logo_url"] = None
                body.pop("remove_logo")

            allowed_fields = [
                "name", "partner_type", "discount", "services",
                "phone", "email", "website", "address",
                "contact_person", "note", "logo_url", "is_archived",
            ]
            set_clauses = []
            values = []

            for field in allowed_fields:
                if field in body:
                    value = body[field]
                    if field == "name":
                        v = (value or "").strip()
                        if len(v) < 2 or len(v) > 255:
                            return error_response("Name must be 2-255 chars", 400)
                    if field == "partner_type" and value not in VALID_TYPES:
                        return error_response(f"partner_type must be one of: {', '.join(VALID_TYPES)}", 400)
                    if field == "discount":
                        try:
                            value = float(value)
                            if value < 0 or value > 100:
                                raise ValueError
                        except (ValueError, TypeError):
                            return error_response("discount must be 0-100", 400)
                    set_clauses.append(f"{field} = %s")
                    values.append(value if value != "" else None)

            if not set_clauses:
                return error_response("No valid fields to update", 400)

            set_clauses.append("updated_at = NOW()")
            values.append(partner_id)

            cur.execute(
                f"""UPDATE {SCHEMA}.partners
                    SET {', '.join(set_clauses)}
                    WHERE id = %s
                    RETURNING *""",
                values,
            )
            updated = dict(cur.fetchone())
            conn.commit()

        return json_response({"partner": updated})
    except Exception as e:
        conn.rollback()
        print(f"Update partner error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_archive(partner_id, user):
    """Мягкое удаление — архивация."""
    if not partner_id:
        return error_response("Partner id is required", 400)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT id, is_archived FROM {SCHEMA}.partners WHERE id = %s AND owner_id = %s",
                (partner_id, str(user["id"])),
            )
            row = cur.fetchone()
            if not row:
                return error_response("Partner not found", 404)

            new_val = not row["is_archived"]
            cur.execute(
                f"UPDATE {SCHEMA}.partners SET is_archived = %s, updated_at = NOW() WHERE id = %s RETURNING *",
                (new_val, partner_id),
            )
            updated = dict(cur.fetchone())
            conn.commit()

        return json_response({"partner": updated})
    except Exception as e:
        conn.rollback()
        print(f"Archive partner error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handler(event, context):
    """Обработчик партнёров: CRUD с загрузкой логотипа и мягким удалением."""
    method = event.get("httpMethod", event.get("method", "GET"))
    headers = event.get("headers", {})
    body = event.get("body", "")
    qsp = event.get("queryStringParameters") or {}

    if method == "OPTIONS":
        return {"statusCode": 204, "headers": CORS_HEADERS, "body": ""}

    auth_result = authenticate(headers)
    if "statusCode" in auth_result:
        return auth_result
    user = auth_result

    partner_id = qsp.get("id")
    action = qsp.get("action")

    if method == "GET":
        if partner_id:
            return handle_get(partner_id, user)
        return handle_list(qsp, user)
    elif method == "POST":
        return handle_create(body, user)
    elif method == "PUT":
        if action == "archive":
            return handle_archive(partner_id, user)
        return handle_update(partner_id, body, user)
    elif method == "DELETE":
        return handle_archive(partner_id, user)
    else:
        return error_response("Method not allowed", 405)
