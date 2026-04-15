import json
import os
import base64
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


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def json_response(data, status_code=200):
    return {"statusCode": status_code, "headers": CORS_HEADERS, "body": json.dumps(data, default=str)}


def error_response(message, status_code):
    return json_response({"error": message}, status_code)


def extract_token(headers):
    auth_header = headers.get("X-Authorization") or headers.get("x-authorization") or headers.get("Authorization") or headers.get("authorization") or ""
    if not auth_header.startswith("Bearer "):
        return None
    return auth_header[7:]


def verify_token(token):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def authenticate(headers):
    """Аутентификация — возвращает dict пользователя или error response."""
    token = extract_token(headers)
    if not token:
        return error_response("Authorization required", 401)
    payload = verify_token(token)
    if not payload:
        return error_response("Invalid or expired token", 401)
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(f"SELECT id, email, role FROM {SCHEMA}.users WHERE id = %s", (payload["userId"],))
            user = cur.fetchone()
        if not user:
            return error_response("User not found", 404)
        return dict(user)
    finally:
        conn.close()


def check_project_access(cur, project_id, user):
    cur.execute(f"SELECT id, designer_id FROM {SCHEMA}.projects WHERE id = %s", (project_id,))
    project = cur.fetchone()
    if not project:
        return None
    if str(project["designer_id"]) == str(user["id"]):
        return dict(project)
    cur.execute(
        f"SELECT id FROM {SCHEMA}.project_members WHERE project_id = %s AND user_id = %s AND accepted = true",
        (project_id, str(user["id"])),
    )
    if cur.fetchone():
        return dict(project)
    return None


def parse_body(body):
    if not body:
        return None
    if isinstance(body, str):
        return json.loads(body)
    return body


# ─── ESTIMATE ────────────────────────────────────────────────────────────────

def handle_estimate_get(user, project_id):
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            if not check_project_access(cur, project_id, user):
                return error_response("Access denied", 403)
            cur.execute(
                f"""SELECT id, category, name, quantity, unit, price_per_unit, total
                    FROM {SCHEMA}.estimate_items ei
                    JOIN {SCHEMA}.estimates e ON e.id = ei.estimate_id
                    WHERE e.project_id = %s
                    ORDER BY ei.category, ei.name""",
                (project_id,),
            )
            items = [dict(r) for r in cur.fetchall()]
            cur.execute(f"SELECT id, status FROM {SCHEMA}.estimates WHERE project_id = %s", (project_id,))
            estimate = cur.fetchone()
        return json_response({"items": items, "estimate": dict(estimate) if estimate else None})
    except Exception as e:
        print(f"Estimate get error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_estimate_add(user, project_id, body_str):
    try:
        body = parse_body(body_str)
    except (json.JSONDecodeError, TypeError):
        return error_response("Invalid JSON", 400)
    if not body or not body.get("name"):
        return error_response("name is required", 400)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            project = check_project_access(cur, project_id, user)
            if not project or str(project["designer_id"]) != str(user["id"]):
                return error_response("Access denied", 403)

            cur.execute(f"SELECT id FROM {SCHEMA}.estimates WHERE project_id = %s", (project_id,))
            est = cur.fetchone()
            if not est:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.estimates (project_id, status) VALUES (%s, 'draft') RETURNING id",
                    (project_id,),
                )
                est = cur.fetchone()

            quantity = float(body.get("quantity", 1))
            price = float(body.get("price_per_unit", 0))
            total = quantity * price
            cur.execute(
                f"""INSERT INTO {SCHEMA}.estimate_items (estimate_id, category, name, quantity, unit, price_per_unit, total)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, category, name, quantity, unit, price_per_unit, total""",
                (est["id"], body.get("category", "Общее"), body["name"], quantity, body.get("unit", "шт"), price, total),
            )
            item = dict(cur.fetchone())
            conn.commit()
        return json_response({"item": item}, 201)
    except Exception as e:
        conn.rollback()
        print(f"Estimate add error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_estimate_delete(user, project_id, item_id):
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            project = check_project_access(cur, project_id, user)
            if not project or str(project["designer_id"]) != str(user["id"]):
                return error_response("Access denied", 403)
            cur.execute(
                f"""DELETE FROM {SCHEMA}.estimate_items
                    WHERE id = %s AND estimate_id IN (SELECT id FROM {SCHEMA}.estimates WHERE project_id = %s)""",
                (item_id, project_id),
            )
            conn.commit()
        return json_response({"deleted": True})
    except Exception as e:
        conn.rollback()
        print(f"Estimate delete error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


# ─── PAYMENTS ────────────────────────────────────────────────────────────────

def handle_payments_get(user, project_id):
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            if not check_project_access(cur, project_id, user):
                return error_response("Access denied", 403)
            cur.execute(
                f"""SELECT id, type, description, amount, status, due_date, paid_date, category
                    FROM {SCHEMA}.payments WHERE project_id = %s ORDER BY due_date ASC NULLS LAST""",
                (project_id,),
            )
            payments = [dict(r) for r in cur.fetchall()]
        return json_response({"payments": payments})
    except Exception as e:
        print(f"Payments get error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_payment_add(user, project_id, body_str):
    try:
        body = parse_body(body_str)
    except (json.JSONDecodeError, TypeError):
        return error_response("Invalid JSON", 400)
    if not body or not body.get("description"):
        return error_response("description is required", 400)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            project = check_project_access(cur, project_id, user)
            if not project or str(project["designer_id"]) != str(user["id"]):
                return error_response("Access denied", 403)
            cur.execute(
                f"""INSERT INTO {SCHEMA}.payments (project_id, type, description, amount, status, due_date, category)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, type, description, amount, status, due_date, paid_date, category""",
                (
                    project_id,
                    body.get("type", "income"),
                    body["description"],
                    float(body.get("amount", 0)),
                    body.get("status", "pending"),
                    body.get("due_date"),
                    body.get("category", ""),
                ),
            )
            payment = dict(cur.fetchone())
            conn.commit()
        return json_response({"payment": payment}, 201)
    except Exception as e:
        conn.rollback()
        print(f"Payment add error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_payment_update(user, project_id, payment_id, body_str):
    try:
        body = parse_body(body_str)
    except (json.JSONDecodeError, TypeError):
        return error_response("Invalid JSON", 400)
    if not body:
        return error_response("Invalid JSON", 400)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            project = check_project_access(cur, project_id, user)
            if not project or str(project["designer_id"]) != str(user["id"]):
                return error_response("Access denied", 403)
            updatable = ["description", "amount", "status", "due_date", "paid_date", "type", "category"]
            parts, vals = [], []
            for f in updatable:
                if f in body:
                    parts.append(f"{f} = %s")
                    vals.append(body[f])
            if not parts:
                return error_response("No fields to update", 400)
            vals.extend([payment_id, project_id])
            cur.execute(
                f"UPDATE {SCHEMA}.payments SET {', '.join(parts)} WHERE id = %s AND project_id = %s RETURNING *",
                vals,
            )
            row = cur.fetchone()
            conn.commit()
            if not row:
                return error_response("Not found", 404)
        return json_response({"payment": dict(row)})
    except Exception as e:
        conn.rollback()
        print(f"Payment update error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_payment_delete(user, project_id, payment_id):
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            project = check_project_access(cur, project_id, user)
            if not project or str(project["designer_id"]) != str(user["id"]):
                return error_response("Access denied", 403)
            cur.execute(f"DELETE FROM {SCHEMA}.payments WHERE id = %s AND project_id = %s", (payment_id, project_id))
            conn.commit()
        return json_response({"deleted": True})
    except Exception as e:
        conn.rollback()
        print(f"Payment delete error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


# ─── DOCUMENTS ───────────────────────────────────────────────────────────────

def handle_documents_get(user, project_id):
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            if not check_project_access(cur, project_id, user):
                return error_response("Access denied", 403)
            cur.execute(
                f"""SELECT d.id, d.type, d.title, d.generated_url, d.signed_url, d.status, d.created_at
                    FROM {SCHEMA}.documents d
                    WHERE d.project_id = %s ORDER BY d.created_at DESC""",
                (project_id,),
            )
            docs = [dict(r) for r in cur.fetchall()]
        return json_response({"documents": docs})
    except Exception as e:
        print(f"Docs get error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_document_upload(user, project_id, body_str):
    try:
        body = parse_body(body_str)
    except (json.JSONDecodeError, TypeError):
        return error_response("Invalid JSON", 400)
    if not body or not body.get("title") or not body.get("file"):
        return error_response("title and file (base64) are required", 400)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            project = check_project_access(cur, project_id, user)
            if not project:
                return error_response("Access denied", 403)

            file_data = base64.b64decode(body["file"])
            content_type = body.get("content_type", "application/pdf")
            ext = body.get("ext", "pdf")
            import uuid
            file_key = f"documents/{project_id}/{uuid.uuid4().hex[:8]}.{ext}"

            s3 = boto3.client(
                "s3",
                endpoint_url="https://bucket.poehali.dev",
                aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
                aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
            )
            s3.put_object(Bucket="files", Key=file_key, Body=file_data, ContentType=content_type)

            aws_key_id = os.environ["AWS_ACCESS_KEY_ID"]
            file_url = f"https://cdn.poehali.dev/projects/{aws_key_id}/bucket/{file_key}"

            cur.execute(
                f"""INSERT INTO {SCHEMA}.documents (project_id, type, title, generated_url, status)
                    VALUES (%s, 'uploaded', %s, %s, 'active')
                    RETURNING id, type, title, generated_url, signed_url, status, created_at""",
                (project_id, body["title"], file_url),
            )
            doc = dict(cur.fetchone())
            conn.commit()
        return json_response({"document": doc}, 201)
    except Exception as e:
        conn.rollback()
        print(f"Doc upload error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_document_delete(user, project_id, doc_id):
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            project = check_project_access(cur, project_id, user)
            if not project or str(project["designer_id"]) != str(user["id"]):
                return error_response("Access denied", 403)
            cur.execute(f"DELETE FROM {SCHEMA}.documents WHERE id = %s AND project_id = %s", (doc_id, project_id))
            conn.commit()
        return json_response({"deleted": True})
    except Exception as e:
        conn.rollback()
        print(f"Doc delete error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


# ─── HANDLER ─────────────────────────────────────────────────────────────────

def handler(event, context=None):
    """Данные проекта — смета, финансы, документы."""
    method = event.get("httpMethod", "GET").upper()
    headers = event.get("headers") or {}
    qsp = event.get("queryStringParameters") or {}
    body = event.get("body")

    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    auth_result = authenticate(headers)
    if "statusCode" in auth_result:
        return auth_result
    user = auth_result

    project_id = qsp.get("project_id")
    section = qsp.get("section", "")
    item_id = qsp.get("id")

    if not project_id:
        return error_response("project_id is required", 400)

    if section == "estimate":
        if method == "GET":
            return handle_estimate_get(user, project_id)
        if method == "POST":
            return handle_estimate_add(user, project_id, body)
        if method == "DELETE" and item_id:
            return handle_estimate_delete(user, project_id, item_id)

    elif section == "payments":
        if method == "GET":
            return handle_payments_get(user, project_id)
        if method == "POST":
            return handle_payment_add(user, project_id, body)
        if method == "PUT" and item_id:
            return handle_payment_update(user, project_id, item_id, body)
        if method == "DELETE" and item_id:
            return handle_payment_delete(user, project_id, item_id)

    elif section == "documents":
        if method == "GET":
            return handle_documents_get(user, project_id)
        if method == "POST":
            return handle_document_upload(user, project_id, body)
        if method == "DELETE" and item_id:
            return handle_document_delete(user, project_id, item_id)

    return error_response("Unknown section. Use: estimate, payments, documents", 400)
