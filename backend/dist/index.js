"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    next();
});
app.get('/server', (req, res) => {
    res.send(process.env.PLEX_SERVER);
});
app.use(express_1.default.static('www'));
app.use((req, res) => {
    res.sendFile('index.html', { root: 'www' });
});
app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
