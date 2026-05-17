# Django Backend Setup

## Database Configuration
- **Database**: MySQL
- **Database Name**: mens_hub_db
- **User**: root
- **Password**: 1127
- **Host**: localhost
- **Port**: 3306

## Setup Instructions

### 1. Create Virtual Environment
```bash
python -m venv venv
venv\Scripts\activate  # On Windows
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Apply Migrations
```bash
python manage.py migrate
```

### 4. Create Superuser (Optional)
```bash
python manage.py createsuperuser
```

### 5. Run Development Server
```bash
python manage.py runserver
```

The Django admin panel will be available at: `http://localhost:8000/admin`

## Project Structure
- `backend_project/` - Django project settings
- `manage.py` - Django management script
- `requirements.txt` - Python dependencies

## MySQL Connection Details
If you need to change the database credentials, edit:
`backend_project/settings.py` - DATABASES configuration
