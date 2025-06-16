import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const ItemType = 'ROW';

const Row = ({ item, index, moveRow, selected, toggle }) => {
    const [, drop] = useDrop({
        accept: ItemType,
        hover: (drag) => {
            if (drag.index !== index) {
                moveRow(drag.index, index);
                drag.index = index;
            }
        }
    });
    const [, drag] = useDrag({
        type: ItemType,
        item: { index }
    });
    return (
        <div ref={node => drag(drop(node))} style={{ display: 'flex', padding: 8, borderBottom: '1px solid #ddd' }}>
            <input type="checkbox" checked={selected} onChange={() => toggle(item)} />
            <span style={{ marginLeft: 8 }}>{item}</span>
        </div>
    );
};

export default function App() {
    const [items, setItems] = useState([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(new Set());

    const load = useCallback(async (reset = false) => {
        const res = await axios.get('/items', {
            params: { offset: reset ? 0 : offset, limit: 20, q: query }
        });
        if (reset) {
            setItems(res.data.items);
            setOffset(20);
        } else {
            setItems(prev => [...prev, ...res.data.items]);
            setOffset(prev => prev + 20);
        }
        setHasMore(res.data.items.length === 20);
        setSelected(new Set(res.data.selected));
    }, [offset, query]);

    useEffect(() => load(true), [query]);

    const toggle = async id => {
        const upd = new Set(selected);
        if (upd.has(id)) {
            upd.delete(id); await axios.post('/deselect', { ids: [id] });
        } else {
            upd.add(id); await axios.post('/select', { ids: [id] });
        }
        setSelected(upd);
    };

    const moveRow = (from, to) => {
        const arr = [...items];
        const [m] = arr.splice(from, 1);
        arr.splice(to, 0, m);
        setItems(arr);
        axios.post('/reorder', { newOrder: arr.concat(items.slice(arr.length)) });
    };

    const onScroll = e => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop === clientHeight && hasMore) load();
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div style={{ width: '400px', height: '600px', margin: '20px auto', border: '1px solid #ccc' }}>
                <input placeholder="Поиск..." style={{ width: '100%', boxSizing: 'border-box', padding: '8px' }}
                       value={query} onChange={e => { setQuery(e.target.value); setOffset(0); }} />
                <div style={{ height: '540px', overflowY: 'auto' }} onScroll={onScroll}>
                    {items.map((it, idx) => (
                        <Row key={it} item={it} index={idx} moveRow={moveRow} selected={selected.has(it)} toggle={toggle}/>
                    ))}
                </div>
            </div>
        </DndProvider>
    );
}