const fs = require('fs');
const file = 'd:/Q Techx Projects/Q Techx Mobile App/GYMWEBNEW1/Gyms_Web_App-Backend_FrontendAdmin/frontend/src/Admin/Members/Members.jsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/if \\(cache\\.adminMembers\\) \\{/, 
`if (cache.adminMembers && role !== "trainer") {`);

fs.writeFileSync(file, code);
console.log("Success cache logic");
