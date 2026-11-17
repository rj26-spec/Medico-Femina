import http.server
import socketserver
import json
import webbrowser
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class MedicoFeminaHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        if self.path == '/favicon.ico':
            self.send_response(204)
            self.end_headers()
            return
        super().do_GET()

    def do_POST(self):
        # Gracefully handle POST requests (e.g. /api/report from extensions or analytics)
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 0:
            _ = self.rfile.read(content_length)
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        response = json.dumps({'status': 'success', 'message': 'Endpoint processed successfully'}).encode('utf-8')
        self.wfile.write(response)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def end_headers(self):
        # Enable caching-friendly & CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, must-revalidate')
        super().end_headers()

def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("", PORT), MedicoFeminaHandler) as httpd:
            print(f"==================================================")
            print(f"✨ Medico Femina Server live at: http://localhost:{PORT}")
            print(f"📂 Serving root: {DIRECTORY}")
            print(f"==================================================")
            sys.stdout.flush()
            
            # Automatically open browser
            try:
                webbrowser.open(f"http://localhost:{PORT}")
            except Exception as e:
                print(f"Note: Could not auto-launch browser ({e}). Please open http://localhost:{PORT}")
            
            httpd.serve_forever()
    except OSError as e:
        print(f"Port {PORT} is already in use or error: {e}")
        # Try port 8080 if 8000 is occupied
        alt_port = 8080
        with socketserver.TCPServer(("", alt_port), MedicoFeminaHandler) as httpd:
            print(f"✨ Medico Femina Server live on alternate port: http://localhost:{alt_port}")
            sys.stdout.flush()
            try:
                webbrowser.open(f"http://localhost:{alt_port}")
            except Exception:
                pass
            httpd.serve_forever()

if __name__ == '__main__':
    run_server()
