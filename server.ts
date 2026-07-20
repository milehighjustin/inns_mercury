import { Hono } from 'hono'
import { generatePdf } from './lib/generatePdf.js'
import { serve } from '@hono/node-server'
import { Server } from 'socket.io'

import validate from './lib/validate.js'
import { mongoClient } from './lib/db.js'
import { updateRtcDevice } from './lib/updateRtcDevice.js'
import { getAllRtcDevices } from './lib/getAllRtcDevices.js'
// 1. Initialize Hono
const app = new Hono()

// Standard API Routes
app.get('/api/health', async (c) => {
    const html = '<h1>Memory Save PDF is healthy</h1>';
    const pdfContent = await generatePdf(html);

    if(!pdfContent.success){
        return c.json({success: false, error: pdfContent.error}, 500)
    }
    const responseBody = pdfContent.pdf as unknown as BodyInit;
    return new Response(responseBody, {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename=test.pdf'
        }
    });
})

app.post('/api/data', async (c) => {
  const body = await c.req.json()
  return c.json({ message: 'Data received', data: body })
})

// 2. Start the Node Server
const port = 3075
const server = serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})

// 3. Attach Socket.io to the HTTP Server
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this for production security
    methods: ["GET", "POST"]
  }
})

// 4. Handle Socket.io Connections
io.on('connection', async (socket) => {
    const validated = validate(socket.handshake.headers.token as string)
    if(!validated){
        socket.disconnect(true)
        return
    }
    if(validated.type == 'operator'){
    }
    else if(validated.type == 'kiosk'){
        await updateRtcDevice(validated.rtcDeviceId, {socketId: socket.id})
    }
    const allDevices = await getAllRtcDevices()
    const connectedSockets = Array.from(io.sockets.sockets.keys())
    const deviceList = allDevices.map((device) => {
        return {
            name: device.name,
            rtcDeviceId: device._id,
            socketId: device.socketId,
            status: connectedSockets.includes(device.socketId) ? 'connected' : 'disconnected',
        }
    })

    io.emit('devicesRefresh', JSON.stringify(deviceList))

    socket.on("initRtcDevice", (data) => {
        socket.to(`${data.connectSocketId}`).emit("initializeConnection", JSON.stringify({connectSocketId: socket.id}));
    });

    socket.on("rtcDeviceInitialized", (data) => {
        socket.to(`${data.connectSocketId}`).emit("rtcDeviceInitialized", JSON.stringify({connectSocketId: socket.id}));
    });

    socket.on("iceCandidate", (data) => {
        socket.to(`${data.connectSocketId}`).emit("incomingIce", JSON.stringify({connectSocketId: socket.id, candidate: data.candidate}));
    });

    socket.on("offerCreated", (data) => {
        socket.to(`${data.connectSocketId}`).emit("offerAvailable", JSON.stringify({connectSocketId: socket.id, offer: data.offer}));
    });

    socket.on("answerCreated", (data) => {
        socket.to(`${data.connectSocketId}`).emit("answerAvailable", JSON.stringify({connectSocketId: socket.id, answer: data.answer}));
    });


    socket.on("partnerError", (data) => {
        socket.to(`${data.connectSocketId}`).emit("partnerError", JSON.stringify({connectSocketId: socket.id, error: data.error}));
    });

    socket.on("enableScreenshareDisplay", (data) => {
        socket.to(`${data.connectSocketId}`).emit("enableScreenshareDisplay", JSON.stringify({connectSocketId: socket.id}));
    });

    socket.on("partnerFocus", (data) => {
        socket.to(`${data.connectSocketId}`).emit("partnerFocus", JSON.stringify({connectSocketId: socket.id}));
    });

    socket.on("selfFocus", (data) => {
        socket.to(`${data.connectSocketId}`).emit("selfFocus", JSON.stringify({connectSocketId: socket.id}));
    });

    socket.on("callOnHold", (data) => {
        socket.to(`${data.connectSocketId}`).emit("callOnHold", JSON.stringify({connectSocketId: socket.id, hold: data.hold}));
    });

    socket.on("resetYourself", (data) => {
        socket.to(`${data.connectSocketId}`).emit("resetYourself", JSON.stringify({connectSocketId: socket.id}));
    });

    socket.on("disconnect", async () => {
        socket.emit('rtcDeviceDisconnected', JSON.stringify({
        socketId: socket.id,
        }));
        const allDevices = await getAllRtcDevices()
        const connectedSockets = Array.from(io.sockets.sockets.keys())
        const deviceList = allDevices.map((device) => {
            return {
                name: device.name,
                rtcDeviceId: device._id,
                socketId: device.socketId,
                status: connectedSockets.includes(device.socketId) ? 'connected' : 'disconnected',
            }
        })
        io.emit('devicesRefresh', JSON.stringify(deviceList))
    });
})
