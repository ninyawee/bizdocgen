<template>
  <div class="bd-foot">
    <div>{{ record.Record.Provider.Name }} · {{ documentTitle }} {{ record.Record.Number }}</div>
    <!--
      Single-page only. Native print pagination cannot report the page count back
      to the document, so this is honest at 1/1 and would need a JS paginator to
      say anything else — see DESIGN-BRIEF.md §multi-page.
    -->
    <div class="bd-foot-r">หน้า 1 / 1</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GristRecord } from '../types/document-schema'
import { getDocumentTypeInThai } from '../utils/document'
import { isVatRate } from '../utils/tax'

interface Props {
  record: GristRecord
}

const props = defineProps<Props>()

const documentTitle = computed(() =>
  getDocumentTypeInThai(props.record.Record.Document_Type[0]!, isVatRate(props.record.Record.Tax)),
)
</script>
