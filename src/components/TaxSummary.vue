<template>
  <section class="bd-summary">
    <dl class="bd-sum-row">
      <dt>ยอดรวม</dt>
      <dd class="bd-num">{{ formatNumber(viewModel.subtotal) }}</dd>
    </dl>

    <dl v-if="tax.label" class="bd-sum-row" :class="{ 'bd-sum-row--wht': tax.percentage < 0 }">
      <dt>{{ tax.label }}</dt>
      <!-- U+2212 minus, not a hyphen — it aligns with tabular figures -->
      <dd class="bd-num">{{ tax.percentage < 0 ? '−' : '' }}{{ formatNumber(Math.abs(tax.amount)) }}</dd>
    </dl>

    <template v-if="viewModel.wht > 0">
      <dl class="bd-sum-row">
        <dt>จำนวนเงินรวมทั้งสิ้น</dt>
        <dd class="bd-num">{{ formatNumber(viewModel.total) }}</dd>
      </dl>
      <span class="bd-bahttext">({{ formatBahtText(viewModel.total) }})</span>
      <dl class="bd-sum-row bd-sum-row--wht">
        <dt>หัก ภาษี ณ ที่จ่าย</dt>
        <dd class="bd-num">−{{ formatNumber(viewModel.wht) }}</dd>
      </dl>
      <dl class="bd-sum-total">
        <dt>ยอดชำระสุทธิ</dt>
        <dd class="bd-num">{{ formatNumber(viewModel.payable) }}</dd>
      </dl>
    </template>
    <template v-else>
      <dl class="bd-sum-total">
        <dt>จำนวนเงินสุทธิ</dt>
        <dd class="bd-num">{{ formatNumber(viewModel.total) }}</dd>
      </dl>

      <span class="bd-bahttext">({{ formatBahtText(viewModel.total) }})</span>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GristRecord } from '../types/document-schema'
import { formatBahtText, formatNumber } from '../utils/currency'
import { getViewModel } from '../utils/view-model'

interface Props {
  record: GristRecord
}

const props = defineProps<Props>()

const viewModel = computed(() => getViewModel(props.record))
const tax = computed(() => viewModel.value.tax)
</script>
