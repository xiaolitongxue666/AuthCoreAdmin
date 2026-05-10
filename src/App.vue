<template>
  <div id="app-root">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import useUser from '@/store/user'

const { read } = useUser()

onMounted(async () => {
  const token = window.localStorage.getItem('Authorization')
  if (token) {
    await read()
  }
})

console.debug('[authcoreadmin] deploy_ver=20260510.016')
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; }
a { color: #1a73e8; text-decoration: none; }
</style>
