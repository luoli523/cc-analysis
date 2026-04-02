<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="lb-overlay"
      @click="close"
    >
      <img :src="src" :alt="alt" class="lb-img" @click.stop />
      <button class="lb-close" @click="close" aria-label="关闭">✕</button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vitepress'

const visible = ref(false)
const src = ref('')
const alt = ref('')

function open(imgEl: HTMLImageElement) {
  src.value = imgEl.src
  alt.value = imgEl.alt
  visible.value = true
  document.body.style.overflow = 'hidden'
}

function close() {
  visible.value = false
  document.body.style.overflow = ''
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

function attachListeners() {
  const selector = '.vp-doc img, .VPHero .image-src'
  document.querySelectorAll<HTMLImageElement>(selector).forEach((img) => {
    if (img.dataset.lbBound) return
    img.dataset.lbBound = '1'
    img.style.cursor = 'zoom-in'
    img.addEventListener('click', () => open(img))
  })
}

const router = useRouter()

onMounted(() => {
  setTimeout(attachListeners, 300)
  router.onAfterRouteChanged = () => setTimeout(attachListeners, 300)
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.lb-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
  animation: lb-fade-in 0.2s ease;
}

@keyframes lb-fade-in {
  from { opacity: 0 }
  to   { opacity: 1 }
}

.lb-img {
  max-width: 92vw;
  max-height: 92vh;
  object-fit: contain;
  border-radius: 6px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6);
  animation: lb-scale-in 0.2s ease;
  cursor: default;
}

@keyframes lb-scale-in {
  from { transform: scale(0.92); opacity: 0 }
  to   { transform: scale(1);    opacity: 1 }
}

.lb-close {
  position: fixed;
  top: 20px;
  right: 24px;
  background: rgba(255, 255, 255, 0.12);
  border: none;
  color: #fff;
  font-size: 1.1rem;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.lb-close:hover {
  background: rgba(255, 255, 255, 0.25);
}
</style>
