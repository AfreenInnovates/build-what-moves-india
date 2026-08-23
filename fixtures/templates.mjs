const FONTS = `'Noto Sans Kannada','Noto Sans Devanagari','Nirmala UI','Segoe UI',Arial,sans-serif`;

const base = (w, h, body) => `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${w}px;height:${h}px;font-family:${FONTS};background:#fff;position:relative;overflow:hidden}
  .wm{position:absolute;inset:-20%;pointer-events:none;z-index:9;
      background:repeating-linear-gradient(-30deg,transparent 0 60px,rgba(0,0,0,.035) 60px 120px)}
  .wm b{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);
      font-size:${Math.round(w/22)}px;letter-spacing:.18em;color:rgba(190,30,30,.16);
      white-space:nowrap;font-weight:800}
  .band{position:absolute;bottom:0;left:0;right:0;z-index:10;background:#7f1d1d;color:#fff;
      font-size:${Math.round(w/48)}px;letter-spacing:.16em;text-align:center;padding:6px 0;font-weight:700}
  .lbl{font-size:${Math.round(w/62)}px;color:#555;letter-spacing:.06em;text-transform:uppercase}
  .val{font-size:${Math.round(w/34)}px;color:#111;font-weight:600}
</style></head><body>
  <div class="wm"><b>SPECIMEN &middot; NOT VALID</b></div>
  ${body}
  <div class="band">SYNTHETIC TEST DOCUMENT &middot; GENERATED FOR SOFTWARE TESTING &middot; NOT A REAL ID</div>
</body></html>`;

export const aadhaar = (d) => base(1012, 638, `
  <div style="padding:34px 40px 0">
    <div style="font-size:15px;letter-spacing:.3em;color:#888">MOCK IDENTITY DOCUMENT &mdash; TYPE A</div>
    <div style="display:flex;gap:34px;margin-top:26px">
      <div style="width:190px;height:230px;background:#eceff1;border:1px solid #cfd8dc;
                  display:flex;align-items:center;justify-content:center;color:#90a4ae;font-size:13px">PHOTO</div>
      <div style="flex:1;display:grid;gap:16px">
        <div><div class="lbl">Name</div><div class="val">${d.name}</div></div>
        <div><div class="lbl">Father / Guardian</div><div class="val">${d.father_name}</div></div>
        <div style="display:flex;gap:48px">
          <div><div class="lbl">Date of Birth</div><div class="val">${d.dob}</div></div>
          <div><div class="lbl">Gender</div><div class="val">${d.gender}</div></div>
        </div>
        <div><div class="lbl">Address</div>
             <div style="font-size:19px;color:#222;line-height:1.5;max-width:560px">${d.address}</div></div>
      </div>
    </div>
    <div style="margin-top:22px;font-size:44px;letter-spacing:.14em;font-weight:800;color:#111">${d.id_number}</div>
  </div>`);

export const pan = (d) => base(1012, 638, `
  <div style="padding:36px 44px">
    <div style="font-size:15px;letter-spacing:.3em;color:#888">MOCK IDENTITY DOCUMENT &mdash; TYPE B</div>
    <div style="margin-top:34px;display:grid;gap:22px;max-width:640px">
      <div><div class="lbl">Account Number</div>
           <div style="font-size:42px;letter-spacing:.16em;font-weight:800">${d.id_number}</div></div>
      <div><div class="lbl">Name</div><div class="val">${d.name}</div></div>
      <div><div class="lbl">Father's Name</div><div class="val">${d.father_name}</div></div>
      <div><div class="lbl">Date of Birth</div><div class="val">${d.dob}</div></div>
    </div>
    <div style="position:absolute;right:44px;top:120px;width:170px;height:210px;background:#eceff1;
                border:1px solid #cfd8dc;display:flex;align-items:center;justify-content:center;
                color:#90a4ae;font-size:13px">PHOTO</div>
  </div>`);

export const bank = (d) => base(820, 770, `
  <div style="padding:40px 44px">
    <div style="border-bottom:2px solid #111;padding-bottom:16px">
      <div style="font-size:30px;font-weight:800">${d.bank_name_native}</div>
      <div style="font-size:16px;color:#666;margin-top:4px">${d.bank_name}</div>
      <div style="font-size:19px;margin-top:8px">${d.branch_native}</div>
    </div>
    <div style="margin-top:30px;display:grid;gap:22px">
      <div><div class="lbl">Account Holder</div>
           <div style="font-size:32px;font-weight:700;line-height:1.5">${d.name_native}</div></div>
      <div><div class="lbl">Account Number</div>
           <div style="font-size:30px;letter-spacing:.1em;font-weight:700">${d.account_number}</div></div>
      <div><div class="lbl">IFSC</div>
           <div style="font-size:26px;letter-spacing:.1em;font-weight:700">${d.ifsc}</div></div>
    </div>
    <table style="width:100%;margin-top:34px;border-collapse:collapse;font-size:15px">
      <tr style="background:#f1f3f4"><th style="padding:9px;text-align:left">DATE</th>
        <th style="padding:9px;text-align:left">PARTICULARS</th>
        <th style="padding:9px;text-align:right">BALANCE</th></tr>
      ${[['01/04/2026','OPENING','12,400.00'],['18/05/2026','SALARY CREDIT','54,900.00'],
         ['02/06/2026','ATM WDL','49,900.00']].map(r =>
        `<tr style="border-bottom:1px solid #e3e6e8"><td style="padding:9px">${r[0]}</td>
         <td style="padding:9px">${r[1]}</td><td style="padding:9px;text-align:right">${r[2]}</td></tr>`).join('')}
    </table>
  </div>`);

export const epfo = (d) => base(1012, 700, `
  <div style="padding:34px 40px">
    <div style="background:#055160;color:#fff;padding:14px 20px;font-size:19px;letter-spacing:.05em">
      MOCK MEMBER PROFILE &mdash; SIMULATED PORTAL RECORD</div>
    <table style="width:100%;margin-top:28px;border-collapse:collapse;font-size:22px">
      ${[['UAN', d.id_number],['Name', d.name],['Date of Birth', d.dob],["Father's Name", d.father_name]]
        .map(([k,v]) => `<tr style="border-bottom:1px solid #e0e0e0">
          <td style="padding:16px 10px;color:#666;width:290px">${k}</td>
          <td style="padding:16px 10px;font-weight:700">${v}</td></tr>`).join('')}
    </table>
  </div>`);

export const templates = { aadhaar, pan, bank, epfo };
