# Mirror of the Documents.Record formula in the Grist doc "PEAK Personal Books"
# (vbeQK1RgxppuR1ddy1Ee94, Finance workspace). Keep the two in sync -- the widget
# renders whatever this produces, and GristRecordSchema in document-schema.ts
# must accept it.
#
# Grist exposes the current record as `rec`; the column formula ends with
#   return serialize_record(rec)
# NOT `$rec`, which desugars to rec.rec and raises AttributeError on every row.

def serialize_client(client):
    return {"Address": client.Address, "Name": client.Name, "Tax_ID": client.Tax_ID}

def serialize_provider(p):
    return {"Address": p.Address, "Email": p.Email or None, "Name": p.Name,
            "Personnel_Name": p.Personnel_Name or None,
            "Phone": getattr(p, "Phone", None) or None,
            "Role": getattr(p, "Role", None) or None,
            # Handwritten signature: a data: URI (keeps share links self-contained
            # and the image off any public URL) or an http(s) URL.
            "Signature": getattr(p, "Signature", None) or None,
            "Tax_ID": p.Tax_ID}

def serialize_item(item):
    return {"Description": item.Description, "Manual_Sort": item.Manual_Sort or None,
            "Quantity": item.Quantity, "Total": item.Total,
            "Unit_Price": item.Unit_Price, "id": item.id}

def serialize_payment_method(pm):
    if not pm:
        return None
    return {"Account_Holder": pm.Account_Holder or None, "Account_Number": pm.Account_Number or None,
            "Bank": pm.Bank or None, "Branch": pm.Branch or None, "Name": pm.Name,
            "PromptPay": pm.PromptPay or None}

def serialize_reference(ref):
    if not ref:
        return None
    return {"Number": ref.Number}

def parse_channel(raw):
    """Receipts.Channel arrives from PEAK as one blob:

        "ธ.กสิกรไทย ออมทรัพย์ - 2198640134 นาย ณัฐชนน นินยวี"   or   "เงินสด"

    The receipt has to name the channel actually used *and* where the money
    landed, so split it into the fields the settlement block renders.
    """
    raw = (raw or "").strip()
    blank = {"Channel": None, "Bank": None, "Account_Number": None, "Account_Holder": None}
    if not raw:
        return blank
    if u"เงินสด" in raw:
        return dict(blank, Channel=u"เงินสด")
    if " - " in raw:
        left, right = raw.split(" - ", 1)
        lp = left.split(None, 1)
        rp = right.split(None, 1)
        acct = ((lp[1] if len(lp) > 1 else "") + " " + rp[0]).strip()
        return {"Channel": u"โอนผ่านธนาคาร",
                "Bank": lp[0],
                "Account_Number": acct or None,
                "Account_Holder": (rp[1] if len(rp) > 1 else None)}
    return dict(blank, Channel=raw)

def serialize_settlement(doc):
    """(1) Receipt settlement. Figures live on Receipts, reached via the
    Documents.Receipt reference; None on invoices, which drops the block."""
    r = getattr(doc, "Receipt", None)
    if not r:
        return None
    ch = parse_channel(getattr(r, "Channel", None))
    return {"Account_Holder": ch["Account_Holder"], "Account_Number": ch["Account_Number"],
            "Bank": ch["Bank"], "Channel": ch["Channel"],
            "Gross": r.Gross, "Net_Transfer": r.NetTransfer,
            "Paid_Date": str(r.PaidDate) if r.PaidDate else "",
            "PromptPay": None, "WHT": r.WHT}

def serialize_record(doc):
    return {
        "Attention": getattr(doc, "Attention", None) or None,  # (8) เรียน
        "Client": serialize_client(doc.Client),
        "Credit_Term": doc.Credit_Term or None,  # (2) due date derives from this
        "Date": str(doc.Date) if doc.Date else "",
        "Document_Type": doc.Document_Type,
        "Items": [serialize_item(i) for i in doc.Items],
        "Number": doc.Number,
        "Payment_Method": serialize_payment_method(doc.Payment_Method),
        "Provider": serialize_provider(doc.Provider),
        "Reference": serialize_reference(doc.Reference),
        "Remarks": doc.Remarks or None,
        "Settlement": serialize_settlement(doc),
        "Show_Contact_Back": bool(getattr(doc, "Show_Contact_Back", False)),  # (9)
        "Signed_Document_URL": doc.Signed_Document_URL or None,
        "Tax": doc.Tax,
        # Partial WHT (labour only); Tax stays 0 when this is set.
        "WHT": getattr(doc, "WHT", None) or None,
    }

return serialize_record(rec)
