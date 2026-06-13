from flask import Flask, request, jsonify
import datetime

# Configure Flask to serve static files from the current directory
app = Flask(__name__, static_folder='.', static_url_path='')

@app.route('/')
def index():
    # Serve index.html from the root folder
    return app.send_static_file('index.html')

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
    
    try:
        # Append to visitors.txt
        with open('visitors.txt', 'a', encoding='utf-8') as f:
            if message:
                f.write(f"[{timestamp}] {name} - Message: {message}\n")
            else:
                f.write(f"[{timestamp}] {name}\n")
            
        return jsonify({"status": "success", "message": f"Thanks, {name}! Your message has been recorded. 👋"})
    except Exception as e:
        print(f"Error writing to file: {e}")
        return jsonify({"status": "error", "message": "Failed to save visitor data"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
