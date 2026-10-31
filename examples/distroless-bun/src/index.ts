const port = process.env.PORT || 3000;

const server = Bun.serve({
  port: Number(port),
  fetch(_req) {
    return new Response(JSON.stringify({ status: 'healthy', runtime: 'distroless-bun' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
});

console.log(`Bun server listening on port ${server.port}`);
