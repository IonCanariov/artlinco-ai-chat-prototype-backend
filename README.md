# Artlinco AI Chat Prototype — Backend

Backend service for the Artlinco internal AI chat prototype.

This service is responsible for:
- Managing projects and messages
- Persisting chat history in PostgreSQL
- Tracking token usage per project
- Orchestrating AI responses via an n8n workflow
- Acting as the single source of truth for the system

---

##  Tech Stack

- Node.js
- Express.js
- PostgreSQL
- n8n (temporary AI orchestration layer)

---

##  Features

- Project-based chat architecture
- Linear chat per project (no threads)
- User and AI messages stored in database
- Token usage tracking per project
- REST API consumed by a React frontend
- Environment-based configuration (no hard-coded secrets)

---

##  Environment Variables

This project uses environment variables for configuration.



