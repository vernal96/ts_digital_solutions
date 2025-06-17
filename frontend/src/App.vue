<template>
  <div class="container py-4">
    <input v-model="search" @input="resetAndLoad" class="form-control mb-3" placeholder="Поиск..." />
    <div ref="scrollBox" style="height: 80vh; overflow-y: auto" @scroll="onScroll">
      <div
          v-for="item in items"
          :key="item.id"
          class="form-check border-bottom py-2 d-flex align-items-center"
      >
        <input
            class="form-check-input me-2"
            type="checkbox"
            :checked="selected.has(item.id)"
            @change="toggleSelection(item.id)"
        />
        <label class="form-check-label">{{ item.label }}</label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const items = ref([]);
const offset = ref(0);
const limit = 20;
const search = ref('');
const selected = ref(new Set());
const order = ref([]);
const scrollBox = ref(null);
const loading = ref(false);

const loadItems = async () => {
  if (loading.value) return;
  loading.value = true;
  const { data } = await axios.get('http://localhost:3000/items', {
    params: { offset: offset.value, limit, search: search.value },
  });
  items.value.push(...data);
  offset.value += limit;
  loading.value = false;
};

const toggleSelection = (id) => {
  if (selected.value.has(id)) selected.value.delete(id);
  else selected.value.add(id);
};

const resetAndLoad = () => {
  offset.value = 0;
  items.value = [];
  loadItems();
};

const onScroll = () => {
  const scroll = scrollBox.value;
  if (scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 10) {
    loadItems();
  }
};

onMounted(async () => {
  const { data } = await axios.get('http://localhost:3000/state/load');
  selected.value = new Set(data.selected);
  order.value = data.order;
  await loadItems();

  window.addEventListener('beforeunload', async () => {
    await axios.post('http://localhost:3000/state/save', {
      selected: Array.from(selected.value),
      order: order.value,
    });
  });
});
</script>

<style scoped>
.form-check-label {
  flex: 1;
}
</style>