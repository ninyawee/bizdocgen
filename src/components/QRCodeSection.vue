<template>
  <div v-if="showQR" class="bd-qr">
    <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="PromptPay QR" class="bd-qr-img" />
    <div v-else class="bd-qr-img" />
    <div class="bd-qr-amt bd-num">฿{{ formatNumber(viewModel.total) }}</div>
    <div class="bd-qr-cap">สแกนจ่ายพร้อมเพย์ · ยอดสุทธิ</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { GristRecord } from '../types/document-schema'
import { formatNumber } from '../utils/currency'
import { generatePromptPayQR } from '../utils/promptpay'
import { getViewModel } from '../utils/view-model'

interface Props {
  record: GristRecord
}

const props = defineProps<Props>()

const qrCodeUrl = ref<string | null>(null)

const viewModel = computed(() => getViewModel(props.record))

const promptPayId = computed(() => viewModel.value.paymentInfo.promptPayId)

const showQR = computed(() => !!promptPayId.value)

const generateQRCode = async () => {
  qrCodeUrl.value = null
  if (showQR.value && promptPayId.value) {
    try {
      qrCodeUrl.value = await generatePromptPayQR(promptPayId.value, viewModel.value.total)
    } catch (error) {
      console.error('Failed to generate QR code:', error)
    }
  }
}

onMounted(generateQRCode)

watch(
  () => [promptPayId.value, viewModel.value.total],
  () => {
    generateQRCode()
  },
)

defineExpose({ showQR })
</script>
