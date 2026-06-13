# Mayur Patil | Portfolio

live Url => `https://mayur-portfolio-phvt.onrender.com`

A personal portfolio website and API built using HTML, CSS, JavaScript, and Flask (Python). This application serves the portfolio statically and utilizes a lightweight Flask backend to handle visitor logs and store them securely in a GitHub Gist.

## Features
- **Responsive UI:** Built with raw HTML/CSS/JS for an immersive and interactive user experience.
- **Visitor Log:** Allows visitors to leave a message via a simple API.
- **Cloud Storage:** Stores visitor messages safely in a private GitHub Gist rather than a traditional database.
- **Rate Limiting & Security:** Integrated security headers and rate limiting (via Flask-Limiter) to prevent abuse and spam.

## Prerequisites
To run this project locally, make sure you have the following installed:
- [Python 3.8+](https://www.python.org/downloads/)
- `pip` (Python package manager)
- A GitHub account (to generate a Personal Access Token for the Gist storage)

## Local Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/MaybeUrMayur/Portfolio.git
cd Portfolio
```

### 2. Create a Virtual Environment (Recommended)
```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
Install the required Python packages from the `requirements.txt` file:
```bash
pip install -r requirements.txt
```

### 4. Run the Application
Start the local Flask server:
```bash
python app.py
```
The server should start running at `http://127.0.0.1:5000`. You can open this address in your web browser to view the portfolio.
