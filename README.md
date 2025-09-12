
# HarmonyDB 🎵

**Tagline:** A Spotify-like music library and player with AI-powered natural language queries.

---

## Table of Contents
1. [Project Overview](#project-overview)  
2. [Features](#features)  
3. [Tech Stack](#tech-stack)  
4. [Database Schema](#database-schema)  
5. [Installation](#installation)  
6. [Running the Project](#running-the-project)  
7. [Usage](#usage)  
8. [AI/LLM Integration](#aillm-integration)  
9. [Project Structure](#project-structure)  
10. [Contributing](#contributing)  
11. [License](#license)

---

## Project Overview

**HarmonyDB** is a full-featured music web application designed for users to:

- Upload, organize, and play music tracks.
- Create playlists, like songs, albums, and playlists.
- View listening history and comments.
- Explore artist discographies and genres.
- Interact with an AI-powered assistant that converts natural language queries into SQL commands and fetches results.

The project is built with **Django (backend)**, **React (frontend)**, and **PostgreSQL (database)**. It includes **LLM integration** for natural language querying of the database.

---

## Features

- User authentication and roles (`listener`, `artist`, `admin`)  
- Artist and album management  
- Track upload and streaming  
- Playlists creation and management  
- Favorites and listening history tracking  
- Comments on songs and albums  
- AI-powered query assistant (natural language → SQL → results)  
- Admin logs and actions  
- Genre categorization and multi-genre support  

---

## Tech Stack

- **Backend:** Django, Django REST Framework  
- **Frontend:** React.js, HTML5, CSS3, JavaScript  
- **Database:** PostgreSQL  
- **AI Integration:** OpenRouter / Groq API  
- **File Storage:** Local `MEDIA` directory (for music files, cover images)  
- **Version Control:** Git & GitHub  

---

## Database Schema

- Users (`user_id`, `name`, `email`, `password_hash`, `role`)  
- Artists (`artist_id`, `stage_name`, `bio`, `profile_picture_url`)  
- Albums (`album_id`, `artist_id`, `title`, `release_date`, `cover_url`)  
- Songs (`song_id`, `album_id`, `artist_id`, `genre_id`, `title`, `duration`, `file_url`, `release_date`)  
- Playlists (`playlist_id`, `user_id`, `title`, `is_public`)  
- Playlist_Songs (junction table)  
- Favorites, Listening_History, Comments, Admin_Logs  
- Genres and Track_Genres (M:N)  
- AI_Prompts, AI_Interactions  

> Full ER diagram and cardinalities are included in `/docs` folder.

---

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/harmonydb.git
cd harmonydb
````

2. **Set up Python environment**

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. **Set up PostgreSQL database**

```sql
CREATE DATABASE harmonydb;
CREATE USER harmonyuser WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE harmonydb TO harmonyuser;
```

4. **Configure Django**

* Edit `settings.py` to point to PostgreSQL:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'harmonydb',
        'USER': 'harmonyuser',
        'PASSWORD': 'yourpassword',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

5. **Run migrations**

```bash
python manage.py makemigrations
python manage.py migrate
```

6. **Create superuser**

```bash
python manage.py createsuperuser
```

---

## Running the Project

**Backend**

```bash
python manage.py runserver
```

**Frontend**

```bash
cd frontend
npm install
npm start
```

Open [http://localhost:8000](http://localhost:8000) to access the app.

---

## Usage

* Register or log in as a listener or artist.
* Upload tracks (artists only) and organize into albums.
* Create playlists, like tracks/albums, leave comments.
* Use the AI Chatbox to query the database using natural language.

---

## AI/LLM Integration

* Users can type or speak queries in natural language (e.g., *"Show all songs by Arijit Singh uploaded in 2024"*).
* The prompt is sent to the LLM (OpenRouter / Groq) which returns SQL code.
* Django safely executes the SQL query and returns the results in the UI.
* All AI prompts and interactions are logged in the `ai_prompts` and `ai_interactions` tables.

---

## Project Structure

```
harmonydb/
│
├── harmonydb-backend/
│   ├── manage.py
│   ├── harmonydb/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│
├── harmonydb-frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.tsx
│
├── docs/                 # ER diagrams, schema docs
├── media/                # Uploaded music and cover images
├── requirements.txt
└── README.md
```

---

## Contributing

1. Fork the repository.
2. Create a branch (`git checkout -b feature-name`).
3. Make changes, add tests if needed.
4. Commit (`git commit -m "Add feature"`) and push (`git push origin feature-name`).
5. Open a Pull Request.

---

## License

This project is licensed under the MIT License.

---

**Created by:** Sarwad Hasan Siddiqui
**Course:** Database Systems Laboratory (CSE-3110, KUET)
