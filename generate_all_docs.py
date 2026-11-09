import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
import os
import docx
from docx.shared import Inches as DocxInches, Pt as DocxPt, RGBColor as DocxRGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

# --- Color Definitions ---
C_BG = RGBColor(0x0C, 0x0F, 0x1D)
C_NAVY = RGBColor(0x17, 0x1B, 0x2D)
C_CARD = RGBColor(0x1B, 0x20, 0x34)
C_BORDER = RGBColor(0x2D, 0x34, 0x4E)
C_GREEN = RGBColor(0x1D, 0xFB, 0x9D)
C_WHITE = RGBColor(0xFD, 0xFF, 0xFF)
C_LIGHT_GREY = RGBColor(0xC6, 0xC7, 0xCD)
C_MUTED = RGBColor(0x9F, 0xA2, 0xB4)
C_PINK = RGBColor(0xCD, 0x1D, 0x69)
C_YELLOW = RGBColor(0xFE, 0xCA, 0x00)

prs = pptx.Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

def add_header(slide, eyebrow, title):
    tb_eye = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.7), Inches(0.35))
    tf_eye = tb_eye.text_frame
    tf_eye.word_wrap = True
    p_eye = tf_eye.paragraphs[0]
    p_eye.text = eyebrow.upper()
    p_eye.font.size = Pt(10)
    p_eye.font.bold = True
    p_eye.font.color.rgb = C_GREEN
    
    tb_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.85), Inches(11.7), Inches(0.8))
    tf_title = tb_title.text_frame
    tf_title.word_wrap = True
    p_title = tf_title.paragraphs[0]
    p_title.text = title
    p_title.font.size = Pt(24)
    p_title.font.bold = True
    p_title.font.color.rgb = C_WHITE

def add_footer(slide, current, total):
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(6.8), Inches(11.733), Inches(0.02))
    line.fill.solid()
    line.fill.fore_color.rgb = C_BORDER
    line.line.color.rgb = C_BORDER

    tb = slide.shapes.add_textbox(Inches(0.8), Inches(6.9), Inches(8), Inches(0.4))
    p = tb.text_frame.paragraphs[0]
    p.text = 'MOOV PARCEL  •  0113 322 4100  •  moovparcel.co.uk'
    p.font.size = Pt(9)
    p.font.color.rgb = C_MUTED
    
    tb_pg = slide.shapes.add_textbox(Inches(10.5), Inches(6.9), Inches(2), Inches(0.4))
    p_pg = tb_pg.text_frame.paragraphs[0]
    p_pg.alignment = PP_ALIGN.RIGHT
    p_pg.text = f'Slide {current} of {total}'
    p_pg.font.size = Pt(9)
    p_pg.font.bold = True
    p_pg.font.color.rgb = C_GREEN

def create_card(slide, left, top, width, height, bg_color=C_CARD, border_color=C_BORDER):
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    card.fill.solid()
    card.fill.fore_color.rgb = bg_color
    card.line.color.rgb = border_color
    card.line.width = Pt(1.5)
    return card

# Slide 1: Title
s1 = prs.slides.add_slide(prs.slide_layouts[6])
bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
bg1.fill.solid()
bg1.fill.fore_color.rgb = C_BG
bg1.line.fill.background()

tb1_tag = s1.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(11.7), Inches(0.4))
p = tb1_tag.text_frame.paragraphs[0]
p.text = 'MOOV PARCEL  //  COMMERCIAL SALES METHODOLOGY'
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = C_GREEN

tb1_main = s1.shapes.add_textbox(Inches(0.8), Inches(1.15), Inches(11.7), Inches(1.3))
tf = tb1_main.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "Don't Just Deliver Parcels... Moov Them."
p.font.size = Pt(36)
p.font.bold = True
p.font.color.rgb = C_WHITE

p_sub = tf.add_paragraph()
p_sub.text = 'How Moov Parcel sells as a consultative technology partner — eliminating software taxes, switching carriers to unlock later cut-offs, and protecting retailer margins.'
p_sub.font.size = Pt(14)
p_sub.font.color.rgb = C_LIGHT_GREY

create_card(s1, Inches(0.8), Inches(2.7), Inches(5.7), Inches(3.8), bg_color=C_CARD, border_color=RGBColor(0x55, 0x22, 0x33))
tb_left = s1.shapes.add_textbox(Inches(1.1), Inches(2.9), Inches(5.1), Inches(3.4))
tf_l = tb_left.text_frame
tf_l.word_wrap = True
p = tf_l.paragraphs[0]
p.text = 'THE TRADITIONAL BROKER MODEL'
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = C_PINK
p = tf_l.add_paragraph()
p.text = '• Sells cheap stamps & 5p rate cuts\n• Locks merchants into single-carrier contracts\n• Disappears when collections fail or claims are denied\n• Forces shippers to pay £100s/mo for external software\n• Traps businesses in multi-hour carrier bot queues'
p.font.size = Pt(12)
p.font.color.rgb = C_LIGHT_GREY

create_card(s1, Inches(6.8), Inches(2.7), Inches(5.7), Inches(3.8), bg_color=C_CARD, border_color=C_GREEN)
tb_right = s1.shapes.add_textbox(Inches(7.1), Inches(2.9), Inches(5.1), Inches(3.4))
tf_r = tb_right.text_frame
tf_r.word_wrap = True
p = tf_r.paragraphs[0]
p.text = 'THE MOOV CONSULTATIVE MODEL'
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = C_GREEN
p = tf_r.add_paragraph()
p.text = '• Free proprietary tech: Moov Ninja OMS (£0/month)\n• Multi-carrier switching to match carriers with later cut-offs\n• Tier-1 volume rates across DPD, DHL, InPost, UPS & Evri\n• Single unified weekly invoice across all carriers\n• Dedicated human ops desk (0113 322 4101) fighting claims'
p.font.size = Pt(12)
p.font.color.rgb = C_WHITE
add_footer(s1, 1, 6)

# Slide 2: Market Leaks
s2 = prs.slides.add_slide(prs.slide_layouts[6])
bg2 = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
bg2.fill.solid()
bg2.fill.fore_color.rgb = C_BG
bg2.line.fill.background()
add_header(s2, 'The Market Problem', 'The 3 Hidden Margin Leaks in UK E-Commerce Logistics')

create_card(s2, Inches(0.8), Inches(1.8), Inches(3.7), Inches(4.7))
tb = s2.shapes.add_textbox(Inches(1.05), Inches(2.1), Inches(3.2), Inches(4.2))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = 'LEAK 01'
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = C_GREEN
p = tf.add_paragraph()
p.text = '£2,400+'
p.font.size = Pt(36)
p.font.bold = True
p.font.color.rgb = C_WHITE
p = tf.add_paragraph()
p.text = 'Annual SaaS Tax'
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = C_YELLOW
p = tf.add_paragraph()
p.text = 'Online retailers pay £50 to £250/mo for software like ShipStation, Linnworks, or Shiptheory just to generate carrier labels and sync orders. This is dead overhead draining their bottom line before a single parcel moves.'
p.font.size = Pt(11)
p.font.color.rgb = C_LIGHT_GREY

create_card(s2, Inches(4.8), Inches(1.8), Inches(3.7), Inches(4.7))
tb = s2.shapes.add_textbox(Inches(5.05), Inches(2.1), Inches(3.2), Inches(4.2))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = 'LEAK 02'
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = C_GREEN
p = tf.add_paragraph()
p.text = '18%'
p.font.size = Pt(36)
p.font.bold = True
p.font.color.rgb = C_WHITE
p = tf.add_paragraph()
p.text = 'The Early Cut-Off Trap'
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = C_YELLOW
p = tf.add_paragraph()
p.text = 'When a merchant is stuck with a carrier whose driver arrives at 2:00 or 2:30 PM, they lose afternoon orders. Because they only have one carrier account, they have no easy way to switch to a carrier collecting later in their area.'
p.font.size = Pt(11)
p.font.color.rgb = C_LIGHT_GREY

create_card(s2, Inches(8.8), Inches(1.8), Inches(3.7), Inches(4.7))
tb = s2.shapes.add_textbox(Inches(9.05), Inches(2.1), Inches(3.2), Inches(4.2))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = 'LEAK 03'
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = C_GREEN
p = tf.add_paragraph()
p.text = '3.5 Hrs'
p.font.size = Pt(36)
p.font.bold = True
p.font.color.rgb = C_WHITE
p = tf.add_paragraph()
p.text = 'Weekly Support Limbo'
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = C_YELLOW
p = tf.add_paragraph()
p.text = 'Dealing with couriers directly means fighting automated IVRs, endless ticket delays, and ignored damage claims. Staff spend valuable hours chasing parcels while customer Trustpilot reviews take the hit.'
p.font.size = Pt(11)
p.font.color.rgb = C_LIGHT_GREY
add_footer(s2, 2, 6)

# Slide 3: Quad Engine
s3 = prs.slides.add_slide(prs.slide_layouts[6])
bg3 = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
bg3.fill.solid()
bg3.fill.fore_color.rgb = C_BG
bg3.line.fill.background()
add_header(s3, 'The Moov Solution', 'The Moov Quad-Engine Advantage')

p_width = Inches(5.7)
p_height = Inches(2.25)

create_card(s3, Inches(0.8), Inches(1.8), p_width, p_height, border_color=C_GREEN)
tb = s3.shapes.add_textbox(Inches(1.05), Inches(1.95), Inches(5.2), Inches(1.9))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = '1. PROPRIETARY FREE OMS (MOOV NINJA)'
p.font.size = Pt(12)
p.font.bold = True
p.font.color.rgb = C_GREEN
p = tf.add_paragraph()
p.text = 'Award-winning cloud software with 150+ direct connectors (Shopify, TikTok Shop, Amazon, eBay). 100-order batch printing in 15 seconds, smart routing rules, and barcode validation. 100% free with zero software subscription fees forever.'
p.font.size = Pt(11)
p.font.color.rgb = C_LIGHT_GREY

create_card(s3, Inches(6.8), Inches(1.8), p_width, p_height, border_color=RGBColor(0x65, 0x40, 0xA0))
tb = s3.shapes.add_textbox(Inches(7.05), Inches(1.95), Inches(5.2), Inches(1.9))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = '2. TIER-1 MULTI-CARRIER BUYING POWER'
p.font.size = Pt(12)
p.font.bold = True
p.font.color.rgb = RGBColor(0x99, 0x80, 0xE0)
p = tf.add_paragraph()
p.text = 'Access high-volume discounted tariffs with DPD Local, DHL Express, DHL eCommerce, InPost, UPS, and Evri. Benefit from automated carrier routing rules and receive one unified weekly VAT invoice for simplified bookkeeping.'
p.font.size = Pt(11)
p.font.color.rgb = C_LIGHT_GREY

create_card(s3, Inches(0.8), Inches(4.3), p_width, p_height, border_color=C_YELLOW)
tb = s3.shapes.add_textbox(Inches(1.05), Inches(4.45), Inches(5.2), Inches(1.9))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = '3. CARRIER SWITCHING FOR LATER CUT-OFFS'
p.font.size = Pt(12)
p.font.bold = True
p.font.color.rgb = C_YELLOW
p = tf.add_paragraph()
p.text = 'Trapped with an early 2:30pm driver collection? We audit collection schedules across our carrier network (DPD, DHL, UPS) and switch merchants to a carrier whose local round collects later, plus InPost locker options for after-hours orders.'
p.font.size = Pt(11)
p.font.color.rgb = C_LIGHT_GREY

create_card(s3, Inches(6.8), Inches(4.3), p_width, p_height, border_color=C_PINK)
tb = s3.shapes.add_textbox(Inches(7.05), Inches(4.45), Inches(5.2), Inches(1.9))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = '4. DEDICATED YORKSHIRE OPERATIONS DESK'
p.font.size = Pt(12)
p.font.bold = True
p.font.color.rgb = C_PINK
p = tf.add_paragraph()
p.text = 'Direct phone line (0113 322 4101) to our logistics team in Leeds & Sheffield. We answer immediately — no chatbots, no holds. When parcels are delayed or damaged, our team conducts investigations and files claims for you.'
p.font.size = Pt(11)
p.font.color.rgb = C_LIGHT_GREY
add_footer(s3, 3, 6)

# Slide 4: Consultative Discovery Diagnostic
s4 = prs.slides.add_slide(prs.slide_layouts[6])
bg4 = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
bg4.fill.solid()
bg4.fill.fore_color.rgb = C_BG
bg4.line.fill.background()
add_header(s4, 'Sales Execution', 'How Moov Reps Lead Consultative Discovery')

col_w = Inches(2.75)
col_gap = Inches(0.24)
col_h = Inches(4.7)

pillars = [
    ('PILLAR 01', 'Order Cadence', '• Daily baseline volume\n• Peak & Q4 multiplier\n• Domestic vs Highlands/EU\n• IOSS & customs setup\n\nObjective: Identify volume tier & eliminate hidden regional surcharges.', C_GREEN),
    ('PILLAR 02', 'Freight Mechanics', '• Deadweight vs volumetric cube\n• Poly mailers vs cartons\n• Packaging dead space\n• Liquids, glass & ADR goods\n\nObjective: Rescue merchants from punitive volumetric divisor penalties.', C_YELLOW),
    ('PILLAR 03', 'Tech & Bench Friction', '• Shopify, TikTok, Amazon stack\n• Current software subscription fees\n• Hours spent on manual re-keys\n• 6x4 Zebra thermal label format\n\nObjective: Eliminate £100s/mo in SaaS fees with free Moov Ninja.', C_GREEN),
    ('PILLAR 04', 'Carrier Friction', '• Incumbent driver arrival slot\n• Early cut-offs losing sales\n• Invoice surcharge surprises\n• Response times on lost parcels\n\nObjective: Match carriers with later local rounds & Leeds desk.', C_PINK)
]

for i, (tag, title, desc, color) in enumerate(pillars):
    c_left = Inches(0.8) + i * (col_w + col_gap)
    create_card(s4, c_left, Inches(1.8), col_w, col_h)
    tb = s4.shapes.add_textbox(c_left + Inches(0.18), Inches(2.0), col_w - Inches(0.36), col_h - Inches(0.4))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = tag
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = color
    p = tf.add_paragraph()
    p.text = title
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_WHITE
    p = tf.add_paragraph()
    p.text = desc
    p.font.size = Pt(10)
    p.font.color.rgb = C_LIGHT_GREY
add_footer(s4, 4, 6)

# Slide 5: Commercial Impact
s5 = prs.slides.add_slide(prs.slide_layouts[6])
bg5 = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
bg5.fill.solid()
bg5.fill.fore_color.rgb = C_BG
bg5.line.fill.background()
add_header(s5, 'Commercial Transformation', 'Typical Client P&L Impact: 1,500 Parcels / Month')

c3_w = Inches(3.7)
c3_h = Inches(2.0)

create_card(s5, Inches(0.8), Inches(1.8), c3_w, c3_h)
tb = s5.shapes.add_textbox(Inches(1.0), Inches(1.95), Inches(3.3), Inches(1.7))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = 'SOFTWARE SAVING'
p.font.size = Pt(10)
p.font.bold = True
p.font.color.rgb = C_GREEN
p = tf.add_paragraph()
p.text = '£1,800 / yr'
p.font.size = Pt(28)
p.font.bold = True
p.font.color.rgb = C_WHITE
p = tf.add_paragraph()
p.text = 'Replacing ShipStation/Linnworks with free Moov Ninja.'
p.font.size = Pt(10)
p.font.color.rgb = C_LIGHT_GREY

create_card(s5, Inches(4.8), Inches(1.8), c3_w, c3_h)
tb = s5.shapes.add_textbox(Inches(5.0), Inches(1.95), Inches(3.3), Inches(1.7))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = 'CARRIER TARIFF SAVINGS'
p.font.size = Pt(10)
p.font.bold = True
p.font.color.rgb = C_GREEN
p = tf.add_paragraph()
p.text = '£6,300 / yr'
p.font.size = Pt(28)
p.font.bold = True
p.font.color.rgb = C_WHITE
p = tf.add_paragraph()
p.text = 'Avg 35p saving across DPD, DHL, and InPost multi-carrier split.'
p.font.size = Pt(10)
p.font.color.rgb = C_LIGHT_GREY

create_card(s5, Inches(8.8), Inches(1.8), c3_w, c3_h, border_color=C_GREEN)
tb = s5.shapes.add_textbox(Inches(9.0), Inches(1.95), Inches(3.3), Inches(1.7))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = 'TOTAL ANNUAL BENEFIT'
p.font.size = Pt(10)
p.font.bold = True
p.font.color.rgb = C_GREEN
p = tf.add_paragraph()
p.text = '£14,100 / yr'
p.font.size = Pt(28)
p.font.bold = True
p.font.color.rgb = C_GREEN
p = tf.add_paragraph()
p.text = 'Including 2 hrs/day packing labour saved and recovered claims.'
p.font.size = Pt(10)
p.font.color.rgb = C_WHITE

create_card(s5, Inches(0.8), Inches(4.1), Inches(11.7), Inches(2.4), bg_color=C_CARD)
tb_btm = s5.shapes.add_textbox(Inches(1.1), Inches(4.3), Inches(11.1), Inches(2.0))
tf_b = tb_btm.text_frame
tf_b.word_wrap = True
p = tf_b.paragraphs[0]
p.text = 'HOW THE COMMERCIAL AUDIT CREATES A NO-BRAINER DECISION'
p.font.size = Pt(12)
p.font.bold = True
p.font.color.rgb = C_WHITE
p = tf_b.add_paragraph()
p.text = 'When we present our proposal, we present a holistic operational audit rather than just a rate card. Even if an incumbent carrier matches our base parcel rate, they cannot match the £1,800 software elimination, the recovered packing labour from 100-order batch printing, or the dedicated Leeds operations desk. We reframe logistics as an EBITDA growth driver.'
p.font.size = Pt(11)
p.font.color.rgb = C_LIGHT_GREY
add_footer(s5, 5, 6)

# Slide 6: 72-Hour Onboarding
s6 = prs.slides.add_slide(prs.slide_layouts[6])
bg6 = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
bg6.fill.solid()
bg6.fill.fore_color.rgb = C_BG
bg6.line.fill.background()
add_header(s6, 'Client Onboarding', 'The 72-Hour Frictionless Transition Blueprint')

step_w = Inches(3.7)
step_h = Inches(3.6)

create_card(s6, Inches(0.8), Inches(1.8), step_w, step_h)
tb = s6.shapes.add_textbox(Inches(1.05), Inches(2.0), Inches(3.2), Inches(3.2))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = 'DAY 1'
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = C_GREEN
p = tf.add_paragraph()
p.text = 'Connect & Audit'
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = C_WHITE
p = tf.add_paragraph()
p.text = '• Side-by-side tariff & software savings model approved\n• 10-minute Moov Ninja API sync to Shopify / TikTok / Amazon\n• Product SKUs & order channels imported automatically with zero coding'
p.font.size = Pt(11)
p.font.color.rgb = C_LIGHT_GREY

create_card(s6, Inches(4.8), Inches(1.8), step_w, step_h)
tb = s6.shapes.add_textbox(Inches(5.05), Inches(2.0), Inches(3.2), Inches(3.2))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = 'DAY 2'
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = C_GREEN
p = tf.add_paragraph()
p.text = 'Bench Calibration'
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = C_WHITE
p = tf.add_paragraph()
p.text = '• Zebra 6x4 thermal printer output calibrated and verified\n• Carrier collection timing confirmed or switched to carrier with later local pickup\n• Automated routing rules configured by weight & destination'
p.font.size = Pt(11)
p.font.color.rgb = C_LIGHT_GREY

create_card(s6, Inches(8.8), Inches(1.8), step_w, step_h, border_color=C_GREEN)
tb = s6.shapes.add_textbox(Inches(9.05), Inches(2.0), Inches(3.2), Inches(3.2))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = 'DAY 3'
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = C_GREEN
p = tf.add_paragraph()
p.text = 'Live Dispatch'
p.font.size = Pt(16)
p.font.bold = True
p.font.color.rgb = C_WHITE
p = tf.add_paragraph()
p.text = '• First live manifest generated and collected by carrier\n• Leeds/Sheffield desk monitors deliveries in real time\n• Parallel running enabled so the merchant experiences zero risk or downtime'
p.font.size = Pt(11)
p.font.color.rgb = C_LIGHT_GREY

create_card(s6, Inches(0.8), Inches(5.6), Inches(11.7), Inches(0.95), bg_color=RGBColor(0x13, 0x2A, 0x28), border_color=C_GREEN)
tb_callout = s6.shapes.add_textbox(Inches(1.1), Inches(5.7), Inches(11.1), Inches(0.8))
tf_c = tb_callout.text_frame
tf_c.word_wrap = True
p = tf_c.paragraphs[0]
p.text = 'ZERO-DOWNTIME PROMISE: Incumbent couriers run in parallel until the merchant is 100% satisfied. No disruption, no failed shipments.'
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = C_GREEN
add_footer(s6, 6, 6)

pptx_out = '/Users/rossjermy/Documents/InterPricing/Moov_Parcel_How_We_Sell.pptx'
prs.save(pptx_out)
print(f'Saved updated PPTX to: {pptx_out}')

# ============================================================
# GENERATE MICROSOFT WORD (.DOCX) SALES DISCOVERY BLUEPRINT
# ============================================================
doc = docx.Document()

# Page Margins
for section in doc.sections:
    section.top_margin = DocxInches(0.7)
    section.bottom_margin = DocxInches(0.7)
    section.left_margin = DocxInches(0.7)
    section.right_margin = DocxInches(0.7)

# Brand Color Helpers
RGB_DARK = DocxRGBColor(0x17, 0x1B, 0x2D)
RGB_GREEN = DocxRGBColor(0x1A, 0x74, 0x5A) # printable green
RGB_GREY = DocxRGBColor(0x55, 0x55, 0x55)

# Title & Brand Header
p_top = doc.add_paragraph()
r_brand = p_top.add_run('MOOV PARCEL  •  COMMERCIAL SALES BLUEPRINT & DISCOVERY GUIDE\n')
r_brand.font.size = DocxPt(10)
r_brand.font.bold = True
r_brand.font.color.rgb = RGB_GREEN

r_title = p_top.add_run('Sales Discovery & Call Matrix Blueprint')
r_title.font.size = DocxPt(22)
r_title.font.bold = True
r_title.font.color.rgb = RGB_DARK

p_sub = doc.add_paragraph()
r_sub = p_sub.add_run("Desk Reference & Call Matrix for Consultative Discovery  |  Proprietary Free Tech (Moov Ninja)  |  Multi-Carrier (DPD, DHL, InPost, UPS, Evri)  |  Direct Yorkshire Ops Desk: 0113 322 4101")
r_sub.font.size = DocxPt(9.5)
r_sub.font.color.rgb = RGB_GREY

# Divider
p_div = doc.add_paragraph()
p_div.paragraph_format.space_after = DocxPt(12)
r_div = p_div.add_run('—' * 55)
r_div.font.color.rgb = RGB_GREEN

# Rep Call Metadata Table
table_meta = doc.add_table(rows=1, cols=4)
table_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
hdr_cells = table_meta.rows[0].cells
hdr_cells[0].text = "Company: ____________________"
hdr_cells[1].text = "Contact / Role: _____________"
hdr_cells[2].text = "Phone / Email: _____________"
hdr_cells[3].text = "Date / Rep: ________________"
for cell in hdr_cells:
    for paragraph in cell.paragraphs:
        for run in paragraph.runs:
            run.font.size = DocxPt(9)
            run.font.bold = True

doc.add_paragraph().paragraph_format.space_after = DocxPt(10)

# Section 1: Executive Philosophy
h1 = doc.add_heading(level=1)
r = h1.add_run('1. Strategic Positioning: How Moov Wins')
r.font.size = DocxPt(14)
r.font.bold = True
r.font.color.rgb = RGB_DARK

p_phil = doc.add_paragraph()
p_phil.add_run(
    "Most freight brokers sell 'cheap postage' and try to shave 5p off an invoice. Moov Parcel sells as a consultative logistics partner. "
    "We diagnose operational margin leaks across the merchant's warehouse floor, technology stack, and carrier service levels.\n\n"
    "• Free Proprietary Technology: Moov Ninja is 100% free with 150+ native e-commerce store connectors.\n"
    "• Carrier Switching for Later Cut-offs: If their current carrier forces an early 2:30pm cut-off, we can switch them to a carrier on our platform whose local schedule collects later, or utilise InPost locker injection.\n"
    "• Multi-Carrier Resilience: DPD, DHL Express, InPost, UPS, and Evri managed on a single platform with one consolidated weekly invoice.\n"
    "• Dedicated Yorkshire Support Desk: Real humans (0113 322 4101) in Leeds & Sheffield who proactively investigate delayed parcels and manage claims."
)
for run in p_phil.runs:
    run.font.size = DocxPt(10)

# Section 2: Opening Gambits
h2 = doc.add_heading(level=1)
r = h2.add_run('2. High-Converting Conversational Openers (The First 30 Seconds)')
r.font.size = DocxPt(14)
r.font.bold = True
r.font.color.rgb = RGB_DARK

scripts = [
    ("Angle 01: The SaaS Fee Killer (Shopify / Multi-Channel Retailers)",
     "\"Hi [First Name], it's [Your Name] with Moov Parcel. I know I caught you out of the blue — got 30 seconds to see if this is even relevant? ... We connect online retailers into discounted DPD, DHL, and InPost rates without charging a single penny for the order software. Most brands we speak with are paying £100s/mo for tools like ShipStation or manually keying in addresses. Who handles your daily carrier collections at the moment?\"",
     "Why It Works: Acknowledges the cold call interruption, immediately pitches zero software fees to put money back in their pocket, and isolates the operational decision maker."),
    
    ("Angle 02: Carrier Route Matching for Later Cut-offs (Volume Dispatchers)",
     "\"Hi [First Name], [Your Name] from Moov Parcel. Reason for my call is we've been speaking with online retailers in your area whose couriers turn up at 2:00 or 2:30 PM, which cuts off their afternoon sales. Through our multi-carrier platform, we can often switch retailers to a carrier whose local schedule collects later in the day, or use InPost drop-offs. What time does your driver pull up for collection at the moment?\"",
     "Why It Works: Touches a major operational nerve (early driver arrivals costing afternoon checkout conversions) by offering multi-carrier routing flexibility rather than rate haggling."),

    ("Angle 03: Support Limbo & Damaged Claims (Frustrated Shippers)",
     "\"Hi [First Name], [Your Name] from Moov Parcel. We act as the logistics partner for UK brands shipping on DPD, DHL, and UPS, but with one big difference: our clients never sit in carrier call queues or fight bots over damaged parcels — our dedicated Yorkshire desk sorts it directly. When a parcel goes missing right now, who gets stuck having to chase it up?\"",
     "Why It Works: Targets the operational agony of carrier automated phone trees and rejected compensation claims.")
]

for title, script_text, logic in scripts:
    p_st = doc.add_paragraph()
    r = p_st.add_run(f'• {title}\n')
    r.font.size = DocxPt(11)
    r.font.bold = True
    r.font.color.rgb = RGB_GREEN

    p_sc = doc.add_paragraph()
    p_sc.paragraph_format.left_indent = DocxInches(0.2)
    r_sc = p_sc.add_run(script_text)
    r_sc.font.size = DocxPt(9.5)
    r_sc.font.italic = True

    p_lg = doc.add_paragraph()
    p_lg.paragraph_format.left_indent = DocxInches(0.2)
    r_lg = p_lg.add_run(f'Strategic Rationale: {logic}\n')
    r_lg.font.size = DocxPt(9)
    r_lg.font.color.rgb = RGB_GREY

# Section 3: The 4-Pillar Consultative Discovery Framework
h3 = doc.add_heading(level=1)
r = h3.add_run('3. The 4-Pillar Consultative Discovery Diagnostic')
r.font.size = DocxPt(14)
r.font.bold = True
r.font.color.rgb = RGB_DARK

discovery_table = doc.add_table(rows=1, cols=3)
discovery_table.alignment = WD_TABLE_ALIGNMENT.CENTER
hdr = discovery_table.rows[0].cells
hdr[0].text = "Diagnostic Pillar & Focus"
hdr[1].text = "Trigger Question to Ask (Verbatim Rep Script)"
hdr[2].text = "Commercial Opportunity & Notes"
for cell in hdr:
    for paragraph in cell.paragraphs:
        for run in paragraph.runs:
            run.font.size = DocxPt(9.5)
            run.font.bold = True

questions_data = [
    ("Pillar 1: Order Velocity & Seasonality",
     "\"Roughly how many parcels are leaving the packing bench on a normal Tuesday or Wednesday? Does that spike 2x or 5x during Black Friday and Q4? Where do orders go (UK Mainland vs Highlands/Islands or Europe)?\"",
     "Uncover volume tier for collective pricing; route Highlands/Islands away from punitive carrier surcharges; verify IOSS European readiness."),
    
    ("Pillar 2: Freight Mechanics & Volumetric Profile",
     "\"What does your typical parcel profile look like? Are you shipping lightweight bulky boxes or heavy compact parcels? Do you ship any liquids, glass, or lithium batteries?\"",
     "Volumetric divisor rescue (prevent paying for 4kg volumetric weight on an 800g item); identify hazardous goods (ADR) compliance."),

    ("Pillar 3: Technology Stack & Packing Bench Friction",
     "\"Where do sales orders come in from (Shopify, TikTok Shop, Amazon)? How do they get into shipping labels — are you paying £50–£200/mo for ShipStation or manually keying addresses?\"",
     "Immediate £1,000–£3,000/yr savings by replacing third-party SaaS with free Moov Ninja. 100-order batch printing saves 1.5–2 hours of packing labour daily."),

    ("Pillar 4: Carrier SLAs, Cut-offs & Customer Service",
     "\"What time does your collection driver arrive? If their driver turns up early (e.g. 2:30pm), would switching to a carrier who can collect later in your area help you win more same-day orders? What happens when parcels go missing?\"",
     "Switch to a carrier with a later afternoon collection round in their postcode, or position InPost locker injection; introduce 0113 322 4101 direct Yorkshire desk.")
]

for p_title, q_text, notes in questions_data:
    row = discovery_table.add_row().cells
    row[0].text = p_title
    row[1].text = q_text
    row[2].text = notes
    for cell in row:
        for paragraph in cell.paragraphs:
            for run in paragraph.runs:
                run.font.size = DocxPt(9)

doc.add_paragraph().paragraph_format.space_after = DocxPt(12)

# Section 4: Consultative Alignment Matrix
h4 = doc.add_heading(level=1)
r = h4.add_run('4. Consultative Solution Alignment Matrix')
r.font.size = DocxPt(14)
r.font.bold = True
r.font.color.rgb = RGB_DARK

align_table = doc.add_table(rows=1, cols=3)
align_table.alignment = WD_TABLE_ALIGNMENT.CENTER
hdr = align_table.rows[0].cells
hdr[0].text = "Identified Shipper Problem"
hdr[1].text = "The Moov Consultative Pivot"
hdr[2].text = "Direct Commercial & Operational Impact"
for cell in hdr:
    for paragraph in cell.paragraphs:
        for run in paragraph.runs:
            run.font.size = DocxPt(9.5)
            run.font.bold = True

alignment_rows = [
    ("Manual One-by-One Booking\n(Click & Drop or carrier portals)",
     "\"We plug Moov Ninja directly into your Shopify and TikTok Shop in 10 minutes. 100-order batch printing eliminates 2 hours of manual copying every morning.\"",
     "Recovers warehouse labour wages, eliminates address typos, and speeds up customer delivery dispatch."),

    ("The 'SaaS Subscription Tax'\n(Paying £50–£250/mo for ShipStation/Linnworks)",
     "\"Moov Ninja is our proprietary software and is 100% free for all our shipping clients with 150+ direct connectors. You can cancel that monthly software bill tomorrow.\"",
     "Direct bottom-line margin expansion (£1,200–£3,000/yr saved) before even factoring in parcel rate discounts."),

    ("Early Courier Cut-Off\n(Incumbent driver arrives at 2:00 or 2:30 PM)",
     "\"Because we work with DPD, DHL, and UPS, we can audit local carrier collection rounds in your postcode and switch you to a carrier that supports a later afternoon collection, plus InPost locker options.\"",
     "Enables later same-day order processing windows, improving store checkout conversion rates without changing packing benches."),

    ("Single-Carrier Vulnerability\n(Trapped by regional hub delays or strikes)",
     "\"Through Moov, you unlock DPD, DHL, InPost, and UPS on a single dashboard and single weekly consolidated VAT invoice. If one carrier struggles, automated rules re-route parcels instantly.\"",
     "Zero downtime, flexible delivery choices (lockers vs doorsteps), and simplified accounting reconciliation."),

    ("Carrier Support Limbo\n(Waiting days on hold or chasing chatbot tickets)",
     "\"Our clients get a dedicated human support desk in Yorkshire (0113 322 4101). When a parcel goes missing, our team pursues the investigation and files the claim for you. No bots. Ever.\"",
     "Protects customer reviews (Trustpilot/Google) and eliminates lost revenue from unpaid damage claims.")
]

for prob, pivot, impact in alignment_rows:
    row = align_table.add_row().cells
    row[0].text = prob
    row[1].text = pivot
    row[2].text = impact
    for cell in row:
        for paragraph in cell.paragraphs:
            for run in paragraph.runs:
                run.font.size = DocxPt(9)

doc.add_paragraph().paragraph_format.space_after = DocxPt(12)

# Section 5: 72-Hour Onboarding Blueprint
h5 = doc.add_heading(level=1)
r = h5.add_run('5. The 72-Hour Frictionless Onboarding Blueprint')
r.font.size = DocxPt(14)
r.font.bold = True
r.font.color.rgb = RGB_DARK

p_ob = doc.add_paragraph()
p_ob.add_run(
    "• Step 1: Outbound / Inbound Hook — Deliver 30-sec pitch; isolate decision maker; establish willingness to review operational efficiency.\n"
    "• Step 2: Structured Discovery — Run the 4-Pillar Discovery Matrix; log parcel profile, formats, channels, and cut-off bottlenecks.\n"
    "• Step 3: Rate Card & Proposal Prep — Generate side-by-side carrier comparison (DPD, DHL, InPost, Evri, UPS) + calculate software savings (£0 Moov Ninja).\n"
    "• Step 4: Consultative Walkthrough — Review rates live with client; demonstrate Moov Ninja store connector; agree on preferred carrier split or later collection switch.\n"
    "• Step 5: Clean Handoff & Zero-Downtime Transition — Execute agreement; pass operational specs to Onboarding Team (API setup, 6x4 printer test, carrier collection booking). Dual-run with incumbent courier until 100% satisfied.\n\n"
    "REMINDER FOR REPS: Moov Parcel is a tech-enabled consultative partner, not a price-fighter. Sell the peace of mind: Free software (Moov Ninja), multi-carrier flexibility, route switching for later cut-offs, and dedicated humans fighting claims."
)
for run in p_ob.runs:
    run.font.size = DocxPt(10)

docx_out = '/Users/rossjermy/Documents/InterPricing/Moov_Parcel_Sales_Discovery_Blueprint.docx'
doc.save(docx_out)
print(f'Saved DOCX to: {docx_out}')

