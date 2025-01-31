import { Socket } from "socket.io";
import { io } from "..";
import { PerPlexed } from "../types";
import { CheckPlexUser } from "./plex";
import crypto from 'crypto';

console.log(`SYNC is ${io ? 'enabled' : 'disabled'}`);

io?.of('/').adapter.on('create-room', (room) => {
    console.log(`SYNC room created: ${room}`);
});

io?.of('/').adapter.on('delete-room', (room) => {
    console.log(`SYNC room deleted: ${room}`);
});

io?.of('/').adapter.on('join-room', (room, id) => {
    console.log(`SYNC [${id}] joined room: ${room}`);
})

io?.of('/').adapter.on('leave-room', (room, id) => {    
    console.log(`SYNC [${id}] left room: ${room}`);
})

io?.on('connection', async (socket) => {
    console.log(`SYNC [${socket.id}] connected`);

    if(!socket.handshake.query.room || typeof socket.handshake.query.room !== 'string') {
        console.log(`SYNC [${socket.id}] disconnected: no room provided`);
        socket.emit("conn-error", {
            type: 'invalid_room',
            message: 'No room provided'
        } satisfies PerPlexed.Sync.SocketError);
        return setTimeout(() => socket.disconnect(), 1000);
    }

    if(!socket.handshake.auth.token) {
        console.log(`SYNC [${socket.id}] disconnected: no token provided`);
        socket.emit("conn-error", {
            type: 'invalid_auth',
            message: 'No token provided'
        } satisfies PerPlexed.Sync.SocketError);
        return setTimeout(() => socket.disconnect(), 1000);
    }

    const user = await CheckPlexUser(socket.handshake.auth.token);
    if(!user) {
        console.log(`SYNC [${socket.id}] disconnected: invalid token`);
        socket.emit("conn-error", {
            type: 'invalid_auth',
            message: 'Invalid token'
        } satisfies PerPlexed.Sync.SocketError);
        return setTimeout(() => socket.disconnect(), 1000);
    }

    socket.data.user = user;

    console.log(`SYNC [${socket.id}] authenticated as ${user.friendlyName}`);

    const isHost = socket.handshake.query.room === 'new'
    if(isHost) {
        socket.handshake.query.room = GenerateRoomID();
        console.log(`SYNC [${socket.id}] generated new room ID: ${socket.handshake.query.room}`);
    } else if(!io?.sockets.adapter.rooms.has(socket.handshake.query.room)) {
        console.log(`SYNC [${socket.id}] disconnected: invalid room`);
        socket.emit("conn-error", {
            type: 'invalid_room',
            message: 'Invalid room'
        } satisfies PerPlexed.Sync.SocketError);
        return setTimeout(() => socket.disconnect(), 1000);
    }

    const room = socket.handshake.query.room;

    socket.join(socket.handshake.query.room);

    socket.emit('ready', {
        room: socket.handshake.query.room,
        host: isHost
    } satisfies PerPlexed.Sync.Ready);

    io?.to(room).emit('EVNT_USER_JOIN', {
        uid: user.uuid,
        socket: socket.id,
        name: user.friendlyName,
        avatar: user.thumb
    } satisfies PerPlexed.Sync.Member);

    AddEvents(socket, isHost, room);

    socket.on('disconnect', () => {
        console.log(`SYNC [${socket.id}] disconnected`);

        // if host, delete room and disconnect all clients
        if(isHost) {
            io?.to(room).emit('conn-error', {
                type: 'host_disconnect',
                message: 'Host disconnected'
            } satisfies PerPlexed.Sync.SocketError);

            const clients = io?.sockets.adapter.rooms.get(room);
            if(clients) {
                clients.forEach(client => {
                    io?.sockets.sockets.get(client)?.disconnect();
                });
            }
        } else {
            io?.to(room).emit('EVNT_USER_LEAVE', {
                uid: user.uuid,
                socket: socket.id,
                name: user.friendlyName,
                avatar: user.thumb
            } satisfies PerPlexed.Sync.Member);
        }
    });
})

function AddEvents(socket: Socket, isHost: boolean, room: string) {
    const user = socket.data.user as PerPlexed.PlexTV.User;

    socket.onAny((event, ...args) => {
        if(!event.startsWith('SYNC_')) return;

        console.log(`SYNC [${socket.id}] emitting HOST ${event} to ${room}`);
        io?.to(room).emit(`HOST_${event}`, ...args);
    });

    socket.onAny((event, ...args) => {
        if(!isHost) return;
        if(!event.startsWith('RES_')) return;

        console.log(`SYNC [${socket.id}] emitting ${event} to ${room}`);
        io?.to(room).emit(`${event}`, {
            uid: user.uuid,
            socket: socket.id,
            name: user.friendlyName,
            avatar: user.thumb
        } satisfies PerPlexed.Sync.Member, ...args);
    });

    socket.onAny((event, ...args) => {
        if(!event.startsWith("EVNT_")) return; 

        console.log(`SYNC [${socket.id}] emitting EVENT ${event} to ${room}`);
        io?.to(room).emit(`${event}`, {
            uid: user.uuid,
            socket: socket.id,
            name: user.friendlyName,
            avatar: user.thumb
        } satisfies PerPlexed.Sync.Member, ...args);
    })
        
}

function GenerateRoomID() {
    let id: string | null = null;
    let i = 0;

    do {
        id = crypto.randomBytes(3).toString('hex');
        i++;
    } while(io?.sockets.adapter.rooms.has(id) || !id || i > 10);

    if(!id) throw new Error('Failed to generate room ID');

    return id;
}