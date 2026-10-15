import { describe, expect, it } from 'vite-plus/test'

import { mount } from '@vue/test-utils'
import SignatureArea from '../components/SignatureArea.vue'
import type { GristRecord } from '../types/document-schema'

function createRecord(documentType: 'Quotation' | 'Invoice' | 'Receipt'): GristRecord {
  return {
    id: 1,
    Record: {
      Client: {
        Address: '123 Test Street',
        Name: 'Test Client Co., Ltd.',
        Tax_ID: '1234567890123',
      },
      Credit_Term: null,
      Date: '2025-08-09T00:00:00.000Z',
      Document_Type: [documentType],
      Items: [
        {
          Description: 'Test Item',
          Manual_Sort: 1,
          Quantity: 1,
          Total: 100,
          Unit_Price: 100,
          id: 3,
        },
      ],
      Number: 'TEST-001',
      Payment_Method: null,
      Provider: {
        Address: '456 Provider Road',
        Email: 'provider@example.com',
        Name: 'Test Provider Co., Ltd.',
        Personnel_Name: 'Test Provider',
        Tax_ID: '9876543210987',
      },
      Reference: null,
      Remarks: null,
      Signed_Document_URL: '',
      Tax: 0.07,
    },
  }
}

describe('SignatureArea', () => {
  it('renders quotation signatures with distinct signature types', () => {
    const wrapper = mount(SignatureArea, {
      props: { record: createRecord('Quotation') },
    })

    const sections = wrapper.findAll('.bd-sign-box')

    expect(sections).toHaveLength(2)
    expect(sections[0]?.attributes('data-signature-type')).toBe('issuer')
    expect(sections[1]?.attributes('data-signature-type')).toBe('approver')
  })

  it('renders invoice signatures with the issuer signature type', () => {
    const wrapper = mount(SignatureArea, {
      props: { record: createRecord('Invoice') },
    })

    const sections = wrapper.findAll('.bd-sign-box')

    expect(sections).toHaveLength(1)
    expect(sections[0]?.attributes('data-signature-type')).toBe('issuer')
  })

  it('draws the signature image only when the provider has one', () => {
    const without = mount(SignatureArea, { props: { record: createRecord('Invoice') } })
    expect(without.find('[data-testid="signature"]').exists()).toBe(false)

    const record = createRecord('Invoice')
    record.Record.Provider.Signature = 'data:image/png;base64,iVBORw0KGgo='
    const withSig = mount(SignatureArea, { props: { record } })
    expect(withSig.get('[data-testid="signature"]').attributes('src')).toBe(
      'data:image/png;base64,iVBORw0KGgo=',
    )
  })

  it('leaves the quotation approver box unsigned', () => {
    const record = createRecord('Quotation')
    record.Record.Provider.Signature = 'data:image/png;base64,iVBORw0KGgo='
    const wrapper = mount(SignatureArea, { props: { record } })
    // the issuer/approver pair is out of redesign scope and stays hand-signed
    expect(wrapper.findAll('[data-testid="signature"]')).toHaveLength(0)
  })

  it('labels the signature by document type', () => {
    const invoice = mount(SignatureArea, { props: { record: createRecord('Invoice') } })
    const receipt = mount(SignatureArea, { props: { record: createRecord('Receipt') } })

    expect(invoice.get('.bd-sign-k').text()).toBe('ลงชื่อผู้วางบิล')
    expect(receipt.get('.bd-sign-k').text()).toBe('ผู้รับเงิน')
  })
})
