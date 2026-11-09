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

# ============================================================
# 1. GENERATE POWERPOINT (PPTX) - 16:9 DENSE & ACCURATE
# ============================================================
prs = pptx.Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

C_BG = RGBColor(0x0B, 0x0E, 0x1B)
C_CARD = RGBColor(0x17, 0x1B, 0x2D)
C_BORDER = RGBColor(0x27, 0x2E, 0x45)
C_GREEN = RGBColor(0x1D, 0xFB, 0x9D)
C_WHITE = RGBColor(0xFD, 0xFF, 0xFF)
C_LIGHT_GREY = RGBColor(0xC6, 0xC7, 0xCD)
C_MUTED = RGBColor(0x9F, 0xA2, 0xB4)
C_PINK = RGBColor(0xCD, 0x1D, 0x69)
C_YELLOW = RGBColor(0xFE, 0xCA, 0x00)

def add_header(slide, eyebrow, title, subtext=''):
    tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(1.1))
    tf = tb.text_frame
    tf.word_wrap = True
    p1 = tf.paragraphs[0]
    p1.text = eyebrow.upper()
    p1.font.size = Pt(9.5)
    p1.font.bold = True
    p1.font.color.rgb = C_GREEN
    
    p2 = tf.add_paragraph()
    p2.text = title
    p2.font.size = Pt(22)
    p2.font.bold = True
    p2.font.color.rgb = C_WHITE
    
    if subtext:
        p3 = tf.add_paragraph()
        p3.text = subtext
        p3.font.size = Pt(10)
        p3.font.color.rgb = C_MUTED

def add_footer(slide, current, total):
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(6.9), Inches(11.733), Inches(0.015))
    line.fill.solid()
    line.fill.fore_color.rgb = C_BORDER
    line.line.color.rgb = C_BORDER

    tb = slide.shapes.add_textbox(Inches(0.8), Inches(6.95), Inches(8), Inches(0.35))
    p = tb.text_frame.paragraphs[0]
    p.text = 'MOOV PARCEL  •  COMMERCIAL SALES BLUEPRINT  •  0113 322 4100  •  moovparcel.co.uk'
    p.font.size = Pt(8.5)
    p.font.color.rgb = C_MUTED
    
    tb_pg = slide.shapes.add_textbox(Inches(10.5), Inches(6.95), Inches(2), Inches(0.35))
    p_pg = tb_pg.text_frame.paragraphs[0]
    p_pg.alignment = PP_ALIGN.RIGHT
    p_pg.text = f'Slide {current} of {total}'
    p_pg.font.size = Pt(8.5)
    p_pg.font.bold = True
    p_pg.font.color.rgb = C_GREEN

def create_card(slide, left, top, width, height, bg_color=C_CARD, border_color=C_BORDER):
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    card.fill.solid()
    card.fill.fore_color.rgb = bg_color
    card.line.color.rgb = border_color
    card.line.width = Pt(1.2)
    return card

# Slide 1: Philosophy
s1 = prs.slides.add_slide(prs.slide_layouts[6])
bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
bg1.fill.solid()
bg1.fill.fore_color.rgb = C_BG
bg1.line.fill.background()
add_header(s1, 'Moov Parcel // Commercial Identity & Methodology', 
           "Don't Just Deliver Parcels... Moov Them.", 
           "The Consultative Standard: Why Moov rejects the 5p rate-cutting broker trap to become an essential e-commerce growth partner.")

create_card(s1, Inches(0.8), Inches(1.65), Inches(5.7), Inches(4.5), border_color=RGBColor(0x66, 0x22, 0x38))
tb = s1.shapes.add_textbox(Inches(1.0), Inches(1.8), Inches(5.3), Inches(4.2))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = 'THE INCUMBENT BROKER MODEL (BROKEN)'
p.font.size = Pt(10.5)
p.font.bold = True
p.font.color.rgb = C_PINK
p = tf.add_paragraph()
p.text = 'The "Cheap Stamp" Race to the Bottom'
p.font.size = Pt(14)
p.font.bold = True
p.font.color.rgb = RGBColor(0xFF, 0x9B, 0xBB)
p = tf.add_paragraph()
p.text = '• Sells 5p rate cuts while ignoring warehouse bottlenecks\n• Forces shippers to pay £50–£250/mo for ShipStation or key manually\n• Single-carrier trap: regional driver shortages or strikes halt dispatch\n• Early 2:00–2:30pm driver cut-offs choke afternoon store checkouts\n• Support black hole: abandoned to automated IVRs & denied claims'
p.font.size = Pt(10.5)
p.font.color.rgb = C_LIGHT_GREY

create_card(s1, Inches(6.8), Inches(1.65), Inches(5.7), Inches(4.5), border_color=C_GREEN)
tb = s1.shapes.add_textbox(Inches(7.0), Inches(1.8), Inches(5.3), Inches(4.2))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = 'THE MOOV CONSULTATIVE MODEL'
p.font.size = Pt(10.5)
p.font.bold = True
p.font.color.rgb = C_GREEN
p = tf.add_paragraph()
p.text = 'The Tech-Enabled Commerce Partner'
p.font.size = Pt(14)
p.font.bold = True
p.font.color.rgb = C_WHITE
p = tf.add_paragraph()
p.text = '• Free proprietary tech: Moov Ninja OMS (£0/mo) with 150+ direct connectors\n• Carrier Switching: audit local routes across DPD/DHL/UPS to unlock later cut-offs\n• Multi-Carrier Buying Power: collective volume rates on one weekly invoice\n• 100-Order 1-Click Batch: cuts 2 hours of daily packing bench re-keys\n• Dedicated Yorkshire Desk: real people (0113 322 4101) fighting claims'
p.font.size = Pt(10.5)
p.font.color.rgb = C_LIGHT_GREY

create_card(s1, Inches(0.8), Inches(6.25), Inches(11.733), Inches(0.55), bg_color=RGBColor(0x13, 0x17, 0x26))
tb_eco = s1.shapes.add_textbox(Inches(1.0), Inches(6.32), Inches(11.3), Inches(0.4))
p = tb_eco.text_frame.paragraphs[0]
p.text = 'DIRECT CARRIER PARTNERS:  DPD Local  •  DHL Express  •  DHL eCommerce  •  InPost Lockers  •  UPS Standard  •  Evri Domestic'
p.font.size = Pt(9.5)
p.font.bold = True
p.font.color.rgb = C_GREEN
add_footer(s1, 1, 6)

# Slide 2: Margin Leaks
s2 = prs.slides.add_slide(prs.slide_layouts[6])
bg2 = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
bg2.fill.solid()
bg2.fill.fore_color.rgb = C_BG
bg2.line.fill.background()
add_header(s2, 'Market Diagnostic // Financial Leaks',
           'The 4 Hidden Margin Leaks in UK E-Commerce Logistics',
           'Every consultative discovery conversation uncovers and prices these four operational cost drains before quoting a single tariff.')

c_w = Inches(2.78)
c_h = Inches(4.6)
gap = Inches(0.2)

leaks = [
    ('LEAK 01 • TECH TAX', '£2,400+', 'Annual SaaS Subscription Fee',
     'Retailers pay £50 to £250/month for software like ShipStation, Linnworks, or Shiptheory just to print courier labels and sync tracking numbers.\n\nMOOV FIX: Moov Ninja is 100% free with 150+ direct integrations. Drops software overhead to £0 forever.', C_GREEN),
    ('LEAK 02 • CUT-OFF PENALTY', '18%', 'Lost Afternoon Conversions',
     'Early 2:00–2:30pm driver collections force stores into an uncompetitive cut-off time. Modern shoppers abandon carts when same-day dispatch is unavailable.\n\nMOOV FIX: We switch merchants to a carrier on our platform that collects later in their postcode, plus InPost lockers.', C_YELLOW),
    ('LEAK 03 • VOLUMETRIC CUBE', '35%', 'Punitive Volumetric Surcharges',
     'Lightweight goods in standard cartons (e.g. 800g apparel in a 40cm box) trigger 4kg+ volumetric charges under standard carrier divisor formulas.\n\nMOOV FIX: Multi-carrier routing matches bulky goods to carriers with friendly volumetric divisors.', C_PINK),
    ('LEAK 04 • SERVICE LIMBO', '3.5 Hrs', 'Weekly Staff Time in Bot Queues',
     'Warehouse managers and founders waste hours on hold with carrier call centers, fighting IVR bots, and writing off unpaid damaged parcel claims.\n\nMOOV FIX: Dedicated Leeds desk (0113 322 4101) directly files claims, tracks delays, and protects reviews.', RGBColor(0x99, 0x80, 0xE0))
]

for i, (tag, stat, sub, desc, col) in enumerate(leaks):
    left = Inches(0.8) + i * (c_w + gap)
    create_card(s2, left, Inches(1.65), c_w, c_h)
    tb = s2.shapes.add_textbox(left + Inches(0.15), Inches(1.8), c_w - Inches(0.3), c_h - Inches(0.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = tag
    p.font.size = Pt(9)
    p.font.bold = True
    p.font.color.rgb = col
    p = tf.add_paragraph()
    p.text = stat
    p.font.size = Pt(26)
    p.font.bold = True
    p.font.color.rgb = col
    p = tf.add_paragraph()
    p.text = sub
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = C_WHITE
    p = tf.add_paragraph()
    p.text = desc
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_LIGHT_GREY

create_card(s2, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.45), bg_color=RGBColor(0x13, 0x17, 0x26))
tb_dp = s2.shapes.add_textbox(Inches(1.0), Inches(6.4), Inches(11.3), Inches(0.35))
p = tb_dp.text_frame.paragraphs[0]
p.text = 'CONSULTATIVE PRINCIPLE: When you isolate operational friction first, parcel pricing becomes the natural close rather than an adversarial haggle.'
p.font.size = Pt(8.5)
p.font.color.rgb = C_LIGHT_GREY
add_footer(s2, 2, 6)

# Slide 3: Quad Engine
s3 = prs.slides.add_slide(prs.slide_layouts[6])
bg3 = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
bg3.fill.solid()
bg3.fill.fore_color.rgb = C_BG
bg3.line.fill.background()
add_header(s3, 'Operational Superiority // The Quad-Engine',
           'Why Retailers Choose Moov Over Going Direct',
           'The four integrated pillars that deliver enterprise-level shipping power to growing UK e-commerce brands.')

q_w = Inches(5.7)
q_h = Inches(2.25)

create_card(s3, Inches(0.8), Inches(1.65), q_w, q_h, border_color=C_GREEN)
tb = s3.shapes.add_textbox(Inches(1.0), Inches(1.75), Inches(5.3), Inches(2.05))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = '1. PROPRIETARY FREE SOFTWARE (MOOV NINJA OMS)'
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = C_GREEN
p = tf.add_paragraph()
p.text = 'Cloud-based multi-channel order management with 150+ direct integrations (Shopify, TikTok Shop, Amazon, WooCommerce, eBay). 100-order batch printing prints labels and pick lists in 15 seconds flat.'
p.font.size = Pt(10)
p.font.color.rgb = C_LIGHT_GREY
p = tf.add_paragraph()
p.text = 'Commercial Impact: Saves £1,200–£3,600/yr in external SaaS fees + 2 hrs daily packing labour.'
p.font.size = Pt(9.5)
p.font.bold = True
p.font.color.rgb = C_WHITE

create_card(s3, Inches(6.8), Inches(1.65), q_w, q_h, border_color=RGBColor(0x99, 0x80, 0xE0))
tb = s3.shapes.add_textbox(Inches(7.0), Inches(1.75), Inches(5.3), Inches(2.05))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = '2. TIER-1 MULTI-CARRIER BUYING POWER'
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = RGBColor(0x99, 0x80, 0xE0)
p = tf.add_paragraph()
p.text = 'Access collective high-volume rates across DPD Local, DHL Express, DHL eCommerce, InPost, UPS & Evri. Run automated routing rules on one single weekly consolidated VAT invoice.'
p.font.size = Pt(10)
p.font.color.rgb = C_LIGHT_GREY
p = tf.add_paragraph()
p.text = 'Commercial Impact: Shippers unlock tier-1 pricing with zero minimum volume contracts.'
p.font.size = Pt(9.5)
p.font.bold = True
p.font.color.rgb = C_WHITE

create_card(s3, Inches(0.8), Inches(4.05), q_w, q_h, border_color=C_YELLOW)
tb = s3.shapes.add_textbox(Inches(1.0), Inches(4.15), Inches(5.3), Inches(2.05))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = '3. CARRIER SWITCHING FOR LATER CUT-OFFS'
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = C_YELLOW
p = tf.add_paragraph()
p.text = 'Tied to a courier whose driver arrives at 2:00 or 2:30pm? We audit local carrier route schedules across DPD, DHL, and UPS in the merchant\'s postcode and switch them to a carrier that collects later in the afternoon, plus InPost lockers.'
p.font.size = Pt(10)
p.font.color.rgb = C_LIGHT_GREY
p = tf.add_paragraph()
p.text = 'Commercial Impact: Extends same-day order processing to 4:30pm+, lifting store conversions.'
p.font.size = Pt(9.5)
p.font.bold = True
p.font.color.rgb = C_WHITE

create_card(s3, Inches(6.8), Inches(4.05), q_w, q_h, border_color=C_PINK)
tb = s3.shapes.add_textbox(Inches(7.0), Inches(4.15), Inches(5.3), Inches(2.05))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = '4. DEDICATED YORKSHIRE OPERATIONS DESK'
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = C_PINK
p = tf.add_paragraph()
p.text = 'Direct phone line (0113 322 4101) to our customer support team in Leeds & Sheffield. We answer immediately — zero chatbots, zero hold queues. Our team investigates delays and directly pursues claims.'
p.font.size = Pt(10)
p.font.color.rgb = C_LIGHT_GREY
p = tf.add_paragraph()
p.text = 'Commercial Impact: Eliminates staff burnout, recaptures lost freight claims, and protects reviews.'
p.font.size = Pt(9.5)
p.font.bold = True
p.font.color.rgb = C_WHITE

create_card(s3, Inches(0.8), Inches(6.4), Inches(11.733), Inches(0.4), bg_color=RGBColor(0x13, 0x17, 0x26))
tb_s3 = s3.shapes.add_textbox(Inches(1.0), Inches(6.43), Inches(11.3), Inches(0.35))
p = tb_s3.text_frame.paragraphs[0]
p.text = 'OPERATIONAL SUMMARY: Why sell postage stamps when you can solve their software, carrier routing, cut-offs, and claims in one partnership?'
p.font.size = Pt(8.5)
p.font.color.rgb = C_LIGHT_GREY
add_footer(s3, 3, 6)

# Slide 4: Discovery Matrix
s4 = prs.slides.add_slide(prs.slide_layouts[6])
bg4 = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
bg4.fill.solid()
bg4.fill.fore_color.rgb = C_BG
bg4.line.fill.background()
add_header(s4, 'Sales Discovery Execution // The 4 Streams',
           'The 4-Pillar Consultative Discovery Framework',
           'Rep instruction: Treat discovery as an operational diagnostic of their packing benches, tech stack, and carrier service levels.')

p_w = Inches(2.78)
p_h = Inches(4.6)

p_data = [
    ('PILLAR 01', 'Order Cadence & Mix',
     '"Roughly how many parcels leave the bench on a Tuesday vs Monday surge? Where do orders go — domestic vs Highlands/EU?"',
     '• Uncover true daily baseline volume\n• Identify Q4 / Black Friday surges\n• Expose £5–£12 Highland/NI surcharges\n• Check IOSS setup for European deliveries\n\nMoov Angle: Multi-carrier routing eliminates regional island surcharge traps.', C_GREEN),
    ('PILLAR 02', 'Freight Mechanics',
     '"What does your typical parcel look like? Lightweight bulky boxes or compact mailers? Any liquids, glass, or lithium batteries?"',
     '• Expose volumetric weight divisor traps\n• Assess poly mailers vs rigid cartons\n• Check dangerous goods (ADR) compliance\n• Identify packing dead space\n\nMoov Angle: Match parcels to carriers with friendlier volumetric divisors.', C_YELLOW),
    ('PILLAR 03', 'Despatch Automation',
     '"Where do orders come from (Shopify, TikTok, Amazon)? What software prints labels — paying £50–£200/mo for ShipStation?"',
     '• Pinpoint monthly SaaS software costs\n• Time spent re-keying customer addresses\n• Verify 6x4 Zebra thermal label printers\n• Uncover manual inventory sync delays\n\nMoov Angle: Free Moov Ninja eliminates SaaS bills; 100-batch cuts labour.', C_GREEN),
    ('PILLAR 04', 'Carrier SLAs & Pain',
     '"What time does your collection driver arrive? If they collect early (e.g. 2:30pm), would switching help? Who chases lost parcels?"',
     '• Isolate early cut-offs restricting sales\n• Uncover invoice fuel & peak surcharges\n• Expose hours lost in carrier IVR queues\n• Review unpaid damaged parcel claims\n\nMoov Angle: Switch to later local round; position dedicated Leeds desk.', C_PINK)
]

for i, (tag, title, q, bullet, col) in enumerate(p_data):
    left = Inches(0.8) + i * (p_w + gap)
    create_card(s4, left, Inches(1.65), p_w, p_h)
    tb = s4.shapes.add_textbox(left + Inches(0.15), Inches(1.8), p_w - Inches(0.3), p_h - Inches(0.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = tag
    p.font.size = Pt(9)
    p.font.bold = True
    p.font.color.rgb = col
    p = tf.add_paragraph()
    p.text = title
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = C_WHITE
    p = tf.add_paragraph()
    p.text = q
    p.font.size = Pt(8.5)
    p.font.italic = True
    p.font.color.rgb = C_MUTED
    p = tf.add_paragraph()
    p.text = bullet
    p.font.size = Pt(9)
    p.font.color.rgb = C_LIGHT_GREY

create_card(s4, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.45), bg_color=RGBColor(0x13, 0x17, 0x26), border_color=C_GREEN)
tb_tr = s4.shapes.add_textbox(Inches(1.0), Inches(6.38), Inches(11.3), Inches(0.38))
p = tb_tr.text_frame.paragraphs[0]
p.text = 'REP TRANSITION SCRIPT: "Based on 1,500 parcels/month, our rate card saves ~35p/parcel. More importantly: we eliminate your £150/mo software bill, switch you to a carrier with a 4:30pm pickup, and our Leeds desk takes over your claims."'
p.font.size = Pt(8)
p.font.italic = True
p.font.color.rgb = C_WHITE
add_footer(s4, 4, 6)

# Slide 5: ROI
s5 = prs.slides.add_slide(prs.slide_layouts[6])
bg5 = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
bg5.fill.solid()
bg5.fill.fore_color.rgb = C_BG
bg5.line.fill.background()
add_header(s5, 'Commercial Impact // Client P&L Model',
           'Typical Client ROI Model: 1,500 Parcels / Month',
           'How a holistic operational audit creates an undeniable business case that no single carrier can match.')

s_w = Inches(3.78)
s_h = Inches(1.8)

create_card(s5, Inches(0.8), Inches(1.65), s_w, s_h)
tb = s5.shapes.add_textbox(Inches(1.0), Inches(1.75), Inches(3.38), Inches(1.6))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = 'SOFTWARE SAVINGS'
p.font.size = Pt(9)
p.font.bold = True
p.font.color.rgb = C_GREEN
p = tf.add_paragraph()
p.text = '£1,800 / yr'
p.font.size = Pt(24)
p.font.bold = True
p.font.color.rgb = C_WHITE
p = tf.add_paragraph()
p.text = 'Cancelling third-party SaaS seats (ShipStation @ £150/mo) and per-label fees.'
p.font.size = Pt(9)
p.font.color.rgb = C_LIGHT_GREY

create_card(s5, Inches(4.78), Inches(1.65), s_w, s_h)
tb = s5.shapes.add_textbox(Inches(4.98), Inches(1.75), Inches(3.38), Inches(1.6))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = 'TARIFF SAVINGS'
p.font.size = Pt(9)
p.font.bold = True
p.font.color.rgb = C_YELLOW
p = tf.add_paragraph()
p.text = '£6,300 / yr'
p.font.size = Pt(24)
p.font.bold = True
p.font.color.rgb = C_YELLOW
p = tf.add_paragraph()
p.text = '35p average saving across DPD, DHL, and InPost multi-carrier split.'
p.font.size = Pt(9)
p.font.color.rgb = C_LIGHT_GREY

create_card(s5, Inches(8.75), Inches(1.65), s_w, s_h, border_color=C_GREEN)
tb = s5.shapes.add_textbox(Inches(8.95), Inches(1.75), Inches(3.38), Inches(1.6))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = 'TOTAL LANDED VALUE'
p.font.size = Pt(9)
p.font.bold = True
p.font.color.rgb = C_GREEN
p = tf.add_paragraph()
p.text = '£14,100 / yr'
p.font.size = Pt(24)
p.font.bold = True
p.font.color.rgb = C_GREEN
p = tf.add_paragraph()
p.text = 'Includes £4,500 warehouse labour saved via batch printing + £1,500 claims recoveries.'
p.font.size = Pt(9)
p.font.color.rgb = C_WHITE

create_card(s5, Inches(0.8), Inches(3.6), Inches(11.733), Inches(3.1))
tb_tbl = s5.shapes.add_textbox(Inches(1.0), Inches(3.7), Inches(11.3), Inches(2.9))
tf = tb_tbl.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = 'LINE-BY-LINE COMMERCIAL VALUE BREAKDOWN'
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = C_WHITE

lines = [
    ('• Order Software Subscription:', 'ShipStation £150/mo  →  Moov Ninja £0/mo  (Net Gain: +£1,800/yr)'),
    ('• Parcel Courier Tariffs (18k parcels/yr):', 'Base Tariff £4.65  →  Moov Tier-1 £4.30  (Net Gain: +£6,300/yr)'),
    ('• Packing Bench Labour Waste:', '1.5 hrs/day manual re-keys  →  100-Order Batch in 15s  (Net Gain: +£4,500/yr value)'),
    ('• Driver Arrival Slot & Cut-Off:', 'Early 2:30pm driver  →  Switched to carrier with 4:30pm pickup  (+12% Afternoon Conversion)'),
    ('• Carrier Claims & Dispute Handling:', 'Absorbed losses in bot queues  →  Leeds human desk pursues  (Net Gain: +£1,500/yr recoveries)')
]
for lbl, val in lines:
    p = tf.add_paragraph()
    p.text = f'{lbl} {val}'
    p.font.size = Pt(10)
    p.font.color.rgb = C_LIGHT_GREY
add_footer(s5, 5, 6)

# ============================================================
# SLIDE 6: THE REAL 7–10 DAY GUIDED ONBOARDING JOURNEY
# ============================================================
s6 = prs.slides.add_slide(prs.slide_layouts[6])
bg6 = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
bg6.fill.solid()
bg6.fill.fore_color.rgb = C_BG
bg6.line.fill.background()

add_header(s6, 'Customer Onboarding // Handover to Live Dispatch',
           'The 7–10 Day Guided Onboarding Journey',
           'How we hand over from sales to our dedicated onboarding team to properly configure IT, carrier accounts, and warehouse workflows.')

# 6 Structured Phase Cards in 2 rows of 3
box_w = Inches(3.78)
box_h = Inches(2.1)

phases = [
    ('PHASE 01', 'Welcome & Account Alignment',
     '• Warm introduction into the Moov team by their dedicated specialist\n• Comprehensive discovery review to confirm packing volumes & operational requirements\n• Single point of contact assigned for all technical & carrier onboarding queries', C_GREEN),

    ('PHASE 02', 'IT Provisioning & System Access',
     '• Account creation on Moov Ninja OMS with secure credential provisioning\n• Store connector setup (Shopify, TikTok Shop, WooCommerce, Amazon, eBay)\n• Channel sync verification ensuring live inventory & SKU data flows correctly', C_GREEN),

    ('PHASE 03', 'Courier Account Applications',
     '• Moov applies for and manages dedicated courier sub-accounts on merchant\'s behalf\n• Direct coordination with DPD, DHL, InPost, UPS, and Evri operations\n• Collection rounds, vehicle allocation, and driver pickup routes officially scheduled', C_YELLOW),

    ('PHASE 04', 'Workflow Calibration & Training Call',
     '• 1-on-1 video call showing staff how to get the most from Moov Ninja\n• Custom defaults established: label sizing (6x4), box presets & carrier routing rules\n• Tailored workflow shortcuts built specifically for their packing bench layout', C_YELLOW),

    ('PHASE 05', 'Agreed Go-Live Date',
     '• Firm, mutually agreed go-live date locked in with warehouse & courier driver\n• First 100-order live test manifest generated and collected from bench\n• Dedicated onboarding team actively monitors collection and hub injection live', C_GREEN),

    ('PHASE 06', 'Follow-Up Action & Review',
     '• Proactive post-launch check-in call to review delivery scan rates & transit speeds\n• Invoice reconciliation check ensuring accurate billing from day one\n• Ongoing seamless transition to our permanent Yorkshire operations desk', RGBColor(0x99, 0x80, 0xE0))
]

for i, (tag, title, desc, col) in enumerate(phases):
    col_idx = i % 3
    row_idx = i // 3
    left = Inches(0.8) + col_idx * (box_w + gap)
    top = Inches(1.65) + row_idx * (box_h + Inches(0.18))
    
    create_card(s6, left, top, box_w, box_h, border_color=col)
    tb = s6.shapes.add_textbox(left + Inches(0.12), top + Inches(0.08), box_w - Inches(0.24), box_h - Inches(0.16))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = tag
    p.font.size = Pt(8.5)
    p.font.bold = True
    p.font.color.rgb = col
    
    p = tf.add_paragraph()
    p.text = title
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_WHITE
    
    p = tf.add_paragraph()
    p.text = desc
    p.font.size = Pt(8.5)
    p.font.color.rgb = C_LIGHT_GREY

# Bottom Banner
create_card(s6, Inches(0.8), Inches(6.3), Inches(11.733), Inches(0.5), bg_color=RGBColor(0x13, 0x17, 0x26), border_color=C_GREEN)
tb_btm = s6.shapes.add_textbox(Inches(1.0), Inches(6.35), Inches(11.3), Inches(0.4))
p = tb_btm.text_frame.paragraphs[0]
p.text = 'THE 7–10 DAY COMMITMENT: We take the time to set up IT properly, train your warehouse team, and secure courier routes so your go-live is 100% smooth with zero downtime.'
p.font.size = Pt(8.5)
p.font.bold = True
p.font.color.rgb = C_GREEN

add_footer(s6, 6, 6)

prs.save('/Users/rossjermy/Documents/InterPricing/Moov_Parcel_How_We_Sell.pptx')
print('Saved updated Moov_Parcel_How_We_Sell.pptx')

# ============================================================
# 2. GENERATE MICROSOFT WORD (.DOCX) - ACCURATE & POLISHED
# ============================================================
doc = docx.Document()
for section in doc.sections:
    section.top_margin = DocxInches(0.65)
    section.bottom_margin = DocxInches(0.65)
    section.left_margin = DocxInches(0.65)
    section.right_margin = DocxInches(0.65)

RGB_DARK = DocxRGBColor(0x17, 0x1B, 0x2D)
RGB_GREEN = DocxRGBColor(0x1A, 0x74, 0x5A)
RGB_GREY = DocxRGBColor(0x55, 0x55, 0x55)

# Header
p_top = doc.add_paragraph()
r_brand = p_top.add_run('MOOV PARCEL  •  COMMERCIAL SALES BLUEPRINT & DISCOVERY GUIDE\n')
r_brand.font.size = DocxPt(9.5)
r_brand.font.bold = True
r_brand.font.color.rgb = RGB_GREEN

r_title = p_top.add_run('Sales Discovery & Call Matrix Blueprint')
r_title.font.size = DocxPt(22)
r_title.font.bold = True
r_title.font.color.rgb = RGB_DARK

p_sub = doc.add_paragraph()
r_sub = p_sub.add_run("Desk Reference & Call Matrix for Consultative Discovery  |  Proprietary Free Tech (Moov Ninja)  |  Multi-Carrier (DPD, DHL, InPost, UPS, Evri)  |  Direct Yorkshire Ops Desk: 0113 322 4101")
r_sub.font.size = DocxPt(9)
r_sub.font.color.rgb = RGB_GREY

# Rep Metadata Box
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
            run.font.size = DocxPt(8.5)
            run.font.bold = True

doc.add_paragraph().paragraph_format.space_after = DocxPt(10)

# Section 1: Executive Positioning
h1 = doc.add_heading(level=1)
r = h1.add_run('1. Strategic Positioning: How Moov Wins')
r.font.size = DocxPt(13)
r.font.bold = True
r.font.color.rgb = RGB_DARK

p_phil = doc.add_paragraph()
p_phil.add_run(
    "Most freight brokers sell 'cheap postage' and try to shave 5p off an invoice. Moov Parcel sells as a consultative logistics partner. "
    "We diagnose operational margin leaks across the merchant's warehouse floor, technology stack, and carrier service levels.\n\n"
    "• Free Proprietary Technology: Moov Ninja is 100% free with 150+ native e-commerce store connectors.\n"
    "• Carrier Switching for Later Cut-offs: If their current carrier forces an early 2:30pm cut-off, we audit local rounds across DPD, DHL, and UPS and switch them to a carrier that supports a later collection in their area, plus InPost lockers.\n"
    "• Multi-Carrier Resilience: DPD, DHL Express, InPost, UPS, and Evri managed on a single platform with one consolidated weekly invoice.\n"
    "• Dedicated Yorkshire Support Desk: Real humans (0113 322 4101) in Leeds & Sheffield who proactively investigate delayed parcels and manage claims."
)
for run in p_phil.runs:
    run.font.size = DocxPt(9.5)

# Section 2: Openers
h2 = doc.add_heading(level=1)
r = h2.add_run('2. High-Converting Conversational Openers (The First 30 Seconds)')
r.font.size = DocxPt(13)
r.font.bold = True
r.font.color.rgb = RGB_DARK

scripts = [
    ("Angle 01: The SaaS Fee Killer (Shopify / Multi-Channel Retailers)",
     "\"Hi [First Name], it's [Your Name] with Moov Parcel. I know I caught you out of the blue — got 30 seconds to see if this is even relevant? ... We connect online retailers into multi-carrier rates without charging a single penny for the order software. Most brands we speak with are paying £100s/mo for tools like ShipStation or manually keying in addresses. Who handles your daily carrier collections at the moment?\"",
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
    r.font.size = DocxPt(10.5)
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
    r_lg.font.size = DocxPt(8.5)
    r_lg.font.color.rgb = RGB_GREY

# Section 3: Discovery Table
h3 = doc.add_heading(level=1)
r = h3.add_run('3. The 4-Pillar Consultative Discovery Diagnostic')
r.font.size = DocxPt(13)
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
            run.font.size = DocxPt(9)
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
                run.font.size = DocxPt(8.5)

doc.add_paragraph().paragraph_format.space_after = DocxPt(10)

# Section 4: Alignment Matrix
h4 = doc.add_heading(level=1)
r = h4.add_run('4. Consultative Solution Alignment Matrix')
r.font.size = DocxPt(13)
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
            run.font.size = DocxPt(9)
            run.font.bold = True

alignment_rows = [
    ("Manual One-by-One Booking\n(Click & Drop or carrier portals)",
     "\"We plug Moov Ninja directly into your Shopify and TikTok Shop in 10 minutes. 100-order batch printing eliminates 2 hours of manual copying every morning.\"",
     "Recovers warehouse labour wages, eliminates address typos, and speeds up customer delivery dispatch."),

    ("The 'SaaS Subscription Tax'\n(Paying £50–£250/mo for ShipStation/Linnworks)",
     "\"Moov Ninja is our proprietary software and is 100% free for all our shipping clients with 150+ direct connectors. You can cancel that monthly software bill tomorrow.\"",
     "Direct bottom-line margin expansion (£1,200–£3,000/yr saved) before even factoring in parcel rate discounts."),

    ("Early Courier Cut-Off\n(Incumbent driver arrives at 2:00 or 2:30 PM)",
     "\"Because we work across DPD, DHL, and UPS, we can audit local carrier collection rounds in your postcode and switch you to a carrier that supports a later afternoon collection, plus InPost locker options.\"",
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
                run.font.size = DocxPt(8.5)

doc.add_paragraph().paragraph_format.space_after = DocxPt(10)

# Section 5: The Real 7-10 Day Onboarding Journey
h5 = doc.add_heading(level=1)
r = h5.add_run('5. The 7–10 Day Guided Onboarding Journey (Sales-to-Ops Handover)')
r.font.size = DocxPt(13)
r.font.bold = True
r.font.color.rgb = RGB_DARK

p_ob_intro = doc.add_paragraph()
p_ob_intro.add_run(
    "Onboarding at Moov Parcel is a thorough, guided 7-to-10 day process designed to ensure complete operational harmony before a single live parcel moves. "
    "When a prospect signs an agreement, the sales rep executes a clean handover to our dedicated onboarding team following these six structured milestones:\n"
)
for run in p_ob_intro.runs:
    run.font.size = DocxPt(9.5)

ob_steps = [
    ("Step 1: Welcome & Account Alignment",
     "The client is warmly welcomed into the Moov team by their dedicated account specialist. We review their discovery profile, confirm operational requirements, and establish direct communication channels."),

    ("Step 2: IT Provisioning & System Access",
     "Our technical team provisions their Moov Ninja accounts and IT credentials, establishing secure API store connections (Shopify, TikTok Shop, WooCommerce, Amazon, eBay) and verifying live order data ingestion."),

    ("Step 3: Courier Account Applications",
     "Moov directly submits and manages the account applications with our carrier partners (DPD, DHL, InPost, UPS, Evri) to establish the merchant's sub-accounts, collection round schedules, and vehicle allocations."),

    ("Step 4: Workflow Calibration & Training Call",
     "We schedule a dedicated 1-on-1 video call to walk the client's team through Moov Ninja. We help them configure defaults, calibrate 6x4 thermal printer outputs, build packaging presets, and establish automated carrier routing rules tailored to their packing bench layout."),

    ("Step 5: Coordinated Go-Live Date",
     "A firm, mutually agreed go-live date is locked in. The first live 100-order batch is printed, packed, and collected by the carrier driver. The onboarding team actively monitors the collection and hub scan milestones in real time."),

    ("Step 6: Post-Launch Follow-Up & Review",
     "Our team conducts proactive follow-up reviews over the following days to verify delivery success rates, audit carrier invoicing accuracy, answer staff questions, and seamlessly hand off to our permanent Yorkshire operations desk.")
]

for st_title, st_desc in ob_steps:
    p_st = doc.add_paragraph()
    r = p_st.add_run(f'• {st_title}: ')
    r.font.size = DocxPt(9.5)
    r.font.bold = True
    r.font.color.rgb = RGB_GREEN
    
    r2 = p_st.add_run(st_desc)
    r2.font.size = DocxPt(9)

p_rem = doc.add_paragraph()
p_rem.paragraph_format.space_before = DocxPt(10)
r_rem = p_rem.add_run(
    "REMINDER FOR REPS: Moov Parcel is a tech-enabled consultative partner, not a low-cost postage reseller. "
    "We take the 7–10 days required to set up IT properly, train warehouse staff, and secure carrier collection rounds so our clients experience zero disruption and long-term margin growth."
)
r_rem.font.size = DocxPt(9)
r_rem.font.bold = True
r_rem.font.color.rgb = RGB_DARK

doc.save('/Users/rossjermy/Documents/InterPricing/Moov_Parcel_Sales_Discovery_Blueprint.docx')
print('Saved updated Moov_Parcel_Sales_Discovery_Blueprint.docx')
