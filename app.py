from flask import Flask, request, jsonify
import datetime
import os
import requests

# Configure Flask to serve static files from the current directory
app = Flask(__name__, static_folder='.', static_url_path='')

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
def visit():
    data = request.json
    if not data or 'name' not in data:
        return jsonify({"status": "error", "message": "Name is required"}), 400
        
    name = data['name'].strip()
    message = data.get('message', '').strip()
    
    if not name:
        return jsonify({"status": "error", "message": "Name cannot be empty"}), 400

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    log_line = f"[{timestamp}] {name}"
    if message:
        log_line += f" - Message: {message}"
        
    try:
        # Save to GitHub Gist only
        if not update_gist(log_line):
            return jsonify({"status": "error", "message": "Failed to save to cloud gist. Please check GIST_ID and GITHUB_PAT configuration."}), 500
            
        return jsonify({"status": "success", "message": f"Thanks, {name}! Your message has been recorded. 👋"})
    except Exception as e:
        print(f"Error processing visitor: {e}")
        return jsonify({"status": "error", "message": "Failed to save visitor data"}), 500

@app.route('/logs')
def view_logs():
    # Retrieve the secret key from Render environment variables
    admin_secret = os.environ.get("ADMIN_SECRET_KEY", "please_configure_in_render")
    
    secret_key = request.args.get('key')
    if secret_key != admin_secret:
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
    app.run(debug=True, port=5000)
