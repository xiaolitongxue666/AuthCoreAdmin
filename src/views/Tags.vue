<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h1>标签管理</h1>
      <button class="bg-primary text-white px-4 py-2 rounded text-sm cursor-pointer border-0" @click="openCreate">新增标签</button>
    </div>

    <input v-model="keyword" placeholder="搜索标签名称..." class="w-full border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary mb-4" />

    <div v-if="loading" class="text-center py-10 text-text-muted">加载中...</div>
    <div v-else-if="filteredList.length === 0" class="text-center py-10 text-text-muted">暂无数据</div>
    <div v-else class="flex flex-col gap-1.5">
      <div v-for="tag in filteredList" :key="tag.tag_id" class="flex justify-between items-center bg-surface rounded-lg px-4 py-2.5 shadow-sm">
        <span class="text-sm font-medium text-text">{{ tag.tag_name }}</span>
        <button class="bg-red-50 text-red-600 px-3 py-1.5 rounded text-xs cursor-pointer border-0" @click="deleteTag(tag)">删除</button>
      </div>
    </div>

    <!-- Create modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="closeModal">
      <div class="bg-surface rounded-xl p-6 w-[90%] max-w-md">
        <h3>新增标签</h3>
        <div class="mt-4">
          <label class="block text-xs font-semibold text-text mb-1">标签名称</label>
          <input v-model="form.tag_name" class="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" placeholder="输入标签名称" @keyup.enter="submit" />
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button class="bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm cursor-pointer border-0" @click="closeModal">取消</button>
          <button class="bg-primary text-white px-4 py-2 rounded text-sm cursor-pointer border-0" @click="submit" :disabled="!form.tag_name?.trim()">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import request from '@/utils/request'
import type { HtyTag } from '@/types'

const keyword = ref('')
const loading = ref(false)
const showModal = ref(false)
const tags = ref<HtyTag[]>([])
const form = reactive<Partial<HtyTag>>({ tag_name: '' })

const filteredList = computed(() => {
  if (!keyword.value) return tags.value
  const kw = keyword.value.toLowerCase()
  return tags.value.filter(t => t.tag_name.toLowerCase().includes(kw))
})

async function fetchTags() {
  loading.value = true
  const { r, d } = await request({ url: '/api/v1/uc/find_all_tags' })
  loading.value = false
  if (r && Array.isArray(d)) {
    tags.value = d
  }
}

function openCreate() {
  form.tag_name = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function submit() {
  if (!form.tag_name?.trim()) return
  const { r } = await request({
    url: '/api/v1/uc/create_or_update_tags',
    method: 'POST',
    data: { ...form },
  })
  if (r) {
    closeModal()
    await fetchTags()
  }
}

async function deleteTag(tag: HtyTag) {
  if (!confirm(`确认删除标签「${tag.tag_name}」？`)) return
  const { r } = await request({
    url: `/api/v1/uc/delete_tag/${tag.tag_id}`,
    method: 'DELETE',
  })
  if (r) await fetchTags()
}

onMounted(fetchTags)
</script>
