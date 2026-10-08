"""Documentos FICTÍCIOS para testar a Leitura de documentos. Marca d'água 'FICTÍCIO – SEM VALOR'.
Banco 999 (inexistente), CNPJs/chaves gerados apenas para validar dígitos verificadores."""
import json
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
V = json.load(open("valores_docs.json"))
W, H = A4
def fmt_cnpj(c): return f"{c[:2]}.{c[2:5]}.{c[5:8]}/{c[8:12]}-{c[12:]}"
def doc(nome, linhas, titulo):
    c = canvas.Canvas(f"docs_teste/{nome}", pagesize=A4)
    c.saveState(); c.setFillGray(0.88); c.setFont("Helvetica-Bold", 46); c.translate(W/2, H/2); c.rotate(35)
    c.drawCentredString(0, 0, "FICTÍCIO – SEM VALOR"); c.restoreState()
    c.setFont("Helvetica-Bold", 14); c.drawString(50, H-60, titulo)
    c.setFont("Helvetica", 10); y = H-90
    for l in linhas:
        c.drawString(50, y, l); y -= 16
    c.setFont("Helvetica-Oblique", 7); c.drawString(50, 30, "Documento de teste gerado para a Velatrix AOS. Não possui validade.")
    c.save()
esc = fmt_cnpj(V["cnpjEsc"]); emit = fmt_cnpj(V["cnpjEmit"])
doc("01_boleto_valido.pdf", [
    "Banco 999 - Banco Fictício de Testes S.A.",
    "Beneficiário: Monteiro & Vasconcelos Advogados (fictício)", f"CNPJ do beneficiário: {esc}",
    "Pagador: Alpha Construções Civis Ltda (fictício)", "Vencimento: 15/10/2026", "Valor do documento: R$ 2.500,00",
    "Linha digitável:", V["linha"]], "BOLETO DE COBRANÇA — HONORÁRIOS CONTRATUAIS")
doc("02_boleto_adulterado.pdf", [
    "Banco 999 - Banco Fictício de Testes S.A.",
    "Beneficiário: Monteiro & Vasconcelos Advogados (fictício)", f"CNPJ do beneficiário: {esc}",
    "Vencimento: 15/10/2026", "Valor do documento: R$ 25.000,00",
    "Linha digitável:", V["linha"]], "BOLETO DE COBRANÇA — VALOR IMPRESSO ALTERADO")
doc("03_danfe_nfe.pdf", [
    "DANFE - Documento Auxiliar da Nota Fiscal Eletrônica", "CHAVE DE ACESSO", V["chave"],
    f"Emitente: Tecnologia Jurídica Demo Ltda (fictício) — CNPJ {emit}", f"Destinatário: Monteiro & Vasconcelos Advogados — CNPJ {esc}",
    "Data de emissão: 12/09/2024", "Valor total da nota: R$ 1.200,00"], "NOTA FISCAL ELETRÔNICA — NF-e")
doc("04_comprovante_pix.pdf", [
    "Comprovante de transferência PIX", "ID da transação: E99999999202609291432AbCdEfGhIjK",
    "Data/hora: 29/09/2026 14:32", "Valor: R$ 1.500,00", "Recebedor: Monteiro & Vasconcelos Advogados (fictício)",
    f"CNPJ: {esc}", "PIX copia e cola:", V["pix"][:95], V["pix"][95:]], "COMPROVANTE PIX")
doc("05_procuracao.pdf", [
    "PROCURAÇÃO AD JUDICIA ET EXTRA", "Outorgante: João da Silva (fictício), CPF 529.982.247-25",
    "Cônjuge anuente: Maria da Silva (fictício), CPF 529.982.247-24", "Outorgada: Dra. Helena Monteiro, OAB/SP 118.204",
    f"Processo nº {V['cnj']} — 6ª Vara Cível Federal de São Paulo", "São Paulo, 29/09/2026"], "PROCURAÇÃO")
doc("06_contrato_cnpj_alfanumerico.pdf", [
    "CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS", "CONTRATANTE: Nova Holding Participações (fictício)",
    "CNPJ (novo formato alfanumérico): 12.ABC.345/01DE-35", f"CONTRATADA: Monteiro & Vasconcelos Advogados — CNPJ {esc}",
    "Honorários mensais: R$ 18.000,00, com vencimento todo dia 10.", "Vigência a partir de 01/10/2026."], "CONTRATO")
doc("07_guia_arrecadacao.pdf", [
    "Guia de arrecadação — concessionária de saneamento (fictício)", "Valor a pagar: R$ 158,90",
    f"{V['guia'][:12]} {V['guia'][12:24]} {V['guia'][24:36]} {V['guia'][36:]}"], "CONTA DE ÁGUA")
print("ok")
