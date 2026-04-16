import json
import os
import psycopg2
import psycopg2.extras
import jwt

DATABASE_URL = os.environ.get("DATABASE_URL")
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
JWT_SECRET = os.environ.get("JWT_SECRET", "")

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Authorization",
    "Content-Type": "application/json",
}

DEFAULT_PERMISSIONS = {
    "overview": True,
    "execution": True,
    "brief": True,
    "estimate": False,
    "finance": False,
    "documents": False,
    "proposal": False,
}


def get_db():
    return psycopg2.connect(DATABASE_URL)


def authenticate(headers):
    token = headers.get("X-Authorization") or headers.get("x-authorization")
    if not token:
        token = headers.get("Authorization") or headers.get("authorization")
    if not token:
        return None
    token = token.replace("Bearer ", "").strip()
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        uid = payload.get("userId") or payload.get("id") or payload.get("sub")
        return uid
    except Exception:
        return None


def resp(status_code, body):
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, default=str),
    }


def handle_get(user_id, qsp):
    """Список участников команды текущего пользователя (owner). Также возвращает входящие приглашения для member."""
    action = qsp.get("action")

    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            if action == "incoming":
                # Incoming invitations for the current user (as member)
                cur.execute(
                    f"""
                    SELECT
                        tm.id,
                        tm.owner_id,
                        tm.team_role,
                        tm.accepted,
                        tm.invited_at,
                        tm.access_permissions,
                        tm.allowed_project_ids,
                        u.first_name AS owner_first_name,
                        u.last_name AS owner_last_name,
                        u.email AS owner_email,
                        u.specialization AS owner_specialization,
                        u.personal_id AS owner_personal_id
                    FROM {SCHEMA}.team_members tm
                    JOIN {SCHEMA}.users u ON u.id = tm.owner_id
                    WHERE tm.member_id = %s AND tm.accepted = false
                    ORDER BY tm.invited_at DESC
                    """,
                    (user_id,),
                )
                invitations = [dict(r) for r in cur.fetchall()]
                return resp(200, {"invitations": invitations})

            # Default: list team members owned by user
            cur.execute(
                f"""
                SELECT
                    tm.id,
                    tm.member_id,
                    tm.owner_id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.phone,
                    u.city,
                    u.specialization,
                    u.bio,
                    u.rating,
                    u.personal_id,
                    tm.team_role,
                    tm.accepted,
                    tm.invited_at,
                    tm.access_permissions,
                    tm.allowed_project_ids
                FROM {SCHEMA}.team_members tm
                JOIN {SCHEMA}.users u ON u.id = tm.member_id
                WHERE tm.owner_id = %s
                ORDER BY tm.accepted DESC, tm.invited_at DESC
                """,
                (user_id,),
            )
            members = [dict(r) for r in cur.fetchall()]

            # For each member, fetch allowed projects details
            for member in members:
                project_ids = member.get("allowed_project_ids") or []
                if project_ids:
                    cur.execute(
                        f"SELECT id, title, status FROM {SCHEMA}.projects WHERE id = ANY(%s::uuid[]) AND designer_id = %s",
                        (project_ids, user_id),
                    )
                    member["allowed_projects"] = [dict(r) for r in cur.fetchall()]
                else:
                    member["allowed_projects"] = []

        return resp(200, {"members": members})
    finally:
        conn.close()


def handle_post(user_id, body):
    """Приглашение пользователя в команду по email или личному ID. Отправляет DM."""
    try:
        data = json.loads(body) if isinstance(body, str) else body
    except (json.JSONDecodeError, TypeError):
        return resp(400, {"error": "Некорректный JSON"})

    email_or_id = (data.get("email") or "").strip()
    if not email_or_id:
        return resp(400, {"error": "Email или ID обязателен"})

    team_role = data.get("team_role", "designer")

    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Find invitee
            if "@" in email_or_id:
                cur.execute(
                    f"SELECT id, first_name, last_name, email, phone, city, specialization, bio, rating, personal_id FROM {SCHEMA}.users WHERE LOWER(email) = %s",
                    (email_or_id.lower(),),
                )
            else:
                cur.execute(
                    f"SELECT id, first_name, last_name, email, phone, city, specialization, bio, rating, personal_id FROM {SCHEMA}.users WHERE UPPER(personal_id) = %s",
                    (email_or_id.upper(),),
                )
            target_user = cur.fetchone()
            if not target_user:
                return resp(404, {"error": "Пользователь не найден. Проверьте email или ID."})

            member_id = target_user["id"]

            if str(member_id) == str(user_id):
                return resp(400, {"error": "Нельзя пригласить самого себя"})

            cur.execute(
                f"SELECT id FROM {SCHEMA}.team_members WHERE owner_id = %s AND member_id = %s",
                (user_id, member_id),
            )
            if cur.fetchone():
                return resp(409, {"error": "Уже в команде"})

            # Get inviter info
            cur.execute(
                f"SELECT first_name, last_name, personal_id FROM {SCHEMA}.users WHERE id = %s",
                (user_id,),
            )
            inviter = cur.fetchone()
            inviter_name = f"{inviter['first_name'] or ''} {inviter['last_name'] or ''}".strip()
            inviter_pid = inviter["personal_id"]

            # Insert team member record
            cur.execute(
                f"""
                INSERT INTO {SCHEMA}.team_members (owner_id, member_id, team_role, accepted, access_permissions, allowed_project_ids)
                VALUES (%s, %s, %s, false, %s::jsonb, '{{}}')
                RETURNING id, owner_id, member_id, team_role, accepted, invited_at, access_permissions, allowed_project_ids
                """,
                (user_id, member_id, team_role, json.dumps(DEFAULT_PERMISSIONS)),
            )
            tm = dict(cur.fetchone())

            # Send DM to invitee
            invite_message = f"TEAM_INVITE:{tm['id']}:{inviter_name}:{inviter_pid}"
            cur.execute(
                f"""
                INSERT INTO {SCHEMA}.direct_messages (sender_id, receiver_id, content)
                VALUES (%s, %s, %s)
                """,
                (user_id, str(member_id), invite_message),
            )

            conn.commit()

            result = {**tm, **dict(target_user), "id": tm["id"]}
            return resp(201, result)
    finally:
        conn.close()


def handle_put(user_id, qsp, body):
    """Обновление: принять/отклонить приглашение, сменить роль, обновить права доступа и проекты."""
    tm_id = qsp.get("id")
    if not tm_id:
        return resp(400, {"error": "Параметр id обязателен"})

    try:
        data = json.loads(body) if isinstance(body, str) else body
    except (json.JSONDecodeError, TypeError):
        return resp(400, {"error": "Некорректный JSON"})

    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT id, owner_id, member_id, team_role, accepted, access_permissions, allowed_project_ids FROM {SCHEMA}.team_members WHERE id = %s",
                (tm_id,),
            )
            tm = cur.fetchone()
            if not tm:
                return resp(404, {"error": "Запись не найдена"})

            # Member: accept or decline invitation
            if str(tm["member_id"]) == str(user_id):
                accepted = data.get("accepted")
                if accepted is False:
                    # Decline — delete record
                    cur.execute(f"DELETE FROM {SCHEMA}.team_members WHERE id = %s", (tm_id,))
                    conn.commit()
                    return resp(200, {"deleted": True})
                if accepted is True:
                    cur.execute(
                        f"UPDATE {SCHEMA}.team_members SET accepted = true WHERE id = %s RETURNING id, owner_id, member_id, team_role, accepted, invited_at, access_permissions, allowed_project_ids",
                        (tm_id,),
                    )
                    updated = dict(cur.fetchone())
                    conn.commit()
                    return resp(200, updated)

            # Owner: update role, permissions, allowed projects
            if str(tm["owner_id"]) == str(user_id):
                set_parts = []
                vals = []

                if "team_role" in data:
                    set_parts.append("team_role = %s")
                    vals.append(data["team_role"])

                if "access_permissions" in data:
                    set_parts.append("access_permissions = %s::jsonb")
                    vals.append(json.dumps(data["access_permissions"]))

                if "allowed_project_ids" in data:
                    # Validate project IDs belong to owner
                    project_ids = data["allowed_project_ids"] or []
                    if project_ids:
                        cur.execute(
                            f"SELECT id FROM {SCHEMA}.projects WHERE id = ANY(%s::uuid[]) AND designer_id = %s",
                            (project_ids, user_id),
                        )
                        valid_ids = [str(r["id"]) for r in cur.fetchall()]
                    else:
                        valid_ids = []
                    set_parts.append("allowed_project_ids = %s::uuid[]")
                    vals.append(valid_ids)

                if not set_parts:
                    return resp(400, {"error": "Нет полей для обновления"})

                vals.append(tm_id)
                cur.execute(
                    f"UPDATE {SCHEMA}.team_members SET {', '.join(set_parts)} WHERE id = %s RETURNING id, owner_id, member_id, team_role, accepted, invited_at, access_permissions, allowed_project_ids",
                    vals,
                )
                updated = dict(cur.fetchone())
                conn.commit()
                return resp(200, updated)

            return resp(403, {"error": "Нет прав для этого действия"})
    finally:
        conn.close()


def handle_delete(user_id, qsp):
    """Удаление участника из команды (owner) или отказ от участия (member)."""
    tm_id = qsp.get("id")
    if not tm_id:
        return resp(400, {"error": "Параметр id обязателен"})

    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT id, owner_id, member_id FROM {SCHEMA}.team_members WHERE id = %s",
                (tm_id,),
            )
            tm = cur.fetchone()
            if not tm:
                return resp(404, {"error": "Запись не найдена"})

            if str(tm["owner_id"]) != str(user_id) and str(tm["member_id"]) != str(user_id):
                return resp(403, {"error": "Нет прав"})

            cur.execute(f"DELETE FROM {SCHEMA}.team_members WHERE id = %s", (tm_id,))
            conn.commit()
            return resp(200, {"success": True})
    finally:
        conn.close()


def handler(event, context=None):
    """Управление командой дизайнера — приглашения, права доступа, проекты участников."""
    method = event.get("httpMethod", event.get("method", "GET"))
    headers = event.get("headers", {})
    body = event.get("body", "")
    qsp = event.get("queryStringParameters") or {}

    if method == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    user_id = authenticate(headers)
    if not user_id:
        return resp(401, {"error": "Unauthorized"})

    if method == "GET":
        return handle_get(user_id, qsp)
    elif method == "POST":
        return handle_post(user_id, body)
    elif method == "PUT":
        return handle_put(user_id, qsp, body)
    elif method == "DELETE":
        return handle_delete(user_id, qsp)
    else:
        return resp(405, {"error": "Method not allowed"})
