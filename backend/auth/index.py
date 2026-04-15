import json
import os
import re
import datetime
import hashlib
import uuid
import psycopg2
import psycopg2.extras
import bcrypt
import jwt

DATABASE_URL = os.environ.get("DATABASE_URL", "")
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
JWT_SECRET = os.environ.get("JWT_SECRET", "fallback-secret")
JWT_EXPIRES_HOURS = 7 * 24  # 7 days

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Authorization",
    "Content-Type": "application/json",
}


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


def generate_token(user_id, email, role):
    payload = {
        "userId": str(user_id),
        "email": email,
        "role": role,
        "exp": datetime.datetime.utcnow()
        + datetime.timedelta(hours=JWT_EXPIRES_HOURS),
        "iat": datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


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
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def strip_password(user_dict):
    result = dict(user_dict)
    result.pop("password_hash", None)
    return result


def parse_body(body):
    if not body:
        return None
    if isinstance(body, str):
        return json.loads(body)
    return body


def get_route(event):
    qsp = event.get("queryStringParameters") or {}
    action = qsp.get("action", "")
    if action:
        return action
    path = event.get("path", "/")
    clean = path.rstrip("/")
    segments = clean.split("/")
    last = segments[-1] if segments else ""
    return last


def handle_register(body_str):
    try:
        body = parse_body(body_str)
    except (json.JSONDecodeError, TypeError):
        return error_response("Invalid JSON body", 400)

    if not body:
        return error_response("Invalid JSON body", 400)

    email = body.get("email")
    password = body.get("password")
    role = body.get("role")
    first_name = body.get("first_name")
    last_name = body.get("last_name")
    city = body.get("city")
    specialization = body.get("specialization")
    phone = body.get("phone")

    if not email or not password or not role:
        return error_response("email, password, and role are required", 400)

    email_regex = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
    if not re.match(email_regex, email):
        return error_response("Invalid email format", 400)

    if len(password) < 8:
        return error_response("Password must be at least 8 characters", 400)

    valid_roles = ["designer", "client", "worker"]
    if role not in valid_roles:
        return error_response("Role must be one of: designer, client, worker", 400)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT id FROM {SCHEMA}.users WHERE email = %s",
                (email.lower(),),
            )
            if cur.fetchone():
                return error_response("User with this email already exists", 400)

            password_hash = bcrypt.hashpw(
                password.encode("utf-8"), bcrypt.gensalt(10)
            ).decode("utf-8")

            personal_id = hashlib.md5(uuid.uuid4().hex.encode()).hexdigest()[:8].upper()

            cur.execute(
                f"""INSERT INTO {SCHEMA}.users
                    (email, password_hash, role, first_name, last_name, city, specialization, phone, personal_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING *""",
                (
                    email.lower(),
                    password_hash,
                    role,
                    first_name or None,
                    last_name or None,
                    city or None,
                    specialization or None,
                    phone or None,
                    personal_id,
                ),
            )
            user = dict(cur.fetchone())
            conn.commit()

        safe_user = strip_password(user)
        token = generate_token(safe_user["id"], safe_user["email"], safe_user["role"])
        return json_response({"token": token, "user": safe_user}, 201)
    except Exception as e:
        conn.rollback()
        print(f"Register error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_login(body_str):
    try:
        body = parse_body(body_str)
    except (json.JSONDecodeError, TypeError):
        return error_response("Invalid JSON body", 400)

    if not body:
        return error_response("Invalid JSON body", 400)

    email = body.get("email")
    password = body.get("password")

    if not email or not password:
        return error_response("email and password are required", 400)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT * FROM {SCHEMA}.users WHERE email = %s",
                (email.lower(),),
            )
            user = cur.fetchone()

        if not user:
            return error_response("Invalid email or password", 401)

        user = dict(user)
        is_valid = bcrypt.checkpw(
            password.encode("utf-8"), user["password_hash"].encode("utf-8")
        )

        if not is_valid:
            return error_response("Invalid email or password", 401)

        safe_user = strip_password(user)
        token = generate_token(safe_user["id"], safe_user["email"], safe_user["role"])
        return json_response({"token": token, "user": safe_user})
    except Exception as e:
        print(f"Login error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_me(headers):
    token = extract_token(headers)
    if not token:
        return error_response(
            "Authorization header with Bearer token is required", 401
        )

    payload = verify_token(token)
    if not payload:
        return error_response("Invalid or expired token", 401)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT * FROM {SCHEMA}.users WHERE id = %s",
                (payload["userId"],),
            )
            user = cur.fetchone()

        if not user:
            return error_response("User not found", 404)

        safe_user = strip_password(dict(user))
        return json_response({"user": safe_user})
    except Exception as e:
        print(f"Me error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_invite(headers, body_str):
    token = extract_token(headers)
    if not token:
        return error_response(
            "Authorization header with Bearer token is required", 401
        )

    payload = verify_token(token)
    if not payload:
        return error_response("Invalid or expired token", 401)

    if payload.get("role") != "designer":
        return error_response("Only designers can invite members to projects", 403)

    try:
        body = parse_body(body_str)
    except (json.JSONDecodeError, TypeError):
        return error_response("Invalid JSON body", 400)

    if not body:
        return error_response("Invalid JSON body", 400)

    email_or_id = body.get("email", "").strip()
    project_id = body.get("project_id")
    role = body.get("role")

    if not email_or_id or not project_id or not role:
        return error_response("email (or personal ID), project_id, and role are required", 400)

    valid_roles = ["client", "worker"]
    if role not in valid_roles:
        return error_response("Invite role must be one of: client, worker", 400)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT id FROM {SCHEMA}.projects WHERE id = %s AND designer_id = %s",
                (project_id, payload["userId"]),
            )
            if not cur.fetchone():
                return error_response(
                    "Project not found or you are not the designer", 404
                )

            if "@" in email_or_id:
                cur.execute(
                    f"SELECT id FROM {SCHEMA}.users WHERE LOWER(email) = %s",
                    (email_or_id.lower(),),
                )
            else:
                cur.execute(
                    f"SELECT id FROM {SCHEMA}.users WHERE UPPER(personal_id) = %s",
                    (email_or_id.upper(),),
                )
            invited_user = cur.fetchone()
            if not invited_user:
                return error_response(
                    "Пользователь не найден. Проверьте email или ID.", 404
                )

            invited_user_id = invited_user["id"]

            # Check if already a member
            cur.execute(
                f"SELECT id FROM {SCHEMA}.project_members WHERE project_id = %s AND user_id = %s",
                (project_id, invited_user_id),
            )
            if cur.fetchone():
                return error_response(
                    "User is already a member of this project", 400
                )

            # Create project_members record
            cur.execute(
                f"""INSERT INTO {SCHEMA}.project_members (project_id, user_id, role, accepted)
                    VALUES (%s, %s, %s, false)
                    RETURNING *""",
                (project_id, invited_user_id, role),
            )
            member = dict(cur.fetchone())
            conn.commit()

        invite_link = f"/invite/{member['id']}"
        return json_response({"member": member, "invite_link": invite_link}, 201)
    except Exception as e:
        conn.rollback()
        print(f"Invite error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_update_profile(headers, body_str):
    """PUT /update_profile — обновление профиля пользователя."""
    token = extract_token(headers)
    if not token:
        return error_response("Authorization required", 401)
    payload = verify_token(token)
    if not payload:
        return error_response("Invalid or expired token", 401)

    try:
        body = parse_body(body_str)
    except (json.JSONDecodeError, TypeError):
        return error_response("Invalid JSON body", 400)
    if not body:
        return error_response("Invalid JSON body", 400)

    allowed = [
        "first_name", "last_name", "phone", "city", "bio",
        "specialization", "experience_years", "telegram", "website",
        "work_styles", "work_objects", "accepting_orders", "contacts_public",
    ]

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            parts, vals = [], []
            for f in allowed:
                if f in body:
                    parts.append(f"{f} = %s")
                    vals.append(body[f])
            if not parts:
                return error_response("No fields to update", 400)
            vals.append(payload["userId"])
            cur.execute(
                f"UPDATE {SCHEMA}.users SET {', '.join(parts)} WHERE id = %s RETURNING *",
                vals,
            )
            user = cur.fetchone()
            conn.commit()
        if not user:
            return error_response("User not found", 404)
        safe_user = strip_password(dict(user))
        return json_response({"user": safe_user})
    except Exception as e:
        conn.rollback()
        print(f"Update profile error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_get_company(headers):
    """GET /company — получить данные компании."""
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
                f"SELECT entity_type, data FROM {SCHEMA}.company_data WHERE user_id = %s",
                (payload["userId"],),
            )
            row = cur.fetchone()
        if not row:
            return json_response({"entity_type": "individual", "data": {}})
        return json_response({"entity_type": row["entity_type"], "data": row["data"]})
    except Exception as e:
        print(f"Get company error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_save_company(headers, body_str):
    """PUT /company — сохранить данные компании."""
    token = extract_token(headers)
    if not token:
        return error_response("Authorization required", 401)
    payload = verify_token(token)
    if not payload:
        return error_response("Invalid or expired token", 401)
    try:
        body = parse_body(body_str)
    except (json.JSONDecodeError, TypeError):
        return error_response("Invalid JSON body", 400)
    if not body:
        return error_response("Invalid JSON body", 400)

    entity_type = body.get("entity_type", "individual")
    data = body.get("data", {})
    uid = payload["userId"]

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(f"SELECT id FROM {SCHEMA}.company_data WHERE user_id = %s", (uid,))
            if cur.fetchone():
                cur.execute(
                    f"UPDATE {SCHEMA}.company_data SET entity_type = %s, data = %s, updated_at = NOW() WHERE user_id = %s",
                    (entity_type, json.dumps(data, default=str), uid),
                )
            else:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.company_data (user_id, entity_type, data) VALUES (%s, %s, %s)",
                    (uid, entity_type, json.dumps(data, default=str)),
                )
            conn.commit()
        return json_response({"ok": True})
    except Exception as e:
        conn.rollback()
        print(f"Save company error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handler(event, context=None):
    method = event.get("httpMethod", event.get("method", "GET"))
    path = event.get("path", "/")
    headers = event.get("headers", {})
    body = event.get("body", "")

    if method == "OPTIONS":
        return {"statusCode": 204, "headers": CORS_HEADERS, "body": ""}

    route = get_route(event)

    try:
        if route == "register":
            if method != "POST":
                return error_response("Method not allowed", 400)
            return handle_register(body)

        elif route == "login":
            if method != "POST":
                return error_response("Method not allowed", 400)
            return handle_login(body)

        elif route == "me":
            if method != "GET":
                return error_response("Method not allowed", 400)
            return handle_me(headers)

        elif route == "invite":
            if method != "POST":
                return error_response("Method not allowed", 400)
            return handle_invite(headers, body)

        elif route == "update_profile":
            if method != "PUT":
                return error_response("Method not allowed", 400)
            return handle_update_profile(headers, body)

        elif route == "company":
            if method == "GET":
                return handle_get_company(headers)
            if method == "PUT":
                return handle_save_company(headers, body)
            return error_response("Method not allowed", 400)

        else:
            return error_response("Not found", 404)

    except Exception as e:
        print(f"Unhandled error: {e}")
        return error_response("Internal server error", 500)