<template>
  <div class="app">
    <header>
      <h1>每日開源科技報</h1>
      <p class="subtitle">AI 自動摘要 · 每日更新</p>
    </header>

    <main>
      <div v-if="loading" class="loading">載入中...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else class="grid">
        <PostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
          @click="openPost(post)"
        />
      </div>
      <div v-if="!loading && posts.length === 0" class="empty">
        目前還沒有文章
      </div>
    </main>

    <PostModal v-if="selected" :post="selected" @close="selected = null" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { createClient } from '@supabase/supabase-js';
import PostCard from './components/PostCard.vue';
import PostModal from './components/PostModal.vue';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const posts = ref([]);
const loading = ref(true);
const error = ref(null);
const selected = ref(null);

async function fetchPosts() {
  const { data, error: err } = await supabase
    .from('digest_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (err) {
    error.value = '無法載入文章：' + err.message;
  } else {
    posts.value = data;
  }
  loading.value = false;
}

function openPost(post) {
  selected.value = post;
}

onMounted(fetchPosts);
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #0d0d0d;
  color: #e0e0e0;
}

.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px 40px;
}

header {
  text-align: center;
  padding: 48px 0 32px;
  border-bottom: 1px solid #2a2a2a;
  margin-bottom: 32px;
}

header h1 { font-size: 2rem; margin-bottom: 8px; color: #fff; }
.subtitle { color: #666; font-size: 0.95rem; }

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.loading, .error, .empty {
  text-align: center;
  padding: 60px;
  color: #555;
}
.error { color: #fc8181; }
</style>
