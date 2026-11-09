with open('print_slides_rich.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Slide 6
old_slide6 = """  <!-- ========================================== -->
  <!-- SLIDE 6: 72-HOUR ONBOARDING BLUEPRINT       -->
  <!-- ========================================== -->
  <div class="slide-page">
    <div class="slide-header">
      <div>
        <div class="eyebrow"><span class="dot"></span> Client Onboarding // Zero Downtime</div>
        <h1>The 72-Hour Frictionless Onboarding Blueprint</h1>
      </div>
      <div class="header-subtext">
        How we transition merchants from agreement to live collection in 3 days with zero packing bench disruption.
      </div>
    </div>

    <div class="slide-body">
      
      <!-- 3 Day Process Grid -->
      <div class="grid-3">
        
        <!-- Day 1 -->
        <div class="card">
          <div>
            <span class="badge badge-green">Day 1 • Step 01</span>
            <h3 style="color: #FFFFFF; font-size: 11pt;">Tariff Audit & Store Sync</h3>
            <p style="margin-bottom: 6px;">Side-by-side pricing model approved showing line-by-line parcel and software savings.</p>
            <ul class="check-list">
              <li>10-minute API connection to Shopify, TikTok Shop, Amazon, or WooCommerce.</li>
              <li>Order catalogue, SKUs, and channels imported automatically with zero coding.</li>
              <li>No changes required to existing warehouse benches or warehouse staff habits.</li>
            </ul>
          </div>
          <div style="background: rgba(0,0,0,0.3); border-radius: 4px; padding: 4px 6px; font-size: 7.2pt; color: #9FA2B4; margin-top: 4px;">
            <strong style="color: #1DFB9D;">Milestone:</strong> Store orders flowing live into Moov Ninja dashboard.
          </div>
        </div>

        <!-- Day 2 -->
        <div class="card">
          <div>
            <span class="badge badge-yellow">Day 2 • Step 02</span>
            <h3 style="color: #FFFFFF; font-size: 11pt;">Bench Calibration & Carrier Setup</h3>
            <p style="margin-bottom: 6px;">Printer configuration and carrier collection round confirmed or switched.</p>
            <ul class="check-list">
              <li>Standard 6x4 Zebra thermal test labels verified on packing benches.</li>
              <li>Carrier collection schedule confirmed; switched to later round carrier if needed.</li>
              <li>Automated routing rules set (e.g. weight, locker delivery, destination).</li>
            </ul>
          </div>
          <div style="background: rgba(0,0,0,0.3); border-radius: 4px; padding: 4px 6px; font-size: 7.2pt; color: #9FA2B4; margin-top: 4px;">
            <strong style="color: #FECA00;">Milestone:</strong> Carrier route confirmed and test manifest validated.
          </div>
        </div>

        <!-- Day 3 -->
        <div class="card card-accent">
          <div>
            <span class="badge badge-green">Day 3 • Step 03</span>
            <h3 style="color: #1DFB9D; font-size: 11pt;">Live Dispatch & Active Monitoring</h3>
            <p style="margin-bottom: 6px;">First live collection collected by driver and scanned into the carrier hub.</p>
            <ul class="check-list">
              <li>First 100-order batch generated and handed to collection driver.</li>
              <li>Dedicated Leeds/Sheffield team monitors manifests and transit milestones live.</li>
              <li>Merchant maintains existing courier in parallel for complete peace of mind.</li>
            </ul>
          </div>
          <div style="background: rgba(29, 251, 157, 0.08); border: 1px solid rgba(29, 251, 157, 0.2); border-radius: 4px; padding: 4px 6px; font-size: 7.2pt; color: #FFFFFF; margin-top: 4px;">
            <strong style="color: #1DFB9D;">Milestone:</strong> 100% successful dispatch; zero warehouse downtime.
          </div>
        </div>

      </div>

      <!-- Zero-Downtime Guarantee Banner -->
      <div style="background: rgba(23, 27, 45, 0.95); border: 1px solid rgba(29, 251, 157, 0.3); border-radius: 6px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-family: 'Jost'; font-size: 8.5pt; font-weight: 700; color: #1DFB9D; text-transform: uppercase;">The Zero-Downtime Parallel Running Guarantee</div>
          <div style="font-size: 7.8pt; color: #C6C7CD;">Merchants keep their incumbent courier accounts active and dual-run until they are 100% satisfied. No disruption, no setup fees, and zero risk to customer deliveries.</div>
        </div>
        <div style="text-align: right; white-space: nowrap;">
          <div style="font-family: 'Jost'; font-size: 9pt; font-weight: 700; color: #FFFFFF;">0113 322 4100</div>
          <div style="font-size: 7pt; color: #9FA2B4;">enquiries@moovparcel.co.uk</div>
        </div>
      </div>

    </div>

    <div class="slide-footer">
      <span>MOOV PARCEL  •  COMMERCIAL SALES BLUEPRINT  •  moovparcel.co.uk</span>
      <span>Slide <strong>6 of 6</strong></span>
    </div>
  </div>"""

new_slide6 = """  <!-- ========================================== -->
  <!-- SLIDE 6: 7-10 DAY GUIDED ONBOARDING JOURNEY -->
  <!-- ========================================== -->
  <div class="slide-page">
    <div class="slide-header">
      <div>
        <div class="eyebrow"><span class="dot"></span> Client Onboarding // Handover to Live Dispatch</div>
        <h1>The 7–10 Day Guided Onboarding Journey</h1>
      </div>
      <div class="header-subtext">
        How we hand over from sales to our dedicated onboarding team to properly configure IT, carrier accounts, and warehouse workflows.
      </div>
    </div>

    <div class="slide-body">
      
      <!-- 6 Phase Grid (2 rows of 3) -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; flex: 1;">
        
        <!-- Phase 1 -->
        <div class="card">
          <div>
            <span class="badge badge-green">Phase 01</span>
            <h3 style="color: #FFFFFF; font-size: 9.5pt;">Welcome & Account Alignment</h3>
            <ul class="check-list" style="font-size: 7.2pt;">
              <li>Warm introduction into the Moov team by their dedicated specialist.</li>
              <li>Discovery review to confirm packing volumes & operational needs.</li>
              <li>Single dedicated contact assigned for technical & carrier onboarding.</li>
            </ul>
          </div>
          <div style="background: rgba(0,0,0,0.25); border-radius: 4px; padding: 3px 5px; font-size: 6.8pt; color: #9FA2B4; margin-top: 3px;">
            <strong style="color: #1DFB9D;">Milestone:</strong> Dedicated onboarding channel opened.
          </div>
        </div>

        <!-- Phase 2 -->
        <div class="card">
          <div>
            <span class="badge badge-green">Phase 02</span>
            <h3 style="color: #FFFFFF; font-size: 9.5pt;">IT Provisioning & System Access</h3>
            <ul class="check-list" style="font-size: 7.2pt;">
              <li>Moov Ninja accounts provisioned with secure IT credentials.</li>
              <li>Store connector setup (Shopify, TikTok Shop, Amazon, WooCommerce).</li>
              <li>Live sync verification ensuring SKUs & orders flow seamlessly.</li>
            </ul>
          </div>
          <div style="background: rgba(0,0,0,0.25); border-radius: 4px; padding: 3px 5px; font-size: 6.8pt; color: #9FA2B4; margin-top: 3px;">
            <strong style="color: #1DFB9D;">Milestone:</strong> Store connected and order ingestion active.
          </div>
        </div>

        <!-- Phase 3 -->
        <div class="card">
          <div>
            <span class="badge badge-yellow">Phase 03</span>
            <h3 style="color: #FFFFFF; font-size: 9.5pt;">Courier Account Applications</h3>
            <ul class="check-list" style="font-size: 7.2pt;">
              <li>Moov applies for and manages courier accounts directly with carriers.</li>
              <li>Direct liaison with DPD, DHL, InPost, UPS, and Evri operations.</li>
              <li>Driver collection schedules and vehicle allocations officially locked in.</li>
            </ul>
          </div>
          <div style="background: rgba(0,0,0,0.25); border-radius: 4px; padding: 3px 5px; font-size: 6.8pt; color: #9FA2B4; margin-top: 3px;">
            <strong style="color: #FECA00;">Milestone:</strong> Carrier sub-accounts approved & route booked.
          </div>
        </div>

        <!-- Phase 4 -->
        <div class="card">
          <div>
            <span class="badge badge-yellow">Phase 04</span>
            <h3 style="color: #FFFFFF; font-size: 9.5pt;">Workflow Calibration & Training</h3>
            <ul class="check-list" style="font-size: 7.2pt;">
              <li>Dedicated 1-on-1 call showing staff how to get the most from Moov Ninja.</li>
              <li>Custom defaults built: label sizing (6x4), box presets & routing rules.</li>
              <li>Workflow shortcuts tailored specifically for their warehouse bench layout.</li>
            </ul>
          </div>
          <div style="background: rgba(0,0,0,0.25); border-radius: 4px; padding: 3px 5px; font-size: 6.8pt; color: #9FA2B4; margin-top: 3px;">
            <strong style="color: #FECA00;">Milestone:</strong> Packing team trained; test labels verified.
          </div>
        </div>

        <!-- Phase 5 -->
        <div class="card card-accent">
          <div>
            <span class="badge badge-green">Phase 05</span>
            <h3 style="color: #1DFB9D; font-size: 9.5pt;">Agreed Go-Live Date</h3>
            <ul class="check-list" style="font-size: 7.2pt;">
              <li>Firm, mutually agreed go-live date locked in with warehouse & driver.</li>
              <li>First 100-order batch printed and collected from the packing bench.</li>
              <li>Onboarding team actively tracks first collection and hub scans live.</li>
            </ul>
          </div>
          <div style="background: rgba(29, 251, 157, 0.08); border: 1px solid rgba(29, 251, 157, 0.2); border-radius: 4px; padding: 3px 5px; font-size: 6.8pt; color: #FFFFFF; margin-top: 3px;">
            <strong style="color: #1DFB9D;">Milestone:</strong> First manifest dispatched with zero disruption.
          </div>
        </div>

        <!-- Phase 6 -->
        <div class="card card-purple">
          <div>
            <span class="badge badge-purple">Phase 06</span>
            <h3 style="color: #B794F6; font-size: 9.5pt;">Follow-Up Action & Review</h3>
            <ul class="check-list" style="font-size: 7.2pt;">
              <li>Proactive post-launch check-in reviewing scan rates & transit speeds.</li>
              <li>Invoice reconciliation audit ensuring billing accuracy from day one.</li>
              <li>Permanent handover to our dedicated Leeds & Sheffield operations desk.</li>
            </ul>
          </div>
          <div style="background: rgba(65, 3, 204, 0.2); border: 1px solid rgba(65, 3, 204, 0.3); border-radius: 4px; padding: 3px 5px; font-size: 6.8pt; color: #FFFFFF; margin-top: 3px;">
            <strong style="color: #B794F6;">Milestone:</strong> Ongoing growth support with direct phone line.
          </div>
        </div>

      </div>

      <!-- Zero-Downtime Guarantee Banner -->
      <div style="background: rgba(23, 27, 45, 0.95); border: 1px solid rgba(29, 251, 157, 0.3); border-radius: 6px; padding: 6px 12px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-family: 'Jost'; font-size: 8pt; font-weight: 700; color: #1DFB9D; text-transform: uppercase;">The 7–10 Day Onboarding Commitment</div>
          <div style="font-size: 7.3pt; color: #C6C7CD;">We take the time to set up IT properly, train your warehouse team, and secure courier routes so your go-live is 100% smooth with zero downtime.</div>
        </div>
        <div style="text-align: right; white-space: nowrap;">
          <div style="font-family: 'Jost'; font-size: 8.5pt; font-weight: 700; color: #FFFFFF;">0113 322 4100</div>
          <div style="font-size: 6.8pt; color: #9FA2B4;">enquiries@moovparcel.co.uk</div>
        </div>
      </div>

    </div>

    <div class="slide-footer">
      <span>MOOV PARCEL  •  COMMERCIAL SALES BLUEPRINT  •  moovparcel.co.uk</span>
      <span>Slide <strong>6 of 6</strong></span>
    </div>
  </div>"""

if old_slide6 in content:
    content = content.replace(old_slide6, new_slide6)
    with open('print_slides_rich.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated print_slides_rich.html successfully')
else:
    print('Could not find old_slide6 in print_slides_rich.html')

