"""Gera autos FICTÍCIOS de ~500 páginas no padrão PJe para testar a Leitura de Autos (P25).
Nomes, CNPJs, números de processo e valores são inventados."""
import random
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

random.seed(7)
from PIL import Image, ImageDraw
_im = Image.new("L", (600, 800), 235); _d = ImageDraw.Draw(_im)
for _y in range(60, 760, 22): _d.line((40, _y, 560, _y), fill=90, width=2)
_im.save("scan.png"); IMG = "scan.png"
W, H = A4
PROC = "5001234-56.2024.4.03.6100"
FILLER = ("Nos termos da legislação aplicável e da jurisprudência consolidada, a matéria comporta "
          "análise detida dos elementos constantes dos autos, observados o contraditório e a ampla defesa. ")

PECAS = [
    # (titulo no topo, n_paginas, assinante, frases-chave)
    ("EXCELENTÍSSIMO SENHOR DOUTOR JUIZ FEDERAL DA 6ª VARA CÍVEL DE SÃO PAULO", 14, "HELENA MONTEIRO",
     ["ALPHA CONSTRUÇÕES CIVIS LTDA vem, respeitosamente, propor AÇÃO DE REPETIÇÃO DE INDÉBITO TRIBUTÁRIO em face da UNIÃO FEDERAL.",
      "Requer a restituição do PIS e da COFINS recolhidos a maior, no montante de R$ 1.250.000,00, corrigidos pela taxa SELIC.",
      "Dá-se à causa o valor de R$ 1.250.000,00."]),
    ("PROCURAÇÃO AD JUDICIA ET EXTRA", 2, "HELENA MONTEIRO", ["Outorgante: ALPHA CONSTRUÇÕES CIVIS LTDA."]),
    ("DOCUMENTOS - NOTAS FISCAIS E GUIAS DARF", 40, "HELENA MONTEIRO", ["DARF código 8109 PIS período de apuração.", "DARF código 2172 COFINS período de apuração."]),
    ("DESPACHO", 1, "JUIZ FEDERAL SUBSTITUTO", ["Cite-se a União Federal para contestar no prazo legal."]),
    ("CERTIDÃO", 1, "SERVIDOR DA SECRETARIA", ["Certifico que a União foi citada eletronicamente."]),
    ("CONTESTAÇÃO", 18, "PROCURADOR DA FAZENDA NACIONAL",
     ["A UNIÃO FEDERAL alega, preliminarmente, a ocorrência de prescrição quinquenal quanto aos recolhimentos anteriores a cinco anos do ajuizamento.",
      "No mérito, sustenta a legitimidade da inclusão do ICMS na base de cálculo em períodos anteriores à modulação."]),
    ("RÉPLICA - IMPUGNAÇÃO À CONTESTAÇÃO", 9, "HELENA MONTEIRO", ["A autora refuta a prescrição, pois o pedido se limita aos últimos 60 meses."]),
    ("DECISÃO", 3, "JUIZ FEDERAL SUBSTITUTO", ["Defiro a produção de prova pericial contábil e nomeio perito o contador SÉRGIO DUARTE.", "Honorários periciais fixados em R$ 18.500,00."]),
    ("LAUDO PERICIAL CONTÁBIL", 60, "SÉRGIO DUARTE",
     ["O perito apurou recolhimento a maior de R$ 1.187.432,19 no período de 60 meses.",
      "Resposta ao quesito 7: não há recolhimentos anteriores ao quinquênio no cálculo.",
      "Tabela de apuração mensal com memória de cálculo anexa."]),
    ("MANIFESTAÇÃO SOBRE O LAUDO", 6, "HELENA MONTEIRO", ["A autora concorda com o valor apurado pelo perito."]),
    ("SENTENÇA", 12, "JUIZ FEDERAL",
     ["Ante o exposto, JULGO PROCEDENTE o pedido para condenar a União à restituição de R$ 1.187.432,19, corrigidos pela SELIC.",
      "Rejeito a alegação de prescrição.",
      "Condeno a União ao pagamento de honorários advocatícios de 10% sobre o valor da condenação, nos termos do art. 85, § 3º, do CPC."]),
    ("APELAÇÃO", 22, "PROCURADOR DA FAZENDA NACIONAL", ["A União requer a reforma da sentença e a redução dos honorários advocatícios."]),
    ("CONTRARRAZÕES DE APELAÇÃO", 14, "HELENA MONTEIRO", ["A apelada pugna pela manutenção integral da sentença."]),
    ("ACÓRDÃO", 16, "DESEMBARGADOR FEDERAL RELATOR",
     ["ACORDAM os Desembargadores Federais da Terceira Turma, por unanimidade, negar provimento à apelação da União.",
      "Honorários recursais majorados para 11%, nos termos do art. 85, § 11, do CPC."]),
    ("CERTIDÃO DE TRÂNSITO EM JULGADO", 1, "SERVIDOR DA SECRETARIA", ["Certifico o trânsito em julgado do acórdão em 12/05/2026."]),
]

def texto_paragrafos(c, x, y, linhas):
    for l in linhas:
        c.drawString(x, y, l[:110])
        y -= 13
    return y

def quebrar(frase, n=100):
    out, cur = [], ""
    for w in frase.split():
        if len(cur) + len(w) + 1 > n:
            out.append(cur); cur = w
        else:
            cur = (cur + " " + w).strip()
    if cur: out.append(cur)
    return out

c = canvas.Canvas("autos_ficticios_500p.pdf", pagesize=A4)
pag_total = 0
num_id = 81234500
dia = 3
alvo = 500
# repete os documentos até ~500 páginas (mais DARFs no meio)
sequencia = list(PECAS)
base = sum(p[1] for p in PECAS)
extra = alvo - base - 12  # reserva p/ escaneadas e brancas
if extra > 0:
    sequencia.insert(3, ("DOCUMENTOS - PLANILHAS SPED CONTRIBUIÇÕES", extra, "HELENA MONTEIRO", ["Registro M200 e M600 do EFD-Contribuições."]))

for (titulo, npag, assinante, chaves) in sequencia:
    num_id += random.randint(3, 40)
    dia = min(28, dia + 1)
    for k in range(1, npag + 1):
        pag_total += 1
        c.setFont("Helvetica", 9)
        c.drawString(40, H - 30, f"Processo {PROC} - Justiça Federal da 3ª Região - PJe")
        y = H - 70
        c.setFont("Helvetica-Bold", 12)
        if k == 1:
            for l in quebrar(titulo, 70):
                c.drawString(60, y, l); y -= 16
            y -= 8
        c.setFont("Helvetica", 10)
        frases = []
        if k == 1:
            frases += chaves
        elif random.random() < 0.25:
            frases.append(random.choice(chaves))
        frases += [FILLER * 2] * 3
        for f in frases:
            y = texto_paragrafos(c, 60, y, quebrar(f)) - 8
        c.setFont("Helvetica", 7)
        c.drawString(40, 40, f"Assinado eletronicamente por: {assinante} - {dia:02d}/03/2025 10:{k % 60:02d}:00")
        c.drawString(40, 30, f"Num. {num_id} - Pág. {k}")
        c.showPage()
    # uma página "escaneada" (só imagem) depois de algumas peças
    if titulo.startswith(("DOCUMENTOS", "LAUDO", "PROCURAÇÃO", "CERTIDÃO")):
        pag_total += 1
        c.drawImage(IMG, 60, 120, W - 120, H - 240)  # página digitalizada: só imagem, sem camada de texto
        c.showPage()

# 2 páginas em branco no fim (comum em digitalizações)
for _ in range(2):
    pag_total += 1; c.showPage()
c.save()
print("paginas", pag_total)
