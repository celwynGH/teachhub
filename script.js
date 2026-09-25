const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

// STARTS HERE
function displayTodayDate() {
    const dateElement = document.getElementById("todayText");

    if (!dateElement) return;

    const today = new Date();

    dateElement.textContent = today.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });
}

// Display immediately
displayTodayDate();

// Check every minute
setInterval(displayTodayDate, 60000);

// Update when returning to the browser tab
document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
        displayTodayDate();
    }
}); 

// ENDED HERE

const defaultSubjects = [
  {id:1,name:"Mathematics",desc:"Algebra, geometry, and calculus fundamentals",grade:"Grade 10",accent:"#8054ef",soft:"#eee8ff",students:[
    {id:"S004",name:"Noah Williams"},{id:"S005",name:"Olivia Brown"},{id:"S006",name:"James Davis"},{id:"S007",name:"Ava Wilson"}]},
  {id:2,name:"Biology",desc:"Living organisms, ecosystems, and life processes",grade:"Grade 9",accent:"#06b67b",soft:"#d8f8e9",students:[
    {id:"S008",name:"Liam Miller"},{id:"S009",name:"Sophia Taylor"},{id:"S010",name:"Ethan Moore"}]},
  {id:3,name:"History",desc:"World history from ancient civilizations to modern era",grade:"Grade 10",accent:"#f39a00",soft:"#fff0c8",students:[
    {id:"S011",name:"Emma Anderson"},{id:"S012",name:"Mason Thomas"},{id:"S013",name:"Mia Jackson"}]},
  {id:4,name:"English Literature",desc:"Reading, writing, and literary analysis",grade:"Grade 11",accent:"#ff3854",soft:"#ffe4e8",students:[
    {id:"S014",name:"Lucas White"},{id:"S015",name:"Isabella Harris"},{id:"S016",name:"Henry Martin"}]}
];

const defaultLessons = [
  {id:1,title:"Introduction to Photosynthesis",subject:"Biology",grade:"Grade 9",status:"finalized",date:"Jan 20, 2025",desc:"Students will understand the process of photosynthesis and identify the key components involved."},
  {id:2,title:"World War II: Causes and Effects",subject:"History",grade:"Grade 10",status:"draft",date:"Jan 22, 2025",desc:"Analyze the major causes of WWII and evaluate the global impact of the conflict."}
];

let subjects = JSON.parse(localStorage.getItem("teachhub_subjects") || "null") || defaultSubjects;
let lessons = JSON.parse(localStorage.getItem("teachhub_lessons") || "null") || defaultLessons;
let attendance = JSON.parse(localStorage.getItem("teachhub_attendance") || "{}");
let approvals = JSON.parse(localStorage.getItem("teachhub_approvals") || "[]");
let selectedPlan = "monthly";

function saveAll(){
  localStorage.setItem("teachhub_subjects", JSON.stringify(subjects));
  localStorage.setItem("teachhub_lessons", JSON.stringify(lessons));
  localStorage.setItem("teachhub_attendance", JSON.stringify(attendance));
  localStorage.setItem("teachhub_approvals", JSON.stringify(approvals));
}
function icons(){ if(window.lucide) lucide.createIcons(); }
function esc(s=""){ return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])); }
function toast(msg){ const t=$("#toast"); t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200); }

function showPage(page){
  $$(".page").forEach(p=>p.classList.remove("active"));
  $(`#page-${page}`).classList.add("active");
  $$(".nav-item[data-page]").forEach(n=>n.classList.toggle("active",n.dataset.page===page));
  $("#sidebar").classList.remove("open");
  if(page==="dashboard") renderDashboard();
  if(page==="subjects") renderSubjects();
  if(page==="attendance") renderAttendance();
  if(page==="lessons") renderLessons();
  if(page==="admin") renderApprovals();
  icons();
}
$$(".nav-item[data-page]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));
$$("[data-page-link]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.pageLink)));
$("#mobileMenu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
/*$("#signOutBtn").addEventListener("click",()=>toast("Signed out (demo only).")); */

function renderDashboard(){
  $("#statSubjects").textContent=subjects.length;
  $("#statStudents").textContent=subjects.reduce((n,s)=>n+s.students.length,0);
  $("#statLessons").textContent=lessons.length;
  const today = todayISO();
  let present=0;
  Object.entries(attendance).forEach(([k,v])=>{ if(k.endsWith(`|${today}`)) present += Object.values(v).filter(x=>x==="present").length; });
  $("#statPresent").textContent=present;
  $("#recentLessons").innerHTML=lessons.slice(0,3).map(l=>`<div class="recent-item"><div><strong>${esc(l.title)}</strong><p>${esc(l.subject)} • ${esc(l.grade)}</p></div><span class="badge ${l.status}">${esc(l.status)}</span></div>`).join("") || `<div class="empty-state compact"><p>No lesson plans yet</p></div>`;
}

function renderSubjects(){
  const q=($("#subjectSearch").value||"").toLowerCase();
  $("#subjectGrid").innerHTML=subjects.filter(s=>(s.name+" "+s.desc+" "+s.grade).toLowerCase().includes(q)).map(s=>`
    <article class="subject-card" style="--accent:${s.accent};--soft:${s.soft}">
      <div class="subject-card-actions">
        <button class="edit-subject" title="Edit subject" data-edit-subject="${s.id}"><i data-lucide="pencil"></i></button>
        <button class="delete-subject" title="Delete subject" data-delete-subject="${s.id}"><i data-lucide="trash-2"></i></button>
      </div>
      <div class="letter">${esc(s.name[0])}</div>
      <h3>${esc(s.name)}</h3><p>${esc(s.desc)}</p>
      <div class="subject-footer"><span class="grade">${esc(s.grade)}</span><span>♧ ${s.students.length} students</span><span class="chev">›</span></div>
    </article>`).join("");
  $$("[data-edit-subject]").forEach(b=>b.addEventListener("click",()=>{
    editSubject(Number(b.dataset.editSubject));
  }));

  $$("[data-delete-subject]").forEach(b=>b.addEventListener("click",()=>{
    if(confirm("Delete this subject?")){
      subjects=subjects.filter(s=>s.id!==Number(b.dataset.deleteSubject));
      saveAll();
      renderSubjects();
      refreshSubjectSelect();
      renderAttendance();
      renderDashboard();
      icons();
    }
  }));
  icons();
}
$("#subjectSearch").addEventListener("input",renderSubjects);

function refreshSubjectSelect(){
  const sel=$("#attendanceSubject");
  const current=sel.value;
  sel.innerHTML=subjects.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("");
  if(subjects.some(s=>String(s.id)===current)) sel.value=current;
  else if(subjects.length) sel.value=subjects[0].id;
}
function attendanceKey(subjectId,date){ return `${subjectId}|${date}`; }
function renderAttendance(){
  refreshSubjectSelect();
  if(!$("#attendanceDate").value) $("#attendanceDate").value=todayISO();
  const sid=Number($("#attendanceSubject").value);
  const sub=subjects.find(s=>s.id===sid);
  if(!sub){$("#attendanceTable").innerHTML="";return;}
  const date=$("#attendanceDate").value;
  const key=attendanceKey(sid,date);
  attendance[key] ||= {};
  $("#attendanceSubjectBanner").innerHTML=`<div class="letter">${esc(sub.name[0])}</div><div><strong>${esc(sub.name)}</strong><small>${formatLongDate(date)} • ${sub.students.length} students</small></div>`;
  $("#attendanceTable").innerHTML=sub.students.map(st=>{
    const status=attendance[key][st.id]||"";
    return `<div class="student-row"><div class="student-avatar">${esc(st.name[0])}</div><div class="student-info"><strong>${esc(st.name)}</strong><span>#${esc(st.id)}</span></div><div class="attendance-actions">
      ${["present","absent","late","excused"].map(x=>`<button class="status-btn ${x} ${status===x?"active":""}" data-student="${st.id}" data-status="${x}">${x==="present"?"✓":x==="absent"?"×":x==="late"?"◷":"♢"} ${x[0].toUpperCase()+x.slice(1)}</button>`).join("")}
    </div></div>`;
  }).join("");
  $$(".status-btn").forEach(btn=>btn.addEventListener("click",()=>{
    attendance[key][btn.dataset.student]=btn.dataset.status;
    saveAll();renderAttendance();renderDashboard();
  }));
  updateCounts(key);
}
function updateCounts(key){
  const vals=Object.values(attendance[key]||{});
  $("#presentCount").textContent=`${vals.filter(v=>v==="present").length} Present`;
  $("#absentCount").textContent=`${vals.filter(v=>v==="absent").length} Absent`;
}
function formatLongDate(s){ if(!s)return "";const d=new Date(s+"T00:00:00");return d.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"}); }
$("#attendanceSubject").addEventListener("change",renderAttendance);
$("#attendanceDate").addEventListener("change",()=>{
  // Manual date selection is respected until the user reloads the app.
  $("#attendanceDate").dataset.autoDate="";
  renderAttendance();
});
$("#saveAttendanceBtn").addEventListener("click",()=>{saveAll();toast("Attendance saved.");});
$("#downloadCsvBtn").addEventListener("click",()=>{
  const sid=Number($("#attendanceSubject").value), sub=subjects.find(s=>s.id===sid), date=$("#attendanceDate").value;
  if(!sub)return;
  const data=attendance[attendanceKey(sid,date)]||{};
  let csv="Student ID,Student Name,Subject,Date,Status\n"+sub.students.map(st=>[st.id,`"${st.name}"`,`"${sub.name}"`,date,data[st.id]||"Unmarked"].join(",")).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`attendance-${sub.name.toLowerCase().replace(/\s+/g,"-")}-${date}.csv`;a.click();URL.revokeObjectURL(a.href);
});


function downloadLessonPlan(id){
  const lesson=lessons.find(l=>l.id===id);
  if(!lesson) return;

  const content = `TEACHHUB LESSON PLAN

Title: ${lesson.title}
Subject: ${lesson.subject}
Grade Level: ${lesson.grade}
Status: ${lesson.status}
Date: ${lesson.date}

Description / Objectives:
${lesson.desc}

Generated by TeachHub Teacher Portal
`;

  const blob=new Blob([content],{type:"text/plain;charset=utf-8"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`lesson-plan-${lesson.title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
  toast("Lesson plan downloaded.");
}

/*function printAttendance(){
  const sid=Number($("#attendanceSubject").value);
  const sub=subjects.find(s=>s.id===sid);
  const date=$("#attendanceDate").value;
  if(!sub) return;

  const data=attendance[attendanceKey(sid,date)]||{};
  const rows=sub.students.map(st=>`
    <tr>
      <td>${esc(st.id)}</td>
      <td>${esc(st.name)}</td>
      <td>${esc((data[st.id]||"Unmarked").replace(/^./,c=>c.toUpperCase()))}</td>
    </tr>`).join("");

  const w=window.open("","_blank");
  w.document.write(`
    <!doctype html>
    <html>
    <head>
      <title>Attendance - ${esc(sub.name)}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:32px;color:#111}
        h1{margin:0 0 6px}p{color:#555}
        table{width:100%;border-collapse:collapse;margin-top:22px}
        th,td{border:1px solid #ccc;padding:10px;text-align:left}
        th{background:#f2f2f2}
        .note{margin-top:18px;font-size:12px;color:#666}
      </style>
    </head>
    <body>
      <h1>${esc(sub.name)} Attendance</h1>
      <p>${formatLongDate(date)} • ${sub.grade}</p>
      <table>
        <thead><tr><th>Student ID</th><th>Student Name</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="note">Generated by TeachHub Teacher Portal</p>
      <script>window.onload=()=>window.print();<\/script>
    </body>
    </html>
  `);
  w.document.close();
} */

/* ADDED HERE */

function printAttendance() {
    const sid = Number(document.getElementById("attendanceSubject").value);
    const sub = subjects.find(s => s.id === sid);
    const date = document.getElementById("attendanceDate").value;

    if (!sub) {
        alert("Please select a subject first.");
        return;
    }

    const data = attendance[attendanceKey(sid, date)] || {};

    const rows = sub.students.map(student => {
        const status = data[student.id] || "Unmarked";

        return `
            <tr>
                <td>${esc(student.id)}</td>
                <td>${esc(student.name)}</td>
                <td>${esc(status.charAt(0).toUpperCase() + status.slice(1))}</td>
            </tr>
        `;
    }).join("");

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
        alert("Please allow popups for this website to print attendance.");
        return;
    }

    printWindow.document.open();
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Attendance - ${esc(sub.name)}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 25px;
                    color: #111;
                }

                h1 {
                    margin-bottom: 8px;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 25px;
                }

                th, td {
                    border: 1px solid #aaa;
                    padding: 10px;
                    text-align: left;
                }

                th {
                    background: #eee;
                }

                @page {
                    size: A4;
                    margin: 15mm;
                }
            </style>
        </head>
        <body>
            <h1>${esc(sub.name)} Attendance</h1>
            <p>${formatLongDate(date)} | ${esc(sub.grade)}</p>

            <table>
                <thead>
                    <tr>
                        <th>Student ID</th>
                        <th>Student Name</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>

            <p>Generated by TeacherHub Teacher Portal</p>
        </body>
        </html>
    `);

    printWindow.document.close();

    printWindow.focus();
    printWindow.print();
}

/* END HERE */


function renderLessons(){
  const q=($("#lessonSearch").value||"").toLowerCase(), status=$("#lessonStatusFilter").value;
  const list=lessons.filter(l=>(l.title+" "+l.subject+" "+l.grade).toLowerCase().includes(q)&&(status==="all"||l.status===status));
  $("#lessonGrid").innerHTML=list.map(l=>`<article class="lesson-card" data-lesson="${l.id}">
    <div class="lesson-head">
      <div class="lesson-icon"><i data-lucide="file-text"></i></div>
      <div class="lesson-main">
        <div class="lesson-title">${esc(l.title)}</div>
        <div class="lesson-subject">${esc(l.subject)}</div>
      </div>
      <div class="lesson-card-actions">
        <button class="icon-action download-lesson" data-download-lesson="${l.id}" title="Download lesson plan"><i data-lucide="download"></i></button>
        <button class="icon-action edit-lesson" data-edit-lesson="${l.id}" title="Edit lesson plan"><i data-lucide="pencil"></i></button>
        <button class="icon-action delete-lesson" data-delete-lesson="${l.id}" title="Delete lesson plan"><i data-lucide="trash-2"></i></button>
      </div>
    </div>
    <div class="lesson-meta">
      <span class="badge">${esc(l.grade)}</span>
      <span class="badge ${l.status}">${esc(l.status)}</span>
      <span class="lesson-date">${esc(l.date)}</span>
    </div>
    <p>${esc(l.desc)}</p>
  </article>`).join("");

  $$("[data-download-lesson]").forEach(btn=>{
    btn.addEventListener("click", e=>{
      e.stopPropagation();
      downloadLessonPlan(Number(btn.dataset.downloadLesson));
    });
  });

  $$("[data-edit-lesson]").forEach(btn=>{
    btn.addEventListener("click", e=>{
      e.stopPropagation();
      editLessonPlan(Number(btn.dataset.editLesson));
    });
  });

  $$("[data-delete-lesson]").forEach(btn=>{
    btn.addEventListener("click", e=>{
      e.stopPropagation();
      const id=Number(btn.dataset.deleteLesson);
      const lesson=lessons.find(l=>l.id===id);
      if(lesson && confirm(`Delete "${lesson.title}"?`)){
        lessons=lessons.filter(l=>l.id!==id);
        saveAll();
        renderLessons();
        renderDashboard();
        toast("Lesson plan deleted.");
      }
    });
  });

  $$(".lesson-card").forEach(card=>{
    card.addEventListener("dblclick", ()=>editLessonPlan(Number(card.dataset.lesson)));
  });

  icons();
}
$("#lessonSearch").addEventListener("input",renderLessons);$("#lessonStatusFilter").addEventListener("change",renderLessons);

function openModal(title,html,onSubmit){
  $("#modalTitle").textContent=title;$("#modalBody").innerHTML=html;$("#modalBackdrop").classList.remove("hidden");icons();
  const form=$("#modalBody form"); if(form) form.addEventListener("submit",e=>{e.preventDefault();onSubmit(new FormData(form));});
}
function closeModal(){ $("#modalBackdrop").classList.add("hidden"); }
$("#modalClose").addEventListener("click",closeModal);
$("#modalBackdrop").addEventListener("click",e=>{if(e.target===$("#modalBackdrop"))closeModal();});


function editSubject(id){
  const subject=subjects.find(s=>s.id===id);
  if(!subject) return;

  openModal("Edit Subject",`
    <form class="modal-form">
      <label>Subject Name
        <input name="name" required value="${esc(subject.name)}">
      </label>

      <label>Description
        <textarea name="desc" required>${esc(subject.desc)}</textarea>
      </label>

      <label>Grade Level
        <select name="grade">
          ${["Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"].map(g=>`<option ${g===subject.grade?"selected":""}>${g}</option>`).join("")}
        </select>
      </label>

      <label>Student Names (one per line)
        <textarea name="students">${subject.students.map(st=>esc(st.name)).join("\n")}</textarea>
      </label>

      <div class="modal-actions">
        <button type="button" class="secondary-btn" onclick="document.querySelector('#modalClose').click()">Cancel</button>
        <button class="primary-btn">Save Changes</button>
      </div>
    </form>`,fd=>{
      const oldStudents=subject.students || [];
      const names=String(fd.get("students")||"")
        .split("\n")
        .map(x=>x.trim())
        .filter(Boolean);

      subject.name=String(fd.get("name")||"").trim();
      subject.desc=String(fd.get("desc")||"").trim();
      subject.grade=String(fd.get("grade")||"").trim();

      // Reuse an existing student's ID when the name still exists;
      // otherwise create a new stable ID.
      subject.students=names.map((name,index)=>{
        const existing=oldStudents.find(st=>st.name.toLowerCase()===name.toLowerCase());
        return existing || {id:`S${String(Date.now()+index).slice(-6)}`,name};
      });

      saveAll();
      closeModal();
      renderSubjects();
      refreshSubjectSelect();
      renderAttendance();
      renderDashboard();
      toast("Subject updated.");
    });
}

$("#newSubjectBtn").addEventListener("click",()=>openModal("New Subject",`
  <form class="modal-form">
    <label>Subject Name<input name="name" required placeholder="e.g. Computer Science"></label>
    <label>Description<textarea name="desc" required placeholder="Short subject description"></textarea></label>
    <label>Grade Level<select name="grade"><option>Grade 7</option><option>Grade 8</option><option>Grade 9</option><option selected>Grade 10</option><option>Grade 11</option><option>Grade 12</option></select></label>
    <label>Student Names (one per line)<textarea name="students" placeholder="Juan Dela Cruz&#10;Maria Santos"></textarea></label>
    <div class="modal-actions"><button type="button" class="secondary-btn" onclick="document.querySelector('#modalClose').click()">Cancel</button><button class="primary-btn">Create Subject</button></div>
  </form>`,fd=>{
    const colors=[["#8054ef","#eee8ff"],["#06b67b","#d8f8e9"],["#f39a00","#fff0c8"],["#ff3854","#ffe4e8"]];
    const c=colors[subjects.length%colors.length], names=String(fd.get("students")||"").split("\n").map(x=>x.trim()).filter(Boolean);
    const id=Date.now(); subjects.push({id,name:fd.get("name"),desc:fd.get("desc"),grade:fd.get("grade"),accent:c[0],soft:c[1],students:names.map((n,i)=>({id:`S${String(100+i).padStart(3,"0")}`,name:n}))});
    saveAll();closeModal();renderSubjects();refreshSubjectSelect();renderDashboard();toast("Subject created.");
  }));


function editLessonPlan(id){
  const lesson=lessons.find(l=>l.id===id);
  if(!lesson) return;

  openModal("Edit Lesson Plan",`
    <form class="modal-form">
      <label>Lesson Title
        <input name="title" required value="${esc(lesson.title)}">
      </label>

      <label>Subject
        <select name="subject">
          ${subjects.map(s=>`<option value="${esc(s.name)}" ${s.name===lesson.subject?"selected":""}>${esc(s.name)}</option>`).join("")}
        </select>
      </label>

      <label>Grade Level
        <input name="grade" required value="${esc(lesson.grade)}">
      </label>

      <label>Status
        <select name="status">
          <option value="draft" ${lesson.status==="draft"?"selected":""}>Draft</option>
          <option value="finalized" ${lesson.status==="finalized"?"selected":""}>Finalized</option>
        </select>
      </label>

      <label>Date
        <input name="date" type="date" value="${toDateInputValue(lesson.date)}">
      </label>

      <label>Description / Objectives
        <textarea name="desc" required>${esc(lesson.desc)}</textarea>
      </label>

      <div class="modal-actions">
        <button type="button" class="secondary-btn" onclick="document.querySelector('#modalClose').click()">Cancel</button>
        <button class="primary-btn">Save Changes</button>
      </div>
    </form>`, fd=>{
      lesson.title=String(fd.get("title")||"").trim();
      lesson.subject=String(fd.get("subject")||"").trim();
      lesson.grade=String(fd.get("grade")||"").trim();
      lesson.status=String(fd.get("status")||"draft");
      lesson.desc=String(fd.get("desc")||"").trim();

      const dateValue=String(fd.get("date")||"");
      if(dateValue){
        const d=new Date(dateValue+"T00:00:00");
        lesson.date=d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
      }

      saveAll();
      closeModal();
      renderLessons();
      renderDashboard();
      toast("Lesson plan updated.");
    });
}

function toDateInputValue(dateText){
  if(!dateText) return "";
  const d=new Date(dateText);
  if(Number.isNaN(d.getTime())) return "";
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

$("#newLessonBtn").addEventListener("click",()=>openModal("New Lesson Plan",`
  <form class="modal-form">
    <label>Lesson Title<input name="title" required></label>
    <label>Subject<select name="subject">${subjects.map(s=>`<option value="${esc(s.name)}">${esc(s.name)}</option>`).join("")}</select></label>
    <label>Grade Level<input name="grade" value="Grade 10" required></label>
    <label>Status<select name="status"><option value="draft">Draft</option><option value="finalized">Finalized</option></select></label>
    <label>Description<textarea name="desc" required></textarea></label>
    <div class="modal-actions"><button type="button" class="secondary-btn" onclick="document.querySelector('#modalClose').click()">Cancel</button><button class="primary-btn">Create Plan</button></div>
  </form>`,fd=>{
    lessons.unshift({id:Date.now(),title:fd.get("title"),subject:fd.get("subject"),grade:fd.get("grade"),status:fd.get("status"),date:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),desc:fd.get("desc")});
    saveAll();closeModal();renderLessons();renderDashboard();toast("Lesson plan created.");
  }));

/*$$(".plan-card").forEach(card=>card.addEventListener("click",()=>{
  selectedPlan=card.dataset.plan;
  $$(".plan-card").forEach(c=>{c.classList.toggle("selected",c===card);$(".radio-dot",c).classList.toggle("checked",c===card);});
  $("#continuePlanBtn").textContent=`Continue with ${selectedPlan==="monthly"?"Monthly":"Yearly"} Plan →`;
}));
$("#continuePlanBtn").addEventListener("click",()=>{
  $("#paymentForm").classList.remove("hidden");
  $("#gcashPlan").value=selectedPlan==="monthly"?"Monthly":"Yearly";
  $("#gcashAmount").value=selectedPlan==="monthly"?199:1799;
  $("#paymentForm").scrollIntoView({behavior:"smooth",block:"center"});
}); */
/*$("#submitPaymentBtn").addEventListener("click",()=>{
  const name=$("#gcashName").value.trim(), ref=$("#gcashRef").value.trim();
  if(!name||!ref){toast("Please complete GCash name and reference number.");return;}
  approvals.unshift({id:Date.now(),name,ref,plan:selectedPlan,amount:selectedPlan==="monthly"?199:1799,status:"pending",submitted:new Date().toLocaleString()});
  saveAll();$("#paymentForm").classList.add("hidden");$("#gcashName").value="";$("#gcashRef").value="";toast("Payment submitted for approval.");renderApprovals();
}); */
/*function renderApprovals(){
  const pending=approvals.filter(a=>a.status==="pending");
  $("#approvalList").innerHTML=pending.length?pending.map(a=>`<article class="approval-card">
    <div><h3>${esc(a.name)} — ${a.plan==="monthly"?"Monthly":"Yearly"} Plan</h3><p>GCash Ref: ${esc(a.ref)} • ₱${a.amount.toLocaleString()}</p><p>Submitted: ${esc(a.submitted)}</p></div>
    <div class="approval-actions"><button class="approve-btn" data-approve="${a.id}">Approve</button><button class="reject-btn" data-reject="${a.id}">Reject</button></div>
  </article>`).join(""):`<div class="admin-empty"><i data-lucide="clock-3"></i><p>No subscription requests yet</p></div>`;
  $$("[data-approve]").forEach(b=>b.addEventListener("click",()=>updateApproval(Number(b.dataset.approve),"approved")));
  $$("[data-reject]").forEach(b=>b.addEventListener("click",()=>updateApproval(Number(b.dataset.reject),"rejected")));
  icons();
} */
/*function updateApproval(id,status){ const a=approvals.find(x=>x.id===id);if(a)a.status=status;saveAll();renderApprovals();toast(`Subscription ${status}.`); }*/

function todayISO(){
  const d=new Date();
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function updateDashboardDate(){
  const d=new Date();
  $("#todayText").textContent=d.toLocaleDateString("en-US",{
    weekday:"long",month:"long",day:"numeric",year:"numeric"
  });
}

/* Keep the portal's date fresh automatically.
   This runs on load, whenever the tab becomes active again,
   and once every minute so the dashboard rolls over after midnight. */
function refreshDailyData(){
  const previousDate=$("#attendanceDate").dataset.autoDate || "";
  const current=todayISO();

  updateDashboardDate();

  // If the attendance date was being automatically managed, roll it to today.
  if(!$("#attendanceDate").value || $("#attendanceDate").value===previousDate){
    $("#attendanceDate").value=current;
    $("#attendanceDate").dataset.autoDate=current;
  }

  renderDashboard();
}

refreshSubjectSelect();
$("#attendanceDate").value=todayISO();
$("#attendanceDate").dataset.autoDate=todayISO();

renderDashboard();
renderSubjects();
renderAttendance();
renderLessons();
/*renderApprovals();*/
updateDashboardDate();
icons();

setInterval(refreshDailyData, 60000);
document.addEventListener("visibilitychange",()=>{
  if(!document.hidden) refreshDailyData();
});

$("#printAttendanceBtn").addEventListener("click", printAttendance);



// added here

