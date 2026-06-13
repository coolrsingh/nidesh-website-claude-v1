/* ═══════════════════════════════════════════════════════
   Nidesh Financial Services — shared site script
   Utilities, charts, AI-insight generators, lead capture
   (lead form + WhatsApp + Telegram + CSV logic unchanged)
   ═══════════════════════════════════════════════════════ */

/* ═══ CONFIG ═══ */
const WHATSAPP_NUM = '919819590598';
const TELEGRAM_TOKEN = '8864527966:AAHoPNbnWZBbUrfT_0eCEjM4llpeFyD3PT0';
const TELEGRAM_CHAT_ID = '5003718919';
const SLACK_WEBHOOK = 'YOUR_SLACK_WEBHOOK';

const charts = {};

/* ═══ FORMAT ═══ */
function fmt(v) {
  if (isNaN(v) || v === null) return '—';
  const n = Math.round(v);
  if (n >= 10000000) return '₹' + (n/10000000).toFixed(2) + ' Cr';
  if (n >= 100000)   return '₹' + (n/100000).toFixed(2) + ' L';
  return '₹' + n.toLocaleString('en-IN');
}
function fmtShort(v) {
  const n = Math.round(v);
  if (n >= 10000000) return '₹' + (n/10000000).toFixed(1) + 'Cr';
  if (n >= 100000)   return '₹' + (n/100000).toFixed(0) + 'L';
  return '₹' + n.toLocaleString('en-IN');
}

function gN(id) { const el = document.getElementById(id); return el ? (parseFloat(el.value)||0) : 0; }
function gS(id) { const el = document.getElementById(id); return el ? el.value : ''; }

/* ═══ CHARTS ═══ */
function makeChart(canvasId, config) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  if (charts[canvasId]) charts[canvasId].destroy();
  charts[canvasId] = new Chart(ctx, config);
}

function chartColors(colors) {
  const ctx = document.createElement('canvas').getContext('2d');
  return colors.map(c => {
    const g = ctx.createLinearGradient(0,0,0,300);
    g.addColorStop(0, c+'30'); g.addColorStop(1, c+'04');
    return g;
  });
}

function chartOpts(n) {
  return {
    responsive:true, maintainAspectRatio:false,
    interaction:{mode:'index',intersect:false},
    plugins:{
      legend:{display:false},
      tooltip:{
        backgroundColor:'#fff', borderColor:'#DBEAFE', borderWidth:1,
        titleColor:'#0F172A', bodyColor:'#334155', padding:12,
        callbacks:{label:c=>{
          const v=c.parsed.y; if(v===null)return null;
          if(v>=10000000)return ' ₹'+(v/10000000).toFixed(2)+'Cr';
          if(v>=100000)return ' ₹'+(v/100000).toFixed(2)+'L';
          return ' ₹'+Math.round(v).toLocaleString('en-IN');
        }}
      }
    },
    scales:{
      x:{grid:{display:false},ticks:{color:'#94A3B8',font:{size:11},maxTicksLimit:n>20?12:n}},
      y:{grid:{color:'#F1F8FF'},ticks:{color:'#94A3B8',font:{size:11},callback:v=>{
        if(v>=10000000)return '₹'+(v/10000000).toFixed(1)+'Cr';
        if(v>=100000)return '₹'+(v/100000).toFixed(0)+'L';
        return '₹'+v.toLocaleString('en-IN');
      }}}
    }
  };
}

/* ═══ AI INSIGHTS (pure helpers, safe on any page) ═══ */
function renderInsights(containerId, insights) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = insights.map(i => `
    <div class="ai-insight">
      <div class="ai-insight-icon">${i.icon}</div>
      <div class="ai-insight-text">${i.text}</div>
    </div>`).join('');
}

function getSIPInsights(sip, rate, years, invested, corpus) {
  const mult = corpus / invested;
  const insights = [];
  if (rate < 10) insights.push({icon:'⚠️', text:`<strong>Rate assumption is conservative.</strong> At ${rate}% CAGR, your returns may trail inflation significantly. Consider equity mutual funds targeting 12–15% for long-term goals.`});
  else if (rate >= 15) insights.push({icon:'🎯', text:`<strong>Ambitious return assumption (${rate}%).</strong> This is achievable with quality mid/small-cap funds over 10+ years, but expect year-to-year volatility. Diversify across 3–4 fund categories.`});
  else insights.push({icon:'✅', text:`<strong>Healthy return assumption at ${rate}%.</strong> This aligns with historical large/flexi-cap mutual fund averages. You're planning realistically.`});

  insights.push({icon:'📈', text:`<strong>Your money multiplies ${mult.toFixed(1)}x</strong> — investing ₹${(sip).toLocaleString('en-IN')}/mo for ${years} years grows to ${fmt(corpus)}. The power of compounding is at work here.`});

  if (years < 7) insights.push({icon:'⏳', text:`<strong>Short tenure detected (${years} years).</strong> For equity mutual funds, the minimum recommended horizon is 5–7 years. Consider extending your tenure to reduce risk and maximise compounding.`});
  else if (years >= 15) insights.push({icon:'🏆', text:`<strong>Excellent! ${years}-year horizon maximises compounding.</strong> Long tenures dramatically reduce risk in equity. Your wealth has space to weather market cycles.`});

  if (sip < 5000) insights.push({icon:'💡', text:`<strong>Starting small is perfectly fine.</strong> ₹${sip.toLocaleString('en-IN')}/month is a great start. Use Step-Up SIP — increasing by even 10% annually can more than double your final corpus.`});

  return insights;
}

function getLSInsights(lump, rate, years, corpus) {
  const insights = [];
  const mult = corpus / lump;
  insights.push({icon:'💰', text:`<strong>Your ₹${fmt(lump)} investment grows ${mult.toFixed(1)}x</strong> to ${fmt(corpus)} in ${years} years at ${rate}% CAGR. This is the power of long-duration compounding.`});
  if (rate < 8) insights.push({icon:'⚠️', text:`<strong>At ${rate}% CAGR, you may barely beat inflation.</strong> Indian CPI averages 5–6%. Consider equity-oriented mutual funds for higher real returns.`});
  if (years >= 10 && rate >= 12) insights.push({icon:'🎯', text:`<strong>Optimal zone.</strong> Equity mutual funds over 10+ years have historically delivered 12–15% CAGR with manageable volatility. Your parameters match this sweet spot.`});
  insights.push({icon:'📊', text:`<strong>Timing matters with lump sums.</strong> Consider STPs (Systematic Transfer Plans) if markets appear elevated — invest lump sum in a liquid fund and auto-transfer to equity monthly to average your cost.`});
  return insights;
}

function getMPInsights(peak, paid, term, sipYears, pauseYears, swpYears, swp, depleted) {
  const insights = [];
  insights.push({icon:'🏗️', text:`<strong>Your wealth lifecycle:</strong> ${sipYears}yr SIP builds the base → ${pauseYears}yr compounding pause amplifies it to ${fmt(peak)} → then ${swpYears}yr SWP provides income.`});
  if (depleted) insights.push({icon:'🚨', text:`<strong>Corpus depletion risk detected!</strong> Your SWP withdrawals exceed portfolio returns — the corpus gets eaten. Reduce SWP amount, reduce escalation rate, or extend the accumulation phase.`});
  else if (term > 0) insights.push({icon:'✅', text:`<strong>Sustainable withdrawal plan.</strong> After ${swpYears} years of SWP, you still have ${fmt(term)} as terminal balance. This is a healthy retirement corpus design.`});
  if (pauseYears > 0) insights.push({icon:'⏸️', text:`<strong>The pause phase is powerful.</strong> ${pauseYears} years of pure compounding (no withdrawals, no contributions) adds exponential value. Even 2 extra pause years can significantly boost your SWP capacity.`});
  insights.push({icon:'📈', text:`<strong>Total income generated: ${fmt(paid)}</strong> across your SWP phase. Building this income stream from investments is the key to financial independence.`});
  return insights;
}

function getHLInsights(loanAmt, rate, years, emi, totalInt) {
  const insights = [];
  const intRatio = totalInt / loanAmt;
  insights.push({icon:'🏠', text:`<strong>Total cost of your home loan: ${fmt(loanAmt + totalInt)}.</strong> For a ₹${fmt(loanAmt)} loan, you pay back ${fmt(totalInt)} extra as interest — ${(intRatio*100).toFixed(0)}% of your original loan amount.`});
  if (intRatio > 1.0) insights.push({icon:'⚠️', text:`<strong>You pay back over 2x the loan amount.</strong> At ${rate}% for ${years} years, interest costs are significant. Consider increasing EMI by 10-15% to close the loan 4–6 years early.`});
  if (rate > 8.5) insights.push({icon:'💡', text:`<strong>Rate is above current market average (~8.5%).</strong> Even 0.5% reduction in rate saves lakhs over the tenure. Ask Rahul to compare rates across HDFC, SBI, Kotak, and Axis Bank.`});
  insights.push({icon:'📊', text:`<strong>Tax benefit on home loan:</strong> Principal repayment (up to ₹1.5L) under 80C and interest (up to ₹2L) under Section 24 can save you ₹50,000–₹1L in taxes annually during early years.`});
  return insights;
}

function getELInsights(sal, foir, maxLoan, maxEmi, rate, yrs) {
  const insights = [];
  insights.push({icon:'✅', text:`<strong>Max eligible loan: ${fmt(maxLoan)}.</strong> At ${foir}% FOIR on ₹${sal.toLocaleString('en-IN')}/mo salary with ${rate}% rate and ${yrs}-yr tenure, banks will lend you approximately this amount.`});
  if (foir > 50) insights.push({icon:'⚠️', text:`<strong>FOIR above 50% is risky.</strong> Lenders get cautious above 50% FOIR as it leaves little buffer for other expenses. Consider a longer tenure to bring the EMI down.`});
  insights.push({icon:'💡', text:`<strong>Increase eligibility by:</strong> (1) Adding a co-applicant's income, (2) Closing existing EMIs, (3) Increasing tenure, or (4) Negotiating a lower rate with a good CIBIL score (750+).`});
  insights.push({icon:'📊', text:`<strong>CIBIL score is crucial.</strong> A score above 750 can get you 0.25–0.5% lower rate, saving ₹${Math.round(maxLoan * 0.003 * yrs / 1000)}K+ over the loan tenure. Check yours for free at CIBIL.com.`});
  return insights;
}

/* ═══ LEAD / FORM (logic unchanged) ═══ */
function openModal() { const m = document.getElementById('mainModal'); if (m) m.classList.add('open'); }
function closeModal() { const m = document.getElementById('mainModal'); if (m) m.classList.remove('open'); }

function showToast() {
  const t = document.getElementById('toast');
  if (!t) return;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 4500);
}

function sendToChannels(name, phone, source, extra) {
  const msg = `🎯 *New Lead — Nidesh.com*\n\n👤 *Name:* ${name}\n📱 *Phone:* ${phone}\n📍 *Source:* ${source}\n${extra||''}\n🕐 *Time:* ${new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}`;
  if (TELEGRAM_TOKEN !== '8864527966:AAHoPNbnWZBbUrfT_0eCEjM4llpeFyD3PT0') {
    fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:5003718919,text:msg,parse_mode:'Markdown'})}).catch(()=>{});
  }
  if (SLACK_WEBHOOK !== 'YOUR_SLACK_WEBHOOK') {
    fetch(SLACK_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:msg})}).catch(()=>{});
  }
}

function submitLead(wrapId, okId, e, source, extraFn) {
  if (e) e.preventDefault();
  const wrap = document.getElementById(wrapId);
  const nameEl = wrap.querySelector('input[type="text"]');
  const phoneEl = wrap.querySelector('input[type="tel"]');
  const name = nameEl ? nameEl.value.trim() : '';
  const phone = phoneEl ? phoneEl.value.trim() : '';
  if (!name || !phone) { alert('Please enter your name and phone number.'); return; }

  sendToChannels(name, phone, source, '');

  document.getElementById(wrapId).style.display = 'none';
  const ok = document.getElementById(okId);
  ok.style.display = 'block';
  ok.innerHTML = '<span class="big-tick">✅</span><strong style="color:var(--blue)">Received! We\'ll reach out soon.</strong><p style="font-size:0.82rem;color:var(--text-muted);margin-top:0.4rem">Expect a WhatsApp message from Rahul within 24 hours.</p>';

  showToast();

  setTimeout(() => {
    const waMsg = encodeURIComponent(`Hi Rahul! I used the ${source} on nidesh.com. My name is ${name} and I'd like to know more about investing.`);
    window.open(`https://wa.me/${WHATSAPP_NUM}?text=${waMsg}`, '_blank');
  }, 1500);
}

function submitBar() {
  const name = document.getElementById('lbName').value.trim();
  const phone = document.getElementById('lbPhone').value.trim();
  if (!name || !phone) { alert('Please enter name and number.'); return; }
  sendToChannels(name, phone, 'Lead Bar', '');
  document.getElementById('lbName').value = '';
  document.getElementById('lbPhone').value = '';
  showToast();
  const waMsg = encodeURIComponent(`Hi Rahul! I'd like a portfolio review. My name is ${name}.`);
  setTimeout(() => window.open(`https://wa.me/${WHATSAPP_NUM}?text=${waMsg}`, '_blank'), 1500);
}

/* ═══ EXPORT CSV (logic unchanged) ═══ */
function exportCSV(tableIdPrefix, mode) {
  const thead = document.getElementById(tableIdPrefix.replace('Table','THead'));
  const tbody = document.getElementById(tableIdPrefix.replace('Table','TBody'));
  const heads = [...thead.querySelectorAll('th')].map(th=>`"${th.innerText.trim()}"`);
  const dataRows = [...tbody.querySelectorAll('tr')].map(tr=>[...tr.querySelectorAll('td')].map(td=>`"${td.innerText.replace(/[₹,]/g,'').trim()}"`).join(','));
  const csv = [heads.join(','),...dataRows].join('\n');
  const a = document.createElement('a'); a.download = `nidesh_${mode}.csv`;
  a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.click();
}

/* ═══ NAV (mobile menu + dropdown) ═══ */
function toggleMenu() { const l = document.getElementById('navLinks'); if (l) l.classList.toggle('open'); }
function toggleDrop(el) {
  if (window.innerWidth <= 820) {
    const dd = el.closest('.nav-dropdown');
    if (dd) dd.classList.toggle('open');
  }
}
