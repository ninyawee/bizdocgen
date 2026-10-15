<template>
  <div v-if="paymentMethod">
    <div class="bd-sec">ชำระเงินได้ที่</div>
    <div class="bd-pay-box">
      <dl class="bd-pay-rows">
        <template v-if="paymentMethod.Bank">
          <dt>ธนาคาร</dt>
          <dd>{{ paymentMethod.Bank }}</dd>
        </template>
        <template v-if="paymentMethod.Branch">
          <dt>สาขา</dt>
          <dd>{{ paymentMethod.Branch }}</dd>
        </template>
        <template v-if="paymentMethod.Account_Number">
          <dt>เลขที่บัญชี</dt>
          <dd class="bd-num">{{ paymentMethod.Account_Number }}</dd>
        </template>
        <template v-if="paymentMethod.Account_Holder">
          <dt>ชื่อบัญชี</dt>
          <dd>{{ paymentMethod.Account_Holder }}</dd>
        </template>
        <template v-if="paymentMethod.PromptPay">
          <dt>พร้อมเพย์</dt>
          <dd class="bd-num">{{ paymentMethod.PromptPay }}</dd>
        </template>
      </dl>
      <!--
        Both channels settle into the same account, but they are different
        channels — and the receipt will name whichever the client actually used.
      -->
      <div v-if="paymentMethod.Bank && paymentMethod.PromptPay" class="bd-chan-note">
        โอนผ่านธนาคารหรือพร้อมเพย์ — คนละช่องทาง เข้าบัญชีเดียวกัน
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GristRecord } from '../types/document-schema'

interface Props {
  record: GristRecord
}

const props = defineProps<Props>()

const paymentMethod = computed(() => props.record.Record.Payment_Method)
</script>
