const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const STATE = {
    selected: new Set(),
    order: Array.from({ length: 1000000 }, (_, i) => i + 1),
};

app.get('/items', (req, res) => {
    const offset = +req.query.offset || 0;
    const limit = +req.query.limit || 20;
    const q = req.query.q || '';

    let filtered = STATE.order;
    if (q) filtered = filtered.filter(n => n.toString().includes(q));

    const slice = filtered.slice(offset, offset + limit);
    res.json({ items: slice, total: filtered.length, selected: Array.from(STATE.selected) });
});

app.post('/select', (req, res) => {
    req.body.ids.forEach(id => STATE.selected.add(id));
    res.sendStatus(200);
});

app.post('/deselect', (req, res) => {
    req.body.ids.forEach(id => STATE.selected.delete(id));
    res.sendStatus(200);
});

app.post('/reorder', (req, res) => {
    STATE.order = req.body.newOrder;
    res.sendStatus(200);
});

app.listen(PORT, () => console.log(`✅ Backend listening on port ${PORT}`));