<template>
  <article
    v-if="record"
    class="bd-page document"
    data-testid="document"
    role="document"
    :data-document-type="documentType?.toLowerCase()"
    :data-document-id="record?.id"
    :data-document-number="documentNumber"
    :data-provider-name="providerName"
    :data-customer-name="customerName"
    :data-payment-method-name="paymentMethodName"
  >
    <DocumentHeader :record="record" />
    <ClientInfo :record="record" />

    <div class="bd-flow">
      <ItemsTable :record="record" />
      <TaxSummary :record="record" />

      <!-- ① receipts only -->
      <SettlementInfo v-if="settlement" :settlement="settlement" />

      <RemarksSection :record="record" />

      <!--
        Payment details and the PromptPay QR are suppressed on receipts by
        document type, not by data absence — a receipt row can still carry a
        Payment_Method reference, but there is nothing left to pay.
      -->
      <section v-if="showPayment" class="bd-pay" :class="{ 'bd-pay--solo': !showQr }">
        <PaymentInfo :record="record" />
        <QRCodeSection v-if="showQr" :record="record" />
      </section>

      <SignatureArea :record="record" />
    </div>

    <DocumentFooter :record="record" />
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GristRecord } from '../types/document-schema'
import ClientInfo from './ClientInfo.vue'
import DocumentFooter from './DocumentFooter.vue'
import DocumentHeader from './DocumentHeader.vue'
import ItemsTable from './ItemsTable.vue'
import PaymentInfo from './PaymentInfo.vue'
import QRCodeSection from './QRCodeSection.vue'
import RemarksSection from './RemarksSection.vue'
import SettlementInfo from './SettlementInfo.vue'
import SignatureArea from './SignatureArea.vue'
import TaxSummary from './TaxSummary.vue'
import { getViewModel } from '../utils/view-model'

interface Props {
  record: GristRecord | null
}

const props = defineProps<Props>()

const documentType = computed(() => props.record?.Record.Document_Type[0] || null)
const providerName = computed(() => props.record?.Record.Provider.Name || null)
const customerName = computed(() => props.record?.Record.Client.Name || null)
const documentNumber = computed(() => props.record?.Record.Number || null)
const paymentMethodName = computed(() => props.record?.Record.Payment_Method?.Name || null)

const settlement = computed(() => (props.record ? getViewModel(props.record).settlement : null))

const isReceipt = computed(() => documentType.value === 'Receipt')

const showPayment = computed(
  () => !isReceipt.value && Boolean(props.record?.Record.Payment_Method),
)

const showQr = computed(
  () => showPayment.value && Boolean(props.record?.Record.Payment_Method?.PromptPay),
)
</script>
