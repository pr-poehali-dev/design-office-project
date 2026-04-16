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
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
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
    """Аутентификация запроса, возвращает пользователя или ответ с ошибкой."""
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
                f"SELECT id, email, role, first_name, last_name FROM {SCHEMA}.users WHERE id = %s",
                (payload["userId"],),
            )
            user = cur.fetchone()
        if not user:
            return error_response("User not found", 404)
        return dict(user)
    finally:
        conn.close()


def check_project_access(user, project_id):
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(f"SELECT * FROM {SCHEMA}.projects WHERE id = %s", (project_id,))
            project = cur.fetchone()
            if not project:
                return None, error_response("Project not found", 404)
            project = dict(project)
            if str(project["designer_id"]) == str(user["id"]):
                return project, None
            cur.execute(
                f"""SELECT id FROM {SCHEMA}.project_members
                    WHERE project_id = %s AND user_id = %s AND accepted = true""",
                (project_id, str(user["id"])),
            )
            if cur.fetchone():
                return project, None
            return None, error_response("Access denied to this project", 403)
    finally:
        conn.close()


def handle_list_messages(qsp, user):
    """GET ?project_id=UUID — сообщения проекта."""
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
                f"""SELECT m.id, m.project_id, m.sender_id, m.content, m.is_read, m.created_at,
                           u.first_name AS sender_first_name, u.last_name AS sender_last_name
                    FROM {SCHEMA}.messages m
                    JOIN {SCHEMA}.users u ON u.id = m.sender_id
                    WHERE m.project_id = %s
                    ORDER BY m.created_at ASC""",
                (project_id,),
            )
            rows = [dict(r) for r in cur.fetchall()]
        return json_response({"messages": rows})
    except Exception as e:
        print(f"List messages error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_send_message(body_str, user):
    """POST — отправить сообщение в чат проекта."""
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

    project, err = check_project_access(user, project_id)
    if err:
        return err

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"""INSERT INTO {SCHEMA}.messages (project_id, sender_id, content)
                    VALUES (%s, %s, %s)
                    RETURNING id, project_id, sender_id, content, is_read, created_at""",
                (project_id, str(user["id"]), content.strip()),
            )
            message = dict(cur.fetchone())
            conn.commit()
        message["sender_first_name"] = user.get("first_name")
        message["sender_last_name"] = user.get("last_name")
        return json_response({"message": message}, 201)
    except Exception as e:
        conn.rollback()
        print(f"Send message error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_dm_list(qsp, user):
    """GET ?action=dm&peer_id=UUID — личная переписка с конкретным пользователем."""
    peer_id = qsp.get("peer_id")
    if not peer_id:
        return error_response("peer_id is required", 400)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"""SELECT dm.id, dm.sender_id, dm.receiver_id, dm.content, dm.is_read, dm.created_at,
                           u.first_name AS sender_first_name, u.last_name AS sender_last_name
                    FROM {SCHEMA}.direct_messages dm
                    JOIN {SCHEMA}.users u ON u.id = dm.sender_id
                    WHERE (dm.sender_id = %s AND dm.receiver_id = %s)
                       OR (dm.sender_id = %s AND dm.receiver_id = %s)
                    ORDER BY dm.created_at ASC""",
                (str(user["id"]), peer_id, peer_id, str(user["id"])),
            )
            rows = [dict(r) for r in cur.fetchall()]

            cur.execute(
                f"""UPDATE {SCHEMA}.direct_messages
                    SET is_read = true
                    WHERE receiver_id = %s AND sender_id = %s AND is_read = false""",
                (str(user["id"]), peer_id),
            )
            conn.commit()
        return json_response({"messages": rows})
    except Exception as e:
        print(f"DM list error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_dm_send(body_str, user):
    """POST ?action=dm — отправить личное сообщение."""
    try:
        body = parse_body(body_str)
    except (json.JSONDecodeError, TypeError):
        return error_response("Invalid JSON body", 400)
    if not body:
        return error_response("Invalid JSON body", 400)

    receiver_id = body.get("receiver_id")
    content = body.get("content")
    if not receiver_id:
        return error_response("receiver_id is required", 400)
    if not content or not content.strip():
        return error_response("content is required", 400)
    if str(receiver_id) == str(user["id"]):
        return error_response("Cannot send message to yourself", 400)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT id, first_name, last_name FROM {SCHEMA}.users WHERE id = %s",
                (receiver_id,),
            )
            if not cur.fetchone():
                return error_response("Receiver not found", 404)

            cur.execute(
                f"""INSERT INTO {SCHEMA}.direct_messages (sender_id, receiver_id, content)
                    VALUES (%s, %s, %s)
                    RETURNING id, sender_id, receiver_id, content, is_read, created_at""",
                (str(user["id"]), receiver_id, content.strip()),
            )
            msg = dict(cur.fetchone())
            conn.commit()
        msg["sender_first_name"] = user.get("first_name")
        msg["sender_last_name"] = user.get("last_name")
        return json_response({"message": msg}, 201)
    except Exception as e:
        conn.rollback()
        print(f"DM send error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_inbox(user):
    """GET ?action=inbox — входящие: проектный чат, личные переписки, приглашения в команду."""
    uid = str(user["id"])
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"""SELECT DISTINCT ON (m.project_id)
                           m.id, m.project_id, m.sender_id, m.content, m.is_read, m.created_at,
                           u.first_name AS sender_first_name, u.last_name AS sender_last_name,
                           p.title AS project_title
                    FROM {SCHEMA}.messages m
                    JOIN {SCHEMA}.users u ON u.id = m.sender_id
                    JOIN {SCHEMA}.projects p ON p.id = m.project_id
                    WHERE m.project_id IN (
                        SELECT id FROM {SCHEMA}.projects WHERE designer_id = %s
                        UNION
                        SELECT project_id FROM {SCHEMA}.project_members WHERE user_id = %s AND accepted = true
                    )
                    ORDER BY m.project_id, m.created_at DESC""",
                (uid, uid),
            )
            project_messages = [dict(r) for r in cur.fetchall()]
            project_messages.sort(key=lambda x: x["created_at"], reverse=True)

            # DMs excluding TEAM_INVITE system messages
            cur.execute(
                f"""SELECT DISTINCT ON (peer_id)
                           sub.id, sub.sender_id, sub.receiver_id, sub.content, sub.is_read, sub.created_at,
                           sub.peer_id,
                           pu.first_name AS peer_first_name, pu.last_name AS peer_last_name
                    FROM (
                        SELECT dm.*,
                               CASE WHEN dm.sender_id = %s THEN dm.receiver_id ELSE dm.sender_id END AS peer_id
                        FROM {SCHEMA}.direct_messages dm
                        WHERE (dm.sender_id = %s OR dm.receiver_id = %s)
                          AND dm.content NOT LIKE 'TEAM_INVITE:%%'
                    ) sub
                    JOIN {SCHEMA}.users pu ON pu.id = sub.peer_id
                    ORDER BY peer_id, sub.created_at DESC""",
                (uid, uid, uid),
            )
            dm_conversations = [dict(r) for r in cur.fetchall()]
            dm_conversations.sort(key=lambda x: x["created_at"], reverse=True)

            # Team invitations — pending only for current user as member
            cur.execute(
                f"""
                SELECT
                    tm.id AS team_member_id,
                    tm.owner_id,
                    tm.team_role,
                    tm.invited_at,
                    tm.access_permissions,
                    u.first_name AS owner_first_name,
                    u.last_name AS owner_last_name,
                    u.personal_id AS owner_personal_id
                FROM {SCHEMA}.team_members tm
                JOIN {SCHEMA}.users u ON u.id = tm.owner_id
                WHERE tm.member_id = %s AND tm.accepted = false
                ORDER BY tm.invited_at DESC
                """,
                (uid,),
            )
            team_invitations = [dict(r) for r in cur.fetchall()]

        return json_response({
            "project_messages": project_messages,
            "dm_conversations": dm_conversations,
            "team_invitations": team_invitations,
        })
    except Exception as e:
        print(f"Inbox error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_unread_count(user):
    """GET ?action=unread — количество непрочитанных."""
    uid = str(user["id"])
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"""SELECT COUNT(*) AS cnt FROM {SCHEMA}.direct_messages
                    WHERE receiver_id = %s AND is_read = false""",
                (uid,),
            )
            dm_unread = cur.fetchone()["cnt"]

            cur.execute(
                f"""SELECT COUNT(*) AS cnt FROM {SCHEMA}.messages
                    WHERE is_read = false AND sender_id != %s
                    AND project_id IN (
                        SELECT id FROM {SCHEMA}.projects WHERE designer_id = %s
                        UNION
                        SELECT project_id FROM {SCHEMA}.project_members WHERE user_id = %s AND accepted = true
                    )""",
                (uid, uid, uid),
            )
            project_unread = cur.fetchone()["cnt"]

            cur.execute(
                f"SELECT COUNT(*) AS cnt FROM {SCHEMA}.team_members WHERE member_id = %s AND accepted = false",
                (uid,),
            )
            invite_unread = cur.fetchone()["cnt"]

        return json_response({
            "dm_unread": dm_unread,
            "project_unread": project_unread,
            "invite_unread": invite_unread,
            "total_unread": dm_unread + project_unread + invite_unread,
        })
    except Exception as e:
        print(f"Unread count error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handle_mark_read(body_str, user):
    """PUT ?action=mark_read — отметить сообщения прочитанными."""
    try:
        body = parse_body(body_str)
    except (json.JSONDecodeError, TypeError):
        return error_response("Invalid JSON body", 400)
    if not body:
        return error_response("Invalid JSON body", 400)

    uid = str(user["id"])
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if body.get("project_id"):
                cur.execute(
                    f"""UPDATE {SCHEMA}.messages
                        SET is_read = true
                        WHERE project_id = %s AND sender_id != %s AND is_read = false""",
                    (body["project_id"], uid),
                )
            if body.get("peer_id"):
                cur.execute(
                    f"""UPDATE {SCHEMA}.direct_messages
                        SET is_read = true
                        WHERE receiver_id = %s AND sender_id = %s AND is_read = false""",
                    (uid, body["peer_id"]),
                )
            conn.commit()
        return json_response({"ok": True})
    except Exception as e:
        conn.rollback()
        print(f"Mark read error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handler(event, context=None):
    """Сообщения — проектный чат, личные сообщения, входящие, непрочитанные."""
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

    action = qsp.get("action", "")

    try:
        if method == "GET":
            if action == "dm":
                return handle_dm_list(qsp, user)
            if action == "inbox":
                return handle_inbox(user)
            if action == "unread":
                return handle_unread_count(user)
            return handle_list_messages(qsp, user)

        if method == "POST":
            if action == "dm":
                return handle_dm_send(body, user)
            return handle_send_message(body, user)

        if method == "PUT":
            if action == "mark_read":
                return handle_mark_read(body, user)
            return error_response("Unknown action", 400)

        return error_response("Method not allowed", 405)
    except Exception as e:
        print(f"Unhandled error: {e}")
        return error_response("Internal server error", 500)