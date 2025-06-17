const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Генерация данных
const ITEMS = Array.from({ length: 1_000_000 }, (_, i) => ({ id: i + 1, label: `Item ${i + 1}` }));
let state = {
    selected: new Set(),
    order: [...Array(1_000_000).keys()].map(i => i + 1),
};

// Получение данных
app.get('/items', (req, res) => {
    const offset = parseInt(req.query.offset || '0');
    const limit = parseInt(req.query.limit || '20');
    const search = (req.query.search || '').toLowerCase();

    const orderedItems = state.order.map(id => ITEMS[id - 1]);
    const filtered = search ? orderedItems.filter(i => i.label.toLowerCase().includes(search)) : orderedItems;
    const sliced = filtered.slice(offset, offset + limit);
    res.json(sliced);
});

// Получение состояния
app.get('/state/load', (req, res) => {
    res.json({ selected: Array.from(state.selected), order: state.order });
});

// Сохранение состояния
app.post('/state/save', (req, res) => {
    const { selected, order } = req.body;
    state.selected = new Set(selected);
    state.order = order;
    res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));