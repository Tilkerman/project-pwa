<template>
  <div class="character-selector">
    <h3 class="selector-title">Выбери персонажа-мотиватора</h3>
    <div class="characters-grid">
      <div
        v-for="char in availableCharacters"
        :key="char.id"
        class="character-option"
        :class="{ active: modelValue === char.id }"
        @click="$emit('update:modelValue', char.id)"
      >
        <div class="character-icon-large">{{ char.icon }}</div>
        <div class="character-name">{{ char.name }}</div>
        <div class="character-preview">
          {{ getPreviewPhrase(char.id) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CharacterType } from '@/types'
import { characters } from '@/utils/characters'

const props = defineProps<{
  modelValue: CharacterType
}>()

defineEmits<{
  'update:modelValue': [value: CharacterType]
}>()

const availableCharacters = computed(() => Object.values(characters))

function getPreviewPhrase(characterId: CharacterType): string {
  const character = characters[characterId]
  return character.phrases.daily[0]
}
</script>

<style scoped>
.character-selector {
  margin: 1.5rem 0;
}

.selector-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.characters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

@media (max-width: 480px) {
  .characters-grid {
    grid-template-columns: 1fr;
  }
}

.character-option {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.character-option:hover {
  border-color: #4f46e5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
}

.character-option.active {
  border-color: #4f46e5;
  background: #eef2ff;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
}

.character-icon-large {
  font-size: 4rem;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.character-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.75rem;
}

.character-preview {
  font-size: 0.875rem;
  color: #6b7280;
  font-style: italic;
  line-height: 1.4;
}
</style>

