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
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
    """Authenticate request and return user dict or error response dict."""
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
                f"SELECT id, email, role FROM {SCHEMA}.users WHERE id = %s",
                (payload["userId"],),
            )
            user = cur.fetchone()

        if not user:
            return error_response("User not found", 404)

        return dict(user)
    finally:
        conn.close()


def check_project_access(user, project_id):
    """Check if user has access to a project.
    Returns (project_row, None) on success or (None, error_response) on failure.
    """
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT * FROM {SCHEMA}.projects WHERE id = %s",
                (project_id,),
            )
            project = cur.fetchone()

            if not project:
                return None, error_response("Project not found", 404)

            project = dict(project)

            # Designer-owner has access
            if str(project["designer_id"]) == str(user["id"]):
                return project, None

            # Project member with accepted invite has access
            cur.execute(
                f"""SELECT id FROM {SCHEMA}.project_members
                    WHERE project_id = %s AND user_id = %s AND accepted = true""",
                (project_id, str(user["id"])),
            )
            member = cur.fetchone()

            if member:
                return project, None

            return None, error_response("Access denied to this project", 403)
    finally:
        conn.close()


def handle_list_messages(qsp, user):
    project_id = qsp.get("project_id")
    if not project_id:
        return error_response("project_id query parameter is required", 400)

    project, err = check_project_access(user, project_id)
    if err:
        return err

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"""SELECT m.*, u.first_name AS sender_first_name,
                           u.last_name AS sender_last_name
                    FROM {SCHEMA}.messages m
                    JOIN {SCHEMA}.users u ON u.id = m.sender_id
                    WHERE m.project_id = %s
                    ORDER BY m.created_at ASC""",
                (project_id,),
            )
            rows = cur.fetchall()

        return json_response({"messages": [dict(r) for r in rows]})
    except Exception as e:
        print(f"List messages error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_send_message(body_str, user):
    try:
        body = parse_body(body_str)
    except (json.JSONDecodeError, TypeError):
        return error_response("Invalid JSON body", 400)

    if not body:
        return error_response("Invalid JSON body", 400)

    project_id = body.get("project_id")
    content = body.get("content")

    if not project_id:
        return error_response("project_id is required", 400)
    if not content or not content.strip():
        return error_response("content is required", 400)

    # Check project access
    project, err = check_project_access(user, project_id)
    if err:
        return err

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"""INSERT INTO {SCHEMA}.messages (project_id, sender_id, content)
                    VALUES (%s, %s, %s)
                    RETURNING *""",
                (project_id, str(user["id"]), content.strip()),
            )
            message = dict(cur.fetchone())
            conn.commit()

            # Fetch sender info to include in response
            cur.execute(
                f"""SELECT first_name, last_name FROM {SCHEMA}.users WHERE id = %s""",
                (str(user["id"]),),
            )
            sender = cur.fetchone()

        message["sender_first_name"] = sender["first_name"] if sender else None
        message["sender_last_name"] = sender["last_name"] if sender else None

        return json_response({"message": message}, 201)
    except Exception as e:
        conn.rollback()
        print(f"Send message error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handler(event, context=None):
    method = event.get("httpMethod", event.get("method", "GET"))
    headers = event.get("headers", {})
    body = event.get("body", "")
    qsp = event.get("queryStringParameters") or {}

    # Handle CORS preflight
    if method == "OPTIONS":
        return {"statusCode": 204, "headers": CORS_HEADERS, "body": ""}

    # Authenticate all requests
    auth_result = authenticate(headers)
    if "statusCode" in auth_result:
        return auth_result
    user = auth_result

    try:
        if method == "GET":
            return handle_list_messages(qsp, user)

        elif method == "POST":
            return handle_send_message(body, user)

        else:
            return error_response("Method not allowed", 405)

    except Exception as e:
        print(f"Unhandled error: {e}")
        return error_response("Internal server error", 500)
