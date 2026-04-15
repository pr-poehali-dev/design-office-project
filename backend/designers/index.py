import json
import os
import psycopg2
import psycopg2.extras

DATABASE_URL = os.environ.get("DATABASE_URL", "")
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
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


def handle_list_designers(query_params):
    city = query_params.get("city")
    specialization = query_params.get("specialization")
    search = query_params.get("search")

    conditions = ["role = 'designer'"]
    values = []

    if city:
        conditions.append("city = %s")
        values.append(city)

    if specialization:
        conditions.append("specialization = %s")
        values.append(specialization)

    if search:
        conditions.append("(first_name ILIKE %s OR last_name ILIKE %s OR personal_id ILIKE %s)")
        values.append(f"%{search}%")
        values.append(f"%{search}%")
        values.append(f"%{search}%")

    where_clause = " AND ".join(conditions)

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"""SELECT id, first_name, last_name, city, specialization,
                           rating, projects_count, avatar_url, bio, personal_id
                    FROM {SCHEMA}.users
                    WHERE {where_clause}
                    ORDER BY rating DESC, projects_count DESC""",
                values,
            )
            rows = cur.fetchall()

        return json_response({"designers": [dict(r) for r in rows]})
    except Exception as e:
        print(f"List designers error: {e}")
        return error_response("Internal server error", 500)
    finally:
        conn.close()


def handler(event, context=None):
    method = event.get("httpMethod", event.get("method", "GET"))

    if method == "OPTIONS":
        return {"statusCode": 204, "headers": CORS_HEADERS, "body": ""}

    if method != "GET":
        return error_response("Method not allowed", 400)

    query_params = event.get("queryStringParameters") or {}

    try:
        return handle_list_designers(query_params)
    except Exception as e:
        print(f"Unhandled error: {e}")
        return error_response("Internal server error", 500)