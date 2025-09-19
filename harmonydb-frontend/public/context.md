

# 🎵 HarmonyDB – Project Context

## 📌 Project Overview

HarmonyDB is a **Spotify-like music library and player web application** with a focus on **database systems concepts** for academic requirements. The app allows users to create accounts, browse and stream music, manage playlists, mark favorites, and interact with an AI assistant that enables **natural language querying of the database**.

The application is designed to demonstrate practical implementations of:

* Database design (ERD, schema, normalization, constraints)
* SQL queries and relational algebra mapping
* Query processing and optimization
* Triggers, stored procedures, and indexing
* Transaction management & concurrency control
* Database security and authorization
* Integration of modern **AI/LLM models** for intelligent query handling

---

## 🖥️ Tech Stack

* **Backend Framework**: Django (Python)
* **Frontend Framework**: React + TailwindCSS + Framer Motion
* **Database**: PostgreSQL (preferred)
* **Authentication**: Django Auth or JWT-based system
* **File Storage**: Filesystem or cloud (with DB storing file paths/URLs)
* **AI Integration**: LLM via OpenRouter or Groq (API call)
* **Deployment**: Ubuntu Linux server (LAMP stack installed, but Django/React will be used)

---

## 🎨 UI/UX Requirements

* Landing page with **hero section** (project name, tagline, get started button).
* Second intro page with **floating glass navbar** and project **features grid**.
* Consistent color palette:

  * `#E23E57`
  * `#88304E`
  * `#522546`
  * `#311D3F`
* Modern responsive design, smooth animations, minimal clutter.

---

## 🗄️ Database Schema (Simplified)

### **Core Tables**

1. **users** – accounts for all users, artists, and admins.
2. **artists** – linked to users, with artist-specific metadata.
3. **albums** – each album belongs to one artist.
4. **songs** – belong to albums and genres, with file URLs.
5. **genres** – classification of songs.
6. **playlists** – user-created playlists.
7. **playlist\_songs** – M\:N junction table between playlists and songs.
8. **favorites** – user’s saved songs, albums, playlists.
9. **listening\_history** – stores play activity.
10. **comments** – users can leave comments on songs/albums.
11. **admin\_logs** – logs admin actions.

### **AI Tables**

12. **ai\_prompts** – stores natural language user prompts, LLM responses, generated SQL, and results.
13. **ai\_interactions** – multi-turn chat support (conversation memory).

---

## 🔗 Cardinalities

* Users ↔ Artists → 1:1
* Users ↔ Playlists → 1\:N
* Users ↔ Favorites → 1\:N
* Users ↔ Listening History → 1\:N
* Users ↔ Comments → 1\:N
* Users ↔ AI Prompts → 1\:N
* Artists ↔ Albums → 1\:N
* Albums ↔ Songs → 1\:N
* Genres ↔ Songs → 1\:N
* Playlists ↔ Songs → M\:N
* Songs ↔ Listening History → 1\:N
* AI Prompts ↔ AI Interactions → 1\:N

---

## 🤖 AI/LLM Integration

* Users can **type or speak natural language queries** (e.g., “Show me my top 5 most played songs this month”).
* The **LLM generates SQL code** as response.
* The system **parses, validates, and executes SQL** safely against PostgreSQL.
* Results are returned to the user in a **friendly formatted response**.
* All interactions are **logged in ai\_prompts and ai\_interactions** for auditing.

---

## 📋 Feature List (MVP)

* ✅ User Authentication (Register/Login/Logout)
* ✅ Music Library (Songs, Albums, Artists, Genres)
* ✅ Playlists (Create, Edit, Add/Remove Songs)
* ✅ Favorites (Mark songs, albums, playlists as favorites)
* ✅ Listening History (Track play events)
* ✅ Comments & Reviews (on songs/albums)
* ✅ Admin Logs (moderation actions logged)
* ✅ AI Queries (prompt → SQL → results)
* ✅ Responsive UI with **React + Tailwind**

---

## 📂 File & Asset Storage

* Music/audio files and album covers will be stored in a **media/ directory** or cloud storage.
* The database stores only **file paths/URLs**, not the binary files.

---

## 🎯 Academic Coverage

This project demonstrates:

* **ER Models, Schema, Normalization, Functional Dependencies**
* **Relational Algebra via SQL Queries**
* **Triggers, Indexing, Constraints**
* **Transaction & Concurrency Control (PostgreSQL)**
* **Security & Authorization (role-based access: user/artist/admin)**
* **Information Retrieval (search by metadata, AI-assisted queries)**
* **Modern AI integration with Databases**


