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

DEFAULT_ITEMS = [
    {
        "order_number": 1,
        "title": "Обмерный план",
        "description": "Точные обмеры — основа всего проекта. Без них невозможно создать корректные чертежи и рассчитать материалы.",
        "price": 25000,
    },
    {
        "order_number": 2,
        "title": "Концепция и мудборд",
        "description": "Визуальная концепция помогает убедиться, что дизайнер и заказчик мыслят в одном направлении до начала работы.",
        "price": 30000,
    },
    {
        "order_number": 3,
        "title": "Планировочное решение",
        "description": "Грамотная планировка — это удобство на годы. Продумываем каждый сантиметр.",
        "price": 35000,
    },
    {
        "order_number": 4,
        "title": "3D-визуализация",
        "description": "Вы увидите свой интерьер до начала ремонта. Никаких сюрпризов.",
        "price": 50000,
    },
    {
        "order_number": 5,
        "title": "Рабочая документация",
        "description": "Полный комплект чертежей для строителей. Без них ремонт превращается в хаос.",
        "price": 45000,
    },
    {
        "order_number": 6,
        "title": "Ведомость материалов",
        "description": "Помогает сориентироваться по финансам. Вы точно знаете где и что покупать — экономия денег и времени.",
        "price": 15000,
    },
    {
        "order_number": 7,
        "title": "Авторский надзор",
        "description": "Контроль качества на объекте. Строители делают как задумано, а не как им удобно.",
        "price": 40000,
    },
]

CONTENT_TYPE_TO_EXT = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
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


def check_project_access(cur, project_id, user):
    """Check if user is designer-owner or accepted project member. Returns project row or None."""
    cur.execute(
        f"SELECT id, designer_id FROM {SCHEMA}.projects WHERE id = %s",
        (project_id,),
    )
    project = cur.fetchone()
    if not project:
        return None

    if str(project["designer_id"]) == str(user["id"]):
        return dict(project)

    cur.execute(
        f"""SELECT id FROM {SCHEMA}.project_members
            WHERE project_id = %s AND user_id = %s AND accepted = true""",
        (project_id, str(user["id"])),
    )
    if cur.fetchone():
        return dict(project)

    return None


def check_designer_owner(cur, project_id, user):
    """Check if user is the designer-owner of the project. Returns project row or None."""
    cur.execute(
        f"SELECT id, designer_id FROM {SCHEMA}.projects WHERE id = %s",
        (project_id,),
    )
    project = cur.fetchone()
    if not project:
        return None

    if str(project["designer_id"]) == str(user["id"]):
        return dict(project)

    return None


def fetch_proposal_with_items(cur, proposal_id):
    """Fetch a proposal and its items."""
    cur.execute(
        f"""SELECT id, project_id, status, background_url, background_preset,
                   template_name, notes, discount, discount_type, created_at, updated_at
            FROM {SCHEMA}.proposals WHERE id = %s""",
        (proposal_id,),
    )
    proposal = cur.fetchone()
    if not proposal:
        return None

    proposal = dict(proposal)

    cur.execute(
        f"""SELECT id, order_number, title, description, price
            FROM {SCHEMA}.proposal_items
            WHERE proposal_id = %s
            ORDER BY order_number""",
        (proposal_id,),
    )
    proposal["items"] = [dict(r) for r in cur.fetchall()]
    return proposal


def insert_items(cur, proposal_id, items):
    """Insert proposal items in a single query."""
    if not items:
        return []

    placeholders = []
    values = []
    for item in items:
        placeholders.append("(%s, %s, %s, %s, %s)")
        values.extend([
            str(proposal_id),
            item["title"],
            item.get("description", ""),
            item.get("price", 0),
            item.get("order_number", 0),
        ])

    cur.execute(
        f"""INSERT INTO {SCHEMA}.proposal_items
            (proposal_id, title, description, price, order_number)
            VALUES {', '.join(placeholders)}
            RETURNING id, order_number, title, description, price""",
        values,
    )
    return [dict(r) for r in cur.fetchall()]


def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


# ─── Handlers ────────────────────────────────────────────────────────────────


def handle_get(user, qsp):
    """GET ?project_id=UUID — get proposal for a project."""
    project_id = qsp.get("project_id")
    if not project_id:
        return error_response("project_id query parameter is required", 400)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            project = check_project_access(cur, project_id, user)
            if not project:
                return error_response("Project not found or access denied", 403)

            cur.execute(
                f"""SELECT id FROM {SCHEMA}.proposals WHERE project_id = %s""",
                (project_id,),
            )
            row = cur.fetchone()
            if not row:
                return json_response({"proposal": None})

            proposal = fetch_proposal_with_items(cur, row["id"])
            return json_response({"proposal": proposal})
    except Exception as e:
        print(f"Get proposal error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_create(user, body_str):
    """POST — create a proposal for a project."""
    try:
        body = parse_body(body_str)
    except (json.JSONDecodeError, TypeError):
        return error_response("Invalid JSON body", 400)

    if not body:
        return error_response("Invalid JSON body", 400)

    project_id = body.get("project_id")
    if not project_id:
        return error_response("project_id is required", 400)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            project = check_designer_owner(cur, project_id, user)
            if not project:
                return error_response("Project not found or you are not the owner", 403)

            # Check if proposal already exists
            cur.execute(
                f"SELECT id FROM {SCHEMA}.proposals WHERE project_id = %s",
                (project_id,),
            )
            if cur.fetchone():
                return error_response("Proposal already exists for this project", 409)

            background_preset = body.get("background_preset")
            template_name = body.get("template_name")

            cur.execute(
                f"""INSERT INTO {SCHEMA}.proposals
                    (project_id, status, background_preset, template_name)
                    VALUES (%s, 'draft', %s, %s)
                    RETURNING id, project_id, status, background_url, background_preset,
                              template_name, notes, created_at, updated_at""",
                (project_id, background_preset, template_name),
            )
            proposal = dict(cur.fetchone())

            items = body.get("items")
            if items:
                proposal["items"] = insert_items(cur, proposal["id"], items)
            else:
                proposal["items"] = insert_items(cur, proposal["id"], DEFAULT_ITEMS)

            conn.commit()

        return json_response({"proposal": proposal}, 201)
    except Exception as e:
        conn.rollback()
        print(f"Create proposal error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_update(user, proposal_id, body_str):
    """PUT ?id=UUID — update proposal fields and/or items."""
    try:
        body = parse_body(body_str)
    except (json.JSONDecodeError, TypeError):
        return error_response("Invalid JSON body", 400)

    if not body:
        return error_response("Invalid JSON body", 400)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Fetch proposal to get project_id
            cur.execute(
                f"SELECT id, project_id FROM {SCHEMA}.proposals WHERE id = %s",
                (proposal_id,),
            )
            proposal_row = cur.fetchone()
            if not proposal_row:
                return error_response("Proposal not found", 404)

            project = check_designer_owner(cur, proposal_row["project_id"], user)
            if not project:
                return error_response("Access denied", 403)

            # Build update fields
            updatable = ["status", "background_url", "background_preset", "template_name", "notes", "discount", "discount_type"]
            set_parts = []
            values = []
            for field in updatable:
                if field in body:
                    set_parts.append(f"{field} = %s")
                    values.append(body[field])

            if set_parts:
                set_parts.append("updated_at = NOW()")
                values.append(proposal_id)
                cur.execute(
                    f"""UPDATE {SCHEMA}.proposals
                        SET {', '.join(set_parts)}
                        WHERE id = %s
                        RETURNING id, project_id, status, background_url, background_preset,
                                  template_name, notes, created_at, updated_at""",
                    values,
                )
            else:
                # Even if no scalar fields, touch updated_at
                cur.execute(
                    f"""UPDATE {SCHEMA}.proposals SET updated_at = NOW()
                        WHERE id = %s
                        RETURNING id, project_id, status, background_url, background_preset,
                                  template_name, notes, created_at, updated_at""",
                    (proposal_id,),
                )

            proposal = dict(cur.fetchone())

            # Handle items replacement
            if "items" in body:
                cur.execute(
                    f"DELETE FROM {SCHEMA}.proposal_items WHERE proposal_id = %s",
                    (proposal_id,),
                )
                proposal["items"] = insert_items(cur, proposal_id, body["items"])
            else:
                # Fetch existing items
                cur.execute(
                    f"""SELECT id, order_number, title, description, price
                        FROM {SCHEMA}.proposal_items
                        WHERE proposal_id = %s ORDER BY order_number""",
                    (proposal_id,),
                )
                proposal["items"] = [dict(r) for r in cur.fetchall()]

            conn.commit()

        return json_response({"proposal": proposal})
    except Exception as e:
        conn.rollback()
        print(f"Update proposal error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_upload_bg(user, proposal_id, body_str):
    """PUT ?id=UUID&action=upload_bg — upload background image to S3."""
    try:
        body = parse_body(body_str)
    except (json.JSONDecodeError, TypeError):
        return error_response("Invalid JSON body", 400)

    if not body or "image" not in body:
        return error_response("image field is required (base64)", 400)

    content_type = body.get("content_type", "image/jpeg")
    ext = CONTENT_TYPE_TO_EXT.get(content_type)
    if not ext:
        return error_response("Unsupported content_type. Use image/jpeg, image/png, or image/webp", 400)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT id, project_id FROM {SCHEMA}.proposals WHERE id = %s",
                (proposal_id,),
            )
            proposal_row = cur.fetchone()
            if not proposal_row:
                return error_response("Proposal not found", 404)

            project = check_designer_owner(cur, proposal_row["project_id"], user)
            if not project:
                return error_response("Access denied", 403)

            # Decode and upload to S3
            image_data = base64.b64decode(body["image"])
            s3_key = f"proposals/{proposal_id}/bg.{ext}"

            s3 = get_s3_client()
            s3.put_object(
                Bucket="files",
                Key=s3_key,
                Body=image_data,
                ContentType=content_type,
            )

            aws_key_id = os.environ["AWS_ACCESS_KEY_ID"]
            background_url = f"https://cdn.poehali.dev/projects/{aws_key_id}/bucket/{s3_key}"

            cur.execute(
                f"""UPDATE {SCHEMA}.proposals
                    SET background_url = %s, updated_at = NOW()
                    WHERE id = %s""",
                (background_url, proposal_id),
            )
            conn.commit()

        return json_response({"background_url": background_url})
    except Exception as e:
        conn.rollback()
        print(f"Upload bg error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_delete(user, proposal_id):
    """DELETE ?id=UUID — delete proposal and all its items."""
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT id, project_id FROM {SCHEMA}.proposals WHERE id = %s",
                (proposal_id,),
            )
            proposal_row = cur.fetchone()
            if not proposal_row:
                return error_response("Proposal not found", 404)

            project = check_designer_owner(cur, proposal_row["project_id"], user)
            if not project:
                return error_response("Access denied", 403)

            cur.execute(
                f"DELETE FROM {SCHEMA}.proposal_items WHERE proposal_id = %s",
                (proposal_id,),
            )
            cur.execute(
                f"DELETE FROM {SCHEMA}.proposals WHERE id = %s",
                (proposal_id,),
            )
            conn.commit()

        return json_response({"deleted": True})
    except Exception as e:
        conn.rollback()
        print(f"Delete proposal error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_get_templates(user):
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"""SELECT id, name, items, created_at
                    FROM {SCHEMA}.proposal_templates
                    WHERE owner_id = %s ORDER BY created_at DESC""",
                (str(user["id"]),),
            )
            rows = cur.fetchall()
        return json_response({"templates": [dict(r) for r in rows]})
    except Exception as e:
        print(f"Get templates error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_save_template(user, body_str):
    try:
        body = parse_body(body_str)
    except (json.JSONDecodeError, TypeError):
        return error_response("Invalid JSON body", 400)

    if not body or not body.get("name") or not body.get("items"):
        return error_response("name and items are required", 400)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"""INSERT INTO {SCHEMA}.proposal_templates (owner_id, name, items)
                    VALUES (%s, %s, %s) RETURNING id, name, items, created_at""",
                (str(user["id"]), body["name"], json.dumps(body["items"], default=str)),
            )
            tpl = dict(cur.fetchone())
            conn.commit()
        return json_response({"template": tpl}, 201)
    except Exception as e:
        conn.rollback()
        print(f"Save template error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_delete_template(user, template_id):
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT id FROM {SCHEMA}.proposal_templates WHERE id = %s AND owner_id = %s",
                (template_id, str(user["id"])),
            )
            if not cur.fetchone():
                return error_response("Template not found", 404)
            cur.execute(
                f"DELETE FROM {SCHEMA}.proposal_templates WHERE id = %s",
                (template_id,),
            )
            conn.commit()
        return json_response({"deleted": True})
    except Exception as e:
        conn.rollback()
        print(f"Delete template error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


# ─── Main handler ────────────────────────────────────────────────────────────


def handler(event, context=None):
    """Управление коммерческими предложениями — создание, редактирование, пункты КП, шаблоны."""
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

    action = qsp.get("action", "")

    if method == "GET":
        if action == "templates":
            return handle_get_templates(user)
        return handle_get(user, qsp)

    if method == "POST":
        if action == "save_template":
            return handle_save_template(user, body)
        return handle_create(user, body)

    if method == "PUT":
        proposal_id = qsp.get("id")
        if not proposal_id:
            return error_response("id query parameter is required", 400)
        if action == "upload_bg":
            return handle_upload_bg(user, proposal_id, body)
        return handle_update(user, proposal_id, body)

    if method == "DELETE":
        if action == "delete_template":
            template_id = qsp.get("id")
            if not template_id:
                return error_response("id query parameter is required", 400)
            return handle_delete_template(user, template_id)
        proposal_id = qsp.get("id")
        if not proposal_id:
            return error_response("id query parameter is required", 400)
        return handle_delete(user, proposal_id)

    return error_response("Method not allowed", 405)