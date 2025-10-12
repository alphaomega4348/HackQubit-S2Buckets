# 🧠 Hate Speech & Offensive Content Detection  

An **AI-powered multilingual content moderation system** integrated within a full-stack social media platform built using the **MERN stack**.  
It detects, flags, and filters out offensive or hateful content in both **text and image posts**, ensuring safer and more responsible digital communication.  

---

## 1️⃣ Problem Statement  

In the real world, **fake information spreads faster than facts — and hate speech often hides inside hashtags**.  
With the rise of user-generated content, social platforms face the growing challenge of moderating millions of posts containing implicit hate, offensive language, or hidden textual toxicity within memes and images.

### The goal is to develop an automated system that can:
- Detect hate and offensive speech across multiple languages.  
- Identify and block images containing toxic or hateful text.  
- Maintain healthy, inclusive, and safe online interactions.

---

## 2️⃣ Proposed Solution  

We developed an **AI-powered Multilingual Content Moderation System** that integrates seamlessly with a social media application.  

### ✨ Key Highlights:
- **Text Moderation** → Uses `XLM-RoBERTa` (Hugging Face) model via FastAPI for multilingual hate and toxicity detection.  
- **Image Moderation** → Utilizes `Tesseract OCR` to extract embedded text from memes and images before AI analysis.  
- **Real-time Blocking** → Posts flagged as “offensive” are automatically blocked from being published.  
- **Cloud Integration** → Non-offensive images are stored securely using `Cloudinary`.  
- **Full-Stack Integration** → MERN app handles post creation, user management, and API communication.  

---

## 3️⃣ System Architecture  

Below is the architecture illustrating how the components interact:

                     ┌──────────────────────────────┐
                     │         Frontend             │
                     │        (React.js)            │
                     │  • User Interface (UI)       │
                     │  • Post Creation / Viewing   │
                     │  • API Requests via Axios    │
                     └──────────────┬───────────────┘
                                    │
                         HTTP / JSON API Calls
                                    │
                     ┌──────────────▼───────────────┐
                     │          Backend             │
                     │   (Node.js + Express)        │
                     │  • REST APIs                 │
                     │  • Authentication (JWT)      │
                     │  • Routing / Validation      │
                     │  • Moderation Trigger        │
                     └──────────────┬───────────────┘
                                    │
                                    │
                     ┌──────────────▼───────────────┐
                     │      ML Moderation API       │
                     │       (FastAPI + Python)     │
                     │  • Text Analysis using        │
                     │    XLM-RoBERTa (HuggingFace) │
                     │  • Image OCR via Tesseract   │
                     │  • Classification: Safe/Off. │
                     └──────────────┬───────────────┘
                                    │
                     ┌──────────────▼───────────────┐
                     │        Cloud Storage         │
                     │         (Cloudinary)         │
                     │  • Stores only safe images   │
                     │  • Returns secure URLs       │
                     └──────────────┬───────────────┘
                                    │
                     ┌──────────────▼───────────────┐
                     │         Database             │
                     │          (MongoDB)           │
                     │  • User Info & Posts         │
                     │  • Comments & Likes          │
                     │  • Moderation Logs           │
                     └──────────────────────────────┘


### 🧩 Components:
- **Frontend:** React.js  
- **Backend:** Node.js + Express  
- **Database:** MongoDB  
- **ML Layer:** FastAPI (Python) + Hugging Face `xlm-roberta-large`  
- **OCR Engine:** Tesseract  
- **Cloud Storage:** Cloudinary  
- **LLM Support:** Gemini (for contextual content analysis)

---

## 4️⃣ Tech Stack  

| Category | Technologies Used |
|-----------|-------------------|
| **Frontend** | React.js, TailwindCSS |
| **Backend** | Node.js, Express.js, Socket.io |
| **Database** | MongoDB |
| **Machine Learning** | FastAPI, XLM-RoBERTa, Tesseract OCR |
| **Cloud Services** | Cloudinary |
| **Languages** | JavaScript, Python |

---

## 5️⃣ Features  

- 📝 Create, read, update, and delete posts  
- ❤️ Like and unlike posts  
- 💬 Nested comments with Markdown support  
- 🔒 JWT-based authentication  
- 💬 Real-time messaging with Socket.io  
- 👤 User profiles with bio & posts  
- 🚀 Infinite scrolling  
- 📊 Sort posts by likes, comments, and date created  
- 🚫 AI-driven profanity & hate speech filtering  
- 🔍 Search posts by title  
- 📱 Fully responsive layout  

---

## 6️⃣ Installation & Setup  

### Step 1: Clone the repository
```bash
git clone https://github.com/Vishal1092003/HackQubit-S2Buckets.git
```

### Step 2: Install dependencies
```bash
cd hate-speech-app  
npm install
cd client
npm install
```

### Step 3: Create a `.env` file in the root directory
```bash
MONGO_URI=<YOUR_MONGO_URI> 
TOKEN_KEY=<YOUR_TOKEN_KEY>
PORT=4000
```

### Step 4: Run the backend server
```bash
npm run server
```

### Step 5: Run the frontend
```bash
cd client
npm start
```

Your app will now be running locally at **http://localhost:3000**

---

## 7️⃣ Repository Link  

**GitHub Repository:**  
👉 [https://github.com/Vishal1092003/HackQubit-S2Buckets.git](https://github.com/Vishal1092003/HackQubit-S2Buckets.git)

---

## 8️⃣ Future Scope  

- 🔍 Integrate fine-tuned LLMs for deeper contextual hate detection.  
- 📊 Add an explainability dashboard for moderation insights.  
- 🌍 Extend support for more regional languages.  
- ☁️ Deploy a public API version for third-party moderation use.  

---

## 9️⃣ Recognition  

🏆 **Winner — HackQubit 2025 (National-level 24-hour Hackathon)**  
Sponsored by **HDFC Bank** and **Izzikitech**.  

This achievement reflects our dedication to leveraging AI for a safer, inclusive, and responsible digital ecosystem.  

---

## 🔟 Quote  

> _“In the real world, fake information spreads faster than facts — and hate speech often hides inside hashtags.”_


