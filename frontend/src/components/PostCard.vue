<template>
  <div class="card" @click="$emit('click')">
    <div class="card-badge" :class="post.source">
      {{ post.source === 'github' ? '🐙 GitHub' : '🔶 HN' }}
    </div>
    <h2 class="card-title">{{ title }}</h2>
    <p class="card-excerpt">{{ excerpt }}</p>
    <div class="card-footer">
      <span class="card-date">{{ date }}</span>
      <span class="card-read">閱讀全文 →</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({ post: Object });
defineEmits(['click']);

const title = computed(() => {
  const match = props.post.content.match(/【(.+?)】/);
  return match ? match[1] : props.post.project_name;
});

const excerpt = computed(() => {
  const lines = props.post.content.split('\n').filter(l => l.trim() && !l.startsWith('【'));
  return lines[0]?.slice(0, 100) + '...' || '';
});

const date = computed(() => {
  return new Date(props.post.created_at).toLocaleDateString('zh-TW');
});
</script>

<style scoped>
.card {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  border-color: #444;
}

.card-badge {
  display: inline-block;
  font-size: 0.75rem;
  padding: 3px 10px;
  border-radius: 20px;
  width: fit-content;
}
.card-badge.github { background: #1a2e1a; color: #6fcf6f; }
.card-badge.hackernews { background: #2e1e0a; color: #f6a623; }

.card-title {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
  color: #f0f0f0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-excerpt {
  font-size: 0.875rem;
  color: #888;
  line-height: 1.5;
  flex: 1;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}
.card-date { color: #555; }
.card-read { color: #4a90e2; font-weight: 500; }
</style>
