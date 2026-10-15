<template>
  <section class="bd-parties" :class="{ 'bd-parties--solo': !showContactBack }">
    <div>
      <div class="bd-sec">ลูกค้า</div>
      <div class="bd-client-name">{{ client.Name }}</div>
      <div class="bd-client-meta">
        <div v-if="address" class="bd-addr">{{ address }}</div>
        <div v-if="client.Tax_ID">
          <span class="bd-k">เลขประจำตัวผู้เสียภาษี</span> {{ client.Tax_ID }}
        </div>
      </div>
      <div v-if="viewModel.attention" class="bd-attn">
        <span class="bd-k">เรียน</span> {{ viewModel.attention }}
      </div>
    </div>

    <!-- ⑨ ติดต่อกลับที่ — who to call back, independent of ⑧ -->
    <div v-if="showContactBack">
      <div class="bd-sec">ติดต่อกลับที่</div>
      <div class="bd-contact">
        <strong>{{ contactName }}</strong>
        <template v-if="provider.Phone"><br />{{ provider.Phone }}</template>
        <template v-if="provider.Email"><br />{{ provider.Email }}</template>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GristRecord } from '../types/document-schema'
import { getViewModel } from '../utils/view-model'

interface Props {
  record: GristRecord
}

const props = defineProps<Props>()

const viewModel = computed(() => getViewModel(props.record))
const client = computed(() => props.record.Record.Client)
const provider = computed(() => props.record.Record.Provider)
const address = computed(() => props.record.Record.Client.Address?.trim() ?? '')

const contactName = computed(
  () => props.record.Record.Provider.Personnel_Name || props.record.Record.Provider.Name,
)

// Collapses on its own: with nothing to show, the grid falls back to 1fr and
// the client block takes the full measure — no reserved gap.
const showContactBack = computed(
  () =>
    viewModel.value.showContactBack &&
    Boolean(provider.value.Phone || provider.value.Email || contactName.value),
)
</script>
