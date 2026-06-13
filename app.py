from flask import Flask, request, jsonify
import datetime
import os
import requests
import hmac
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Configure Flask to serve static files from the current directory
app = Flask(__name__, static_folder='.', static_url_path='')

app.config['MAX_CONTENT_LENGTH'] = 16 * 1024  # 16 KB max for this app
limiter = Limiter(get_remote_address, app=app, default_limits=["5 per minute"])

@app.after_request
def set_security_headers(response):
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' cdnjs.cloudflare.com; "
        "style-src 'self' 'unsafe-inline' fonts.googleapis.com cdnjs.cloudflare.com; "
        "font-src fonts.gstatic.com cdnjs.cloudflare.com; "
        "img-src 'self' data:;"
    )
    return response

@app.route('/')
def index():
    # Serve index.html from the root folder
    return app.send_static_file('index.html')

def update_gist(log_entry):
    gist_id = os.environ.get("GIST_ID")
    pat = os.environ.get("GITHUB_PAT")
    
    if not gist_id or not pat:
        return False
        
    headers = {
        "Authorization": f"token {pat}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    # 1. Get current gist content
    url = f"https://api.github.com/gists/{gist_id}"
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"Failed to fetch gist: {response.text}")
        return False
        
    gist_data = response.json()
    files = gist_data.get('files', {})
    
    # Assume the file is named visitors.txt
    filename = "visitors.txt"
    current_content = ""
    if filename in files:
        current_content = files[filename].get("content", "")
    else:
        # If visitors.txt doesn't exist in the gist, use the first file available
        if files:
            filename = list(files.keys())[0]
            current_content = files[filename].get("content", "")
            
    # 2. Append new entry
    new_content = current_content + log_entry + "\n"
    
    # 3. Update gist
    patch_data = {
        "files": {
            filename: {
                "content": new_content
            }
        }
    }
    patch_resp = requests.patch(url, headers=headers, json=patch_data)
    if patch_resp.status_code == 200:
        return True
    else:
        print(f"Failed to update gist: {patch_resp.text}")
        return False

@app.route('/api/visit', methods=['POST'])
@limiter.limit("3 per minute")
def visit():
    data = request.json
    if not data or 'name' not in data:
        return jsonify({"status": "error", "message": "Name is required"}), 400
        
    name = data['name'].strip().replace('\n', ' ').replace('\r', ' ')
    message = data.get('message', '').strip().replace('\n', ' ').replace('\r', ' ')
    
    if not name:
        return jsonify({"status": "error", "message": "Name cannot be empty"}), 400
        
    if len(name) > 100:
        return jsonify({"status": "error", "message": "Name is too long"}), 400
    if len(message) > 500:
        return jsonify({"status": "error", "message": "Message is too long"}), 400

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    log_line = f"[{timestamp}] {name}"
    if message:
        log_line += f" - Message: {message}"
        
    try:
        # Save to GitHub Gist only
        if not update_gist(log_line):
            print("Failed to save to cloud gist. Please check GIST_ID and GITHUB_PAT configuration.")
            return jsonify({"status": "error", "message": "Failed to save. Please try again later."}), 500
            
        return jsonify({"status": "success", "message": f"Thanks for the message, {name}!"})
    except Exception as e:
        print(f"Error processing visitor: {e}")
        return jsonify({"status": "error", "message": "Failed to save visitor data"}), 500

@app.route('/logs')
def view_logs():
    # Retrieve the secret key from Render environment variables
    admin_secret = os.environ.get("ADMIN_SECRET_KEY")
    if not admin_secret:
        return "Admin endpoint not configured.", 503
    
    secret_key = request.args.get('key')
    if not hmac.compare_digest(secret_key or '', admin_secret):
        return "Unauthorized", 401
        
    gist_id = os.environ.get("GIST_ID")
    pat = os.environ.get("GITHUB_PAT")
    
    if not gist_id or not pat:
        return "GIST_ID or GITHUB_PAT not configured.", 500
    
    # Fetch from Gist strictly
    headers = {
        "Authorization": f"token {pat}",
        "Accept": "application/vnd.github.v3+json"
    }
    url = f"https://api.github.com/gists/{gist_id}"
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        gist_data = response.json()
        files = gist_data.get('files', {})
        filename = "visitors.txt" if "visitors.txt" in files else (list(files.keys())[0] if files else None)
        
        if filename:
            content = files[filename].get("content", "Empty log.")
            return content, 200, {'Content-Type': 'text/plain; charset=utf-8'}
        else:
            return "No files found in Gist.", 200
    else:
        return f"Error fetching Gist: {response.text}", 500

if __name__ == '__main__':
    app.run(debug=False, port=5000)
