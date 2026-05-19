from io import BytesIO

from PIL import Image
import streamlit as st


def get_image_bytes(uploaded_file):
    """Read bytes from an uploaded image or camera image."""
    if uploaded_file is None:
        return None
    return uploaded_file.getvalue()


def show_image_preview(image_bytes):
    """Display a safe preview of the selected image."""
    try:
        image = Image.open(BytesIO(image_bytes))
        st.image(image, caption="Selected food image", use_container_width=True)
    except Exception:
        st.error("The selected file could not be opened as an image.")
