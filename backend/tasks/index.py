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

VALID_STATUSES = ["todo", "in_progress", "review", "done"]


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


def handle_list_tasks(qsp, user):
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
                f"""SELECT t.*, u.first_name AS assigned_first_name,
                           u.last_name AS assigned_last_name
                    FROM {SCHEMA}.tasks t
                    LEFT JOIN {SCHEMA}.users u ON u.id = t.assigned_to
                    WHERE t.project_id = %s
                    ORDER BY t.created_at DESC""",
                (project_id,),
            )
            rows = cur.fetchall()

        return json_response({"tasks": [dict(r) for r in rows]})
    except Exception as e:
        print(f"List tasks error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_create_task(body_str, user):
    if user["role"] != "designer":
        return error_response("Only designers can create tasks", 403)

    try:
        body = parse_body(body_str)
    except (json.JSONDecodeError, TypeError):
        return error_response("Invalid JSON body", 400)

    if not body:
        return error_response("Invalid JSON body", 400)

    project_id = body.get("project_id")
    title = body.get("title")

    if not project_id:
        return error_response("project_id is required", 400)
    if not title:
        return error_response("title is required", 400)

    # Verify user is the project's designer
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT designer_id FROM {SCHEMA}.projects WHERE id = %s",
                (project_id,),
            )
            project = cur.fetchone()

            if not project:
                return error_response("Project not found", 404)

            if str(project["designer_id"]) != str(user["id"]):
                return error_response(
                    "Only the project designer can create tasks", 403
                )

            description = body.get("description") or None
            priority = body.get("priority") or None
            deadline = body.get("deadline") or None
            stage_id = body.get("stage_id") or None
            assigned_to = body.get("assigned_to") or None
            status = "todo"

            cur.execute(
                f"""INSERT INTO {SCHEMA}.tasks
                    (project_id, title, description, priority, status, deadline, stage_id, assigned_to)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING *""",
                (
                    project_id,
                    title,
                    description,
                    priority,
                    status,
                    deadline,
                    stage_id,
                    assigned_to,
                ),
            )
            task = dict(cur.fetchone())
            conn.commit()

        return json_response({"task": task}, 201)
    except Exception as e:
        conn.rollback()
        print(f"Create task error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_update_task(task_id, body_str, user):
    if not task_id:
        return error_response("Task id query parameter is required", 400)

    try:
        body = parse_body(body_str)
    except (json.JSONDecodeError, TypeError):
        return error_response("Invalid JSON body", 400)

    if not body:
        return error_response("Invalid JSON body", 400)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Fetch task to get project_id
            cur.execute(
                f"SELECT * FROM {SCHEMA}.tasks WHERE id = %s",
                (task_id,),
            )
            task = cur.fetchone()

            if not task:
                return error_response("Task not found", 404)

            task = dict(task)

            # Check project access
            project, err = check_project_access(user, str(task["project_id"]))
            if err:
                return err

            # Build dynamic update
            allowed_fields = [
                "title", "description", "priority", "status",
                "deadline", "stage_id", "assigned_to",
            ]
            set_clauses = []
            values = []

            for field in allowed_fields:
                if field in body:
                    value = body[field]

                    # Validate status
                    if field == "status" and value not in VALID_STATUSES:
                        return error_response(
                            f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}",
                            400,
                        )

                    set_clauses.append(f"{field} = %s")
                    values.append(value if value != "" else None)

            if not set_clauses:
                return error_response("No valid fields to update", 400)

            set_clauses.append("updated_at = NOW()")
            values.append(task_id)

            cur.execute(
                f"""UPDATE {SCHEMA}.tasks
                    SET {', '.join(set_clauses)}
                    WHERE id = %s
                    RETURNING *""",
                values,
            )
            updated_task = dict(cur.fetchone())
            conn.commit()

        return json_response({"task": updated_task})
    except Exception as e:
        conn.rollback()
        print(f"Update task error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_delete_task(task_id, user):
    if not task_id:
        return error_response("Task id query parameter is required", 400)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Fetch task to get project_id
            cur.execute(
                f"SELECT * FROM {SCHEMA}.tasks WHERE id = %s",
                (task_id,),
            )
            task = cur.fetchone()

            if not task:
                return error_response("Task not found", 404)

            task = dict(task)

            # Verify user is the project's designer
            cur.execute(
                f"SELECT designer_id FROM {SCHEMA}.projects WHERE id = %s",
                (str(task["project_id"]),),
            )
            project = cur.fetchone()

            if not project:
                return error_response("Project not found", 404)

            if str(project["designer_id"]) != str(user["id"]):
                return error_response(
                    "Only the project designer can delete tasks", 403
                )

            cur.execute(
                f"DELETE FROM {SCHEMA}.tasks WHERE id = %s RETURNING id",
                (task_id,),
            )
            conn.commit()

        return json_response({"deleted": True, "id": task_id})
    except Exception as e:
        conn.rollback()
        print(f"Delete task error: {e}")
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

    action = qsp.get("action", "")

    try:
        if method == "GET":
            return handle_list_tasks(qsp, user)

        elif method == "POST":
            return handle_create_task(body, user)

        elif method == "PUT":
            task_id = qsp.get("id")
            return handle_update_task(task_id, body, user)

        elif method == "DELETE":
            task_id = qsp.get("id")
            return handle_delete_task(task_id, user)

        else:
            return error_response("Method not allowed", 405)

    except Exception as e:
        print(f"Unhandled error: {e}")
        return error_response("Internal server error", 500)
