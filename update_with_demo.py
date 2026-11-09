import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
import docx
from docx.shared import Inches as DocxInches, Pt as DocxPt, RGBColor as DocxRGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

# Brand Colors
C_BG = RGBColor(0x0C, 0x0F, 0x1D)
C_CARD = RGBColor(0x17, 0x1B, 0x2D)
C_BORDER = RGBColor(0x28, 0x30, 0x48)
C_GREEN = RGBColor(0x1D, 0xFB, 0x9D)
C_WHITE = RGBColor(0xFD, 0xFF, 0xFF)
C_LIGHT_GREY = RGBColor(0xC6, 0xC7, 0xCD)
C_MUTED = RGBColor(0x9F, 0xA2, 0xB4)
C_YELLOW = RGBColor(0xFE, 0xCA, 0x00)

prs = pptx.Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

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
    p2.font.size = Pt(21)
    p2.font.bold = True
    p2.font.color.rgb = C_WHITE
    
    if subtext:
        p3 = tf.add_paragraph()
        p3.text = subtext
        p3.font.size = Pt(9.5)
        p3.font.color.rgb = C_MUTED

def add_footer(slide, current, total):
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(6.85), Inches(11.733), Inches(0.015))
    line.fill.solid()
    line.fill.fore_color.rgb = C_BORDER
    line.line.color.rgb = C_BORDER

    tb = slide.shapes.add_textbox(Inches(0.8), Inches(6.9), Inches(8), Inches(0.35))
    p = tb.text_frame.paragraphs[0]
    p.text = 'MOOV PARCEL  •  CONSULTATIVE SALES PLAYBOOK  •  0113 322 4100  •  moovparcel.co.uk'
    p.font.size = Pt(8.5)
    p.font.color.rgb = C_MUTED
    
    tb_pg = slide.shapes.add_textbox(Inches(10.5), Inches(6.9), Inches(2), Inches(0.35))
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

# ----------------- SLIDE 1: Who We Are & Purpose -----------------
s1 = prs.slides.add_slide(prs.slide_layouts[6])
bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
bg1.fill.solid()
bg1.fill.fore_color.rgb = C_BG
bg1.line.fill.background()

add_header(s1, 'Moov Parcel // Commercial Identity & Mission',
           'How Moov Parcel Sells: The Consultative Sales Framework',
           'Moov Parcel was invented to help e-commerce SMEs be more productive through proprietary free technology, multi-carrier access, and genuine consultative service.')

c_w = Inches(3.78)
c_h = Inches(4.5)
gap = Inches(0.2)

create_card(s1, Inches(0.8), Inches(1.65), c_w, c_h, border_color=C_GREEN)
tb = s1.shapes.add_textbox(Inches(0.95), Inches(1.8), c_w - Inches(0.3), c_h - Inches(0.3))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = 'OUR CORE MISSION'
p.font.size = Pt(10)
p.font.bold = True
p.font.color.rgb = C_GREEN
p = tf.add_paragraph()
p.text = 'Empowering E-Commerce SMEs'
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = C_WHITE
p = tf.add_paragraph()
p.text = 'Moov Parcel exists to make growing online retailers more productive.\n\nMost SMEs spend hours each week manually processing orders, re-keying customer addresses, and struggling with single-carrier limitations.\n\nWe provide the technology, carrier rates, and operational support to remove that friction completely so they can focus on growing their business.'
p.font.size = Pt(9.5)
p.font.color.rgb = C_LIGHT_GREY

create_card(s1, Inches(4.78), Inches(1.65), c_w, c_h)
tb = s1.shapes.add_textbox(Inches(4.93), Inches(1.8), c_w - Inches(0.3), c_h - Inches(0.3))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = 'PROPRIETARY TECHNOLOGY'
p.font.size = Pt(10)
p.font.bold = True
p.font.color.rgb = C_YELLOW
p = tf.add_paragraph()
p.text = 'Moov Ninja (150+ Channels)'
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = C_WHITE
p = tf.add_paragraph()
p.text = 'Our cloud order management software is 100% proprietary, owned by ourselves, and given to our clients at no extra cost.\n\n• Connects to 150+ marketplaces & sales channels (Shopify, TikTok Shop, Amazon, eBay, WooCommerce, etc.)\n• Eliminates manual 1-by-1 booking and prevents costly address errors\n• Unlocks easy expansion to new sales channels without operational headaches.'
p.font.size = Pt(9.5)
p.font.color.rgb = C_LIGHT_GREY

create_card(s1, Inches(8.75), Inches(1.65), c_w, c_h)
tb = s1.shapes.add_textbox(Inches(8.9), Inches(1.8), c_w - Inches(0.3), c_h - Inches(0.3))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = 'MULTI-CARRIER SOLUTIONS'
p.font.size = Pt(10)
p.font.bold = True
p.font.color.rgb = RGBColor(0x99, 0x80, 0xE0)
p = tf.add_paragraph()
p.text = 'DPD, DHL, InPost & UPS'
p.font.size = Pt(13)
p.font.bold = True
p.font.color.rgb = C_WHITE
p = tf.add_paragraph()
p.text = 'We maintain primary relationships with the UK’s leading carriers:\n\n• DPD (Domestic next-day & timed)\n• DHL (Express international & eCommerce)\n• InPost (Automated lockers & shop drops)\n• UPS (UK domestic & worldwide freight)\n\nOur customers access the right carrier for every parcel, managed in one platform on one invoice.'
p.font.size = Pt(9.5)
p.font.color.rgb = C_LIGHT_GREY

create_card(s1, Inches(0.8), Inches(6.25), Inches(11.733), Inches(0.45), bg_color=RGBColor(0x13, 0x17, 0x26))
tb_eco = s1.shapes.add_textbox(Inches(1.0), Inches(6.3), Inches(11.3), Inches(0.35))
p = tb_eco.text_frame.paragraphs[0]
p.text = 'PRIMARY CARRIER PARTNERS:   DPD   •   DHL   •   InPost   •   UPS   |   Proprietary Free Software: Moov Ninja'
p.font.size = Pt(9)
p.font.bold = True
p.font.color.rgb = C_GREEN

add_footer(s1, 1, 6)

# ----------------- SLIDE 2: What Makes Us Different -----------------
s2 = prs.slides.add_slide(prs.slide_layouts[6])
bg2 = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
bg2.fill.solid()
bg2.fill.fore_color.rgb = C_BG
bg2.line.fill.background()

add_header(s2, 'Our Competitive Edge',
           'What Makes Moov Parcel Different',
           'We do not sell as a low-cost postage reseller. We combine proprietary technology with multi-carrier flexibility and hands-on service.')

p_w = Inches(5.7)
p_h = Inches(2.2)

create_card(s2, Inches(0.8), Inches(1.65), p_w, p_h, border_color=C_GREEN)
tb = s2.shapes.add_textbox(Inches(1.0), Inches(1.75), Inches(5.3), Inches(2.0))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = '1. PROPRIETARY FREE SOFTWARE (MOOV NINJA)'
p.font.size = Pt(10.5)
p.font.bold = True
p.font.color.rgb = C_GREEN
p = tf.add_paragraph()
p.text = 'Unlike brokers who provide only rate cards, we give our customers our own proprietary order management system. It connects into 150+ sales platforms, eliminates 1-by-1 manual typing, stops mis-delivery errors, and costs our shipping clients nothing.'
p.font.size = Pt(9)
p.font.color.rgb = C_LIGHT_GREY

create_card(s2, Inches(6.8), Inches(1.65), p_w, p_h, border_color=RGBColor(0x99, 0x80, 0xE0))
tb = s2.shapes.add_textbox(Inches(7.0), Inches(1.75), Inches(5.3), Inches(2.0))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = '2. TRUE MULTI-CARRIER CHOICE ON ONE INVOICE'
p.font.size = Pt(10.5)
p.font.bold = True
p.font.color.rgb = RGBColor(0x99, 0x80, 0xE0)
p = tf.add_paragraph()
p.text = 'Instead of locking customers into a single courier, we offer direct access to DPD, DHL, InPost, and UPS. Customers get the right carrier for each parcel format (small packet, standard carton, locker, international) with a single weekly invoice.'
p.font.size = Pt(9)
p.font.color.rgb = C_LIGHT_GREY

create_card(s2, Inches(0.8), Inches(4.05), p_w, p_h, border_color=C_YELLOW)
tb = s2.shapes.add_textbox(Inches(1.0), Inches(4.15), Inches(5.3), Inches(2.0))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = '3. CARRIER SWITCHING FOR BETTER COLLECTION TIMES'
p.font.size = Pt(10.5)
p.font.bold = True
p.font.color.rgb = C_YELLOW
p = tf.add_paragraph()
p.text = 'If a merchant is stuck with an early collection time (e.g. 2:00 or 2:30pm) that cuts off afternoon sales, we can switch them to a different carrier in our network whose local round supports a later collection time, plus InPost options for late orders.'
p.font.size = Pt(9)
p.font.color.rgb = C_LIGHT_GREY

create_card(s2, Inches(6.8), Inches(4.05), p_w, p_h, border_color=C_WHITE)
tb = s2.shapes.add_textbox(Inches(7.0), Inches(4.15), Inches(5.3), Inches(2.0))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = '4. EXCEPTIONAL CUSTOMER SERVICE FROM REAL PEOPLE'
p.font.size = Pt(10.5)
p.font.bold = True
p.font.color.rgb = C_WHITE
p = tf.add_paragraph()
p.text = 'Our customers don’t sit in automated phone queues or argue with chatbots. Our team answers straight away (0113 322 4101) with real UK logistics experts who resolve parcel delays, tracking queries, and carrier issues on their behalf.'
p.font.size = Pt(9)
p.font.color.rgb = C_LIGHT_GREY

create_card(s2, Inches(0.8), Inches(6.35), Inches(11.733), Inches(0.4), bg_color=RGBColor(0x13, 0x17, 0x26))
tb_s2 = s2.shapes.add_textbox(Inches(1.0), Inches(6.38), Inches(11.3), Inches(0.35))
p = tb_s2.text_frame.paragraphs[0]
p.text = 'OUR BRAND PROMISE: "Don\'t just deliver parcels... Moov them."  •  "Don\'t be cheap, be cost-effective."'
p.font.size = Pt(8.5)
p.font.bold = True
p.font.color.rgb = C_GREEN

add_footer(s2, 2, 6)

# ----------------- SLIDE 3: The Consultative Sales Process -----------------
s3 = prs.slides.add_slide(prs.slide_layouts[6])
bg3 = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
bg3.fill.solid()
bg3.fill.fore_color.rgb = C_BG
bg3.line.fill.background()

add_header(s3, 'Our Commercial Approach',
           'The Consultative Journey: Discovery ➔ Live Demo ➔ Proposal',
           'How we combine inbound leads and outbound calling with live software demonstrations to convert at 2.5x higher rates.')

c4_w = Inches(2.78)
c4_h = Inches(4.5)

steps = [
    ('STEP 01', 'Outbound Hook & Decision Maker',
     'A mixture of inbound leads (email marketing & web) and outbound calls.\n\n• Get hold of the business decision maker (Owner, Director, Ops Manager)\n• Acknowledge interruption and state our productivity purpose\n• Gain agreement to explore their current packing bench setup.', C_GREEN),

    ('STEP 02', 'Deep 9-Point Discovery',
     'Dig up as much operational detail as possible:\n\n• Volumes, destinations, B2B vs B2C\n• Sizes, deadweights, min/max, hazmat\n• Current booking software & WMS stack\n• Couriers, required collection times & pain points.', C_YELLOW),

    ('STEP 03', 'The Live Software Demo (Crucial)',
     'Never quote blind rates without a live demonstration:\n\n• Show Moov Ninja live on a 15-min screen share\n• Demonstrate batch printing, packing station & rules\n• Research shows live tech demos increase B2B close rates by up to 68% over static rate sheets.', C_GREEN),

    ('STEP 04', 'Tailored Rates & 7–10 Day Onboarding',
     'Present proposal and manage smooth handover:\n\n• Send transparent rate card aligned to their profile\n• Follow up consistently until agreement is secured\n• Sign-up and clean handover to onboarding for 7–10 day setup.', RGBColor(0x99, 0x80, 0xE0))
]

for i, (tag, title, desc, col) in enumerate(steps):
    left = Inches(0.8) + i * (c4_w + gap)
    create_card(s3, left, Inches(1.65), c4_w, c4_h, border_color=col)
    tb = s3.shapes.add_textbox(left + Inches(0.15), Inches(1.8), c4_w - Inches(0.3), c4_h - Inches(0.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = tag
    p.font.size = Pt(9)
    p.font.bold = True
    p.font.color.rgb = col
    p = tf.add_paragraph()
    p.text = title
    p.font.size = Pt(11.5)
    p.font.bold = True
    p.font.color.rgb = C_WHITE
    p = tf.add_paragraph()
    p.text = desc
    p.font.size = Pt(9)
    p.font.color.rgb = C_LIGHT_GREY

create_card(s3, Inches(0.8), Inches(6.3), Inches(11.733), Inches(0.45), bg_color=RGBColor(0x13, 0x17, 0x26))
tb_s3 = s3.shapes.add_textbox(Inches(1.0), Inches(6.35), Inches(11.3), Inches(0.35))
p = tb_s3.text_frame.paragraphs[0]
p.text = 'INDUSTRY RESEARCH: Demonstrating software live transforms an intangible rate quote into an indispensable operational workflow.'
p.font.size = Pt(8.5)
p.font.bold = True
p.font.color.rgb = C_GREEN

add_footer(s3, 3, 6)

# ----------------- SLIDE 4: The 9 Discovery Areas -----------------
s4 = prs.slides.add_slide(prs.slide_layouts[6])
bg4 = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
bg4.fill.solid()
bg4.fill.fore_color.rgb = C_BG
bg4.line.fill.background()

add_header(s4, 'Discovery Matrix // The 9 Core Areas',
           'What We Need to Understand from the Business',
           'The sales representative must dig up as much information as possible across these 9 essential operational fields.')

g_w = Inches(3.78)
g_h = Inches(1.4)
row_gap = Inches(0.15)

disc_areas = [
    ('1. Parcel Volumes', 'How many parcels do they send daily and weekly? Do they spike during peak seasons or promos?', C_GREEN),
    ('2. Destinations', 'Where do they send? UK domestic mainland, Scottish Highlands/Islands, Europe, or Worldwide?', C_GREEN),
    ('3. Recipient Profile', 'Who are they sending to? Direct to consumer (B2C) residential addresses & lockers, or B2B trade?', C_GREEN),
    ('4. Parcel Sizes & Weights', 'What are their typical dimensions? What are their minimum and maximum deadweights and sizes?', C_YELLOW),
    ('5. International Shipping', 'Do they send internationally to Europe (IOSS compliance) or Rest of World? Any customs friction?', C_YELLOW),
    ('6. Hazardous / Special Cargo', 'Do they send anything hazardous, liquids, glass, aerosols, batteries, or outside the norm?', C_YELLOW),
    ('7. Packaging Requirements', 'Do they have specific packaging rules — poly mailers, custom branded boxes, or 6x4 thermal labels?', RGBColor(0x99, 0x80, 0xE0)),
    ('8. Software & Booking Method', 'How do they book parcels now? 1-by-1 manual entry? What channels (Shopify, Amazon)? Any WMS?', RGBColor(0x99, 0x80, 0xE0)),
    ('9. Couriers, Cut-offs & Challenges', 'Which couriers do they use? What collection time do they need? What challenges: price, service, damage?', RGBColor(0x99, 0x80, 0xE0))
]

for idx, (title, desc, col) in enumerate(disc_areas):
    r_idx = idx // 3
    c_idx = idx % 3
    left = Inches(0.8) + c_idx * (g_w + gap)
    top = Inches(1.65) + r_idx * (g_h + row_gap)
    
    create_card(s4, left, top, g_w, g_h, border_color=col)
    tb = s4.shapes.add_textbox(left + Inches(0.12), top + Inches(0.08), g_w - Inches(0.24), g_h - Inches(0.16))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = col
    p = tf.add_paragraph()
    p.text = desc
    p.font.size = Pt(8.5)
    p.font.color.rgb = C_LIGHT_GREY

create_card(s4, Inches(0.8), Inches(6.3), Inches(11.733), Inches(0.45), bg_color=RGBColor(0x13, 0x17, 0x26))
tb_s4 = s4.shapes.add_textbox(Inches(1.0), Inches(6.35), Inches(11.3), Inches(0.35))
p = tb_s4.text_frame.paragraphs[0]
p.text = 'REPRESENTATIVE OBJECTIVE: Gather the full operational picture so you can pivot naturally into booking the live Moov Ninja demo.'
p.font.size = Pt(8.5)
p.font.bold = True
p.font.color.rgb = C_GREEN

add_footer(s4, 4, 6)

# ============================================================
# SLIDE 5: WHY WE DEMO // THE 9 MOOV NINJA PROBLEMS SOLVED
# ============================================================
s5 = prs.slides.add_slide(prs.slide_layouts[6])
bg5 = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
bg5.fill.solid()
bg5.fill.fore_color.rgb = C_BG
bg5.line.fill.background()

add_header(s5, 'The Power of the Demo // Software Showcase',
           'Why We Demo: The 9 Operational Problems Moov Ninja Solves',
           'Research shows software demonstrations convert 2.5x higher because prospects see tangible workflow automation instead of an abstract rate sheet.')

# 9 Feature Cards in 3x3 Grid
d_w = Inches(3.78)
d_h = Inches(1.4)

demo_features = [
    ('1. Multi-Channel Connectivity', 'Connects 150+ channels (Shopify, TikTok, Amazon, eBay) into one centralized dispatch screen.', C_GREEN),
    ('2. 1-Click Batch Shipping', 'Prints up to 100 shipping labels and pick lists simultaneously, ending 1-by-1 manual booking.', C_GREEN),
    ('3. Internal Packing Station', 'Integrated packing station with barcode scanning to verify items in the box and eliminate packing errors.', C_GREEN),
    ('4. Multi-Parcel International', 'Specialized workflow for multi-box overseas shipments that competitor software cannot support.', C_YELLOW),
    ('5. Real-Time Carrier Error Logs', 'Instant visibility on courier error codes (bad postcodes, tax IDs) so reps can fix and print immediately.', C_YELLOW),
    ('6. Easy International Shipping', 'Hassle-free customs paperwork, electronic commercial invoices, and seamless EU IOSS compliance.', C_YELLOW),
    ('7. Ninja Status Gamification', 'Engaging visual Ninjas alert warehouse staff immediately when exceptions, errors, or delays occur.', RGBColor(0x99, 0x80, 0xE0)),
    ('8. Direct-to-Printer Integration', 'Integrated printer software sends labels straight to 6x4 Zebra thermal printers without PDF dialogues.', RGBColor(0x99, 0x80, 0xE0)),
    ('9. Smart Shipping Rules Engine', 'Automatically selects the right carrier (DPD, DHL, InPost, UPS) based on weight, price, country, or postcode.', RGBColor(0x99, 0x80, 0xE0))
]

for idx, (title, desc, col) in enumerate(demo_features):
    r_idx = idx // 3
    c_idx = idx % 3
    left = Inches(0.8) + c_idx * (d_w + gap)
    top = Inches(1.65) + r_idx * (d_h + row_gap)
    
    create_card(s5, left, top, d_w, d_h, border_color=col)
    tb = s5.shapes.add_textbox(left + Inches(0.12), top + Inches(0.08), d_w - Inches(0.24), d_h - Inches(0.16))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = title
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = col
    p = tf.add_paragraph()
    p.text = desc
    p.font.size = Pt(8.5)
    p.font.color.rgb = C_LIGHT_GREY

create_card(s5, Inches(0.8), Inches(6.3), Inches(11.733), Inches(0.45), bg_color=RGBColor(0x13, 0x17, 0x26), border_color=C_GREEN)
tb_s5 = s5.shapes.add_textbox(Inches(1.0), Inches(6.35), Inches(11.3), Inches(0.35))
p = tb_s5.text_frame.paragraphs[0]
p.text = 'SALES CONVERSION PRINCIPLE: Never send a rate card without walking through the software. The demo sells the partnership; the rate card confirms it.'
p.font.size = Pt(8.5)
p.font.bold = True
p.font.color.rgb = C_GREEN

add_footer(s5, 5, 6)

# ----------------- SLIDE 6: The 7-10 Day Onboarding -----------------
s6 = prs.slides.add_slide(prs.slide_layouts[6])
bg6 = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
bg6.fill.solid()
bg6.fill.fore_color.rgb = C_BG
bg6.line.fill.background()

add_header(s6, 'Customer Onboarding // Handover to Live Dispatch',
           'The 7–10 Day Guided Onboarding Journey',
           'Once agreed, sales executes a clean handover to our dedicated onboarding team who manage the 7–10 day setup process.')

box_w = Inches(3.78)
box_h = Inches(2.1)

phases = [
    ('PHASE 01', 'Welcome to the Team',
     '• Warm welcome into the Moov team by their dedicated specialist\n• Review discovery notes and confirm order volumes, packaging, and operational requirements\n• Clear lines of communication established with a named contact.', C_GREEN),

    ('PHASE 02', 'IT & Software Configuration',
     '• Provision their Moov Ninja accounts and IT credentials\n• Connect their Shopify, TikTok Shop, Amazon, or WooCommerce store\n• If using a WMS, establish integration or CSV automated workflows.', C_GREEN),

    ('PHASE 03', 'Courier Account Applications',
     '• Moov applies for and manages dedicated courier sub-accounts with DPD, DHL, InPost, or UPS\n• Direct coordination with carrier depot operations\n• Collection rounds, driver routes, and vehicle timings booked.', C_YELLOW),

    ('PHASE 04', 'Workflow Calibration & Training Call',
     '• Dedicated 1-on-1 walkthrough call showing them how to use Moov Ninja\n• Help configure defaults: label formats (6x4), box dimensions & carrier routing\n• Tailor custom workflows that make daily packing faster and easier for their staff.', C_YELLOW),

    ('PHASE 05', 'Agreed Go-Live Date',
     '• Mutually agreed go-live date locked in with warehouse and carrier driver\n• First live collection generated from the software and collected by courier\n• Dedicated team actively tracks collection and hub scanning in real time.', C_GREEN),

    ('PHASE 06', 'Follow-Up Action & Support',
     '• Proactive post-launch check-in call to verify delivery scan rates and transit\n• Review invoice accuracy and answer any packing team questions\n• Seamless ongoing transition to our permanent Yorkshire support team.', RGBColor(0x99, 0x80, 0xE0))
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

create_card(s6, Inches(0.8), Inches(6.3), Inches(11.733), Inches(0.45), bg_color=RGBColor(0x13, 0x17, 0x26), border_color=C_GREEN)
tb_btm = s6.shapes.add_textbox(Inches(1.0), Inches(6.35), Inches(11.3), Inches(0.35))
p = tb_btm.text_frame.paragraphs[0]
p.text = 'THE 7–10 DAY COMMITMENT: We take the time to set up IT properly, train your team, and secure courier accounts so your go-live is 100% smooth.'
p.font.size = Pt(8.5)
p.font.bold = True
p.font.color.rgb = C_GREEN

add_footer(s6, 6, 6)

prs.save('/Users/rossjermy/Documents/InterPricing/Moov_Parcel_How_We_Sell.pptx')
print('Successfully saved Moov_Parcel_How_We_Sell.pptx')

# ============================================================
# GENERATE EXPANDED MICROSOFT WORD (.DOCX) WITH DEMO SECTION
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
r_brand = p_top.add_run('MOOV PARCEL  •  CONSULTATIVE SALES FRAMEWORK & BLUEPRINT\n')
r_brand.font.size = DocxPt(10)
r_brand.font.bold = True
r_brand.font.color.rgb = RGB_GREEN

r_title = p_top.add_run('Consultative Sales Blueprint & Live Demo Playbook')
r_title.font.size = DocxPt(20)
r_title.font.bold = True
r_title.font.color.rgb = RGB_DARK

p_sub = doc.add_paragraph()
r_sub = p_sub.add_run("Proprietary Free Technology (Moov Ninja)  |  Multi-Carrier Solutions (DPD, DHL, InPost, UPS)  |  Yorkshire Support Desk: 0113 322 4101")
r_sub.font.size = DocxPt(9.5)
r_sub.font.color.rgb = RGB_GREY

# Meta Table
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

doc.add_paragraph().paragraph_format.space_after = DocxPt(8)

# 1. Who We Are
h1 = doc.add_heading(level=1)
r = h1.add_run('1. Who We Are & What Makes Us Different')
r.font.size = DocxPt(13)
r.font.bold = True
r.font.color.rgb = RGB_DARK

p = doc.add_paragraph()
p.add_run(
    "Moov Parcel was invented to help e-commerce SMEs be more productive. We give our customers access to a piece of software (Moov Ninja), which is proprietary and owned by ourselves, that connects them to over 150 different marketplaces and sales channels.\n\n"
    "The core benefits we deliver:\n"
    "• Eliminates manual work: Stops manual one-by-one order entry and customer service headaches.\n"
    "• Increases operational efficiency: Speeds up order turnaround and stops human copy-paste errors and mis-deliveries.\n"
    "• Marketplace growth: Enables SMEs to easily launch onto new sales channels (Shopify, TikTok Shop, Amazon, eBay, WooCommerce, etc.).\n"
    "• Multi-carrier power: Primary carrier relationships with DPD, DHL, InPost, and UPS so we can offer genuine multi-carrier solutions on a single invoice.\n"
    "• Exceptional human service: Real people answering the phone straight away (0113 322 4101) with no queues and resolving carrier issues on the merchant's behalf."
)
for run in p.runs:
    run.font.size = DocxPt(9.5)

# 2. Sales Process Overview
h2 = doc.add_heading(level=1)
r = h2.add_run('2. The Outbound & Inbound Sales Process')
r.font.size = DocxPt(13)
r.font.bold = True
r.font.color.rgb = RGB_DARK

p = doc.add_paragraph()
p.add_run(
    "Our sales pipeline is a mixture of inbound leads (from email marketing and website enquiries) and outbound prospecting.\n\n"
    "Our outbound proposition is to call up an e-commerce business, get hold of the right decision maker (Owner, Director, Operations/Warehouse Manager), and seek to truly understand their business.\n\n"
    "We adopt a consultative approach: we do NOT push cheap rates blind. We gather as much information as possible across our 9 discovery areas, transition to a live software demo, and then align our solution to solve their specific challenges."
)
for run in p.runs:
    run.font.size = DocxPt(9.5)

# 3. Discovery Matrix
h3 = doc.add_heading(level=1)
r = h3.add_run('3. The 9 Core Discovery Areas (What Reps Must Understand)')
r.font.size = DocxPt(13)
r.font.bold = True
r.font.color.rgb = RGB_DARK

disc_table = doc.add_table(rows=1, cols=3)
disc_table.alignment = WD_TABLE_ALIGNMENT.CENTER
hdr = disc_table.rows[0].cells
hdr[0].text = "Discovery Focus Area"
hdr[1].text = "Trigger Question to Ask (Verbatim Script)"
hdr[2].text = "What You Need to Note & Why It Matters"
for cell in hdr:
    for paragraph in cell.paragraphs:
        for run in paragraph.runs:
            run.font.size = DocxPt(9)
            run.font.bold = True

questions_list = [
    ("1. Parcel Volume",
     "\"Roughly how many parcels are you dispatching on an average day or week? Does that volume spike significantly during peak periods or promotions?\"",
     "Establish daily/weekly volume tier and peak capacity requirements."),

    ("2. Destinations",
     "\"Where do these orders go? Are you primarily UK domestic mainland, or do you send to the Scottish Highlands, Islands, Northern Ireland, or Europe?\"",
     "Identify regional surcharge exposure and cross-border customs requirements."),

    ("3. Recipient Profile",
     "\"Who receives the goods — direct to consumer (B2C) residential addresses and lockers, or B2B trade and commercial retail addresses?\"",
     "Matches to the right carrier service (e.g. InPost lockers / DPD Home vs UPS B2B)."),

    ("4. Sizes & Deadweights",
     "\"What does your parcel profile look like in terms of size and deadweight? What are your typical minimums and maximums?\"",
     "Determines volumetric vs deadweight pricing bands and carrier conveyor limits."),

    ("5. International Shipping",
     "\"Do you ship internationally, either to Europe or the rest of the world? How do you currently handle customs and IOSS?\"",
     "Positions DHL Express / eCommerce capabilities and customs compliance tools."),

    ("6. Hazardous / Special Cargo",
     "\"Do you send anything that is hazardous, liquids, creams, glass, aerosols, batteries, or anything outside of the norm?\"",
     "Identifies dangerous goods (ADR) compliance and carrier restricted item rules."),

    ("7. Packaging Requirements",
     "\"Do you have any specific packaging requirements — for example, poly mailers, custom branded boxes, long tubes, or 6x4 thermal labels?\"",
     "Ensures compatibility with carrier sortation belts and our label printing formats."),

    ("8. Software & Booking Method",
     "\"How do you book your parcels right now? Are you booking them one by one? What channels (Shopify, Amazon)? If you use a WMS, which one?\"",
     "The key software trigger: if booking 1-by-1, Moov Ninja eliminates this immediately."),

    ("9. Couriers, Cut-offs & Pain",
     "\"Which couriers are collecting today? What time would you need a vehicle to collect from you if you were to move? Any challenges with price, service, or damage?\"",
     "Identifies if an early driver collection can be improved by switching carriers, and isolates service/claims frustrations.")
]

for area, q, notes in questions_list:
    row = disc_table.add_row().cells
    row[0].text = area
    row[1].text = q
    row[2].text = notes
    for cell in row:
        for paragraph in cell.paragraphs:
            for run in paragraph.runs:
                run.font.size = DocxPt(8.5)

doc.add_paragraph().paragraph_format.space_after = DocxPt(8)

# 4. THE POWER OF THE DEMO (NEW SECTION WITH RESEARCH & 9 FEATURES)
h4 = doc.add_heading(level=1)
r = h4.add_run('4. The Power of the Demo: Why We Demo & How It Drives Conversion')
r.font.size = DocxPt(13)
r.font.bold = True
r.font.color.rgb = RGB_DARK

p_res = doc.add_paragraph()
p_res.add_run(
    "Why Live Demos Are Essential:\n"
    "B2B commercial sales research (Gong.io, Gartner, Forrester) demonstrates that technology-enabled services convert at up to 68% higher win-rates when prospects experience a live product demonstration compared to receiving static rate quotes.\n\n"
    "When a prospect sees a PDF rate sheet, they compare pennies. When they see a live 15-minute demonstration of Moov Ninja, they see their daily warehouse headaches disappearing. It anchors immediate operational value and proves we are a true technology partner, not a low-cost postage reseller.\n\n"
    "The 9 Problems Moov Ninja Solves (The Demo Walkthrough Checklist):"
)
for run in p_res.runs:
    run.font.size = DocxPt(9.5)

demo_features_doc = [
    ("1. Multi-Channel Connectivity", "Connects to 150+ marketplaces and platforms (Shopify, TikTok Shop, Amazon, eBay, WooCommerce, etc.). Solves the pain of logging into multiple separate portals every day."),
    ("2. 1-Click Batch Shipping", "Enables merchants to print up to 100 shipping labels and pick lists simultaneously. Solves the bottleneck of booking orders one-by-one and re-keying customer addresses."),
    ("3. Internal Packing Station", "Dedicated barcode-driven packing station screen. Solves packing errors by scanning items into the carton before generating the label, ensuring the right customer gets the right product."),
    ("4. Multi-Parcel International Shipments", "Specialized multi-box international workflow. Solves a major pain point where competitor tools break or lack workflows when overseas orders require multiple cartons on a single consignment."),
    ("5. Real-Time Carrier Error Log Actionability", "Instantly displays exact courier error codes (e.g. invalid postcode, missing tax ID, phone number format). Solves silent failure by allowing warehouse staff to fix errors and print labels on the spot."),
    ("6. Ease of Use for International Shipping", "Automated commercial invoices, customs documentation, and seamless EU IOSS compliance. Solves international customs friction and stops parcels getting held up at borders."),
    ("7. Ninja Status Gamification", "Engaging visual Ninjas alert warehouse staff immediately when exceptions, address errors, or carrier delays occur. Makes warehouse management intuitive and visual."),
    ("8. Direct-to-Printer Integrated Software", "Native printer client that sends thermal labels directly to 6x4 Zebra printers. Solves the frustration of opening PDF dialogues or downloading label files for every batch."),
    ("9. Intelligent Shipping Rules Engine", "Conditional rules engine that automatically chooses the correct carrier (DPD, DHL, InPost, UPS) based on weight, parcel dimensions, value, postcode, or country. Solves manual carrier decision-making.")
]

for title, desc in demo_features_doc:
    p_f = doc.add_paragraph()
    r = p_f.add_run(f'• {title}: ')
    r.font.size = DocxPt(9)
    r.font.bold = True
    r.font.color.rgb = RGB_GREEN
    r2 = p_f.add_run(desc)
    r2.font.size = DocxPt(9)

p_pitch = doc.add_paragraph()
p_pitch.paragraph_format.space_before = DocxPt(6)
r_p = p_pitch.add_run(
    "Verbatim Rep Demo Pitch: \"Anyone can email you a list of prices that look like every other courier. Let me show you 10 minutes on a quick screen share of how Moov Ninja actually connects your Shopify in minutes, prints 100 labels in one click, and selects the right carrier automatically. Do you have your laptop open?\""
)
r_p.font.size = DocxPt(9)
r_p.font.italic = True
r_p.font.color.rgb = RGB_DARK

# 5. Consultative Alignment
h5 = doc.add_heading(level=1)
r = h5.add_run('5. Consultative Alignment (Software, Carrier & Service)')
r.font.size = DocxPt(13)
r.font.bold = True
r.font.color.rgb = RGB_DARK

align_table = doc.add_table(rows=1, cols=3)
align_table.alignment = WD_TABLE_ALIGNMENT.CENTER
hdr = align_table.rows[0].cells
hdr[0].text = "Uncovered Customer Situation"
hdr[1].text = "How to Align the Moov Solution"
hdr[2].text = "Direct Commercial Benefit"
for cell in hdr:
    for paragraph in cell.paragraphs:
        for run in paragraph.runs:
            run.font.size = DocxPt(9)
            run.font.bold = True

alignment_data = [
    ("Booking parcels one by one via web portals or Click & Drop",
     "\"We plug Moov Ninja directly into your Shopify or sales channels in minutes. 100-order batch printing stops manual typing and eliminates copy-paste errors completely.\"",
     "Saves 1 to 2 hours of packing labour daily; eliminates mis-delivery typos; free software with 150+ direct connectors."),

    ("Wanting to expand onto new sales channels (TikTok Shop, Amazon, eBay)",
     "\"Moov Ninja connects to over 150 marketplaces and channels, allowing you to list and sell on new channels easily without having to learn new shipping systems.\"",
     "Accelerates sales channel expansion with zero extra software subscription costs."),

    ("Current courier collects too early (e.g. 2:00 or 2:30pm), cutting off sales",
     "\"Through our relationships with DPD, DHL, InPost, and UPS, we can switch you to a carrier whose local schedule in your area supports a later collection time.\"",
     "Extends daily order processing window, allowing the store to capture more same-day orders."),

    ("Single-carrier dependency or service reliability issues",
     "\"With Moov, you get DPD, DHL, InPost, and UPS on a single dashboard and single weekly invoice. You have the right carrier for every parcel profile.\"",
     "Reduces operational risk, improves customer delivery choice, and simplifies bookkeeping into one invoice."),

    ("Poor customer service, long call queues, or damage dispute headaches",
     "\"Our customers never sit in carrier call queues. Our dedicated Yorkshire support desk (0113 322 4101) handles parcel tracking, delays, and damage claims directly.\"",
     "Protects customer reviews, frees up staff time, and ensures damage claims are actually pursued and recovered.")
]

for sit, pivot, ben in alignment_data:
    row = align_table.add_row().cells
    row[0].text = sit
    row[1].text = pivot
    row[2].text = ben
    for cell in row:
        for paragraph in cell.paragraphs:
            for run in paragraph.runs:
                run.font.size = DocxPt(8.5)

doc.add_paragraph().paragraph_format.space_after = DocxPt(8)

# 6. The Real 7-10 Day Onboarding Journey
h6 = doc.add_heading(level=1)
r = h6.add_run('6. The 7–10 Day Guided Onboarding Journey')
r.font.size = DocxPt(13)
r.font.bold = True
r.font.color.rgb = RGB_DARK

p = doc.add_paragraph()
p.add_run(
    "Onboarding at Moov Parcel takes between 7 to 10 days to ensure IT systems, carrier sub-accounts, and warehouse workflows are properly established:\n\n"
    "• Phase 1: Welcome to the Team — The client is warmly welcomed into our team by their dedicated onboarding specialist, reviewing operational requirements.\n"
    "• Phase 2: IT Provisioning & System Setup — We set them up on our IT systems, provision Moov Ninja credentials, and establish store integrations (Shopify, TikTok, Amazon, etc.).\n"
    "• Phase 3: Courier Account Applications — Moov directly applies for and coordinates dedicated accounts with the chosen carriers (DPD, DHL, InPost, UPS) to lock in collection routes and vehicle timings.\n"
    "• Phase 4: Workflow Calibration & Training Call — We host a 1-on-1 video call to walk them through Moov Ninja, helping them set up box defaults, 6x4 thermal printer settings, and customized workflows that make dispatch easier.\n"
    "• Phase 5: Agreed Go-Live Date — A firm go-live date is agreed with the merchant and carrier driver for the first live collection, actively monitored by our team.\n"
    "• Phase 6: Follow-Up Action & Support — Proactive post-launch check-in to verify scan rates, audit invoice accuracy, and transition to our permanent Yorkshire support desk (0113 322 4101)."
)
for run in p.runs:
    run.font.size = DocxPt(9.5)

doc.save('/Users/rossjermy/Documents/InterPricing/Moov_Parcel_Sales_Discovery_Blueprint.docx')
print('Successfully saved Moov_Parcel_Sales_Discovery_Blueprint.docx')

