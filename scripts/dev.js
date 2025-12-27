const { spawn } = require('child_process');
const net = require('net');

/**
 * Finds an available port.
 * @param {number} startPort The port to try first. If 0, it will pick any available port.
 * @returns {Promise<number>}
 */
function findFreePort(startPort) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(startPort, () => {
            const { port } = server.address();
            server.close(() => resolve(port));
        });
        server.on('error', () => {
            // If startPort is busy, try a random one by passing 0
            const randomServer = net.createServer();
            randomServer.listen(0, () => {
                const { port } = randomServer.address();
                randomServer.close(() => resolve(port));
            });
        });
    });
}

async function main() {
    console.log('Finding available ports...');

    // Try to use preferred ports 3001 and 5173, but fallback to random ones if busy
    const serverPort = await findFreePort(3001);
    const clientPort = await findFreePort(5173);

    console.log(`> Server will run on port: ${serverPort}`);
    console.log(`> Client will run on port: ${clientPort}`);

    const env = {
        ...process.env,
        PORT: serverPort.toString(),
        VITE_API_PORT: serverPort.toString(),
        VITE_PORT: clientPort.toString(),
        GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || `http://localhost:${serverPort}/api/google-photos/auth/callback`,
    };

    // Run concurrently
    const child = spawn('npx', [
        'concurrently',
        '-n', 'server,client',
        '-c', 'blue,green',
        '--kill-others', // Kill both if one fails
        'npm run dev:server',
        'npm run dev:client'
    ], {
        env,
        stdio: 'inherit',
        shell: true
    });

    child.on('exit', (code) => {
        process.exit(code || 0);
    });
}

main().catch((err) => {
    console.error('Failed to start dev server:', err);
    process.exit(1);
});
