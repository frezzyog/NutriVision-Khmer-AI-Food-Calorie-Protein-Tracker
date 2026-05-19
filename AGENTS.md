This is the project's AGENTS.md

# Notes
- Streamlit demo app uses `HF_TOKEN` from `.env` via `python-dotenv`; keep Hugging Face image calls in `hf_client.py` so API errors stay isolated from UI code.
