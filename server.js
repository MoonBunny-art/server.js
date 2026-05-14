const express = require(‘express’);
const fs = require(‘fs’);
const app = express();
app.use(express.json());

const DATA_FILE = ‘keys.json’;

function loadData() {
if (!fs.existsSync(DATA_FILE)) {
fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}
return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data) {
fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get(’/check’, function(req, res) {
var key = (req.query.key || ‘’).toLowerCase().trim();
var user = (req.query.user || ‘’).toLowerCase().trim();

```
if (!key || !user) {
    return res.json({ status: 'error', message: 'Fehlende Parameter' });
}

var data = loadData();

if (!(key in data)) {
    return res.json({ status: 'invalid', message: 'Key existiert nicht' });
}

var entry = data[key];
var now = Math.floor(Date.now() / 1000);

if (!entry) {
    return res.json({ status: 'free', message: 'Key ist frei' });
}

var isExpired = now >= entry.expiresAt;
var isSameUser = entry.usedBy === user;

if (isSameUser) {
    if (isExpired) {
        return res.json({ status: 'expired_permanent', message: 'Du hast diesen Key bereits verbraucht!' });
    } else {
        var remaining = entry.expiresAt - now;
        return res.json({ status: 'active', remaining: remaining, message: 'Key aktiv' });
    }
} else {
    if (isExpired) {
        return res.json({ status: 'free', message: 'Key ist wieder verfuegbar' });
    } else {
        return res.json({ status: 'in_use', message: 'Key wird bereits verwendet!' });
    }
}
```

});

app.get(’/activate’, function(req, res) {
var key = (req.query.key || ‘’).toLowerCase().trim();
var user = (req.query.user || ‘’).toLowerCase().trim();
var seconds = parseInt(req.query.seconds) || 0;

```
if (!key || !user || seconds <= 0) {
    return res.json({ status: 'error', message: 'Fehlende Parameter' });
}

var data = loadData();

if (!(key in data)) {
    return res.json({ status: 'invalid', message: 'Key existiert nicht' });
}

var now = Math.floor(Date.now() / 1000);
data[key] = {
    usedBy: user,
    expiresAt: now + seconds
};

saveData(data);
return res.json({ status: 'ok', expiresAt: data[key].expiresAt });
```

});

app.get(’/addkey’, function(req, res) {
var secret = req.query.secret || ‘’;
var key = (req.query.key || ‘’).toLowerCase().trim();

```
if (secret !== 'BuildABoat') {
    return res.status(403).json({ status: 'forbidden' });
}

if (!key) {
    return res.json({ status: 'error', message: 'Kein Key angegeben' });
}

var data = loadData();
data[key] = null;
saveData(data);

return res.json({ status: 'ok', message: 'Key hinzugefuegt: ' + key });
```

});

app.get(’/keys’, function(req, res) {
if (req.query.secret !== ‘BuildABoat’) {
return res.status(403).json({ status: ‘forbidden’ });
}
return res.json(loadData());
});

var PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
console.log(’Server laeuft auf Port ’ + PORT);
});
