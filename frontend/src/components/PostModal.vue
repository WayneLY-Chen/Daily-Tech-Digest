<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="modal">
      <button class="close-btn" @click="$emit('close')">✕</button>
      <div class="modal-meta">
        <span class="badge" :class="post.source">
          {{ post.source === 'github' ? '🐙 GitHub' : '🔶 Hacker News' }}
        </span>
        <span class="date">{{ date }}</span>
      </div>
      <div class="modal-content" v-html="html" />
      <a :href="post.source_url" target="_blank" rel="noopener" class="source-link">
        查看原始來源 ↗
      </a>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { marked } from 'marked';

const props = defineProps({ post: Object });
defineEmits(['close']);

const html = computed(() => marked.parse(props.post.content));

const date = computed(() =>
  new Date(props.post.created_at).toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
);
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}

.modal {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 16px;
  max-width: 720px;
  width: 100%;
  max-height: 85vh;
  overflow-y: auto;
  padding: 32px;
  position: relative;
  color: #e0e0e0;
}

.close-btn {
  position: sticky;
  top: 0;
  float: right;
  background: #2a2a2a;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #aaa;
  display: flex;
  align-items: center;
  justify-content: center;
}
.close-btn:hover { background: #333; color: #fff; }

.modal-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.badge {
  font-size: 0.8rem;
  padding: 3px 10px;
  border-radius: 20px;
}
.badge.github { background: #1a2e1a; color: #6fcf6f; }
.badge.hackernews { background: #2e1e0a; color: #f6a623; }

.date { color: #555; font-size: 0.85rem; }

.modal-content {
  line-height: 1.8;
  font-size: 0.95rem;
}


.modal-content :deep(h1),
.modal-content :deep(h2),
.modal-content :deep(h3) {
  margin: 20px 0 8px;
  font-weight: 600;
  color: #f0f0f0;
}
.modal-content :deep(p) { margin-bottom: 12px; color: #ccc; }
.modal-content :deep(ul), .modal-content :deep(ol) {
  padding-left: 20px;
  margin-bottom: 12px;
}
.modal-content :deep(li) { margin-bottom: 4px; color: #ccc; }
.modal-content :deep(code) {
  background: #2a2a2a;
  color: #e0e0e0;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.875em;
}
.modal-content :deep(pre) {
  background: #111;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 12px;
  border: 1px solid #2a2a2a;
}
.modal-content :deep(pre code) {
  background: none;
  padding: 0;
  color: inherit;
}

.source-link {
  display: inline-block;
  margin-top: 24px;
  color: #4a90e2;
  text-decoration: none;
  font-size: 0.9rem;
}
.source-link:hover { text-decoration: underline; }
</style>
