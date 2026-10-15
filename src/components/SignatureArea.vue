<template>
  <!-- Quotation keeps upstream's two-box issue/approve pair — out of redesign scope -->
  <footer v-if="isQuotation" class="bd-sign bd-sign--pair">
    <div class="bd-sign-box" data-signature-type="issuer">
      <div class="bd-sign-k">เสนอราคาโดย</div>
      <div class="bd-sign-line"></div>
      <div class="bd-sign-name">( {{ displayName }} )</div>
      <div class="bd-sign-date">วันที่ {{ signDate }}</div>
    </div>
    <div class="bd-sign-box" data-signature-type="approver">
      <div class="bd-sign-k">อนุมัติโดย</div>
      <div class="bd-sign-line"></div>
      <div class="bd-sign-name">(&nbsp;)</div>
      <div class="bd-sign-date">วันที่ ....../....../.........</div>
    </div>
  </footer>

  <footer v-else class="bd-sign">
    <div class="bd-sign-box" data-signature-type="issuer">
      <div class="bd-sign-k">{{ signatureLabel }}</div>
      <div class="bd-sign-line">
        <img v-if="signature" :src="signature" alt="" class="bd-sign-img" data-testid="signature" />
      </div>
      <div class="bd-sign-name">( {{ displayName }} )</div>
      <div class="bd-sign-date">วันที่ {{ signDate }}</div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GristRecord } from '../types/document-schema'
import { formatShortDate } from '../utils/document'
import { getViewModel } from '../utils/view-model'

interface Props {
  record: GristRecord
}

const props = defineProps<Props>()

const viewModel = computed(() => getViewModel(props.record))

const isQuotation = computed(() => props.record.Record.Document_Type.includes('Quotation'))

const isReceipt = computed(() => props.record.Record.Document_Type.includes('Receipt'))

const signatureLabel = computed(() => (isReceipt.value ? 'ผู้รับเงิน' : 'ลงชื่อผู้วางบิล'))

const displayName = computed(() => {
  const p = props.record.Record.Provider
  return p.Personnel_Name ?? p.Name
})

// Only the issuer signs in advance; the quotation's approver box stays blank
// for the client to sign by hand.
const signature = computed(() => props.record.Record.Provider.Signature || null)

// A receipt is signed on the day the money landed, not the day it was issued.
const signDate = computed(() =>
  formatShortDate(viewModel.value.settlement?.paidDate ?? props.record.Record.Date),
)
</script>
