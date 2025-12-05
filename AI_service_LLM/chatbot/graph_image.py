# AI_service_LLM/chatbot/graph_image.py

from __future__ import annotations

from chatbot.graph_doc import doc_graph  # <-- 실행용이 아닌 '문서용' 그래프 가져옴

OUTPUT_FILE = "graph_doc.png"


def save_graph_png() -> None:
    try:
        g = doc_graph.get_graph()
        png_bytes = g.draw_mermaid_png()

        with open(OUTPUT_FILE, "wb") as f:
            f.write(png_bytes)

        print(f"[OK] LangGraph doc PNG saved → {OUTPUT_FILE}")
    except Exception as e:
        print("[ERROR] Failed to generate graph image:", e)


if __name__ == "__main__":
    save_graph_png()
