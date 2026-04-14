import json
import os
import re
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

DEFAULT_STAGES = [
    {"title": "Обмеры и техзадание", "order_number": 1},
    {"title": "Концепция", "order_number": 2},
    {"title": "Планировочное решение", "order_number": 3},
    {"title": "Визуализация", "order_number": 4},
    {"title": "Рабочая документация", "order_number": 5},
    {"title": "Авторский надзор", "order_number": 6},
]

UUID_REGEX = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.IGNORECASE
)


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


def parse_route(event):
    """Parse route from query params or path. Returns (route_type, project_id)."""
    qsp = event.get("queryStringParameters") or {}
    pid = qsp.get("id")
    if pid:
        return "byId", pid

    path = event.get("path", "/")
    clean = path.rstrip("/")
    segments = [s for s in clean.split("/") if s]
    last = segments[-1] if segments else ""

    if last and UUID_REGEX.match(last):
        return "byId", last

    return "root", None


def handle_list_projects(user):
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            if user["role"] == "designer":
                cur.execute(
                    f"""SELECT p.*, u.first_name AS designer_first_name,
                               u.last_name AS designer_last_name
                        FROM {SCHEMA}.projects p
                        JOIN {SCHEMA}.users u ON u.id = p.designer_id
                        WHERE p.designer_id = %s
                        ORDER BY p.created_at DESC""",
                    (str(user["id"]),),
                )
            else:
                cur.execute(
                    f"""SELECT p.*, u.first_name AS designer_first_name,
                               u.last_name AS designer_last_name
                        FROM {SCHEMA}.projects p
                        JOIN {SCHEMA}.users u ON u.id = p.designer_id
                        JOIN {SCHEMA}.project_members pm ON pm.project_id = p.id
                        WHERE pm.user_id = %s AND pm.accepted = true
                        ORDER BY p.created_at DESC""",
                    (str(user["id"]),),
                )
            rows = cur.fetchall()

        return json_response({"projects": [dict(r) for r in rows]})
    except Exception as e:
        print(f"List projects error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_create_project(body_str, user):
    if user["role"] != "designer":
        return error_response("Only designers can create projects", 403)

    try:
        body = parse_body(body_str)
    except (json.JSONDecodeError, TypeError):
        return error_response("Invalid JSON body", 400)

    if not body:
        return error_response("Invalid JSON body", 400)

    title = body.get("title")
    if not title:
        return error_response("title is required", 400)

    description = body.get("description") or None
    address = body.get("address") or None
    area = body.get("area") or None
    rooms = body.get("rooms") or None
    style = body.get("style") or None
    budget = body.get("budget") or None
    start_date = body.get("start_date") or None
    deadline = body.get("deadline") or None

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("BEGIN")

            # Insert project
            cur.execute(
                f"""INSERT INTO {SCHEMA}.projects
                    (designer_id, title, description, address, area, rooms, style, budget, start_date, deadline)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING *""",
                (
                    str(user["id"]),
                    title,
                    description,
                    address,
                    area,
                    rooms,
                    style,
                    budget,
                    start_date,
                    deadline,
                ),
            )
            project = dict(cur.fetchone())

            # Insert 6 default stages in a single query
            stage_values = []
            stage_placeholders = []
            for i, stage in enumerate(DEFAULT_STAGES):
                offset = i * 3
                stage_placeholders.append(
                    f"(%s, %s, %s)"
                )
                stage_values.extend(
                    [str(project["id"]), stage["title"], stage["order_number"]]
                )

            cur.execute(
                f"""INSERT INTO {SCHEMA}.stages (project_id, title, order_number)
                    VALUES {', '.join(stage_placeholders)}
                    RETURNING *""",
                stage_values,
            )
            stages = [dict(r) for r in cur.fetchall()]

            # Increment designer's projects_count
            cur.execute(
                f"UPDATE {SCHEMA}.users SET projects_count = projects_count + 1 WHERE id = %s",
                (str(user["id"]),),
            )

            conn.commit()

        project["stages"] = stages
        return json_response({"project": project}, 201)
    except Exception as e:
        conn.rollback()
        print(f"Create project error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_get_project(project_id, user):
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Fetch the project with designer info
            cur.execute(
                f"""SELECT p.*, u.first_name AS designer_first_name,
                           u.last_name AS designer_last_name,
                           u.email AS designer_email
                    FROM {SCHEMA}.projects p
                    JOIN {SCHEMA}.users u ON u.id = p.designer_id
                    WHERE p.id = %s""",
                (project_id,),
            )
            project_row = cur.fetchone()

            if not project_row:
                return error_response("Project not found", 404)

            project = dict(project_row)

            # Check access: designer-owner OR accepted project member
            is_owner = str(project["designer_id"]) == str(user["id"])

            if not is_owner:
                cur.execute(
                    f"""SELECT id FROM {SCHEMA}.project_members
                        WHERE project_id = %s AND user_id = %s AND accepted = true""",
                    (project_id, str(user["id"])),
                )
                if not cur.fetchone():
                    return error_response("Access denied", 403)

            # Fetch stages
            cur.execute(
                f"""SELECT * FROM {SCHEMA}.stages
                    WHERE project_id = %s
                    ORDER BY order_number ASC""",
                (project_id,),
            )
            stages = [dict(r) for r in cur.fetchall()]

            # Fetch members with user info
            cur.execute(
                f"""SELECT pm.*, u.first_name, u.last_name, u.email, u.phone, u.avatar_url
                    FROM {SCHEMA}.project_members pm
                    JOIN {SCHEMA}.users u ON u.id = pm.user_id
                    WHERE pm.project_id = %s""",
                (project_id,),
            )
            members = [dict(r) for r in cur.fetchall()]

        project["stages"] = stages
        project["members"] = members
        return json_response({"project": project})
    except Exception as e:
        print(f"Get project error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_update_project(body_str, project_id, user):
    try:
        body = parse_body(body_str)
    except (json.JSONDecodeError, TypeError):
        return error_response("Invalid JSON body", 400)

    if not body:
        return error_response("Invalid JSON body", 400)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Check project exists and user is designer-owner
            cur.execute(
                f"SELECT id, designer_id FROM {SCHEMA}.projects WHERE id = %s",
                (project_id,),
            )
            project_row = cur.fetchone()

            if not project_row:
                return error_response("Project not found", 404)

            if str(project_row["designer_id"]) != str(user["id"]):
                return error_response("Only the project designer can update it", 403)

            # Build dynamic SET clause from allowed fields
            allowed_fields = [
                "title",
                "status",
                "description",
                "address",
                "area",
                "rooms",
                "style",
                "budget",
                "start_date",
                "deadline",
            ]

            set_clauses = []
            values = []
            for field in allowed_fields:
                if field in body:
                    set_clauses.append(f"{field} = %s")
                    val = body[field]
                    values.append(val if val is not None else None)

            if not set_clauses:
                return error_response("No valid fields to update", 400)

            values.append(project_id)

            cur.execute(
                f"""UPDATE {SCHEMA}.projects
                    SET {', '.join(set_clauses)}
                    WHERE id = %s
                    RETURNING *""",
                values,
            )
            updated = dict(cur.fetchone())
            conn.commit()

        return json_response({"project": updated})
    except Exception as e:
        conn.rollback()
        print(f"Update project error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_delete_project(project_id, user):
    if user["role"] != "designer":
        return error_response("Only designers can delete projects", 403)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT id, designer_id FROM {SCHEMA}.projects WHERE id = %s",
                (project_id,),
            )
            project = cur.fetchone()
            if not project:
                return error_response("Project not found", 404)
            if str(project["designer_id"]) != str(user["id"]):
                return error_response("Only the project owner can delete it", 403)

            for table in ["stages", "tasks", "messages", "briefs", "estimates", "payments", "documents", "files", "project_members", "comments"]:
                try:
                    if table == "comments":
                        cur.execute(
                            f"DELETE FROM {SCHEMA}.comments WHERE stage_id IN (SELECT id FROM {SCHEMA}.stages WHERE project_id = %s)",
                            (project_id,),
                        )
                    else:
                        cur.execute(f"DELETE FROM {SCHEMA}.{table} WHERE project_id = %s", (project_id,))
                except Exception:
                    pass

            cur.execute(f"DELETE FROM {SCHEMA}.projects WHERE id = %s", (project_id,))
            cur.execute(
                f"UPDATE {SCHEMA}.users SET projects_count = GREATEST(projects_count - 1, 0) WHERE id = %s",
                (str(user["id"]),),
            )
            conn.commit()

        return json_response({"message": "Project deleted"})
    except Exception as e:
        conn.rollback()
        print(f"Delete project error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handler(event, context=None):
    method = event.get("httpMethod", event.get("method", "GET"))
    path = event.get("path", "/")
    headers = event.get("headers", {})
    body = event.get("body", "")

    # CORS preflight
    if method == "OPTIONS":
        return {"statusCode": 204, "headers": CORS_HEADERS, "body": ""}

    # Authenticate all routes
    auth_result = authenticate(headers)
    if "statusCode" in auth_result:
        return auth_result
    user = auth_result

    route_type, project_id = parse_route(event)

    try:
        if route_type == "root":
            if method == "GET":
                return handle_list_projects(user)
            if method == "POST":
                return handle_create_project(body, user)
            return error_response("Method not allowed", 400)

        if route_type == "byId" and project_id:
            if method == "GET":
                return handle_get_project(project_id, user)
            if method == "PUT":
                return handle_update_project(body, project_id, user)
            if method == "DELETE":
                return handle_delete_project(project_id, user)
            return error_response("Method not allowed", 400)

        return error_response("Not found", 404)

    except Exception as e:
        print(f"Unhandled error: {e}")
        return error_response("Internal server error", 500)