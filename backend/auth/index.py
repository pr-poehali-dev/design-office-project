import json
import os
import re
import datetime
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

            cur.execute(
                f"""INSERT INTO {SCHEMA}.users
                    (email, password_hash, role, first_name, last_name, city, specialization, phone)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
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

    email = body.get("email")
    project_id = body.get("project_id")
    role = body.get("role")

    if not email or not project_id or not role:
        return error_response("email, project_id, and role are required", 400)

    valid_roles = ["client", "worker"]
    if role not in valid_roles:
        return error_response("Invite role must be one of: client, worker", 400)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Verify project exists and belongs to this designer
            cur.execute(
                f"SELECT id FROM {SCHEMA}.projects WHERE id = %s AND designer_id = %s",
                (project_id, payload["userId"]),
            )
            if not cur.fetchone():
                return error_response(
                    "Project not found or you are not the designer", 404
                )

            # Find the invited user
            cur.execute(
                f"SELECT id FROM {SCHEMA}.users WHERE email = %s",
                (email.lower(),),
            )
            invited_user = cur.fetchone()
            if not invited_user:
                return error_response(
                    "User with this email not found. They must register first.", 404
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


def handler(event, context=None):
    method = event.get("httpMethod", event.get("method", "GET"))
    path = event.get("path", "/")
    headers = event.get("headers", {})
    body = event.get("body", "")

    # Handle CORS preflight
    if method == "OPTIONS":
        return {
            "statusCode": 204,
            "headers": CORS_HEADERS,
            "body": "",
        }

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

        else:
            return error_response(
                "Not found. Available routes: /register, /login, /me, /invite", 404
            )

    except Exception as e:
        print(f"Unhandled error: {e}")
        return error_response("Internal server error", 500)