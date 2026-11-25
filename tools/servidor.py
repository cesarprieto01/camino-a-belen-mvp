# Servidor local del MVP (npm run dev): sirve public/ en el puerto 5190 diciéndole al navegador que no guarde nada,
# así cada recarga trae lo último (pantallas, JS, imágenes y audio). Con http.server a secas Chrome guardaba las
# pantallas y los .js un rato y se veía la versión anterior.
import functools, http.server, os, sys

PUERTO = int(sys.argv[1]) if len(sys.argv) > 1 else 5190
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public')

class SinGuardar(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, *a):
        pass

http.server.ThreadingHTTPServer.allow_reuse_address = True
http.server.ThreadingHTTPServer(('', PUERTO), functools.partial(SinGuardar, directory=RAIZ)).serve_forever()
