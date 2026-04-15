import json
import os
import psycopg2
import psycopg2.extras
import jwt

DATABASE_URL = os.environ.get("DATABASE_URL", "")
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
JWT_SECRET = os.environ.get("JWT_SECRET", "fallback-secret")

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Authorization",
    "Content-Type": "application/json",
}

ALL_CLIENT_FIELDS = [
    "name", "phone", "email", "address", "note", "source", "is_archived",
    "contact_person", "status", "entity_type", "org_name", "inn", "ogrn",
    "kpp", "legal_address", "bank_name", "bik", "account_number", "corr_account",
]


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
        return error_response("Authorization required", 401)
    payload = verify_token(token)
    if not payload:
        return error_response("Invalid or expired token", 401)
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT id, email, role, first_name, last_name FROM {SCHEMA}.users WHERE id = %s",
                (payload["userId"],),
            )
            user = cur.fetchone()
        if not user:
            return error_response("User not found", 404)
        return dict(user)
    finally:
        conn.close()


def handle_list(qsp, user):
    """Список клиентов с поиском по имени и контактному лицу."""
    search = qsp.get("search", "").strip()
    show_archived = qsp.get("archived") == "true"
    status_filter = qsp.get("status", "").strip()

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            conditions = ["c.owner_id = %s"]
            params = [str(user["id"])]

            if not show_archived:
                conditions.append("c.is_archived = false")

            if status_filter:
                conditions.append("c.status = %s")
                params.append(status_filter)

            if search:
                conditions.append(
                    "(c.name ILIKE %s OR c.contact_person ILIKE %s OR c.phone ILIKE %s OR c.email ILIKE %s)"
                )
                like = f"%{search}%"
                params.extend([like, like, like, like])

            where = " AND ".join(conditions)

            cur.execute(
                f"""SELECT c.*,
                           (SELECT COUNT(*) FROM {SCHEMA}.projects p WHERE p.designer_id = c.owner_id) AS project_count
                    FROM {SCHEMA}.clients c
                    WHERE {where}
                    ORDER BY c.created_at DESC""",
                params,
            )
            rows = cur.fetchall()

        return json_response({"clients": [dict(r) for r in rows]})
    finally:
        conn.close()


def handle_get(client_id, user):
    """Получение одного клиента со всеми полями."""
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT * FROM {SCHEMA}.clients WHERE id = %s AND owner_id = %s",
                (client_id, str(user["id"])),
            )
            row = cur.fetchone()
        if not row:
            return error_response("Client not found", 404)
        return json_response({"client": dict(row)})
    finally:
        conn.close()


def handle_create(body_str, user):
    """Быстрое создание клиента — достаточно только имени."""
    body = parse_body(body_str)
    if not body:
        return error_response("Invalid JSON body", 400)

    name = (body.get("name") or "").strip()
    if not name or len(name) < 2:
        return error_response("Name is required (min 2 chars)", 400)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"""INSERT INTO {SCHEMA}.clients
                    (owner_id, name, phone, email, contact_person, status, source)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING *""",
                (
                    str(user["id"]),
                    name,
                    body.get("phone") or "",
                    body.get("email") or None,
                    body.get("contact_person") or None,
                    body.get("status") or "new",
                    body.get("source") or None,
                ),
            )
            client = dict(cur.fetchone())
            conn.commit()
        return json_response({"client": client}, 201)
    except Exception as e:
        conn.rollback()
        print(f"Create client error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_update(client_id, body_str, user):
    """Обновление любых полей клиента."""
    if not client_id:
        return error_response("Client id required", 400)
    body = parse_body(body_str)
    if not body:
        return error_response("Invalid JSON body", 400)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT id FROM {SCHEMA}.clients WHERE id = %s AND owner_id = %s",
                (client_id, str(user["id"])),
            )
            if not cur.fetchone():
                return error_response("Client not found", 404)

            set_clauses = []
            values = []
            for field in ALL_CLIENT_FIELDS:
                if field in body:
                    val = body[field]
                    if field == "name":
                        v = (val or "").strip()
                        if len(v) < 2:
                            return error_response("Name min 2 chars", 400)
                    set_clauses.append(f"{field} = %s")
                    values.append(val if val != "" else None)

            if not set_clauses:
                return error_response("No fields to update", 400)

            set_clauses.append("updated_at = NOW()")
            values.append(client_id)

            cur.execute(
                f"UPDATE {SCHEMA}.clients SET {', '.join(set_clauses)} WHERE id = %s RETURNING *",
                values,
            )
            updated = dict(cur.fetchone())
            conn.commit()
        return json_response({"client": updated})
    except Exception as e:
        conn.rollback()
        print(f"Update client error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_archive(client_id, user):
    """Архивация / восстановление клиента."""
    if not client_id:
        return error_response("Client id required", 400)
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT id, is_archived FROM {SCHEMA}.clients WHERE id = %s AND owner_id = %s",
                (client_id, str(user["id"])),
            )
            row = cur.fetchone()
            if not row:
                return error_response("Client not found", 404)
            new_val = not row["is_archived"]
            cur.execute(
                f"UPDATE {SCHEMA}.clients SET is_archived = %s, updated_at = NOW() WHERE id = %s RETURNING *",
                (new_val, client_id),
            )
            updated = dict(cur.fetchone())
            conn.commit()
        return json_response({"client": updated})
    except Exception as e:
        conn.rollback()
        print(f"Archive client error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


# --- Notes ---

def handle_list_notes(client_id, user):
    """Список заметок клиента."""
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT id FROM {SCHEMA}.clients WHERE id = %s AND owner_id = %s",
                (client_id, str(user["id"])),
            )
            if not cur.fetchone():
                return error_response("Client not found", 404)

            cur.execute(
                f"""SELECT n.*, u.first_name, u.last_name
                    FROM {SCHEMA}.client_notes n
                    LEFT JOIN {SCHEMA}.users u ON u.id = n.author_id
                    WHERE n.client_id = %s
                    ORDER BY n.created_at DESC""",
                (client_id,),
            )
            rows = cur.fetchall()
        return json_response({"notes": [dict(r) for r in rows]})
    finally:
        conn.close()


def handle_create_note(client_id, body_str, user):
    """Добавление заметки к клиенту."""
    body = parse_body(body_str)
    if not body:
        return error_response("Invalid JSON body", 400)

    content = (body.get("content") or "").strip()
    if not content:
        return error_response("Content is required", 400)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT id FROM {SCHEMA}.clients WHERE id = %s AND owner_id = %s",
                (client_id, str(user["id"])),
            )
            if not cur.fetchone():
                return error_response("Client not found", 404)

            cur.execute(
                f"""INSERT INTO {SCHEMA}.client_notes (client_id, author_id, content)
                    VALUES (%s, %s, %s)
                    RETURNING *""",
                (client_id, str(user["id"]), content),
            )
            note = dict(cur.fetchone())
            note["first_name"] = user.get("first_name")
            note["last_name"] = user.get("last_name")
            conn.commit()
        return json_response({"note": note}, 201)
    except Exception as e:
        conn.rollback()
        print(f"Create note error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handler(event, context):
    """CRUD для клиентов (контрагенты) + заметки."""
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

    client_id = qsp.get("id")
    action = qsp.get("action")

    if action == "notes":
        if method == "GET":
            return handle_list_notes(client_id, user)
        elif method == "POST":
            return handle_create_note(client_id, body, user)
        return error_response("Method not allowed", 405)

    if method == "GET":
        if client_id:
            return handle_get(client_id, user)
        return handle_list(qsp, user)
    elif method == "POST":
        return handle_create(body, user)
    elif method == "PUT":
        if action == "archive":
            return handle_archive(client_id, user)
        return handle_update(client_id, body, user)
    elif method == "DELETE":
        return handle_archive(client_id, user)
    else:
        return error_response("Method not allowed", 405)
