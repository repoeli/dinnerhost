from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests

app = Flask(__name__)
CORS(app)

UNSPLASH_ACCESS_KEY = os.environ.get("UNSPLASH_ACCESS_KEY")

@app.route('/')
def health():
    return jsonify({"status": "healthy", "message": "Unsplash Proxy API is running"})

@app.route('/search')
def search():
    try:
        # Get query parameters
        query = request.args.get('query', 'nature')  # Changed from 'q' to 'query'
        per_page = request.args.get('per_page', '12')
        orientation = request.args.get('orientation', '')
        
        # Build URL
        url = f"https://api.unsplash.com/search/photos?query={query}&per_page={per_page}&client_id={UNSPLASH_ACCESS_KEY}"
        if orientation:
            url += f"&orientation={orientation}"
        
        # Make request to Unsplash API
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        return jsonify(response.json())
        
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"API request failed: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
