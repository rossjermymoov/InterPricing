import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

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
C_PURPLE = RGBColor(0x41, 0x03, 0xCC)

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

# ----------------- SLIDE 1 -----------------
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
p.text = '• Sells 5p rate cuts while ignoring warehouse bottlenecks\\n• Forces shippers to pay £50–£250/mo for ShipStation or key manually\\n• Single-carrier trap: regional driver shortages or strikes halt dispatch\\n• Early 2:00–2:30pm driver cut-offs choke afternoon store checkouts\\n• Support black hole: abandoned to automated IVRs & denied claims'
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
p.text = '• Free proprietary tech: Moov Ninja OMS (£0/mo) with 150+ direct connectors\\n• Carrier Switching: audit local routes across DPD/DHL/UPS to unlock later cut-offs\\n• Multi-Carrier Buying Power: collective volume rates on one weekly invoice\\n• 100-Order 1-Click Batch: cuts 2 hours of daily packing bench re-keys\\n• Dedicated Yorkshire Desk: real people (0113 322 4101) fighting claims'
p.font.size = Pt(10.5)
p.font.color.rgb = C_LIGHT_GREY

# Bottom Ecosystem Bar
create_card(s1, Inches(0.8), Inches(6.25), Inches(11.733), Inches(0.55), bg_color=RGBColor(0x13, 0x17, 0x26))
tb_eco = s1.shapes.add_textbox(Inches(1.0), Inches(6.32), Inches(11.3), Inches(0.4))
p = tb_eco.text_frame.paragraphs[0]
p.text = 'DIRECT CARRIER PARTNERS:  DPD Local  •  DHL Express  •  DHL eCommerce  •  InPost Lockers  •  UPS Standard  •  Evri Domestic'
p.font.size = Pt(9.5)
p.font.bold = True
p.font.color.rgb = C_GREEN

add_footer(s1, 1, 6)

# ----------------- SLIDE 2 -----------------
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
     'Retailers pay £50 to £250/month for software like ShipStation, Linnworks, or Shiptheory just to print courier labels and sync tracking numbers.\\n\\nMOOV FIX: Moov Ninja is 100% free with 150+ direct integrations. Drops software overhead to £0 forever.', C_GREEN),
    ('LEAK 02 • CUT-OFF PENALTY', '18%', 'Lost Afternoon Conversions',
     'Early 2:00–2:30pm driver collections force stores into an uncompetitive cut-off time. Modern shoppers abandon carts when same-day dispatch is unavailable.\\n\\nMOOV FIX: We switch merchants to a carrier on our platform that collects later in their postcode, plus InPost lockers.', C_YELLOW),
    ('LEAK 03 • VOLUMETRIC CUBE', '35%', 'Punitive Volumetric Surcharges',
     'Lightweight goods in standard cartons (e.g. 800g apparel in a 40cm box) trigger 4kg+ volumetric charges under standard carrier divisor formulas.\\n\\nMOOV FIX: Multi-carrier routing matches bulky goods to carriers with friendly volumetric divisors.', C_PINK),
    ('LEAK 04 • SERVICE LIMBO', '3.5 Hrs', 'Weekly Staff Time in Bot Queues',
     'Warehouse managers and founders waste hours on hold with carrier call centers, fighting IVR bots, and writing off unpaid damaged parcel claims.\\n\\nMOOV FIX: Dedicated Leeds desk (0113 322 4101) directly files claims, tracks delays, and protects reviews.', RGBColor(0x99, 0x80, 0xE0))
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

# Diagnostic principle bar
create_card(s2, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.45), bg_color=RGBColor(0x13, 0x17, 0x26))
tb_dp = s2.shapes.add_textbox(Inches(1.0), Inches(6.4), Inches(11.3), Inches(0.35))
p = tb_dp.text_frame.paragraphs[0]
p.text = 'CONSULTATIVE PRINCIPLE: When you isolate operational friction first, parcel pricing becomes the natural close rather than an adversarial haggle.'
p.font.size = Pt(8.5)
p.font.color.rgb = C_LIGHT_GREY

add_footer(s2, 2, 6)

# ----------------- SLIDE 3 -----------------
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

# Engine 1
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

# Engine 2
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

# Engine 3
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

# Engine 4
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

# ----------------- SLIDE 4 -----------------
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
     '• Uncover true daily baseline volume\\n• Identify Q4 / Black Friday surges\\n• Expose £5–£12 Highland/NI surcharges\\n• Check IOSS setup for European deliveries\\n\\nMoov Angle: Multi-carrier routing eliminates regional island surcharge traps.', C_GREEN),
    
    ('PILLAR 02', 'Freight Mechanics',
     '"What does your typical parcel look like? Lightweight bulky boxes or compact mailers? Any liquids, glass, or lithium batteries?"',
     '• Expose volumetric weight divisor traps\\n• Assess poly mailers vs rigid cartons\\n• Check dangerous goods (ADR) compliance\\n• Identify packing dead space\\n\\nMoov Angle: Match parcels to carriers with friendlier volumetric divisors.', C_YELLOW),

    ('PILLAR 03', 'Despatch Automation',
     '"Where do orders come from (Shopify, TikTok, Amazon)? What software prints labels — paying £50–£200/mo for ShipStation?"',
     '• Pinpoint monthly SaaS software costs\\n• Time spent re-keying customer addresses\\n• Verify 6x4 Zebra thermal label printers\\n• Uncover manual inventory sync delays\\n\\nMoov Angle: Free Moov Ninja eliminates SaaS bills; 100-batch cuts labour.', C_GREEN),

    ('PILLAR 04', 'Carrier SLAs & Pain',
     '"What time does your collection driver arrive? If they collect early (e.g. 2:30pm), would switching help? Who chases lost parcels?"',
     '• Isolate early cut-offs restricting sales\\n• Uncover invoice fuel & peak surcharges\\n• Expose hours lost in carrier IVR queues\\n• Review unpaid damaged parcel claims\\n\\nMoov Angle: Switch to later local round; position dedicated Leeds desk.', C_PINK)
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

# Script transition banner
create_card(s4, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.45), bg_color=RGBColor(0x13, 0x17, 0x26), border_color=C_GREEN)
tb_tr = s4.shapes.add_textbox(Inches(1.0), Inches(6.38), Inches(11.3), Inches(0.38))
p = tb_tr.text_frame.paragraphs[0]
p.text = 'REP TRANSITION SCRIPT: "Based on 1,500 parcels/month, our rate card saves ~35p/parcel. More importantly: we eliminate your £150/mo software bill, switch you to a carrier with a 4:30pm pickup, and our Leeds desk takes over your claims."'
p.font.size = Pt(8)
p.font.italic = True
p.font.color.rgb = C_WHITE

add_footer(s4, 4, 6)

# ----------------- SLIDE 5 -----------------
s5 = prs.slides.add_slide(prs.slide_layouts[6])
bg5 = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
bg5.fill.solid()
bg5.fill.fore_color.rgb = C_BG
bg5.line.fill.background()

add_header(s5, 'Commercial Impact // Client P&L Model',
           'Typical Client ROI Model: 1,500 Parcels / Month',
           'How a holistic operational audit creates an undeniable business case that no single carrier can match.')

# 3 Top Cards
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

# Financial Table Card
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

# ----------------- SLIDE 6 -----------------
s6 = prs.slides.add_slide(prs.slide_layouts[6])
bg6 = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
bg6.fill.solid()
bg6.fill.fore_color.rgb = C_BG
bg6.line.fill.background()

add_header(s6, 'Client Onboarding // Zero Downtime',
           'The 72-Hour Frictionless Onboarding Blueprint',
           'How we transition merchants from agreement to live collection in 3 days with zero packing bench disruption.')

o_w = Inches(3.78)
o_h = Inches(4.3)

steps = [
    ('DAY 1 • STEP 01', 'Tariff Audit & Store Sync',
     '• Side-by-side pricing model approved showing line-by-line parcel and software savings\\n• 10-minute API connection to Shopify, TikTok Shop, Amazon, or WooCommerce\\n• Order catalogue, SKUs, and channels imported automatically with zero coding\\n• No changes required to existing warehouse benches or staff routines\\n\\nMilestone: Store orders flowing live into Moov Ninja dashboard.', C_GREEN),
    
    ('DAY 2 • STEP 02', 'Bench Calibration & Carrier Setup',
     '• Standard 6x4 Zebra thermal test labels verified on packing benches\\n• Carrier collection schedule confirmed; switched to later round carrier if needed\\n• Automated routing rules set (e.g. weight, locker delivery, destination)\\n• Carrier collection vehicle allocated and driver route confirmed\\n\\nMilestone: Carrier route confirmed and test manifest validated.', C_YELLOW),

    ('DAY 3 • STEP 03', 'Live Dispatch & Monitoring',
     '• First live 100-order batch generated and handed to collection driver\\n• Dedicated Leeds/Sheffield team monitors manifests and transit milestones live\\n• Merchant maintains existing courier in parallel for complete peace of mind\\n• Immediate direct phone line access to Yorkshire desk\\n\\nMilestone: 100% successful dispatch; zero warehouse downtime.', C_GREEN)
]

for i, (tag, title, desc, col) in enumerate(steps):
    left = Inches(0.8) + i * (o_w + gap)
    create_card(s6, left, Inches(1.65), o_w, o_h, border_color=col)
    tb = s6.shapes.add_textbox(left + Inches(0.15), Inches(1.8), o_w - Inches(0.3), o_h - Inches(0.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = tag
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = col
    
    p = tf.add_paragraph()
    p.text = title
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_WHITE
    
    p = tf.add_paragraph()
    p.text = desc
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_LIGHT_GREY

# Guarantee banner
create_card(s6, Inches(0.8), Inches(6.15), Inches(11.733), Inches(0.65), bg_color=RGBColor(0x13, 0x17, 0x26), border_color=C_GREEN)
tb_g = s6.shapes.add_textbox(Inches(1.0), Inches(6.22), Inches(11.3), Inches(0.5))
tf = tb_g.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = 'THE ZERO-DOWNTIME PARALLEL RUNNING GUARANTEE: Merchants keep their incumbent courier accounts active and dual-run until they are 100% satisfied. No disruption, no setup fees, and zero risk to customer deliveries.'
p.font.size = Pt(8.5)
p.font.bold = True
p.font.color.rgb = C_GREEN

add_footer(s6, 6, 6)

prs.save('/Users/rossjermy/Documents/InterPricing/Moov_Parcel_How_We_Sell.pptx')
print('Successfully saved dense, rich Moov_Parcel_How_We_Sell.pptx')
