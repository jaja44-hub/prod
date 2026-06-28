import fs from 'fs';
import path from 'path';

const SRC = '/mnt/data-disk/mu_temp_project/src';
const DEST = '/mnt/data-disk/mu_temp_project/production-submodule/src';

const mappings = [
  { src: 'views/AnalyticsDashboard.jsx', dest: 'pages/Dashboard.jsx' },
  { src: 'views/HRFortress.jsx', dest: 'pages/Employees.jsx' },
  { src: 'views/ImperialFinanceMinistry.jsx', dest: 'pages/Accounts.jsx' },
  { src: 'services/PayrollService.js', dest: 'services/PayrollService.js' },
  { src: 'services/FinanceService.js', dest: 'services/FinanceService.js' },
  { src: 'components/LockedOverlay.jsx', dest: 'components/LockedOverlay.jsx' },
  { src: 'components/DemoDataBanner.jsx', dest: 'components/DemoDataBanner.jsx' }
];

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

for (const map of mappings) {
  const srcPath = path.join(SRC, map.src);
  const destPath = path.join(DEST, map.dest);
  
  if (fs.existsSync(srcPath)) {
    let content = fs.readFileSync(srcPath, 'utf8');
    
    // Convert BilingualContext to LangContext
    content = content.replace(/useBilingual/g, 'useLang');
    content = content.replace(/BilingualContext/g, 'LangContext');
    content = content.replace(/const \{ language \} = useLang\(\);/g, 'const { language: lang } = useLang();\n  const language = lang;'); // To keep 'language' variable working
    
    // Fix imports if necessary (e.g. if they point to wrong directories)
    if (map.dest.startsWith('pages/')) {
      // the imports in views are like '../context/...', which matches pages '../context/...'
      // so we don't need to change relative paths much.
    }
    
    ensureDir(destPath);
    fs.writeFileSync(destPath, content);
    console.log(`✅ Adopted ${map.src} -> ${map.dest}`);
  } else {
    console.log(`❌ Source missing: ${srcPath}`);
  }
}
