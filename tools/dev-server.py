"""Serve this game's files and its same-origin classroom API for local QA."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from pathlib import Path
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw): super().__init__(*a,directory=str(Path(__file__).resolve().parents[1]/'game'),**kw)
    def do_POST(self):
        if not self.path.startswith('/room-api/'):
            self.send_error(404);return
        size=int(self.headers.get('content-length','0'))
        if size>4096:self.send_error(413);return
        request=Request('https://classroom-rooms-production.up.railway.app/'+self.path[len('/room-api/'):],data=self.rfile.read(size),method='POST',headers={k:self.headers[k] for k in ['Content-Type','Cookie','Origin'] if k in self.headers})
        try: result=urlopen(request,timeout=15)
        except HTTPError as error: result=error
        except Exception:
            self.send_error(502);return
        body=result.read();self.send_response(result.status)
        for k in ['Content-Type','Set-Cookie','Cache-Control']:
            if result.headers.get(k):self.send_header(k,result.headers[k])
        self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
ThreadingHTTPServer(('127.0.0.1',8765),Handler).serve_forever()
