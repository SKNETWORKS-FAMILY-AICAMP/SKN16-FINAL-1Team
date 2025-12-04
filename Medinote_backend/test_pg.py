# test_pg.py
import psycopg2

print("🚀 psycopg2 직접 연결 테스트 시작")

try:
    conn = psycopg2.connect(
        dbname="medinote",
        user="postgres",
        password="7276",
        host="localhost",
        port=5432,
        options="-c client_encoding=UTF8",
    )
    print("✅ psycopg2 connect 성공")
    conn.close()
except Exception as e:
    print("❌ psycopg2 connect 실패:", repr(e))
