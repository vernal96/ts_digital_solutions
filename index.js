// === backend: express-server/index.js ===
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
    const { offset = 0, limit = 20, q = '' } = req.query;
    let filtered = STATE.order;

    if (q) {
        filtered = filtered.filter((id) => id.toString().includes(q));
    }

    const slice = filtered.slice(+offset, +offset + +limit);
    res.json({ items: slice, total: filtered.length, selected: [...STATE.selected] });
});

app.post('/select', (req, res) => {
    const { ids } = req.body;
    ids.forEach((id) => STATE.selected.add(id));
    res.sendStatus(200);
});

app.post('/deselect', (req, res) => {
    const { ids } = req.body;
    ids.forEach((id) => STATE.selected.delete(id));
    res.sendStatus(200);
});

app.post('/reorder', (req, res) => {
    const { newOrder } = req.body;
    STATE.order = newOrder;
    res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// === frontend: src/App.jsx ===
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const ItemType = 'ROW';

const Row = ({ item, index, moveRow, selected, toggleSelect }) => {
    const [, ref] = useDrop({
        accept: ItemType,
        hover: (dragged) => {
            if (dragged.index !== index) {
                moveRow(dragged.index, index);
                dragged.index = index;
            }
        },
    });

    const [, drag] = useDrag({
        type: ItemType,
        item: { index },
    });

    return (
        <div ref={(node) => drag(ref(node))} style={{ display: 'flex', padding: 8, borderBottom: '1px solid #ccc' }}>
            <input type="checkbox" checked={selected} onChange={() => toggleSelect(item)} />
            <div style={{ marginLeft: 8 }}>{item}</div>
        </div>
    );
};

function App() {
    const [items, setItems] = useState([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(new Set());

    const loadItems = async (reset = false) => {
        const res = await axios.get('https://ts-digital-solutions.onrender.com/items', {
            params: { offset: reset ? 0 : offset, limit: 20, q: query },
        });
        if (reset) {
            setItems(res.data.items);
            setOffset(20);
        } else {
            setItems((prev) => [...prev, ...res.data.items]);
            setOffset((prev) => prev + 20);
        }
        setHasMore(res.data.items.length === 20);
        setSelected(new Set(res.data.selected));
    };

    useEffect(() => { loadItems(true); }, [query]);

    const toggleSelect = async (id) => {
        const updated = new Set(selected);
        if (selected.has(id)) {
            updated.delete(id);
            await axios.post('https://ts-digital-solutions.onrender.com/deselect', { ids: [id] });
        } else {
            updated.add(id);
            await axios.post('https://ts-digital-solutions.onrender.com/select', { ids: [id] });
        }
        setSelected(updated);
    };

    const moveRow = useCallback((from, to) => {
        const updated = [...items];
        const [moved] = updated.splice(from, 1);
        updated.splice(to, 0, moved);
        setItems(updated);
        axios.post('https://ts-digital-solutions.onrender.com/reorder', { newOrder: updated });
    }, [items]);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop === clientHeight && hasMore) {
            loadItems();
        }
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div style={{ maxHeight: 600, overflow: 'auto' }} onScroll={handleScroll}>
                <input placeholder="Поиск..." onChange={(e) => setQuery(e.target.value)} style={{ width: '100%', padding: 8 }} />
                {items.map((item, i) => (
                    <Row
                        key={item}
                        item={item}
                        index={i}
                        moveRow={moveRow}
                        selected={selected.has(item)}
                        toggleSelect={toggleSelect}
                    />
                ))}
            </div>
        </DndProvider>
    );
}

export default App;
