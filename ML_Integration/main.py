import os
import pickle
import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoConfig, AutoModelForSequenceClassification

# ───────────────────────────────────────────────────────────────
# Settings
# ───────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PKL_PATH = os.path.join(BASE_DIR, "hate_speech_model.pkl")

# If you know the exact base model, put it first in this list
CANDIDATE_BASES = [
    "xlm-roberta-base",          # your multilingual choice
    "distilbert-base-uncased",   # fallback
    "bert-base-uncased",         # fallback
]

# ───────────────────────────────────────────────────────────────
# Load pickle → rebuild model from state_dict (avoids old configs)
# ───────────────────────────────────────────────────────────────
try:
    with open(PKL_PATH, "rb") as f:
        bundle = pickle.load(f)

    old_model = bundle["model"]        # old HF model object from training env
    tokenizer = bundle["tokenizer"]    # tokenizer object
    state_dict = old_model.state_dict()  # extract weights safely
    del old_model                      # discard old object (and its old config)

except Exception as e:
    raise RuntimeError(f"Failed to load pickle bundle: {e}")

# Try to create a fresh model with a modern config and load weights
model = None
loaded_from = None
last_err = None
for base_name in CANDIDATE_BASES:
    try:
        cfg = AutoConfig.from_pretrained(base_name, num_labels=2)
        fresh = AutoModelForSequenceClassification.from_config(cfg)
        fresh.load_state_dict(state_dict, strict=False)
        model = fresh
        loaded_from = base_name
        break
    except Exception as e:
        last_err = e
        continue

if model is None:
    raise RuntimeError(
        f"Could not rebuild model from state_dict. Last error: {last_err}"
    )

# ───────────────────────────────────────────────────────────────
# Robust padding setup (XLM-R has no native PAD)
# ───────────────────────────────────────────────────────────────
def ensure_padding(tokenizer, model):
    # Use the conventional XLM-R EOS token string as pad (works across versions)
    eos_str = "</s>"
    try:
        eos_id = tokenizer.convert_tokens_to_ids(eos_str)
    except Exception:
        eos_id = None

    if eos_id in (None, -1):
        # Fallback: encode then take first id
        eos_id = tokenizer.encode(eos_str, add_special_tokens=False)[0]

    # Assign pad id (avoid reading missing attrs)
    try:
        tokenizer.pad_token_id = eos_id
    except Exception:
        pass
    try:
        tokenizer.pad_token = eos_str
    except Exception:
        pass

    model.config.pad_token_id = eos_id

ensure_padding(tokenizer, model)

# ───────────────────────────────────────────────────────────────
# FastAPI app
# ───────────────────────────────────────────────────────────────
app = FastAPI(title="Hate Speech Detection API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextIn(BaseModel):
    text: str

@app.get("/")
def root():
    return {"status": "ok", "model_base": loaded_from}

@app.post("/predict")
def predict(payload: TextIn):
    try:
        inputs = tokenizer(
            payload.text,
            return_tensors="pt",
            truncation=True,
            padding="max_length",
            max_length=128,
        )
        with torch.no_grad():
            outputs = model(**inputs)
            probs = torch.softmax(outputs.logits, dim=1)[0]
            pred = int(torch.argmax(probs).item())
        label = "Offensive" if pred == 1 else "Not Offensive"
        confidence = float(round(probs[pred].item(), 4))
        return {"text": payload.text, "prediction": label, "confidence": confidence}
    except Exception as e:
        # Bubble the exact error so you can see it in Swagger
        raise HTTPException(status_code=500, detail=str(e))