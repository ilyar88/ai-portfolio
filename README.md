# Interactive AI Portfolio 🤖

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

Create your own engaging, AI-powered conversation portfolio. This open-source project enables developers to create interactive portfolios where visitors can have meaningful conversations with an AI assistant that knows about your work, experience, and expertise.

## ✨ Key Features

- 🤖 **Interactive AI Assistant**: Engage visitors with personalized, context-aware conversations
- 🚀 **Real-time Streaming**: Fluid, chat-like experience with streaming responses
- 🎨 **Modern UI**: Clean, responsive design focused on conversation
- 🖼️ **Blog Image Gallery**: Browsable gallery of pictures with large arrow controls (see `frontend/public/AI pictures/`)
- 🔄 **Easy to Customize**: Create your own from template and modify for your personal brand
- 🛠 **Modular Architecture**: Built for maintainability and easy extension

## 🏗 Architecture

```mermaid
graph LR
    A[React Frontend] --> B[FastAPI Backend]
    B --> C[LLM Service]
    B --> D[Vector Store]
    B --> E[Redis Cache]
```

### Tech Stack

- **Frontend**: React + Vite, TailwindCSS, Framer Motion
- **Backend**: FastAPI, PostgreSQL + pgvector, Redis


## 🚀 Quick Start

1. Create a new repository from this template and clone it
2. Add your content: edit `frontend/public/config.json`, and drop blog gallery pictures into `frontend/public/AI pictures/` - [Config Setup Guide](frontend/CONFIGURATION.md)
3. Run `docker compose build` then `docker compose up`, and open [http://localhost:3000](http://localhost:3000)
4. Deploy to [fly.io](fly.io) or set up locally - [Backend Setup Guide](backend/README.md)
5. Deploy to [vercel.com](vercel.com) or set up locally - [Frontend Setup Guide](frontend/README.md)


## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


<div align="center">
Made with ❤️ by Alon Trugman
</div>

