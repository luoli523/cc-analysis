<script setup lang="ts">
import { ref } from 'vue'
import { withBase } from 'vitepress'

const isOpen = ref(false)
const videoSrc = withBase('/dcxj.mp4')
const videoRef = ref<HTMLVideoElement | null>(null)

function togglePlayer() {
  isOpen.value = !isOpen.value
  if (!isOpen.value && videoRef.value) {
    videoRef.value.pause()
  }
}

function closePlayer() {
  isOpen.value = false
  if (videoRef.value) {
    videoRef.value.pause()
  }
}
</script>

<template>
  <!-- 导航栏按钮 -->
  <div class="vp-btn-wrap">
    <button class="vp-music-btn" @click="togglePlayer" :class="{ active: isOpen }">
      <span class="vp-music-icon">🎵</span>
    </button>
    <span class="vp-music-tooltip">看累了听个音乐吧</span>
  </div>

  <!-- 右下角悬浮播放器 -->
  <Teleport to="body">
    <Transition name="player-slide">
      <div v-if="isOpen" class="vp-float-player">
        <div class="vp-float-header">
          <span>🎵 &nbsp;放松一下</span>
          <button class="vp-float-close" @click="closePlayer">✕</button>
        </div>
        <video
          ref="videoRef"
          :src="videoSrc"
          controls
          autoplay
          class="vp-float-video"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── 按钮 ── */
.vp-btn-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-right: 4px;
}

.vp-music-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
  color: var(--vp-c-text-1);
}
.vp-music-btn:hover,
.vp-music-btn.active {
  background: var(--vp-c-bg-soft);
}
.vp-music-btn.active .vp-music-icon {
  animation: spin 1.5s linear infinite;
}
.vp-music-icon {
  font-size: 16px;
  display: inline-block;
}

/* Tooltip */
.vp-music-tooltip {
  display: none;
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.78);
  color: #fff;
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 6px;
  pointer-events: none;
  z-index: 100;
}
.vp-music-tooltip::before {
  content: '';
  position: absolute;
  top: -5px;
  right: 10px;
  border: 5px solid transparent;
  border-top: none;
  border-bottom-color: rgba(0, 0, 0, 0.78);
}
.vp-btn-wrap:hover .vp-music-tooltip {
  display: block;
}

/* ── 浮窗播放器 ── */
.vp-float-player {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 340px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 9999;
}

.vp-float-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.vp-float-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--vp-c-text-2);
  font-size: 14px;
  padding: 2px 4px;
  border-radius: 4px;
  line-height: 1;
  transition: background 0.15s, color 0.15s;
}
.vp-float-close:hover {
  background: var(--vp-c-danger-soft);
  color: var(--vp-c-danger-1);
}

.vp-float-video {
  width: 100%;
  display: block;
  max-height: 240px;
  background: #000;
}

/* 入场动画 */
.player-slide-enter-active,
.player-slide-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.player-slide-enter-from,
.player-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* 音符旋转动画 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
</style>
