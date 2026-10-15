<template>
  <div v-if="viewModel.remarks" class="bd-remarks" v-html="renderMarkdown(viewModel.remarks)" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GristRecord } from '../types/document-schema'
import { renderMarkdown } from '../utils/markdown'
import { getViewModel } from '../utils/view-model'

interface Props {
  record: GristRecord
}

const props = defineProps<Props>()

const viewModel = computed(() => getViewModel(props.record))
</script>
