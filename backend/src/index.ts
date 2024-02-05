import express from 'express';

const app = express();

app.use(express.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    next();
});


app.get('/server', (req, res) => {
    res.send(process.env.PLEX_SERVER);
});

app.use(express.static('www'));

app.use((req, res) => {
    res.sendFile('index.html', { root: 'www' });
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});