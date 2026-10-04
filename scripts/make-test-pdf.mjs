/* Generates a minimal one-page PDF with resume-like text for upload testing. */
const lines = [
  'PRIYA TEST',
  'priya@example.com | +91 90000 11111',
  '',
  'SKILLS: React, JavaScript, Node.js, MongoDB, Git',
  '',
  'PROJECTS',
  'Career portal - built with MERN stack, served 300 users, cut load time by 40%',
  'Chat app - developed realtime messaging with websockets',
  '',
  'EDUCATION',
  'B.Tech CSE, Test University, 2027',
];

function esc(s) { return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }

let content = 'BT /F1 12 Tf 50 770 Td 14 TL\n';
for (const line of lines) content += `(${esc(line)}) Tj T*\n`;
content += 'ET';

const objects = [];
objects.push('<< /Type /Catalog /Pages 2 0 R >>');
objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>');
objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);

let pdf = '%PDF-1.4\n';
const offsets = [0];
objects.forEach((obj, i) => {
  offsets.push(pdf.length);
  pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
});
const xrefStart = pdf.length;
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
for (let i = 1; i <= objects.length; i += 1) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

process.stdout.write(Buffer.from(pdf, 'latin1'));
