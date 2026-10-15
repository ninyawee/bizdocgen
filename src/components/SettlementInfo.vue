<template>
  <!--
    ① RECEIPT ONLY. Reads as arithmetic: the gross sits above a hairline, the
    two settled figures carry + operators, and the accent rule closes the sum.
    If the two ever fail to reconcile, the block says so rather than hiding it.
  -->
  <section class="bd-settle">
    <div class="bd-sec">ชำระเงิน</div>
    <div class="bd-settle-grid">
      <dl class="bd-settle-meta">
        <dt>วันที่ชำระ</dt>
        <dd>{{ formatShortDate(s.paidDate) }}</dd>
        <template v-if="s.channel">
          <dt>ช่องทางรับชำระ</dt>
          <dd>{{ s.channel }}</dd>
        </template>
        <template v-if="s.promptPayId">
          <dt>พร้อมเพย์ที่รับ</dt>
          <dd class="bd-num">{{ s.promptPayId }}</dd>
        </template>
        <template v-if="s.bank">
          <dt>{{ s.promptPayId ? 'เข้าบัญชี' : 'ธนาคาร' }}</dt>
          <dd>{{ s.bank }}</dd>
        </template>
        <template v-if="s.accountNumber">
          <dt>บัญชี</dt>
          <dd class="bd-num">{{ s.accountNumber }}</dd>
        </template>
        <template v-if="s.accountHolder">
          <dt>ชื่อบัญชี</dt>
          <dd>{{ s.accountHolder }}</dd>
        </template>
      </dl>

      <div class="bd-math">
        <div class="bd-math-row bd-math-row--gross">
          <span class="bd-math-op"></span>
          <span class="bd-math-k">จำนวนเงินรวม</span>
          <span class="bd-math-v bd-num">{{ formatNumber(s.gross) }}</span>
        </div>
        <div class="bd-math-sep"></div>

        <div class="bd-math-row">
          <span class="bd-math-op"></span>
          <span class="bd-math-k">
            {{ s.intoLabel }}
            <small v-if="s.intoCaption">{{ s.intoCaption }}</small>
          </span>
          <span class="bd-math-v bd-num">{{ formatNumber(s.net) }}</span>
        </div>

        <div class="bd-math-row">
          <span class="bd-math-op">+</span>
          <span class="bd-math-k">
            ภาษีหัก ณ ที่จ่าย {{ whtRateLabel }}
            <small>ผู้จ่ายนำส่งกรมสรรพากร</small>
          </span>
          <span class="bd-math-v bd-num">{{ formatNumber(s.wht) }}</span>
        </div>

        <div class="bd-math-row bd-math-row--sum">
          <span class="bd-math-op">=</span>
          <span class="bd-math-k">รวมชำระ</span>
          <span class="bd-math-v bd-num">
            {{ formatNumber(s.net + s.wht) }}
            <span class="bd-tick" :class="{ 'bd-tick--off': !s.reconciles }">
              {{ s.reconciles ? 'ตรงกัน' : 'ไม่ตรงกับจำนวนเงินรวม' }}
            </span>
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SettlementView } from '../types/view-model'
import { formatNumber } from '../utils/currency'
import { formatShortDate } from '../utils/document'

interface Props {
  settlement: SettlementView
}

const props = defineProps<Props>()

const s = computed(() => props.settlement)

// Derived from the settlement itself so the block stays internally consistent
// even if the document's Tax rate and the withheld amount ever disagree.
const whtRateLabel = computed(() => {
  const { gross, wht } = props.settlement
  if (!gross) return ''
  const percent = (wht / gross) * 100
  return `${Number(percent.toFixed(2))}%`
})
</script>
