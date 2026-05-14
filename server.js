var express = require(‘express’);
var fs = require(‘fs’);
var app = express();
app.use(express.json());

function load() {
if (!fs.existsSync(‘keys.json’)) fs.writeFileSync(‘keys.json’, ‘{}’);
return JSON.parse(fs.readFileSync(‘keys.json’));
}

function save(d) {
fs.writeFileSync(‘keys.json’, JSON.stringify(d));
}

app.get(’/check’, function(req, res) {
var key = String(req.query.key || ‘’).toLowerCase().trim();
var user = String(req.query.user || ‘’).toLowerCase().trim();
if (!key || !user) return res.json({status:‘error’});
var d = load();
if (!(key in d)) return res.json({status:‘invalid’});
var e = d[key];
var now = Math.floor(Date.now() / 1000);
if (!e) return res.json({status:‘free’});
var expired = now >= e.expiresAt;
var same = e.usedBy === user;
if (same && expired) return res.json({status:‘expired_permanent’});
if (same && !expired) return res.json({status:‘active’, remaining: e.expiresAt - now});
if (!same && expired) return res.json({status:‘free’});
return res.json({status:‘in_use’});
});

app.get(’/activate’, function(req, res) {
var key = String(req.query.key || ‘’).toLowerCase().trim();
var user = String(req.query.user || ‘’).toLowerCase().trim();
var sec = parseInt(req.query.seconds) || 0;
if (!key || !user || sec <= 0) return res.json({status:‘error’});
var d = load();
if (!(key in d)) return res.json({status:‘invalid’});
var now = Math.floor(Date.now() / 1000);
d[key] = {usedBy: user, expiresAt: now + sec};
save(d);
return res.json({status:‘ok’});
});

app.get(’/addkey’, function(req, res) {
var secret = String(req.query.secret || ‘’);
var key = String(req.query.key || ‘’).toLowerCase().trim();
if (secret !== ‘MEINPASSWORT’) return res.status(403).json({status:‘forbidden’});
if (!key) return res.json({status:‘error’});
var d = load();
d[key] = null;
save(d);
return res.json({status:‘ok’, key: key});
});

app.get(’/keys’, function(req, res) {
var secret = String(req.query.secret || ‘’);
if (secret !== ‘MEINPASSWORT’) return res.status(403).json({status:‘forbidden’});
return res.json(load());
});

var PORT = process.env.PORT || 3000;
app.listen(PORT, function() { console.log(’running on ’ + PORT); });
