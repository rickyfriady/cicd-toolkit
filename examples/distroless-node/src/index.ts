import http from 'node:http';

const port = process.env.PORT || 3000;

const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'healthy', runtime: 'distroless-node' }));
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
