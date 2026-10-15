<template>
  <header class="bd-head">
    <div>
      <h1 class="bd-provider-name">{{ provider.Name }}</h1>
      <div v-if="provider.Role" class="bd-provider-role">{{ provider.Role }}</div>
      <div class="bd-provider-meta">
        <div v-if="address" class="bd-addr">{{ address }}</div>
        <div v-if="provider.Phone || provider.Email" class="bd-inline">
          <span v-if="provider.Phone"><span class="bd-k">โทร</span> {{ provider.Phone }}</span>
          <span v-if="provider.Email"><span class="bd-k">อีเมล</span> {{ provider.Email }}</span>
        </div>
        <div v-if="provider.Tax_ID">
          <span class="bd-k">เลขประจำตัวผู้เสียภาษี</span> {{ provider.Tax_ID }}
        </div>
      </div>
    </div>

    <div class="bd-meta">
      <span class="bd-chip" :class="{ 'bd-chip--copy': isCopy }">({{ copyLabel }})</span>

      <div>
        <h2 class="bd-doctype">{{ documentTitle }}</h2>
        <span v-if="settlement" class="bd-paid">ชำระเงินแล้ว</span>
      </div>

      <dl class="bd-metarows">
        <dt>เลขที่</dt>
        <dd>{{ record.Record.Number }}</dd>
        <dt>วันที่</dt>
        <dd>{{ formatShortDate(record.Record.Date) }}</dd>
        <template v-if="viewModel.reference.number">
          <dt>อ้างอิง</dt>
          <dd>{{ viewModel.reference.number }}</dd>
        </template>
        <template v-if="viewModel.creditTerm">
          <dt>เครดิต</dt>
          <dd>{{ viewModel.creditTerm }}</dd>
        </template>
        <template v-if="settlement">
          <dt>วันที่ชำระ</dt>
          <dd>{{ formatShortDate(settlement.paidDate) }}</dd>
        </template>
      </dl>

      <div v-if="viewModel.dueDate" class="bd-due">
        <div class="bd-due-k">วันที่ครบกำหนด</div>
        <div class="bd-due-v">{{ formatShortDate(viewModel.dueDate) }}</div>
      </div>
    </div>
  </header>
  <div class="bd-rule"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GristRecord } from '../types/document-schema'
import { formatShortDate, getDocumentTypeInThai } from '../utils/document'
import { getCopyLabel, DUPLICATE } from '../utils/copy-state'
import { getViewModel } from '../utils/view-model'
import { isVatRate } from '../utils/tax'

interface Props {
  record: GristRecord
}

const props = defineProps<Props>()

const viewModel = computed(() => getViewModel(props.record))
const provider = computed(() => props.record.Record.Provider)
const settlement = computed(() => viewModel.value.settlement)
const address = computed(() => props.record.Record.Provider.Address?.trim() ?? '')

const hasVat = computed(() => isVatRate(props.record.Record.Tax))
const documentTitle = computed(() =>
  getDocumentTypeInThai(props.record.Record.Document_Type[0]!, hasVat.value),
)

const copyLabel = computed(() => getCopyLabel())
const isCopy = computed(() => copyLabel.value === DUPLICATE)
</script>
