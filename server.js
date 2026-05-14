const express = require(“express”);
const fs = require(“fs”);
const app = express();
app.use(express.json());

const DATA_FILE = “keys.json”;

// keys.json Format:
// {
//   “hi”: { “usedBy”: “MoonBunny”, “expiresAt”: 1747123456 },
//   “vip”: null
// }

function loadData() {
if (!fs.existsSync(DATA_FILE)) {
fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}
return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data) {
fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ================================================
// GET /check?key=hi&user=MoonBunny
// Prüft ob ein Key gültig ist und gibt die Zeit zurück
// ================================================
app.get(”/check”, (req, res) => {
const key = (req.query.key || “”).toLowerCase().trim();
const user = (req.query.user || “”).toLowerCase().trim();

```
if (!key || !user) {
    return res.json({ status: "error", message: "Fehlende Parameter" });
}

const data = loadData();

// Key existiert nicht
if (!(key in data)) {
    return res.json({ status: "invalid", message: "Key existiert nicht" });
}

const entry = data[key];
const now = Math.floor(Date.now() / 1000);

// Key noch nie benutzt
if (!entry) {
    return res.json({ status: "free", message: "Key ist frei" });
}

// Key wurde schon benutzt
const isExpired = now >= entry.expiresAt;
const isSameUser = entry.usedBy === user;

if (isSameUser) {
    if (isExpired) {
        // Selber User, aber abgelaufen → nie wieder
        return res.json({ status: "expired_permanent", message: "Du hast diesen Key bereits verbraucht!" });
    } else {
        // Selber User, noch gültig → Countdown zurückgeben
        const remaining = entry.expiresAt - now;
        return res.json({ status: "active", remaining: remaining, message: "Key aktiv" });
    }
} else {
    if (isExpired) {
        // Anderer User, Zeit abgelaufen → Key ist wieder frei
        return res.json({ status: "free", message: "Key ist wieder verfügbar" });
    } else {
        // Anderer User, noch aktiv → gesperrt
        return res.json({ status: "in_use", message: "Key wird bereits verwendet!" });
    }
}
```

});

// ================================================
// POST /activate { “key”: “hi”, “user”: “MoonBunny”, “seconds”: 120 }
// Aktiviert einen Key für einen User
// ================================================
app.post(”/activate”, (req, res) => {
const key = (req.body.key || “”).toLowerCase().trim();
const user = (req.body.user || “”).toLowerCase().trim();
const seconds = parseInt(req.body.seconds) || 0;

```
if (!key || !user || seconds <= 0) {
    return res.json({ status: "error", message: "Fehlende Parameter" });
}

const data = loadData();

if (!(key in data)) {
    return res.json({ status: "invalid", message: "Key existiert nicht" });
}

const now = Math.floor(Date.now() / 1000);
data[key] = {
    usedBy: user,
    expiresAt: now + seconds
};

saveData(data);
return res.json({ status: "ok", expiresAt: data[key].expiresAt });
```

});

// ================================================
// POST /addkey { “key”: “vip2”, “secret”: “DEIN_PASSWORT” }
// Fügt einen neuen Key hinzu (nur du kannst das)
// ================================================
app.post(”/addkey”, (req, res) => {
const secret = req.body.secret || “”;
const key = (req.body.key || “”).toLowerCase().trim();

```
// ÄNDERE DAS PASSWORT HIER!
if (secret !== "DEIN_GEHEIMES_PASSWORT_HIER") {
    return res.status(403).json({ status: "forbidden" });
}

if (!key) {
    return res.json({ status: "error", message: "Kein Key angegeben" });
}

const data = loadData();
data[key] = null; // null = noch nie benutzt
saveData(data);

return res.json({ status: "ok", message: `Key '${key}' hinzugefügt` });
```

});

// ================================================
// GET /keys?secret=PASSWORT
// Zeigt alle Keys an
// ================================================
app.get(”/keys”, (req, res) => {
if (req.query.secret !== “DEIN_GEHEIMES_PASSWORT_HIER”) {
return res.status(403).json({ status: “forbidden” });
}
return res.json(loadData());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));