import http.server
import socketserver
import os

PORT = 3456
DIRECTORY = "dist"

class SPAServer(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def do_GET(self):
        # Try to serve the file
        path = self.translate_path(self.path)
        if not os.path.exists(path) or os.path.isdir(path):
            # Fallback to index.html for SPA routes
            self.path = '/index.html'
        return super().do_GET()

with socketserver.TCPServer(("", PORT), SPAServer) as httpd:
    print(f"Serving SPA at http://localhost:{PORT}")
    httpd.serve_forever()
