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


def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    return conn


def authenticate(headers):
    token = headers.get("X-Authorization") or headers.get("x-authorization")
    if not token:
        token = headers.get("Authorization") or headers.get("authorization")
    if not token:
        return None
    token = token.replace("Bearer ", "").strip()
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload.get("id") or payload.get("sub") or payload.get("user_id")
    except Exception:
        return None


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, default=str),
    }


def handle_get(user_id, qsp):
    """Список участников команды текущего пользователя (owner)."""
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"""
                SELECT
                    tm.id,
                    tm.member_id,
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
                    (
                        SELECT COUNT(*)
                        FROM {SCHEMA}.project_members pm
                        JOIN {SCHEMA}.projects p ON p.id = pm.project_id
                        WHERE pm.member_id = tm.member_id
                          AND pm.accepted = true
                          AND p.designer_id = tm.owner_id
                    ) AS projects_count,
                    (
                        SELECT COUNT(*)
                        FROM {SCHEMA}.project_members pm
                        JOIN {SCHEMA}.projects p ON p.id = pm.project_id
                        WHERE pm.member_id = tm.member_id
                          AND pm.accepted = true
                          AND p.designer_id = tm.owner_id
                          AND p.status NOT IN ('completed', 'cancelled', 'archived')
                    ) AS active_projects
                FROM {SCHEMA}.team_members tm
                JOIN {SCHEMA}.users u ON u.id = tm.member_id
                WHERE tm.owner_id = %s
                ORDER BY tm.invited_at DESC
                """,
                (user_id,),
            )
            members = cur.fetchall()

            # Fetch projects for each member
            for member in members:
                cur.execute(
                    f"""
                    SELECT p.id, p.title
                    FROM {SCHEMA}.project_members pm
                    JOIN {SCHEMA}.projects p ON p.id = pm.project_id
                    WHERE pm.member_id = %s
                      AND pm.accepted = true
                      AND p.designer_id = %s
                    """,
                    (member["member_id"], user_id),
                )
                member["projects"] = cur.fetchall()

        return response(200, {"members": members})
    finally:
        conn.close()


def handle_post(user_id, body):
    """Приглашение пользователя в команду по email или личному ID."""
    try:
        data = json.loads(body) if isinstance(body, str) else body
    except (json.JSONDecodeError, TypeError):
        return response(400, {"error": "Некорректный JSON"})

    email_or_id = (data.get("email") or "").strip()
    if not email_or_id:
        return response(400, {"error": "Email или ID обязателен"})

    team_role = data.get("team_role", "designer")

    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
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
                return response(404, {"error": "Пользователь не найден. Проверьте email или ID."})

            member_id = target_user["id"]

            # Cannot invite yourself
            if str(member_id) == str(user_id):
                return response(400, {"error": "Нельзя пригласить самого себя"})

            # Check if already in team
            cur.execute(
                f"SELECT id FROM {SCHEMA}.team_members WHERE owner_id = %s AND member_id = %s",
                (user_id, member_id),
            )
            if cur.fetchone():
                return response(409, {"error": "Уже в команде"})

            # Insert team member
            cur.execute(
                f"""
                INSERT INTO {SCHEMA}.team_members (owner_id, member_id, team_role, accepted)
                VALUES (%s, %s, %s, false)
                RETURNING id, owner_id, member_id, team_role, accepted, invited_at
                """,
                (user_id, member_id, team_role),
            )
            tm = cur.fetchone()
            conn.commit()

            # Combine team_member record with user info
            result = {**tm, **target_user, "id": tm["id"]}
            return response(201, result)
    finally:
        conn.close()


def handle_put(user_id, qsp, body):
    """Обновление участника команды — принятие приглашения или смена роли."""
    tm_id = qsp.get("id")
    if not tm_id:
        return response(400, {"error": "Параметр id обязателен"})

    try:
        data = json.loads(body) if isinstance(body, str) else body
    except (json.JSONDecodeError, TypeError):
        return response(400, {"error": "Некорректный JSON"})

    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT id, owner_id, member_id, team_role, accepted FROM {SCHEMA}.team_members WHERE id = %s",
                (tm_id,),
            )
            tm = cur.fetchone()
            if not tm:
                return response(404, {"error": "Запись не найдена"})

            # Member can accept invitation
            if str(tm["member_id"]) == str(user_id):
                if "accepted" in data:
                    cur.execute(
                        f"UPDATE {SCHEMA}.team_members SET accepted = %s WHERE id = %s RETURNING id, owner_id, member_id, team_role, accepted, invited_at",
                        (data["accepted"], tm_id),
                    )
                    updated = cur.fetchone()
                    conn.commit()
                    return response(200, updated)

            # Owner can change role
            if str(tm["owner_id"]) == str(user_id):
                if "team_role" in data:
                    cur.execute(
                        f"UPDATE {SCHEMA}.team_members SET team_role = %s WHERE id = %s RETURNING id, owner_id, member_id, team_role, accepted, invited_at",
                        (data["team_role"], tm_id),
                    )
                    updated = cur.fetchone()
                    conn.commit()
                    return response(200, updated)

            return response(403, {"error": "Нет прав для этого действия"})
    finally:
        conn.close()


def handle_delete(user_id, qsp):
    """Удаление участника из команды (только owner)."""
    tm_id = qsp.get("id")
    if not tm_id:
        return response(400, {"error": "Параметр id обязателен"})

    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT id, owner_id FROM {SCHEMA}.team_members WHERE id = %s",
                (tm_id,),
            )
            tm = cur.fetchone()
            if not tm:
                return response(404, {"error": "Запись не найдена"})

            if str(tm["owner_id"]) != str(user_id):
                return response(403, {"error": "Только владелец может удалять участников"})

            cur.execute(
                f"DELETE FROM {SCHEMA}.team_members WHERE id = %s",
                (tm_id,),
            )
            conn.commit()
            return response(200, {"success": True})
    finally:
        conn.close()


def handler(event, context=None):
    """Управление командой дизайнера — список, приглашение, удаление участников."""
    method = event.get("httpMethod", event.get("method", "GET"))
    headers = event.get("headers", {})
    body = event.get("body", "")
    qsp = event.get("queryStringParameters") or {}

    # CORS preflight
    if method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": "",
        }

    # Auth
    user_id = authenticate(headers)
    if not user_id:
        return response(401, {"error": "Не авторизован"})

    if method == "GET":
        return handle_get(user_id, qsp)
    elif method == "POST":
        return handle_post(user_id, body)
    elif method == "PUT":
        return handle_put(user_id, qsp, body)
    elif method == "DELETE":
        return handle_delete(user_id, qsp)
    else:
        return response(405, {"error": "Метод не поддерживается"})