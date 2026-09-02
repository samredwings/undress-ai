# Google Colab — Free GPU Backend for Storybook Studio

Run AI models on Google Colab's **free GPU** (T4, V100, or A100) and connect
them to Storybook Studio as a zero-cost inference backend.

## Quick Start

1. Open the notebook in Colab:
   [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/YOUR_USERNAME/image-video-storybook/blob/main/colab/storybook_colab.ipynb)

2. Run all cells — the notebook will:
   - Install dependencies (PyTorch, transformers, diffusers, etc.)
   - Load models for text, image, and video generation
   - Start a Gradio/FastAPI server
   - Expose a public URL via ngrok or Gradio share link

3. Copy the generated URL (looks like `https://xxxx.gradio.live` or `https://xxxx.ngrok.io`)

4. Set it in your `.env`:

   ```
   COLAB_ENDPOINT=https://your-colab-url.gradio.live
   ```

5. Restart Storybook Studio — it will now route AI requests to Colab's free GPU!

## Endpoints the Colab Notebook Exposes

| Endpoint          | Method | Description                      |
| ----------------- | ------ | -------------------------------- |
| `/generate/text`  | POST   | Text generation (mistral/llama2) |
| `/generate/image` | POST   | Image generation (SDXL)          |
| `/generate/video` | POST   | Video generation (CogVideoX)     |
| `/health`         | GET    | Health check                     |

## Models Included

- **Text:** Mistral 7B, Llama 2 7B (uncensored variants)
- **Image:** Stable Diffusion XL (uncensored)
- **Video:** CogVideoX-5b (open-source video generation)

## Notes

- Colab free tier has usage limits (~4-6 hours per session)
- The notebook runs continuously while the Colab tab is open
- For persistent access, consider Colab Pro or a local GPU
