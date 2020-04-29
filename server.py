from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import re
from binascii import a2b_base64

rExt = re.compile(r'(?<=\.).+')
rTimeStamp = re.compile(r'(?<=\"timeStamp\":)\s*\d+')
rVote = re.compile(r'(?<=\"voters\":)\s*.+(?=\}$)')
mimeMap = {
  'html': 'text/html',
  'css': 'text/css',
  'js': 'text/javascript',
  'json': 'text/json',
  'txt': 'text/plain',
  'ico': 'image/x-icon',
  'jpg': 'image/jpg',
  'png': 'image/png'
}

class Server(BaseHTTPRequestHandler):
	def _send_headers(self, ext):
		self.send_response(200)
		self.send_header('Content-Type', mimeMap[ext])
		self.end_headers()

	def do_GET(self):
		self.path = '/index.html' if self.path == '/' else self.path
		ext = re.findall(rExt, self.path)[0]
		self._send_headers(ext)
		with open('.' + self.path, 'rb') as file:
			content = file.read()
		self.wfile.write(content)

	def do_POST(self):
		length = int(self.headers['Content-Length'])
		data = str(self.rfile.read(length), 'utf-8')
		print(data)
		req = json.loads(data)

		if req['task'] == 'load_chats':
			with open('./chats.txt', 'rb') as file:
				lines = file.readlines()
			content = ','.join(str(line, 'utf-8') for line in lines)
			req['chats'] = json.loads('[{}]'.format(content))

		elif req['task'] == 'save_chat' or req['task'] == 'save_mms':
			if req['task'] == 'save_mms':
				with open('./bin/i%s.png' % req['timeStamp'], 'wb') as file:
					file.write(a2b_base64(req['imgURL']))
				req['imgURL'] = './bin/i%s.png' % req['timeStamp']
				data = json.dumps(req)

			with open('./chats.txt', 'ab') as file:
				file.write(bytes('{}\n'.format(data), 'utf-8'))

		elif req['task'] == 'save_vote':
			content = ''
			with open('./chats.txt', 'rb') as file:
				lines = file.readlines()
				
				for i in range(len(lines)):
					line = str(lines[i], 'utf-8')
					# print(line)
					t = int(re.findall(rTimeStamp, line)[0].strip())
					
					if int(t) == req['timeStamp']:
						mV = re.search(rVote, line)
						print(mV.group())
						votersList = json.loads(mV.group())
						votersList.append(req['voter'])
						content += line[ : mV.span()[0] ]
						content += json.dumps(votersList) + '}'
						lines[i] = bytes(content + '\n', 'utf-8')

			with open('./chats.txt', 'wb') as file:
				file.writelines(lines)

		self._send_response(json.dumps(req))

	def _send_response(self, resp):
		self._send_headers('txt')
		# print(resp)
		self.wfile.write(bytes(resp, 'utf-8'))

def startServer():
	serverAdd = ('', 8080)
	server = HTTPServer(serverAdd, Server)
	server.serve_forever()

startServer()
