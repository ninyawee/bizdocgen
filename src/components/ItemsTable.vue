<template>
  <!--
    The 19-of-22 case: one line item with no sub-list renders as a statement,
    not a five-column table for a single row. The table returns the moment a
    second item exists, or the single item carries bullets.
  -->
  <section v-if="viewModel.renderAsStatement" class="bd-single">
    <div>
      <div class="bd-single-name">{{ single.name }}</div>
      <div v-if="single.detail" class="bd-item-desc" v-html="renderMarkdown(single.detail)" />
    </div>
    <div class="bd-single-amt bd-num">{{ formatNumber(single.total) }}</div>
    <div class="bd-single-rate">
      <span><span class="bd-k">จำนวน</span> {{ single.quantity }}</span>
      <!-- the literal space matters: Vue condenses whitespace across newlines -->
      <span><span class="bd-k">ราคาต่อหน่วย</span> <span class="bd-num">{{ formatNumber(single.unitPrice) }}</span></span>
    </div>
  </section>

  <table v-else class="bd-items">
    <thead>
      <tr>
        <th class="bd-c-no">ลำดับ</th>
        <th>รายการ</th>
        <th class="bd-c-qty">จำนวน</th>
        <th class="bd-c-unit">ราคาต่อหน่วย</th>
        <th class="bd-c-amt">จำนวนเงิน</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(item, index) in viewModel.items" :key="item.id">
        <td class="bd-c-no">{{ index + 1 }}</td>
        <td>
          <div class="bd-item-name">{{ item.name }}</div>
          <div v-if="item.detail" class="bd-item-desc" v-html="renderMarkdown(item.detail)" />
        </td>
        <td class="bd-c-qty bd-num">{{ item.quantity }}</td>
        <td class="bd-c-unit bd-num">{{ formatNumber(item.unitPrice) }}</td>
        <td class="bd-c-amt bd-num">{{ formatNumber(item.total) }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GristRecord } from '../types/document-schema'
import { formatNumber } from '../utils/currency'
import { renderMarkdown } from '../utils/markdown'
import { getViewModel } from '../utils/view-model'

interface Props {
  record: GristRecord
}

const props = defineProps<Props>()

const viewModel = computed(() => getViewModel(props.record))
const single = computed(() => viewModel.value.items[0]!)
</script>
